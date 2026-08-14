import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/api";
import { ArrowRight } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get("/services").then((r) => setServices(r.data)); }, []);
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [services]);

  const grouped = CATEGORY_ORDER.map((slug) => ({
    slug,
    name: CATEGORY_LABELS[slug],
    items: services.filter((s) => s.category === slug),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-[#C98E7B]">Szolgáltatások</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl text-[#3E362E] leading-tight">
        Támogatás — a te helyzetedhez szabva.
      </h1>
      <p className="mt-6 text-lg text-[#63584D] max-w-2xl">
        Csoportosítottuk szolgáltatásainkat, hogy könnyebben megtaláld a hozzád illő formát.
      </p>

      <div className="mt-16 space-y-24">
        {grouped.map((g) => (
          <section key={g.slug} id={g.slug} data-testid={`services-cat-${g.slug}`}>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <h2 className="font-serif text-3xl sm:text-4xl text-[#3E362E]">{g.name}</h2>
              <Link to="/foglalas" className="text-sm text-[#7A5C50] hover:underline">Megnézem a lehetőségeket →</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {g.items.map((s) => (
                <div key={s.service_id} className="rounded-3xl bg-white border border-[#EAE5DE] p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-2xl text-[#3E362E]">{s.title}</h3>
                    {s.price_huf && (
                      <span className="shrink-0 text-xs bg-[#F3EFEA] rounded-full px-3 py-1 text-[#7A5C50]">
                        {s.price_huf.toLocaleString("hu-HU")} Ft
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[#63584D] leading-relaxed">{s.short_description}</p>
                  {s.description && <p className="mt-3 text-sm text-[#63584D]">{s.description}</p>}
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-[#9A8F83]">{s.duration_min} perc</span>
                    <Link to="/foglalas" data-testid={`service-book-${s.service_id}`} className="inline-flex items-center gap-1 text-[#7A5C50] hover:gap-2 transition-all">
                      IDŐPONTOT FOGLALOK <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
