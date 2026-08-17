import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Leaf, LogOut, Trash2, Pencil, Plus, Check, X } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

function EditableList({ endpoint, adminEndpoint, fields, title, blank, testKey, extra, hasPhoto }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const load = () => api.get(`/admin/${adminEndpoint}`).then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const startEdit = (it) => { setEditing(it[testKey]); setForm({ ...blank, ...it }); };
  const cancel = () => { setEditing(null); setForm(blank); };

  const save = async () => {
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (typeof payload[k] === "string" && Array.isArray(blank[k])) {
          payload[k] = payload[k].split(",").map((v) => v.trim()).filter(Boolean);
        }
      });
      if (editing === "new") await api.post(`/admin/${adminEndpoint}`, payload);
      else await api.put(`/admin/${adminEndpoint}/${editing}`, payload);
      toast.success("Elmentve");
      cancel(); load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Hiba a mentésnél");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Biztosan törlöd?")) return;
    await api.delete(`/admin/${adminEndpoint}/${id}`);
    toast.success("Törölve"); load();
  };

  const renderField = (f) => {
    const val = form[f.key] ?? (Array.isArray(blank[f.key]) ? "" : "");
    const display = Array.isArray(val) ? val.join(", ") : val;
    if (f.type === "textarea") {
      return <textarea key={f.key} rows={3} placeholder={f.label} value={display}
        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
        className="col-span-2 w-full rounded-xl border border-[#EAE5DE] px-3 py-2 focus:ring-2 focus:ring-[#A3B19B] outline-none text-sm" />;
    }
    if (f.type === "select") {
      return <select key={f.key} value={display}
        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
        className="rounded-xl border border-[#EAE5DE] px-3 py-2 text-sm">
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>;
    }
    if (f.type === "bool") {
      return <label key={f.key} className="flex items-center gap-2 text-sm text-[#3E362E]">
        <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
        {f.label}
      </label>;
    }
    return <input key={f.key} type={f.type || "text"} placeholder={f.label} value={display}
      onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
      className="rounded-xl border border-[#EAE5DE] px-3 py-2 focus:ring-2 focus:ring-[#A3B19B] outline-none text-sm" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-2xl text-[#3E362E]">{title}</h3>
        <button onClick={() => { setEditing("new"); setForm(blank); }} data-testid={`${adminEndpoint}-add`}
          className="inline-flex items-center gap-2 rounded-full bg-[#7A5C50] text-white px-4 py-2 text-sm hover:bg-[#63584D]">
          <Plus className="w-4 h-4" /> Új
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl bg-[#FCFBF9] border border-[#EAE5DE] p-5 mb-6" data-testid={`${adminEndpoint}-editor`}>
          <div className="grid sm:grid-cols-2 gap-3">
            {hasPhoto && (
              <ImageUpload value={form.photo_url || ""} onChange={(v) => setForm({ ...form, photo_url: v })} label="Fotó" />
            )}
            {fields.map(renderField)}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-1 rounded-full bg-[#7A5C50] text-white px-4 py-2 text-sm hover:bg-[#63584D]" data-testid={`${adminEndpoint}-save`}>
              <Check className="w-4 h-4" /> Mentés
            </button>
            <button onClick={cancel} className="inline-flex items-center gap-1 rounded-full border border-[#B5A79A] px-4 py-2 text-sm text-[#7A5C50]">
              <X className="w-4 h-4" /> Mégse
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it[testKey]} className="rounded-2xl bg-white border border-[#EAE5DE] p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-serif text-lg text-[#3E362E] truncate">{it.name || it.title}</div>
              <div className="text-xs text-[#63584D] truncate">{extra ? extra(it) : (it.role || it.category || it.instructor)}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(it)} className="p-2 rounded-full hover:bg-[#F3EFEA]" data-testid={`${adminEndpoint}-edit-${it[testKey]}`}><Pencil className="w-4 h-4 text-[#7A5C50]" /></button>
              <button onClick={() => remove(it[testKey])} className="p-2 rounded-full hover:bg-[#F3EFEA]" data-testid={`${adminEndpoint}-del-${it[testKey]}`}><Trash2 className="w-4 h-4 text-[#C98E7B]" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsList() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/bookings").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await api.put(`/admin/bookings/${id}`, { status });
    toast.success("Frissítve"); load();
  };
  const remove = async (id) => {
    if (!window.confirm("Törlöd a foglalást?")) return;
    await api.delete(`/admin/bookings/${id}`); toast.success("Törölve"); load();
  };

  return (
    <div>
      <h3 className="font-serif text-2xl text-[#3E362E] mb-4">Foglalások</h3>
      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.booking_id} className="rounded-2xl bg-white border border-[#EAE5DE] p-5" data-testid={`booking-row-${b.booking_id}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#C98E7B]">{b.kind === "session" ? "Ülés" : "Program"} · {b.date} {b.time}</div>
                <div className="font-serif text-lg text-[#3E362E] mt-1">{b.name}</div>
                <div className="text-sm text-[#63584D]">{b.email} · {b.phone}</div>
                {b.message && <div className="text-sm text-[#9A8F83] mt-1 italic">„{b.message}”</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={b.status} onChange={(e) => setStatus(b.booking_id, e.target.value)}
                  className="rounded-full border border-[#EAE5DE] px-3 py-1 text-xs" data-testid={`booking-status-${b.booking_id}`}>
                  <option value="new">Új</option>
                  <option value="confirmed">Megerősítve</option>
                  <option value="cancelled">Lemondva</option>
                </select>
                <button onClick={() => remove(b.booking_id)} className="p-2 rounded-full hover:bg-[#F3EFEA]">
                  <Trash2 className="w-4 h-4 text-[#C98E7B]" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-[#63584D] italic">Még nincs foglalás.</p>}
      </div>
    </div>
  );
}

function MessagesList() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/admin/messages").then((r) => setItems(r.data)); }, []);
  return (
    <div>
      <h3 className="font-serif text-2xl text-[#3E362E] mb-4">Üzenetek</h3>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.message_id} className="rounded-2xl bg-white border border-[#EAE5DE] p-5">
            <div className="text-xs text-[#9A8F83]">{new Date(m.created_at).toLocaleString("hu-HU")}</div>
            <div className="font-serif text-lg text-[#3E362E] mt-1">{m.name} — <span className="text-sm text-[#63584D]">{m.email}</span></div>
            {m.subject && <div className="text-sm text-[#7A5C50] mt-1">{m.subject}</div>}
            <p className="mt-2 text-[#63584D]">{m.message}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-[#63584D] italic">Nincs beérkező üzenet.</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const teamFields = [
    { key: "name", label: "Név" }, { key: "role", label: "Titulus" },
    { key: "specialties", label: "Területek (vesszővel)" }, { key: "qualifications", label: "Végzettség (vesszővel)" },
    { key: "methods", label: "Módszertan (vesszővel)" }, { key: "languages", label: "Nyelvek (vesszővel)" },
    { key: "works_with", label: "Kikkel dolgozik (vesszővel)" }, { key: "order", label: "Sorrend", type: "number" },
    { key: "bio", label: "Bemutatkozás", type: "textarea" }, { key: "active", label: "Aktív", type: "bool" },
  ];
  const teamBlank = { name: "", role: "", specialties: [], qualifications: [], methods: [], languages: ["Magyar"], works_with: [], bio: "", order: 0, active: true, photo_url: "" };

  const spaceFields = [
    { key: "label", label: "Rövid felirat" },
    { key: "slot", label: "Hely", type: "select", options: [
      { value: "hero", label: "Hero (kezdőlap)" },
      { value: "about", label: "Rólunk" },
      { value: "generic", label: "Galéria" },
    ]},
    { key: "order", label: "Sorrend", type: "number" },
    { key: "caption", label: "Rövid leírás", type: "textarea" },
  ];
  const spaceBlank = { label: "", caption: "", photo_url: "", slot: "generic", order: 0 };

  const serviceFields = [
    { key: "title", label: "Cím" },
    { key: "category", label: "Kategória", type: "select", options: CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })) },
    { key: "short_description", label: "Rövid leírás" },
    { key: "duration_min", label: "Időtartam (perc)", type: "number" },
    { key: "price_huf", label: "Ár (Ft)", type: "number" }, { key: "order", label: "Sorrend", type: "number" },
    { key: "description", label: "Hosszabb leírás", type: "textarea" }, { key: "active", label: "Aktív", type: "bool" },
  ];
  const serviceBlank = { title: "", category: "egyeni", short_description: "", description: "", duration_min: 50, price_huf: 0, order: 0, active: true };

  const workshopFields = [
    { key: "title", label: "Cím" }, { key: "instructor", label: "Vezető" },
    { key: "date", label: "Dátum (YYYY-MM-DD)" }, { key: "time", label: "Időpont (HH:MM)" },
    { key: "duration_min", label: "Időtartam (perc)", type: "number" },
    { key: "price_huf", label: "Ár (Ft)", type: "number" },
    { key: "capacity", label: "Kapacitás", type: "number" }, { key: "spots_left", label: "Szabad hely", type: "number" },
    { key: "who_for", label: "Kinek szól" }, { key: "description", label: "Leírás", type: "textarea" },
    { key: "active", label: "Aktív", type: "bool" },
  ];
  const workshopBlank = { title: "", instructor: "", date: "", time: "18:00", duration_min: 90, price_huf: 0, capacity: 12, spots_left: 12, who_for: "", description: "", active: true };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E362E]">
      <header className="border-b border-[#EAE5DE] bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#7A5C50] text-white grid place-items-center"><Leaf className="w-3.5 h-3.5" /></span>
            <span className="font-serif text-xl">Studio Vita Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#63584D] hidden sm:inline">{user?.email}</span>
            <button onClick={logout} data-testid="admin-logout" className="inline-flex items-center gap-2 rounded-full border border-[#B5A79A] text-[#7A5C50] px-4 py-1.5 text-sm hover:bg-[#F3EFEA]">
              <LogOut className="w-4 h-4" /> Kilépés
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="font-serif text-4xl text-[#3E362E]">Adminisztráció</h1>
        <p className="text-[#63584D] mt-2">Kezeld a csapatot, szolgáltatásokat, programokat és foglalásokat.</p>

        <Tabs defaultValue="bookings" className="mt-8">
          <TabsList className="bg-[#F3EFEA] rounded-full p-1">
            <TabsTrigger value="bookings" data-testid="tab-bookings" className="rounded-full data-[state=active]:bg-white">Foglalások</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team" className="rounded-full data-[state=active]:bg-white">Csapat</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services" className="rounded-full data-[state=active]:bg-white">Szolgáltatások</TabsTrigger>
            <TabsTrigger value="workshops" data-testid="tab-workshops" className="rounded-full data-[state=active]:bg-white">Programok</TabsTrigger>
            <TabsTrigger value="spaces" data-testid="tab-spaces" className="rounded-full data-[state=active]:bg-white">Terek</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages" className="rounded-full data-[state=active]:bg-white">Üzenetek</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-8"><BookingsList /></TabsContent>
          <TabsContent value="team" className="mt-8">
            <EditableList adminEndpoint="team" endpoint="team" fields={teamFields} blank={teamBlank} title="Szakembereink" testKey="member_id" hasPhoto />
          </TabsContent>
          <TabsContent value="services" className="mt-8">
            <EditableList adminEndpoint="services" endpoint="services" fields={serviceFields} blank={serviceBlank} title="Szolgáltatások" testKey="service_id" extra={(it) => CATEGORY_LABELS[it.category]} />
          </TabsContent>
          <TabsContent value="workshops" className="mt-8">
            <EditableList adminEndpoint="workshops" endpoint="workshops" fields={workshopFields} blank={workshopBlank} title="Programok" testKey="workshop_id" extra={(it) => `${it.date} · ${it.instructor}`} />
          </TabsContent>
          <TabsContent value="spaces" className="mt-8">
            <EditableList adminEndpoint="spaces" endpoint="spaces" fields={spaceFields} blank={spaceBlank} title="Terek és galéria" testKey="space_id" hasPhoto extra={(it) => it.slot} />
          </TabsContent>
          <TabsContent value="messages" className="mt-8"><MessagesList /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
