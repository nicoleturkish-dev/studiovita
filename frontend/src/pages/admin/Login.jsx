import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Sikeres belépés");
      nav("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Sikertelen bejelentkezés");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#FAF8F5] vita-grain p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-[#7A5C50] text-white grid place-items-center"><Leaf className="w-4 h-4" /></span>
          <span className="font-serif text-2xl">Studio Vita</span>
        </Link>
        <div className="rounded-3xl bg-white border border-[#EAE5DE] p-8 shadow-[0_8px_32px_rgba(62,54,46,0.06)]">
          <h1 className="font-serif text-3xl text-[#3E362E]">Admin bejelentkezés</h1>
          <p className="mt-2 text-[#63584D] text-sm">A Studio Vita adminisztrációs felület.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="admin-login-form">
            <input required type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="admin-email" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
            <input required type="password" placeholder="Jelszó" value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-password" className="w-full rounded-xl bg-white border border-[#EAE5DE] px-4 py-3 focus:ring-2 focus:ring-[#A3B19B] outline-none" />
            <button type="submit" disabled={loading} data-testid="admin-submit"
              className="w-full rounded-full bg-[#7A5C50] text-white py-3 tracking-wider hover:bg-[#63584D] disabled:opacity-60">
              {loading ? "Belépés…" : "Belépés"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
