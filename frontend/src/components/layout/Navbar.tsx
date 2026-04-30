import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { Link, useLocation } from "react-router";

import { useGSAP } from "@gsap/react";
import { useAuthStore } from "../../store/useAuthStore";

export default function Navbar() {
  const { token, logout, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useGSAP(
    () => {
      if (isOpen) {
        gsap.to(".menu-panel", {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          pointerEvents: "auto",
        });
        gsap.to(".top-line", {
          y: 0,
          rotation: 45,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".mid-line", {
          opacity: 0,
          scaleX: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".bottom-line", {
          y: 0,
          rotation: -45,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".menu-open", { y: -20, duration: 0.3, ease: "power2.inOut" });
        gsap.to(".menu-close", { y: -20, duration: 0.3, ease: "power2.inOut" });
      } else {
        gsap.to(".menu-panel", {
          y: 40,
          opacity: 0,
          duration: 0.4,
          ease: "power3.in",
          pointerEvents: "none",
        });
        gsap.to(".top-line", {
          y: -5,
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".mid-line", {
          opacity: 1,
          scaleX: 1,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".bottom-line", {
          y: 5,
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(".menu-open", { y: 0, duration: 0.3, ease: "power2.inOut" });
        gsap.to(".menu-close", { y: 0, duration: 0.3, ease: "power2.inOut" });
      }
    },
    { scope: containerRef, dependencies: [isOpen] },
  );

  return (
    <div
      ref={containerRef}
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] w-[90%] md:w-[80%] max-w-[400px]"
    >
      {/* Top Navbar Bubble */}
      <nav className="flex items-center justify-between h-[55px] px-4 pointer-events-auto bg-white backdrop-blur-md border border-white/20 rounded-lg shadow-xl shrink-0">
        {/* Left Side: Hamburger & Menu Text */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="relative w-[15px] h-[12px] flex justify-center items-center">
            <div className="top-line absolute w-[15px] h-[2px] bg-black rounded-full transform -translate-y-[5px]"></div>
            <div className="mid-line absolute w-[15px] h-[2px] bg-black rounded-full"></div>
            <div className="bottom-line absolute w-[15px] h-[2px] bg-black rounded-full transform translate-y-[5px]"></div>
          </div>
          <span className="relative h-[20px] w-[65px] overflow-hidden flex font-heading text-[15px] font-bold tracking-widest text-[#0b0e14] leading-none mt-1">
            <span className="menu-open absolute top-0 left-0 transition-colors group-hover:text-neon group-hover:drop-shadow-[0_0_5px_rgba(178,255,5,0.5)]">
              MENU
            </span>
            <span className="menu-close absolute top-[20px] left-0 transition-colors group-hover:text-red-500">
              CLOSE
            </span>
          </span>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <Link to="/" className="no-underline">
            <span className="font-heading text-[32px] font-black tracking-[2px] text-black hover:text-neon transition-colors duration-300">
              CCA
            </span>
          </Link>
        </div>

        {/* Right Side: Auth / Visual Icon */}
        <div className="flex items-center justify-end min-w-[65px]">
          {token ? (
            <button
              onClick={() => logout()}
              className="font-heading text-[15px] font-bold tracking-widest text-[#0b0e14] hover:text-red-600 transition-colors cursor-pointer"
            >
              LOGOUT
            </button>
          ) : (
            <button
              onClick={() => {
                window.location.href = "http://localhost:3000/auth/google";
              }}
              className="font-heading text-[15px] font-bold tracking-widest text-[#0b0e14] hover:text-neon transition-colors cursor-pointer"
            >
              LOGIN
            </button>
          )}
        </div>
      </nav>

      {/* Floating Menu Panel */}
      <div className="menu-panel absolute top-[72px] left-0 w-full bg-[#151923]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl opacity-0 pointer-events-none py-2 overflow-hidden">
        <ul className="list-none m-0 p-0 flex flex-col">
          {[
            { num: "01", text: "HOME", path: "/", show: true },
            { num: "02", text: "STANDINGS", path: "/standings", show: true },
            { num: "03", text: "LIVE MATCHES", path: "/live", show: true },
            {
              num: "04",
              text: "REGISTER TEAM",
              path: "/register",
              show: !!token,
            },
            {
              num: "05",
              text: "ADMIN DASHBOARD",
              path: "/admin",
              show: user?.role === "admin" || user?.role === "scorer",
            },
          ]
            .filter((item) => item.show)
            .map((item, index, array) => (
              <li
                key={index}
                className={`flex items-center justify-center gap-[10px] py-[14px] px-[28px] cursor-pointer group ${index !== array.length - 1 ? "border-b border-white/10" : ""}`}
              >
                <span className="font-sans text-[13px] font-medium text-white/50 italic tracking-[0.5px] self-end pb-[3px] transition-colors group-hover:text-neon">
                  {item.num}
                </span> 
                <Link
                  to={item.path}
                  className="no-underline text-white w-full text-center"
                >
                  <span className="relative overflow-hidden inline-block leading-none font-heading text-[28px] font-bold tracking-[2px]">
                    <span className="block whitespace-nowrap transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-y-full">
                      {item.text}
                    </span>
                    <span className="absolute top-[100%] left-0 block whitespace-nowrap text-neon text-glow transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-y-full">
                      {item.text}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
