import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Placeholder } from "@/components/Placeholder";

export default function Workshops() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/workshops").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/bookings/workshop", { workshop_id: openId, ...form });
      toast.success("Sikeres jelentkezés! Visszaigazoló e-mailt küldtünk.");
      setOpenId(null);
      setForm({ name: "", email: "", phone: "", message: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Nem sikerült a jelentkezés.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Programok</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl text-[#3E362E]">Közelgő műhelyek és csoportok.</h1>
      <p className="mt-6 text-lg text-[#63584D] max-w-2xl">
        Kis létszámú, meghitt programok — jelentkezés közvetlenül a kártyáról.
      </p>

      <div className="mt-16 space-y-6" data-testid="workshops-list">
        {items.map((w) => (
          <div key={w.workshop_id} className="rounded-3xl bg-white border border-[#EAE5DE] overflow-hidden">
            <div className="grid md:grid-cols-5">
              <Placeholder label={`Hangulatfotó — ${w.title}`} minH="min-h-[220px]"
                className="!rounded-none !border-0 !bg-[#EAE5DE]/60 md:col-span-2" />
              <div className="p-8 md:col-span-3">
                <p className="text-xs uppercase tracking-widest text-[#C98E7B]">
                  {w.date} · {w.time} · {w.duration_min} perc
                </p>
                <h3 className="font-serif text-2xl mt-2 text-[#3E362E]">{w.title}</h3>
                <p className="mt-3 text-[#63584D]">{w.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#63584D]">
                  <span><strong className="text-[#3E362E]">Vezető:</strong> {w.instructor}</span>
                  {w.who_for && <span><strong className="text-[#3E362E]">Kinek:</strong> {w.who_for}</span>}
                  {w.price_huf && <span><strong className="text-[#3E362E]">Ár:</strong> {w.price_huf.toLocaleString("hu-HU")} Ft</span>}
                  <span><strong className="text-[#3E362E]">Szabad hely:</strong> {w.spots_left} / {w.capacity}</span>
                </div>
                <button
                  onClick={() => setOpenId(w.workshop_id)}
                  disabled={w.spots_left <= 0}
                  data-testid={`workshop-join-${w.workshop_id}`}
                  className="mt-6 inline-flex rounded-full bg-[#7A5C50] text-white px-6 py-3 tracking-wider hover:bg-[#63584D] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {w.spots_left > 0 ? "JELENTKEZEM" : "BETELT"}
                </button>
              </div>
            </div>

            {openId === w.workshop_id && (
              <form onSubmit={submit} className="border-t border-[#EAE5DE] p-8 bg-[#FCFBF9] grid sm:grid-cols-2 gap-4" data-testid={`workshop-form-${w.workshop_id}`}>
                <input required placeholder="Név" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="ws-name" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="ws-email" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input required placeholder="Telefonszám" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="ws-phone" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <input placeholder="Üzenet (opcionális)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="ws-message" className="rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button type="submit" disabled={submitting} data-testid="ws-submit"
                    className="rounded-full bg-[#7A5C50] text-white px-6 py-3 tracking-wider hover:bg-[#63584D] disabled:opacity-60">
                    {submitting ? "Küldés…" : "Helyet foglalok"}
                  </button>
                  <button type="button" onClick={() => setOpenId(null)} className="text-[#7A5C50] px-4 py-3">Mégse</button>
                </div>
              </form>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[#63584D] italic">Jelenleg nincs meghirdetett program.</p>
        )}
      </div>
    </div>
  );
}
