import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Placeholder } from "@/components/Placeholder";

export default function TeamMember() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  useEffect(() => { api.get(`/team/${id}`).then((r) => setM(r.data)).catch(() => setM(false)); }, [id]);

  if (m === null) return <div className="p-16 text-[#63584D]">Betöltés…</div>;
  if (m === false) return <div className="p-16 text-[#63584D]">Nem található.</div>;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <Link to="/szakembereink" className="text-sm text-[#7A5C50] hover:underline">← Vissza a csapathoz</Link>

      <div className="mt-8 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <Placeholder label={`Meleg portré — ${m.name}`} minH="min-h-[420px]" />
          <Link to={`/foglalas?member=${m.member_id}`} data-testid="member-book-cta"
            className="mt-6 w-full inline-flex justify-center rounded-full bg-[#7A5C50] text-white px-7 py-3.5 tracking-wider hover:bg-[#63584D] transition-all">
            IDŐPONTOT FOGLALOK
          </Link>
        </div>

        <div className="lg:col-span-3">
          <h1 className="font-serif text-5xl text-[#3E362E]">{m.name}</h1>
          <p className="mt-2 text-lg text-[#7A5C50]">{m.role}</p>
          <p className="mt-8 text-[#63584D] leading-relaxed text-lg">{m.bio}</p>

          {m.specialties?.length > 0 && (
            <div className="mt-10">
              <h3 className="font-serif text-xl text-[#3E362E] mb-3">Területek</h3>
              <div className="flex flex-wrap gap-2">
                {m.specialties.map((s) => (
                  <span key={s} className="text-sm bg-[#F3EFEA] rounded-full px-4 py-1.5 text-[#63584D]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {m.qualifications?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl text-[#3E362E] mb-3">Végzettség</h3>
              <ul className="space-y-1 text-[#63584D]">
                {m.qualifications.map((q) => <li key={q}>· {q}</li>)}
              </ul>
            </div>
          )}

          {m.methods?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl text-[#3E362E] mb-3">Módszertan</h3>
              <ul className="space-y-1 text-[#63584D]">
                {m.methods.map((q) => <li key={q}>· {q}</li>)}
              </ul>
            </div>
          )}

          {m.works_with?.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-serif text-xl text-[#3E362E] mb-2">Kikkel dolgozom</h3>
                <p className="text-[#63584D]">{m.works_with.join(", ")}</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#3E362E] mb-2">Nyelvek</h3>
                <p className="text-[#63584D]">{m.languages.join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
