import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "Honnan tudom, melyik szakembert válasszam?", a: "Ha bizonytalan vagy, foglalj első időpontot bármelyik felnőttekkel dolgozó kollégánknál — az első alkalom közös feltérképezés, és szükség esetén más szakemberhez irányítunk." },
  { q: "Mi történik az első alkalommal?", a: "Ismerkedés, a helyzeted rövid áttekintése, és közös irányválasztás. Nem kell előre pontosan tudnod, mit keresel." },
  { q: "Meddig tart egy ülés?", a: "Egyéni ülés általában 50 perc, párterápia és családterápia 90 perc, csoportok 75–120 perc." },
  { q: "Hogyan tudok foglalni vagy lemondani?", a: 'Foglalás online, az „IDŐPONTOT FOGLALOK" gombbal. Lemondás legkésőbb 24 órával az időpont előtt e-mailben lehetséges.' },
  { q: "Gyermekemet is fogadjátok?", a: "Igen — gyermekpszichológus, család- és fejlesztőterapeuta kollégáink dolgoznak gyerekekkel, mindig szülői konzultáció mellett." },
  { q: "Van online konzultáció?", a: "Igen, felnőttekkel és pároknál. Gyermekekkel személyes találkozást javasolunk." },
  { q: "Párként hogyan érkezzünk?", a: "Az első alkalomra érdemes együtt jönnötök. Az első két ülés általában közös feltérképezés." },
  { q: "Mennyibe kerül?", a: "A pontos árakat a szolgáltatások oldalán találod. Sávos árazást is tudunk kínálni méltányossági alapon." },
];

export default function Faq() {
  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">GYIK</p>
      <h1 className="mt-4 font-serif text-5xl text-[#3E362E]">Gyakori kérdések.</h1>
      <p className="mt-6 text-[#63584D] max-w-2xl">
        Ha nem találod a válaszod, keress minket bátran a Kapcsolat oldalon.
      </p>

      <Accordion type="single" collapsible className="mt-12 space-y-3" data-testid="faq-accordion">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="rounded-3xl bg-white border border-[#EAE5DE] px-6">
            <AccordionTrigger data-testid={`faq-q-${i}`} className="font-serif text-lg text-[#3E362E] hover:no-underline text-left py-5">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-[#63584D] leading-relaxed pb-5">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
