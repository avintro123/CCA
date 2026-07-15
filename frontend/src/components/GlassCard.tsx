import { useRef, type ReactNode, type MouseEvent } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  tilt?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  padding = "p-6",
  tilt = true,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;

    // Move glow to cursor position
    if (glowRef.current) {
      glowRef.current.style.opacity = "1";
      glowRef.current.style.left = `${x}px`;
      glowRef.current.style.top = `${y}px`;
    }
  };

  const handleMouseLeave = () => {
    if (!tilt || !cardRef.current) return;
    cardRef.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      ref={cardRef}
      className={`glass-panel ${padding} ${className} relative overflow-hidden transition-transform duration-200 ease-out`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform" }}
    >
      {/* Cursor-following inner glow */}
      {tilt && (
        <div
          ref={glowRef}
          className="absolute w-[250px] h-[250px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 z-0"
          style={{
            background:
              "radial-gradient(circle, rgba(178, 255, 5, 0.08) 0%, transparent 70%)",
            opacity: 0,
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
