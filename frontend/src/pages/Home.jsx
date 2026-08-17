import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, CATEGORY_LABELS } from "@/lib/api";
import { Placeholder } from "@/components/Placeholder";
import { Photo } from "@/components/Photo";
import { Leaf, Users, HeartHandshake, Sprout, Compass, ArrowRight, Quote } from "lucide-react";

const journeys = [
  { icon: Compass, title: "Segítséget keresek magamnak", desc: "Egyéni terápia, coaching, önismeret — biztonságos tér a te folyamataidhoz.", to: "/szolgaltatasok#egyeni" },
  { icon: Sprout, title: "Támogatás a gyermekemnek", desc: "Gyermek pszichológiai konzultáció, fejlesztés, szülőknek szóló műhelyek.", to: "/szolgaltatasok#gyermek" },
  { icon: HeartHandshake, title: "Kapcsolatunkra keresek teret", desc: "Pár- és családterápia — új nyelv a kapcsolatban, több generáción át.", to: "/szolgaltatasok#kapcsolat" },
  { icon: Users, title: "Csoportos fejlődésre vágyom", desc: "Önismereti csoportok, mozgás, kreatív műhelyek — közös haladás.", to: "/szolgaltatasok#csoport" },
];

export default function Home() {
  const [team, setTeam] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [spaces, setSpaces] = useState([]);
  useEffect(() => {
    api.get("/team").then((r) => setTeam(r.data.slice(0, 4))).catch(() => {});
    api.get("/workshops").then((r) => setWorkshops(r.data.slice(0, 3))).catch(() => {});
    api.get("/spaces").then((r) => setSpaces(r.data)).catch(() => {});
  }, []);
  const heroSpace = spaces.find((s) => s.slot === "hero");
  const aboutSpace = spaces.find((s) => s.slot === "about");

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 animate-fade-up" data-testid="hero-section">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EFEA] px-4 py-1.5 text-xs tracking-widest text-[#7A5C50] uppercase">
            <Leaf className="w-3.5 h-3.5" /> Multidiszciplináris jóllét-műhely
          </div>
          <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl text-[#3E362E] leading-[1.05] tracking-tight">
            Teret adunk<br />a <em className="text-[#C98E7B] not-italic">változásnak</em>.
          </h1>
          <p className="mt-8 text-lg text-[#63584D] max-w-xl leading-relaxed">
            Egyéni és közös fejlődéshez, kapcsolódáshoz és támogatáshoz nyújtunk biztonságos,
            inspiráló teret gyermekeknek, felnőtteknek, pároknak és családoknak.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/foglalas" data-testid="hero-book-cta"
              className="rounded-full bg-[#7A5C50] text-white px-7 py-3.5 tracking-wider hover:bg-[#63584D] transition-all hover:-translate-y-0.5">
              IDŐPONTOT FOGLALOK
            </Link>
            <Link to="/szakembereink" data-testid="hero-team-cta"
              className="rounded-full border border-[#B5A79A] text-[#7A5C50] px-7 py-3.5 tracking-wider hover:bg-[#F3EFEA] transition-all">
              MEGISMEREM A SZAKEMBEREINKET
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="relative">
            <Photo url={heroSpace?.photo_url} label="Meleg hangulatú fotó a Studio Vita fogadóteréből — természetes fény, növények, textilek" minH="min-h-[420px]" />
            <div className="hidden md:block absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#A3B19B]/30 blur-2xl" />
            <div className="hidden md:block absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#C98E7B]/30 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Journeys */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B] mb-4">Mi hozott ma ide?</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#3E362E]">Nem kell mindent egyedül megoldanod.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {journeys.map((j) => (
            <Link key={j.title} to={j.to} data-testid={`journey-${j.to.split("#")[1]}`}
              className="group rounded-3xl bg-white p-8 border border-[#EAE5DE] hover:border-[#B5A79A] transition-all hover:-translate-y-1 shadow-[0_8px_32px_rgba(62,54,46,0.04)]">
              <div className="flex items-start gap-5">
                <span className="shrink-0 w-12 h-12 rounded-full bg-[#F3EFEA] text-[#7A5C50] grid place-items-center">
                  <j.icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-[#3E362E]">{j.title}</h3>
                  <p className="mt-2 text-[#63584D] leading-relaxed">{j.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-[#7A5C50] group-hover:gap-2 transition-all">
                    Tovább a részletekhez <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Studio Vita */}
      <section className="bg-[#F3EFEA] py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <Photo url={aboutSpace?.photo_url} label="Interior részlet — bézs textíliák, természetes anyagok, egy csésze tea az asztalon" minH="min-h-[360px]" />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B] mb-4">Miért Studio Vita?</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#3E362E]">Szakmai tudás, emberi figyelem.</h2>
            <div className="mt-10 space-y-6">
              {[
                { t: "Egy hely, ahol rád figyelünk.", d: "Multidiszciplináris csapat — pszichológus, coach, család- és párterapeuta, mozgás- és kreatív műhelyvezető." },
                { t: "Támogatás a változás minden szakaszában.", d: "Legyen szó egy nehéz élethelyzetről, egy új szakaszról vagy önismereti vágyról — nem egyedül lépsz." },
                { t: "A fejlődésnek is kell egy tér.", d: "Meleg, otthonos, csendes szobák — természetes fény, biztonság, folytonosság." },
              ].map((x) => (
                <div key={x.t} className="flex gap-4">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#C98E7B]" />
                  <div>
                    <h3 className="font-serif text-xl text-[#3E362E]">{x.t}</h3>
                    <p className="text-[#63584D] mt-1">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team preview */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B] mb-3">Szakembereink</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#3E362E] max-w-xl">
              Találd meg a számodra megfelelő támogatást.
            </h2>
          </div>
          <Link to="/szakembereink" className="rounded-full border border-[#B5A79A] text-[#7A5C50] px-5 py-2.5 text-sm hover:bg-[#F3EFEA] transition-all" data-testid="home-team-link">
            Teljes csapat
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m) => (
            <Link key={m.member_id} to={`/szakembereink/${m.member_id}`} data-testid={`home-team-card-${m.member_id}`}
              className="group rounded-3xl bg-white border border-[#EAE5DE] overflow-hidden hover:-translate-y-1 transition-all shadow-[0_8px_32px_rgba(62,54,46,0.04)]">
              <div className="h-[220px] overflow-hidden bg-[#EAE5DE]/60">
                <Photo url={m.photo_url} label={`Meleg portré — ${m.name}`} minH="h-full" className="!rounded-none" rounded={false} />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl text-[#3E362E]">{m.name}</h3>
                <p className="text-sm text-[#7A5C50] mt-1">{m.role}</p>
                <p className="text-sm text-[#63584D] mt-3 line-clamp-2">{m.specialties.join(" · ")}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Workshops */}
      <section className="bg-[#F3EFEA] py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B] mb-3">Következő programok</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-[#3E362E] max-w-xl">Csoportok, műhelyek, mozgás.</h2>
            </div>
            <Link to="/programok" data-testid="home-workshops-link" className="rounded-full border border-[#B5A79A] text-[#7A5C50] px-5 py-2.5 text-sm hover:bg-[#EAE5DE] transition-all">
              Összes program
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {workshops.map((w) => (
              <div key={w.workshop_id} className="rounded-3xl bg-white p-7 border border-[#EAE5DE]">
                <p className="text-xs uppercase tracking-widest text-[#C98E7B]">{w.date} · {w.time}</p>
                <h3 className="font-serif text-2xl mt-3 text-[#3E362E]">{w.title}</h3>
                <p className="mt-3 text-sm text-[#63584D] line-clamp-3">{w.description}</p>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-[#63584D]">{w.instructor}</span>
                  <Link to="/programok" className="text-[#7A5C50] hover:underline">Részletek →</Link>
                </div>
              </div>
            ))}
            {workshops.length === 0 && (
              <p className="text-[#63584D] italic">Hamarosan új programok érkeznek.</p>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-24 text-center">
        <Quote className="w-8 h-8 text-[#C98E7B] mx-auto" />
        <p className="mt-6 font-serif text-3xl sm:text-4xl text-[#3E362E] leading-snug">
          „Először éreztem azt, hogy nem kell egyedül végigvinnem. A Studio Vita-ban tényleg
          rám figyeltek — türelmesen és emberien."
        </p>
        <p className="mt-6 text-sm uppercase tracking-widest text-[#7A5C50]">— Anna, 34</p>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <div className="rounded-[2rem] bg-[#7A5C50] text-white p-10 sm:p-16 grid md:grid-cols-3 gap-10 items-center">
          <div className="md:col-span-2">
            <h2 className="font-serif text-4xl sm:text-5xl leading-tight">
              Biztonságos teret adunk ahhoz, hogy megállj, kapcsolódj, fejlődj és változtass.
            </h2>
          </div>
          <div className="flex md:justify-end">
            <Link to="/foglalas" data-testid="final-cta-book" className="inline-flex rounded-full bg-white text-[#7A5C50] px-7 py-3.5 tracking-wider hover:bg-[#F3EFEA] transition-all">
              IDŐPONTOT FOGLALOK
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
