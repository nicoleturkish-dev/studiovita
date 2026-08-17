from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import ipaddress
import httpx
import requests
import bcrypt
import jwt
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studiovita")

# --- Mongo ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# --- Constants ---
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Studio Vita")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

# --- Object storage ---
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
APP_NAME = "studio-vita"
_storage_key: Optional[str] = None
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}


def init_storage(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ================= Password helpers =================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Nincs bejelentkezve")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="A munkamenet lejárt")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Érvénytelen token")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Jogosulatlan")
    return user


# ================= Email guardrail gate =================
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = (
    "reply with your password", "reply with the code", "send your password", "cvv",
    "send us your password", "enter your password below", "confirm your card number",
    "your full card number", "seed phrase", "recovery phrase", "verify your card",
    "social security number", "confirm your bank details",
)
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links must be https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Bad host in URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text mismatch: {m.group(1)!r} vs {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set; skipping email send.")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return None


# ================= Models =================
def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


CategoryType = Literal["egyeni", "gyermek", "kapcsolat", "csoport", "program"]

CATEGORIES = {
    "egyeni": "Egyéni támogatás",
    "gyermek": "Gyermekeknek",
    "kapcsolat": "Kapcsolatok",
    "csoport": "Csoportok",
    "program": "Programok",
}


class TeamMember(BaseModel):
    member_id: str = Field(default_factory=new_id)
    name: str
    role: str
    specialties: List[str] = []
    bio: str = ""
    qualifications: List[str] = []
    methods: List[str] = []
    languages: List[str] = ["Magyar"]
    works_with: List[str] = []
    photo_url: str = ""
    active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class Space(BaseModel):
    space_id: str = Field(default_factory=new_id)
    label: str
    caption: str = ""
    photo_url: str = ""
    slot: str = "generic"  # "hero" | "about" | "generic"
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class Service(BaseModel):
    service_id: str = Field(default_factory=new_id)
    title: str
    category: str
    short_description: str
    description: str = ""
    duration_min: int = 50
    price_huf: Optional[int] = None
    active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class Workshop(BaseModel):
    workshop_id: str = Field(default_factory=new_id)
    title: str
    description: str
    instructor: str
    date: str  # ISO date
    time: str  # e.g. "18:00"
    duration_min: int = 90
    price_huf: Optional[int] = None
    capacity: int = 12
    spots_left: int = 12
    who_for: str = ""
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class Booking(BaseModel):
    booking_id: str = Field(default_factory=new_id)
    kind: Literal["session", "workshop"] = "session"
    member_id: Optional[str] = None
    service_id: Optional[str] = None
    workshop_id: Optional[str] = None
    date: str  # ISO date
    time: str  # e.g. "10:00"
    name: str
    email: EmailStr
    phone: str
    message: str = ""
    status: Literal["new", "confirmed", "cancelled"] = "new"
    created_at: str = Field(default_factory=now_iso)


class ContactMessage(BaseModel):
    message_id: str = Field(default_factory=new_id)
    name: str
    email: EmailStr
    subject: str = ""
    message: str
    created_at: str = Field(default_factory=now_iso)


# ================= App =================
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.team.create_index("member_id", unique=True)
    await db.services.create_index("service_id", unique=True)
    await db.workshops.create_index("workshop_id", unique=True)
    await db.bookings.create_index("booking_id", unique=True)
    await db.spaces.create_index("space_id", unique=True)
    try:
        init_storage()
        logger.info("Object storage initialized.")
    except Exception as e:
        logger.warning(f"Object storage init failed (uploads will error until fixed): {e}")
    await seed_all()
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api = APIRouter(prefix="/api")


# --------- Auth ---------
class LoginBody(BaseModel):
    email: EmailStr
    password: str


@api.post("/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Hibás e-mail vagy jelszó")
    token = create_access_token(user["user_id"], user["email"])
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=86400, path="/",
    )
    return {"token": token, "user": {"email": user["email"], "name": user["name"], "role": user["role"]}}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_admin)):
    return {"email": user["email"], "name": user["name"], "role": user["role"]}


# --------- Public: Team ---------
@api.get("/team")
async def list_team():
    docs = await db.team.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(200)
    return docs


