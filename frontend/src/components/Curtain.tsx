import gsap from "gsap";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";

export default function Curtain() {
  const container = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!container.current) return;

    const ctx = gsap.context(() => {
      // Instantly reset the curtains to cover the screen
      gsap.set(".curtain-panel", { scaleX: 1 });

      const tl = gsap.timeline();

      tl.to(
        ".left-panel",
        {
          scaleX: 0,
          duration: 0.5,
          ease: "power4.inOut",
          delay: 0.2, // Slight delay on page load so it feels smooth
          stagger: { amount: 0.3, from: "end" },
        },
        0,
      );

      tl.to(
        ".right-panel",
        {
          scaleX: 0,
          duration: 0.5,
          ease: "power4.inOut",
          delay: 0.2,
          stagger: { amount: 0.3, from: "end" },
        },
        0,
      );
    }, container);

    return () => ctx.revert();
  }, [location.pathname]); // The secret to playing on EVERY route change!

  const curtainRows = [];
  for (let i = 0; i < 6; i++) {
    curtainRows.push(
      <div key={i} className="flex-1 w-screen flex">
        <div
          className={`curtain-panel left-panel flex-1 h-full bg-[#680960] origin-left ${i < 5 ? "border-b border-white/5" : ""}`}
        />
        <div
          className={`curtain-panel right-panel flex-1 h-full bg-[#680960] origin-right ${i < 5 ? "border-b border-white/5" : ""}`}
        />
      </div>,
    );
  }

  // Uses React Portal to guarantee it sits on top of everything without breaking flex/grids
  return createPortal(
    <div
      ref={container}
      className="fixed inset-0 w-screen h-screen flex flex-col z-[9999] pointer-events-none"
    >
      {curtainRows}
    </div>,
    document.body,
  );
}
