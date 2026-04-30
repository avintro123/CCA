import type { ButtonHTMLAttributes, ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export default function NeonButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: NeonButtonProps) {
  const baseStyles =
    "px-6 py-2 rounded-xl font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer";

  const variants = {
    primary:
      "bg-neon hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(178,255,5,0.3)] hover:shadow-[0_0_25px_rgba(178,255,5,0.5)]",
    secondary:
      "bg-dark-card border border-dark-border hover:bg-white/5 text-white",
    danger:
      "bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-500",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
