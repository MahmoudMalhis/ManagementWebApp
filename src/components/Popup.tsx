// components/Popup.tsx
import { useEffect } from "react";

interface PopupProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string; // ex: "max-w-md" | "max-w-lg"
}

export default function Popup({
  open,
  onClose,
  children,
  widthClass = "max-w-md",
}: PopupProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div
        className={`w-[92%] ${widthClass} glass-card rounded-2xl p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
