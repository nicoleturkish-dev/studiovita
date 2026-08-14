import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Team from "@/pages/Team";
import TeamMember from "@/pages/TeamMember";
import Workshops from "@/pages/Workshops";
import Booking from "@/pages/Booking";
import Faq from "@/pages/Faq";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AdminGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-[#63584D]">Betöltés…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/rolunk" element={<About />} />
              <Route path="/szolgaltatasok" element={<Services />} />
              <Route path="/szakembereink" element={<Team />} />
              <Route path="/szakembereink/:id" element={<TeamMember />} />
              <Route path="/programok" element={<Workshops />} />
              <Route path="/foglalas" element={<Booking />} />
              <Route path="/gyik" element={<Faq />} />
              <Route path="/kapcsolat" element={<Contact />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </div>
  );
}

export default App;
