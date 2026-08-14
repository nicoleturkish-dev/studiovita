import { Placeholder } from "@/components/Placeholder";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Rólunk</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl text-[#3E362E] leading-tight">
        Egy hely, ahol együtt jönnek létre a változások.
      </h1>
      <p className="mt-8 text-lg text-[#63584D] max-w-2xl leading-relaxed">
        A Studio Vita többféle szakterületről érkező szakembereket fog össze egy meleg,
        emberi térben. Hiszünk abban, hogy a fejlődéshez nem hangosabb, hanem figyelmesebb
        környezetre van szükség.
      </p>

      <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
        <Placeholder label="A Studio Vita térkép-alaprajza — világos szobák, közös várakozó" minH="min-h-[360px]" />
        <div>
          <h2 className="font-serif text-3xl text-[#3E362E]">A név mögött</h2>
          <p className="mt-4 text-[#63584D] leading-relaxed">
            „Vita" — élet. „Studio" — műhely, ahol dolgozunk azon, ami fontos. Együtt olyan
            hely, ahol figyelmesen, közösen alakítjuk azt, ami a fejlődéshez, a
            kapcsolódáshoz, a változáshoz kell.
          </p>
          <h2 className="mt-10 font-serif text-3xl text-[#3E362E]">Ahogyan dolgozunk</h2>
          <p className="mt-4 text-[#63584D] leading-relaxed">
            Multidiszciplináris csapatot alkotunk: pszichológusok, coachok, család- és
            párterapeuták, gyermekfejlesztő szakemberek, mozgás- és kreatív műhelyvezetők.
            Nem egyetlen módszertan mentén dolgozunk — abban hiszünk, hogy hozzád kell
            igazítani a támogatást.
          </p>
        </div>
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-6">
        {[
          { t: "Meleg, nem klinikai", d: "Nem rendelő, hanem műhely — természetes anyagok, csend, otthonosság." },
          { t: "Szakmai és emberi", d: "Elméleti tudással és személyes figyelemmel dolgozunk együtt veled." },
          { t: "Több generációnak", d: "Gyermekektől a felnőttekig, pároktól a családokig — életszakaszokon át." },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl bg-white border border-[#EAE5DE] p-8">
            <h3 className="font-serif text-2xl text-[#3E362E]">{x.t}</h3>
            <p className="mt-3 text-[#63584D]">{x.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-[2rem] bg-[#F3EFEA] p-10 sm:p-16 text-center">
        <h2 className="font-serif text-4xl text-[#3E362E]">Nem kell mindent egyedül megoldanod.</h2>
        <p className="mt-4 text-[#63584D] max-w-2xl mx-auto">
          Foglalj első alkalmat — közös ismerkedés és irányválasztás.
        </p>
        <Link to="/foglalas" data-testid="about-book-cta" className="mt-8 inline-flex rounded-full bg-[#7A5C50] text-white px-7 py-3.5 tracking-wider hover:bg-[#63584D] transition-all">
          IDŐPONTOT FOGLALOK
        </Link>
      </div>
    </div>
  );
}
