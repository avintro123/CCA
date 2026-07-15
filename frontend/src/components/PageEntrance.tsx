import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface PageEntranceProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  duration?: number;
  y?: number;
}

export default function PageEntrance({
  children,
  className = "",
  stagger = 0.12,
  duration = 0.8,
  y = 40,
}: PageEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const elements = containerRef.current.children;
      if (elements.length === 0) return;

      gsap.fromTo(
        elements,
        {
          y: y,
          opacity: 0,
          filter: "blur(4px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: duration,
          stagger: stagger,
          ease: "power3.out",
          delay: 0.15,
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
