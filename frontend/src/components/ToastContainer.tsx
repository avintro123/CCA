import { useEffect, useRef } from "react";
import { useToastStore, type Toast } from "../store/useToastStore";
import { CheckCircle, AlertTriangle, Info, X, XCircle } from "lucide-react";
import gsap from "gsap";

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLE_MAP = {
  success: {
    bg: "bg-green-500/15",
    border: "border-green-500/40",
    icon: "text-green-400",
    bar: "bg-green-500",
  },
  error: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    icon: "text-red-400",
    bar: "bg-red-500",
  },
  warning: {
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/40",
    icon: "text-yellow-400",
    bar: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    icon: "text-blue-400",
    bar: "bg-blue-500",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const removeToast = useToastStore((s) => s.removeToast);
  const style = STYLE_MAP[toast.type];
  const Icon = ICON_MAP[toast.type];

  useEffect(() => {
    if (!itemRef.current) return;

    // Slide in from right
    gsap.fromTo(
      itemRef.current,
      { x: 120, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    );

    // Progress bar countdown
    if (barRef.current && toast.duration && toast.duration > 0) {
      gsap.fromTo(
        barRef.current,
        { width: "100%" },
        {
          width: "0%",
          duration: toast.duration / 1000,
          ease: "linear",
        }
      );
    }
  }, [toast.duration]);

  const handleDismiss = () => {
    if (!itemRef.current) return;
    gsap.to(itemRef.current, {
      x: 120,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => removeToast(toast.id),
    });
  };

  return (
    <div
      ref={itemRef}
      className={`relative flex items-start gap-3 px-5 py-4 rounded-xl border backdrop-blur-xl shadow-2xl max-w-[380px] w-full overflow-hidden ${style.bg} ${style.border}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.icon}`} />
      <p className="text-sm text-white font-medium leading-relaxed flex-1 pr-2">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-white/40 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <div ref={barRef} className={`h-full ${style.bar} rounded-full`} />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
