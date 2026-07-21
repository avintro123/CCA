import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface LiquidSelectOption {
  value: string;
  label: string;
}

interface LiquidSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LiquidSelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function LiquidSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  required,
}: LiquidSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  // Position the menu below the trigger button
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 180),
    });
  }, []);

  // Recalculate position on open, scroll & resize
  useEffect(() => {
    if (!open) return;
    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`}>
      {/* Hidden native input for form required validation */}
      {required && (
        <input
          type="text"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full liquid-glass rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
          value ? "text-white font-medium" : "text-white/40"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform duration-200 flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Portal */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[99999] bg-[#12161f] border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-xl py-1.5 max-h-60 overflow-y-auto backdrop-blur-2xl"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            {placeholder && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs uppercase font-bold tracking-wider text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                {placeholder}
              </button>
            )}

            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-white/40 italic text-center">
                No options available
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    value === opt.value
                      ? "text-white bg-white/15 font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neon ml-2 shrink-0"></span>
                  )}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
