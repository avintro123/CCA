import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
}

export default function GlassCard({
  children,
  className = "",
  padding = "p-6",
}: GlassCardProps) {
  return (
    <div className={`glass-panel ${padding} ${className}`}>{children}</div>
  );
}
