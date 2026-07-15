import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedScoreProps {
  value: number;
  className?: string;
  duration?: number;
}

export default function AnimatedScore({
  value,
  className = "",
  duration = 0.6,
}: AnimatedScoreProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const currentVal = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!spanRef.current) return;

    if (isFirstRender.current) {
      // On first render, just set the value directly
      currentVal.current = value;
      spanRef.current.textContent = String(value);
      isFirstRender.current = false;
      return;
    }

    const from = currentVal.current;
    const to = value;

    if (from === to) return;

    // Animate the number counting up/down
    const obj = { val: from };
    gsap.to(obj, {
      val: to,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = String(Math.round(obj.val));
        }
      },
      onComplete: () => {
        currentVal.current = to;
      },
    });

    // Scale bounce effect
    gsap.fromTo(
      spanRef.current,
      { scale: 1.3, color: "#ffffff" },
      {
        scale: 1,
        color: "",
        duration: 0.5,
        ease: "elastic.out(1, 0.4)",
      }
    );
  }, [value, duration]);

  return (
    <span ref={spanRef} className={`inline-block ${className}`}>
      {value}
    </span>
  );
}
