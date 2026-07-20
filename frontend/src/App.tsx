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
import TeamApproval from "./pages/admin/TeamApproval";
import ToastContainer from "./components/ToastContainer";
import BlobCursor from "./components/BlobCursor";
import ScrollProgress from "./components/ScrollProgress";
import MatchDetails from "./pages/MatchDetails";
import TeamDetails from "./pages/TeamDetails";

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
      <BlobCursor
        blobType="circle"
        fillColor="#adc756"
        trailCount={3}
        sizes={[40, 70, 70]}
        innerSizes={[27, 35, 35]}
        innerColor="rgba(255,255,255,0.8)"
        opacities={[0.3, 0.3, 0.3]}
        shadowColor="rgba(0,0,0,0.75)"
        shadowBlur={9}
        shadowOffsetX={-18}
        shadowOffsetY={10}
        filterStdDeviation={30}
        useFilter={true}
        fastDuration={0.1}
        slowDuration={0.55}
        zIndex={100}
      />
      <ScrollProgress />
      <ToastContainer />
      <Curtain />
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/standings" element={<Standings />} />

          <Route path="/live" element={<LiveMatch />} />

          <Route path="/admin" element={<ScoringInterface />} />
          <Route path="/admin/teams" element={<TeamApproval />} />
          <Route path="/register" element={<RegisterTeam />} />
          <Route path="/match/:id" element={<MatchDetails />} />
          <Route path="/team/:id" element={<TeamDetails />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
