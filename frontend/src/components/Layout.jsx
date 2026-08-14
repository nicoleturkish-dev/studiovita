import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Leaf } from "lucide-react";

const NAV = [
  { to: "/", label: "Kezdőlap" },
  { to: "/rolunk", label: "Rólunk" },
  { to: "/szolgaltatasok", label: "Szolgáltatások" },
  { to: "/szakembereink", label: "Szakembereink" },
  { to: "/programok", label: "Programok" },
  { to: "/gyik", label: "GYIK" },
  { to: "/kapcsolat", label: "Kapcsolat" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3E362E] font-sans">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF8F5]/90 border-b border-[#EAE5DE]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-full bg-[#7A5C50] text-white grid place-items-center transition-transform group-hover:-translate-y-0.5">
              <Leaf className="w-4 h-4" />
            </span>
            <span className="font-serif text-2xl tracking-tight">Studio Vita</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.to.replace("/", "") || "home"}`}
                className={({ isActive }) =>
                  `text-sm tracking-wide transition-colors ${
                    isActive ? "text-[#7A5C50]" : "text-[#63584D] hover:text-[#3E362E]"
                  }`
                }
                end={n.to === "/"}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/foglalas"
              data-testid="header-book-cta"
              className="hidden md:inline-flex items-center rounded-full bg-[#7A5C50] text-white text-sm px-5 py-2.5 hover:bg-[#63584D] transition-all hover:-translate-y-0.5 tracking-wider"
            >
              IDŐPONTOT FOGLALOK
            </Link>
            <button
              className="lg:hidden p-2 rounded-full hover:bg-[#F3EFEA]"
              onClick={() => setOpen((v) => !v)}
              data-testid="mobile-menu-toggle"
              aria-label="Menü"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-[#EAE5DE] bg-[#FAF8F5]">
            <div className="px-6 py-6 flex flex-col gap-4">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} data-testid={`mobile-nav-${n.to.replace("/", "") || "home"}`}
                  className="text-[#3E362E] py-1" end={n.to === "/"}>
                  {n.label}
                </NavLink>
              ))}
              <Link to="/foglalas" data-testid="mobile-book-cta"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[#7A5C50] text-white px-5 py-3 tracking-wider">
                IDŐPONTOT FOGLALOK
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="vita-grain">
        <Outlet />
      </main>

      <footer className="mt-24 bg-[#F3EFEA] border-t border-[#EAE5DE]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-full bg-[#7A5C50] text-white grid place-items-center">
                <Leaf className="w-4 h-4" />
              </span>
              <span className="font-serif text-2xl">Studio Vita</span>
            </div>
            <p className="max-w-md text-[#63584D] text-sm leading-relaxed">
              Teret adunk a változásnak. Egyéni és közös fejlődéshez, kapcsolódáshoz és
              támogatáshoz nyújtunk biztonságos, inspiráló teret gyermekeknek, felnőtteknek,
              pároknak és családoknak.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Oldalak</h4>
            <ul className="space-y-2 text-sm text-[#63584D]">
              {NAV.slice(0, 5).map((n) => (
                <li key={n.to}><Link to={n.to} className="hover:text-[#3E362E]">{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Kapcsolat</h4>
            <ul className="space-y-2 text-sm text-[#63584D]">
              <li>1052 Budapest, Példa utca 1.</li>
              <li>hello@studiovita.hu</li>
              <li>+36 30 000 0000</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#EAE5DE] py-6 text-center text-xs text-[#9A8F83]">
          © {new Date().getFullYear()} Studio Vita — Minden jog fenntartva
        </div>
      </footer>
    </div>
  );
}
