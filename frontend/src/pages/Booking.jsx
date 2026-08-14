import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, ChevronRight } from "lucide-react";

const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function nextWeekdays(n = 14) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < n) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function Booking() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [team, setTeam] = useState([]);
  const [services, setServices] = useState([]);
  const [member, setMember] = useState(null);
  const [service, setService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/team").then((r) => {
      setTeam(r.data);
      const m = params.get("member");
      if (m) {
        const found = r.data.find((x) => x.member_id === m);
        if (found) { setMember(found); setStep(2); }
      }
    });
    api.get("/services").then((r) => setServices(r.data));
  }, [params]);

  const dates = useMemo(() => nextWeekdays(10), []);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/bookings/session", {
        member_id: member.member_id,
        service_id: service.service_id,
        date: date.toISOString().slice(0, 10),
        time,
        ...form,
      });
      toast.success("Foglalás rögzítve — visszaigazoló e-mailt küldtünk.");
      setDone(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Nem sikerült a foglalás.");
    } finally { setSubmitting(false); }
  };

  const steps = ["Szakember", "Szolgáltatás", "Időpont", "Adataid"];

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Időpontfoglalás</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-[#3E362E]">
        Egy nyugodt tér, egy közös első lépés.
      </h1>

      {/* Stepper */}
      <ol className="mt-10 flex flex-wrap gap-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 text-sm rounded-full px-4 py-2 border ${step > i ? "bg-[#F3EFEA] border-[#B5A79A] text-[#7A5C50]" : step === i + 1 ? "bg-[#7A5C50] text-white border-[#7A5C50]" : "bg-white border-[#EAE5DE] text-[#9A8F83]"}`}>
            {step > i ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>} {s}
          </li>
        ))}
      </ol>

      {done ? (
        <div className="mt-12 rounded-3xl bg-white border border-[#EAE5DE] p-10 text-center" data-testid="booking-success">
          <h2 className="font-serif text-3xl text-[#3E362E]">Köszönjük a foglalást!</h2>
          <p className="mt-3 text-[#63584D]">Kollégánk hamarosan felveszi veled a kapcsolatot az {form.email} címen.</p>
        </div>
      ) : (
        <div className="mt-12 rounded-3xl bg-white border border-[#EAE5DE] p-8 sm:p-10">
          {step === 1 && (
            <div data-testid="booking-step-1">
              <h3 className="font-serif text-2xl text-[#3E362E]">Válassz szakembert</h3>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {team.map((m) => (
                  <button key={m.member_id} onClick={() => { setMember(m); setStep(2); }}
                    data-testid={`book-member-${m.member_id}`}
                    className={`text-left rounded-2xl border p-5 hover:border-[#B5A79A] transition-all ${member?.member_id === m.member_id ? "border-[#7A5C50] bg-[#F3EFEA]" : "border-[#EAE5DE]"}`}>
                    <div className="font-serif text-xl text-[#3E362E]">{m.name}</div>
                    <div className="text-sm text-[#7A5C50] mt-1">{m.role}</div>
                    <div className="text-xs text-[#63584D] mt-2">{m.specialties.slice(0, 2).join(" · ")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && member && (
            <div data-testid="booking-step-2">
              <button onClick={() => setStep(1)} className="text-sm text-[#7A5C50] hover:underline">← Szakember módosítása</button>
              <h3 className="mt-3 font-serif text-2xl text-[#3E362E]">Válaszd ki a szolgáltatást</h3>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {services.map((s) => (
                  <button key={s.service_id} onClick={() => { setService(s); setStep(3); }}
                    data-testid={`book-service-${s.service_id}`}
                    className={`text-left rounded-2xl border p-5 hover:border-[#B5A79A] transition-all ${service?.service_id === s.service_id ? "border-[#7A5C50] bg-[#F3EFEA]" : "border-[#EAE5DE]"}`}>
                    <div className="font-serif text-lg text-[#3E362E]">{s.title}</div>
                    <p className="text-sm text-[#63584D] mt-2">{s.short_description}</p>
                    <div className="mt-3 text-xs text-[#9A8F83]">{s.duration_min} perc {s.price_huf ? `· ${s.price_huf.toLocaleString("hu-HU")} Ft` : ""}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div data-testid="booking-step-3">
              <button onClick={() => setStep(2)} className="text-sm text-[#7A5C50] hover:underline">← Szolgáltatás módosítása</button>
              <h3 className="mt-3 font-serif text-2xl text-[#3E362E]">Válassz időpontot</h3>

              <div className="mt-6">
                <div className="text-sm uppercase tracking-widest text-[#9A8F83] mb-3">Nap</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {dates.map((d) => {
                    const key = d.toISOString().slice(0, 10);
                    const active = date && date.toISOString().slice(0, 10) === key;
                    return (
                      <button key={key} onClick={() => setDate(d)} data-testid={`book-date-${key}`}
                        className={`rounded-2xl border px-3 py-3 text-sm ${active ? "bg-[#7A5C50] text-white border-[#7A5C50]" : "border-[#EAE5DE] hover:border-[#B5A79A] text-[#3E362E]"}`}>
                        <div className="text-xs opacity-80">{d.toLocaleDateString("hu-HU", { weekday: "short" })}</div>
                        <div className="font-serif text-lg">{d.getDate()}</div>
                        <div className="text-xs opacity-80">{d.toLocaleDateString("hu-HU", { month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {date && (
                <div className="mt-8">
                  <div className="text-sm uppercase tracking-widest text-[#9A8F83] mb-3">Időpont</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIMES.map((t) => (
                      <button key={t} onClick={() => { setTime(t); setStep(4); }} data-testid={`book-time-${t}`}
                        className={`rounded-full border px-4 py-2 text-sm ${time === t ? "bg-[#7A5C50] text-white border-[#7A5C50]" : "border-[#EAE5DE] hover:border-[#B5A79A] text-[#3E362E]"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div data-testid="booking-step-4">
              <button onClick={() => setStep(3)} className="text-sm text-[#7A5C50] hover:underline">← Időpont módosítása</button>
              <h3 className="mt-3 font-serif text-2xl text-[#3E362E]">Add meg az adataidat</h3>

              <div className="mt-4 rounded-2xl bg-[#F3EFEA] p-5 text-sm text-[#3E362E]">
                <div><strong>Szakember:</strong> {member.name}</div>
                <div><strong>Szolgáltatás:</strong> {service.title}</div>
                <div><strong>Időpont:</strong> {date.toLocaleDateString("hu-HU")} — {time}</div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <input required placeholder="Név" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="book-name" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="book-email" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input required placeholder="Telefonszám" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="book-phone" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input placeholder="Rövid üzenet (opcionális)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="book-message" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
              </div>

              <button onClick={submit} disabled={submitting || !form.name || !form.email || !form.phone}
                data-testid="book-submit"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#7A5C50] text-white px-7 py-3.5 tracking-wider hover:bg-[#63584D] disabled:opacity-50">
                {submitting ? "Küldés…" : "Foglalás megerősítése"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
