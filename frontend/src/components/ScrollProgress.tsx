import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(barRef.current, {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] pointer-events-none">
      <div
        ref={barRef}
        className="h-full w-0 scroll-progress-bar"
        style={{
          background:
            "linear-gradient(90deg, #b2ff05 0%, #a855f7 50%, #f43f5e 100%)",
          boxShadow:
            "0 0 12px rgba(178, 255, 5, 0.6), 0 0 30px rgba(168, 85, 247, 0.3)",
        }}
      />
    </div>
  );
}
