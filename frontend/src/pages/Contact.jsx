import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { Placeholder } from "@/components/Placeholder";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Köszönjük! Hamarosan válaszolunk.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Nem sikerült elküldeni. Próbáld újra.");
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Kapcsolat</p>
      <h1 className="mt-4 font-serif text-5xl text-[#3E362E]">Írj nekünk — vagy gyere el.</h1>

      <div className="mt-16 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="rounded-3xl bg-white border border-[#EAE5DE] p-8 space-y-5">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-[#7A5C50] mt-1" />
              <div>
                <div className="font-serif text-lg text-[#3E362E]">Cím</div>
                <div className="text-[#63584D]">1052 Budapest, Példa utca 1.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-[#7A5C50] mt-1" />
              <div>
                <div className="font-serif text-lg text-[#3E362E]">E-mail</div>
                <div className="text-[#63584D]">hello@studiovita.hu</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-[#7A5C50] mt-1" />
              <div>
                <div className="font-serif text-lg text-[#3E362E]">Telefon</div>
                <div className="text-[#63584D]">+36 30 000 0000</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-[#7A5C50] mt-1" />
              <div>
                <div className="font-serif text-lg text-[#3E362E]">Nyitva</div>
                <div className="text-[#63584D]">Hétfő–péntek 9–20 · Szombat 10–14</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Placeholder label="Térkép beágyazása — a Studio Vita helyszínének elhelyezkedésével" minH="min-h-[260px]" />
          </div>

          <div className="mt-6 rounded-3xl bg-[#F3EFEA] p-6 text-sm text-[#63584D]">
            <div className="font-serif text-lg text-[#3E362E] mb-2">Megközelítés</div>
            Metró és villamos közelben, akadálymentes bejárattal. Utcai parkolás fizetős övezetben.
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl bg-white border border-[#EAE5DE] p-8 space-y-4" data-testid="contact-form">
          <h3 className="font-serif text-2xl text-[#3E362E]">Írj nekünk</h3>
          <input required placeholder="Név" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            data-testid="contact-name" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
          <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            data-testid="contact-email" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
          <input placeholder="Tárgy" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            data-testid="contact-subject" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
          <textarea required rows={5} placeholder="Üzenet" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            data-testid="contact-message" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none resize-none" />
          <button type="submit" disabled={sending} data-testid="contact-submit"
            className="rounded-full bg-[#7A5C50] text-white px-6 py-3 tracking-wider hover:bg-[#63584D] disabled:opacity-60">
            {sending ? "Küldés…" : "Küldés"}
          </button>
        </form>
      </div>
    </div>
  );
}
