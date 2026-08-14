import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Placeholder } from "@/components/Placeholder";

export default function Team() {
  const [team, setTeam] = useState([]);
  useEffect(() => { api.get("/team").then((r) => setTeam(r.data)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Szakembereink</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl text-[#3E362E] leading-tight">
        Emberek, akik veled tartanak.
      </h1>
      <p className="mt-6 text-lg text-[#63584D] max-w-2xl">
        Rövid bemutatkozás után böngészd végig szakembereink profilját — foglalás közvetlenül a profil oldaláról.
      </p>

      <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="team-grid">
        {team.map((m) => (
          <Link key={m.member_id} to={`/szakembereink/${m.member_id}`} data-testid={`team-card-${m.member_id}`}
            className="group rounded-3xl bg-white border border-[#EAE5DE] overflow-hidden hover:-translate-y-1 transition-all shadow-[0_8px_32px_rgba(62,54,46,0.04)]">
            <Placeholder label={`Meleg portré — ${m.name}`} minH="min-h-[280px]" className="!rounded-none !border-0 !bg-[#EAE5DE]/60" />
            <div className="p-7">
              <h3 className="font-serif text-2xl text-[#3E362E]">{m.name}</h3>
              <p className="text-sm text-[#7A5C50] mt-1">{m.role}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs bg-[#F3EFEA] rounded-full px-3 py-1 text-[#63584D]">{s}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