@api.get("/team/{member_id}")
async def get_team(member_id: str):
    doc = await db.team.find_one({"member_id": member_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Nem található")
    return doc


# --------- Admin: Team ---------
class TeamIn(BaseModel):
    name: str
    role: str
    specialties: List[str] = []
    bio: str = ""
    qualifications: List[str] = []
    methods: List[str] = []
    languages: List[str] = ["Magyar"]
    works_with: List[str] = []
    photo_url: str = ""
    active: bool = True
    order: int = 0


@api.post("/admin/team")
async def create_team(body: TeamIn, _=Depends(get_current_admin)):
    m = TeamMember(**body.model_dump())
    await db.team.insert_one(m.model_dump())
    return m.model_dump()


@api.put("/admin/team/{member_id}")
async def update_team(member_id: str, body: TeamIn, _=Depends(get_current_admin)):
    res = await db.team.update_one({"member_id": member_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Nem található")
    return await db.team.find_one({"member_id": member_id}, {"_id": 0})


@api.delete("/admin/team/{member_id}")
async def delete_team(member_id: str, _=Depends(get_current_admin)):
    await db.team.delete_one({"member_id": member_id})
    return {"ok": True}


@api.get("/admin/team")
async def admin_list_team(_=Depends(get_current_admin)):
    return await db.team.find({}, {"_id": 0}).sort("order", 1).to_list(500)


# --------- Public: Services ---------
@api.get("/services")
async def list_services():
    docs = await db.services.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(200)
    return docs


@api.get("/categories")
async def list_categories():
    return [{"slug": k, "name": v} for k, v in CATEGORIES.items()]


# --------- Admin: Services ---------
class ServiceIn(BaseModel):
    title: str
    category: str
    short_description: str
    description: str = ""
    duration_min: int = 50
    price_huf: Optional[int] = None
    active: bool = True
    order: int = 0


@api.post("/admin/services")
async def create_service(body: ServiceIn, _=Depends(get_current_admin)):
    s = Service(**body.model_dump())
    await db.services.insert_one(s.model_dump())
    return s.model_dump()


@api.put("/admin/services/{service_id}")
async def update_service(service_id: str, body: ServiceIn, _=Depends(get_current_admin)):
    res = await db.services.update_one({"service_id": service_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Nem található")
    return await db.services.find_one({"service_id": service_id}, {"_id": 0})


@api.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, _=Depends(get_current_admin)):
    await db.services.delete_one({"service_id": service_id})
    return {"ok": True}


@api.get("/admin/services")
async def admin_list_services(_=Depends(get_current_admin)):
    return await db.services.find({}, {"_id": 0}).sort("order", 1).to_list(500)


# --------- Public: Workshops ---------
@api.get("/workshops")
async def list_workshops():
    today = datetime.now(timezone.utc).date().isoformat()
    docs = await db.workshops.find(
        {"active": True, "date": {"$gte": today}}, {"_id": 0}
    ).sort("date", 1).to_list(200)
    return docs


@api.get("/workshops/{workshop_id}")
async def get_workshop(workshop_id: str):
    doc = await db.workshops.find_one({"workshop_id": workshop_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Nem található")
    return doc


# --------- Admin: Workshops ---------
class WorkshopIn(BaseModel):
    title: str
    description: str
    instructor: str
    date: str
    time: str
    duration_min: int = 90
    price_huf: Optional[int] = None
    capacity: int = 12
    spots_left: int = 12
    who_for: str = ""
    active: bool = True


@api.post("/admin/workshops")
async def create_workshop(body: WorkshopIn, _=Depends(get_current_admin)):
    w = Workshop(**body.model_dump())
    await db.workshops.insert_one(w.model_dump())
    return w.model_dump()


@api.put("/admin/workshops/{workshop_id}")
async def update_workshop(workshop_id: str, body: WorkshopIn, _=Depends(get_current_admin)):
    res = await db.workshops.update_one({"workshop_id": workshop_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Nem található")
    return await db.workshops.find_one({"workshop_id": workshop_id}, {"_id": 0})


@api.delete("/admin/workshops/{workshop_id}")
async def delete_workshop(workshop_id: str, _=Depends(get_current_admin)):
    await db.workshops.delete_one({"workshop_id": workshop_id})
    return {"ok": True}


@api.get("/admin/workshops")
async def admin_list_workshops(_=Depends(get_current_admin)):
    return await db.workshops.find({}, {"_id": 0}).sort("date", 1).to_list(500)


# --------- Public: Bookings ---------
class SessionBookingIn(BaseModel):
    member_id: str
    service_id: str
    date: str
    time: str
    name: str
    email: EmailStr
    phone: str
    message: str = ""


class WorkshopBookingIn(BaseModel):
    workshop_id: str
    name: str
    email: EmailStr
    phone: str
    message: str = ""


def _booking_email_html(booking: dict, meta: dict) -> str:
    lines = [
        f"<p>Kedves <strong>{escape(booking['name'])}</strong>,</p>",
        "<p>Köszönjük foglalásodat a Studio Vita-nál. Az alábbi adatokkal rögzítettük igényedet:</p>",
        "<table role=\"presentation\" style=\"border-collapse:collapse\">",
    ]
    for label, val in meta.items():
        lines.append(
            f"<tr><td style=\"padding:6px 12px 6px 0;color:#63584D\">{escape(label)}</td>"
            f"<td style=\"padding:6px 0;color:#3E362E\"><strong>{escape(str(val))}</strong></td></tr>"
        )
    lines.append("</table>")
    lines.append(
        "<p style=\"margin-top:16px\">Kollégánk hamarosan felveszi veled a kapcsolatot a végleges "
        "időpont visszaigazolásához.</p>"
    )
    lines.append(
        "<p style=\"font-size:12px;color:#9A8F83;margin-top:24px\">"
        f"Ezt az üzenetet a Studio Vita foglalási rendszere küldte. Válaszolni a "
        f"{escape(EMAIL_REPLY_TO or '')} címre lehet.</p>"
    )
    return (
        "<div style=\"font-family:Arial,sans-serif;background:#FAF8F5;padding:32px;color:#3E362E\">"
        "<div style=\"max-width:560px;margin:0 auto;background:#FFFFFF;padding:32px;border-radius:16px\">"
        + "".join(lines) +
        "</div></div>"
    )


@api.post("/bookings/session")
async def create_session_booking(body: SessionBookingIn):
    member = await db.team.find_one({"member_id": body.member_id}, {"_id": 0})
    service = await db.services.find_one({"service_id": body.service_id}, {"_id": 0})
    if not member or not service:
        raise HTTPException(400, "Érvénytelen szakember vagy szolgáltatás")

    b = Booking(
        kind="session",
        member_id=body.member_id,
        service_id=body.service_id,
        date=body.date,
        time=body.time,
        name=body.name,
        email=body.email,
        phone=body.phone,
        message=body.message,
    )
    await db.bookings.insert_one(b.model_dump())

    meta = {
        "Szakember": member["name"],
        "Szolgáltatás": service["title"],
        "Időpont": f"{body.date} {body.time}",
    }
    subject = "Foglalás visszaigazolás — Studio Vita"
    await send_email(to=body.email, subject=subject, html=_booking_email_html(b.model_dump(), meta))
    return b.model_dump()


@api.post("/bookings/workshop")
async def create_workshop_booking(body: WorkshopBookingIn):
    ws = await db.workshops.find_one({"workshop_id": body.workshop_id}, {"_id": 0})
    if not ws:
        raise HTTPException(400, "Érvénytelen program")
    if ws["spots_left"] <= 0:
        raise HTTPException(400, "Sajnos betelt a program.")

    b = Booking(
        kind="workshop",
        workshop_id=body.workshop_id,
        date=ws["date"],
        time=ws["time"],
        name=body.name,
        email=body.email,
        phone=body.phone,
        message=body.message,
    )
    await db.bookings.insert_one(b.model_dump())
    await db.workshops.update_one({"workshop_id": body.workshop_id}, {"$inc": {"spots_left": -1}})

    meta = {
        "Program": ws["title"],
        "Vezető": ws["instructor"],
        "Időpont": f"{ws['date']} {ws['time']}",
    }
    subject = "Jelentkezés visszaigazolás — Studio Vita"
    await send_email(to=body.email, subject=subject, html=_booking_email_html(b.model_dump(), meta))
    return b.model_dump()


# --------- Admin: Bookings ---------
@api.get("/admin/bookings")
async def admin_list_bookings(_=Depends(get_current_admin)):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


class StatusUpdate(BaseModel):
    status: Literal["new", "confirmed", "cancelled"]


@api.put("/admin/bookings/{booking_id}")
async def update_booking(booking_id: str, body: StatusUpdate, _=Depends(get_current_admin)):
    res = await db.bookings.update_one({"booking_id": booking_id}, {"$set": {"status": body.status}})
    if not res.matched_count:
        raise HTTPException(404, "Nem található")
    return await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})


@api.delete("/admin/bookings/{booking_id}")
async def delete_booking(booking_id: str, _=Depends(get_current_admin)):
    await db.bookings.delete_one({"booking_id": booking_id})
    return {"ok": True}


# --------- Contact ---------
class ContactIn(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str


@api.post("/contact")
async def contact(body: ContactIn):
    msg = ContactMessage(**body.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return {"ok": True}


@api.get("/admin/messages")
async def admin_messages(_=Depends(get_current_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


# --------- Health ---------
@api.get("/")
async def root():
    return {"app": "Studio Vita", "status": "ok"}


# --------- Uploads / Files ---------
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@api.post("/admin/uploads")
async def upload_image(file: UploadFile = File(...), _=Depends(get_current_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin").lower()
    if ext not in MIME_TYPES:
        raise HTTPException(400, "Csak JPG, PNG, WEBP vagy GIF képek engedélyezettek.")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "A fájl túl nagy (max 8 MB).")
    ctype = MIME_TYPES[ext]
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, ctype)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(502, "Sikertelen feltöltés")
    doc = {
        "file_id": new_id(),
        "storage_path": result["path"],
        "content_type": ctype,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    }
    await db.files.insert_one(doc)
    return {"url": f"/api/files/{result['path']}", "path": result["path"]}


@api.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Nem található")
    try:
        data, ctype = get_object(path)
    except Exception:
        raise HTTPException(404, "Nem található")
    return Response(content=data, media_type=record.get("content_type") or ctype,
                    headers={"Cache-Control": "public, max-age=3600"})


# --------- Spaces (studio photos) ---------
@api.get("/spaces")
async def list_spaces():
    return await db.spaces.find({}, {"_id": 0}).sort("order", 1).to_list(200)


class SpaceIn(BaseModel):
    label: str
    caption: str = ""
    photo_url: str = ""
    slot: str = "generic"
    order: int = 0


@api.post("/admin/spaces")
async def create_space(body: SpaceIn, _=Depends(get_current_admin)):
    s = Space(**body.model_dump())
    await db.spaces.insert_one(s.model_dump())
    return s.model_dump()


@api.put("/admin/spaces/{space_id}")
async def update_space(space_id: str, body: SpaceIn, _=Depends(get_current_admin)):
    res = await db.spaces.update_one({"space_id": space_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Nem található")
    return await db.spaces.find_one({"space_id": space_id}, {"_id": 0})


@api.delete("/admin/spaces/{space_id}")
async def delete_space(space_id: str, _=Depends(get_current_admin)):
    await db.spaces.delete_one({"space_id": space_id})
    return {"ok": True}


@api.get("/admin/spaces")
async def admin_list_spaces(_=Depends(get_current_admin)):
    return await db.spaces.find({}, {"_id": 0}).sort("order", 1).to_list(500)


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= Seed =================
SEED_TEAM = [
    {
        "name": "Dr. Kovács Anna",
        "role": "Klinikai szakpszichológus",
        "specialties": ["Szorongás", "Életvezetés", "Traumafeldolgozás"],
        "bio": "Több mint 15 éve dolgozom felnőttekkel különböző életszakaszokban. Hiszek abban, hogy minden változás egy figyelmes, biztonságos térben kezdődik.",
        "qualifications": ["ELTE PPK — klinikai szakpszichológus", "EMDR terapeuta"],
        "methods": ["Kognitív-viselkedésterápia", "EMDR", "Sématerápia"],
        "languages": ["Magyar", "Angol"],
        "works_with": ["Felnőttek"],
        "order": 1,
    },
    {
        "name": "Nagy Péter",
        "role": "Coach, mentálhigiénés szakember",
        "specialties": ["Karrier", "Stresszkezelés", "Életváltozások"],
        "bio": "Rendszerszemléletű coachként segítek megtalálni azt a következő lépést, ami valóban a tiéd.",
        "qualifications": ["SE Mentálhigiéné", "ICF akkreditált coach"],
        "methods": ["Coaching", "Rendszerszemlélet", "Fókuszolás"],
        "languages": ["Magyar"],
        "works_with": ["Felnőttek"],
        "order": 2,
    },
    {
        "name": "Szabó Réka",
        "role": "Gyermek- és családterapeuta",
        "specialties": ["Gyermek szorongás", "Iskolai nehézségek", "Család"],
        "bio": "A gyermekek szavak nélkül is beszélnek — feladatom, hogy a családdal együtt meghalljuk őket.",
        "qualifications": ["Gyermek klinikai szakpszichológus", "Családterapeuta"],
        "methods": ["Játékterápia", "Családterápia"],
        "languages": ["Magyar"],
        "works_with": ["Gyermekek", "Családok"],
        "order": 3,
    },
    {
        "name": "Tóth Balázs",
        "role": "Pár- és családterapeuta",
        "specialties": ["Párkapcsolat", "Konfliktus", "Kommunikáció"],
        "bio": "Amikor egy kapcsolat elakad, két embernek kell megtanulnia egy új nyelvet — ehhez adunk teret.",
        "qualifications": ["Családterapeuta szakvizsga"],
        "methods": ["EFT párterápia", "Rendszerszemléletű családterápia"],
        "languages": ["Magyar", "Angol"],
        "works_with": ["Párok", "Családok"],
        "order": 4,
    },
    {
        "name": "Farkas Eszter",
        "role": "Mozgás- és testtudati tréner",
        "specialties": ["Testtudat", "Stresszoldás", "Csoportos mozgás"],
        "bio": "A test emlékszik arra, amit a fej elenged. Kis csoportos foglalkozásaimon lassuló, figyelmes mozgás vár.",
        "qualifications": ["Szomatikus mozgásterápia", "Feldenkrais tréner"],
        "methods": ["Feldenkrais", "Szomatikus gyakorlatok"],
        "languages": ["Magyar"],
        "works_with": ["Felnőttek", "Csoportok"],
        "order": 5,
    },
    {
        "name": "Molnár Júlia",
        "role": "Kreatív műhely vezető",
        "specialties": ["Művészetterápia", "Önismereti workshop"],
        "bio": "Az alkotás olyan út, amit szavak nélkül is be lehet járni — vezetem, de nem irányítom.",
        "qualifications": ["Művészetterapeuta"],
        "methods": ["Művészetterápia", "Csoportos önismeret"],
        "languages": ["Magyar"],
        "works_with": ["Felnőttek", "Csoportok"],
        "order": 6,
    },
]

SEED_SERVICES = [
    # egyeni
    {"title": "Egyéni terápia felnőtteknek", "category": "egyeni", "short_description": "Biztonságos tér a saját folyamataidhoz — szorongás, önismeret, életváltozások.", "description": "Egyéni pszichoterápiás vagy tanácsadói ülés felnőtteknek. Az első alkalom közös ismerkedés és irányválasztás.", "duration_min": 50, "price_huf": 18000, "order": 1},
    {"title": "Coaching", "category": "egyeni", "short_description": "Célok, döntések, karrier — támogatás abban, hogy megtaláld a saját következő lépésed.", "description": "Rendszerszemléletű coaching folyamat személyes vagy szakmai céljaid mellé.", "duration_min": 60, "price_huf": 20000, "order": 2},
    # gyermek
    {"title": "Gyermek pszichológiai támogatás", "category": "gyermek", "short_description": "Játékos, biztonságos térben — szorongás, elakadás, iskolai nehézségek.", "description": "Gyermek pszichológiai konzultáció és játékterápia. A szülőkkel párhuzamos konzultációs alkalmakat tartunk.", "duration_min": 50, "price_huf": 16000, "order": 3},
    {"title": "Fejlesztő foglalkozás", "category": "gyermek", "short_description": "Egyéni fejlesztő órák tanulási és figyelmi elakadások mellé.", "description": "Egyéni fejlesztés célzottan a gyermek erősségeire és nehézségeire szabva.", "duration_min": 45, "price_huf": 14000, "order": 4},
    # kapcsolat
    {"title": "Párterápia", "category": "kapcsolat", "short_description": "Kommunikáció, konfliktus, újratervezés — közös tér két ember számára.", "description": "EFT és rendszerszemléletű megközelítéssel dolgozunk. Az első két alkalom feltérképezés.", "duration_min": 90, "price_huf": 28000, "order": 5},
    {"title": "Családterápia", "category": "kapcsolat", "short_description": "Amikor több generáció együtt keres új egyensúlyt.", "description": "A család rendszerére fókuszáló ülések. Az első alkalomra általában több családtagot hívunk.", "duration_min": 90, "price_huf": 30000, "order": 6},
    # csoport
    {"title": "Önismereti csoport", "category": "csoport", "short_description": "Kis létszámú, folyamatos csoport heti alkalmakkal.", "description": "Zárt csoportos önismereti folyamat — jelentkezéskor rövid beszélgetéssel indul.", "duration_min": 120, "price_huf": 12000, "order": 7},
    {"title": "Mozgás- és testtudati csoport", "category": "csoport", "short_description": "Lassuló, figyelmes mozgás, önmagadhoz visszatérni.", "description": "Feldenkrais alapú kis csoportos foglalkozás.", "duration_min": 75, "price_huf": 8000, "order": 8},
    # program
    {"title": "Szülő műhely", "category": "program", "short_description": "Beszélgető és gyakorlati műhely szülőknek — egy este közösen.", "description": "Havonta egyszer, változó témákban. Nem előadás, hanem gyakorlati, támogató tér.", "duration_min": 120, "price_huf": 9000, "order": 9},
    {"title": "Kreatív hétvége", "category": "program", "short_description": "Alkotás vezetve, csendben, önmagunk felé fordulva.", "description": "Egynapos, művészetterápiás keretben tartott műhely — nem kell rajztudás.", "duration_min": 360, "price_huf": 22000, "order": 10},
]

SEED_WORKSHOPS = [
    {"title": "Szülő műhely — Amikor a gyerek szorong", "description": "Beszélgető és gyakorlati este szülőknek a gyerekkori szorongás jeleiről és a támogatás lehetőségeiről.", "instructor": "Szabó Réka", "date": (datetime.now(timezone.utc).date() + timedelta(days=14)).isoformat(), "time": "18:00", "duration_min": 120, "price_huf": 9000, "capacity": 14, "spots_left": 14, "who_for": "Szülők, gondozók"},
    {"title": "Feldenkrais hétvége", "description": "Két délelőtti alkalom, lassuló, figyelmes mozgással — testtudat és stresszoldás.", "instructor": "Farkas Eszter", "date": (datetime.now(timezone.utc).date() + timedelta(days=28)).isoformat(), "time": "10:00", "duration_min": 150, "price_huf": 12000, "capacity": 10, "spots_left": 10, "who_for": "Felnőttek — előzetes tapasztalat nem szükséges"},
    {"title": "Kreatív műhely — Belső tájak", "description": "Egynapos művészetterápiás műhely önismereti fókusszal, nem kell rajztudás.", "instructor": "Molnár Júlia", "date": (datetime.now(timezone.utc).date() + timedelta(days=42)).isoformat(), "time": "10:00", "duration_min": 360, "price_huf": 22000, "capacity": 8, "spots_left": 8, "who_for": "Felnőttek"},
    {"title": "Párok estje — Új nyelv a kapcsolatban", "description": "Egy este, két embernek — EFT alapú kommunikációs gyakorlatokkal.", "instructor": "Tóth Balázs", "date": (datetime.now(timezone.utc).date() + timedelta(days=21)).isoformat(), "time": "18:30", "duration_min": 150, "price_huf": 18000, "capacity": 12, "spots_left": 12, "who_for": "Párok"},
]


async def seed_all():
    # Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "user_id": new_id(),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Studio Vita Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Updated admin password from .env")

    # Team
    if await db.team.count_documents({}) == 0:
        for t in SEED_TEAM:
            m = TeamMember(**t)
            await db.team.insert_one(m.model_dump())
    # Services
    if await db.services.count_documents({}) == 0:
        for s in SEED_SERVICES:
            svc = Service(**s)
            await db.services.insert_one(svc.model_dump())
    # Workshops
    if await db.workshops.count_documents({}) == 0:
        for w in SEED_WORKSHOPS:
            wk = Workshop(**w)
            await db.workshops.insert_one(wk.model_dump())
