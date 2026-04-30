import { Routes, Route, useNavigate } from "react-router";
import Standings from "./pages/Standings";
import Home from "./pages/Home";
import Navbar from "./components/layout/Navbar";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import LiveMatch from "./pages/LiveMatch";
import ScoringInterface from "./pages/admin/ScoringInterface";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Curtain from "./components/Curtain";
import RegisterTeam from "./pages/RegisterTeam";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userStr = params.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, [login, navigate]);

  // Global Smooth Scroll configuration using Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);

    const rafTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(rafTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafTicker);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Curtain />
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/standings" element={<Standings />} />

          <Route path="/live" element={<LiveMatch />} />

          <Route path="/admin" element={<ScoringInterface />} />
          <Route path="/register" element={<RegisterTeam />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
