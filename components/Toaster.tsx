"use client";

import { useToastStore, type ToastType } from "@/lib/store/toastStore";

const STYLES: Record<ToastType, { border: string; iconBg: string; iconColor: string; icon: React.ReactNode }> = {
  success: {
    border: "var(--success-border)",
    iconBg: "var(--success-bg)",
    iconColor: "var(--success)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 14 14">
        <polyline points="3,7.5 6,10 11,4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    border: "var(--danger-border)",
    iconBg: "var(--danger-bg)",
    iconColor: "var(--danger)",
    icon: <span className="text-sm font-bold leading-none">!</span>,
  },
  info: {
    border: "var(--accent)",
    iconBg: "var(--accent-soft)",
    iconColor: "var(--accent-text)",
    icon: <span className="text-sm font-bold leading-none">i</span>,
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-[380px]">
      {toasts.map((toast) => {
        const style = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className="flex items-start gap-[11px] rounded-[11px] animate-[slideIn_0.2s_ease-out]"
            style={{
              background: "var(--surface)",
              border: `1px solid ${style.border}`,
              boxShadow: "0 6px 18px rgba(0,0,0,.08)",
              padding: "13px 14px",
            }}
          >
            <div
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: style.iconBg, color: style.iconColor }}
            >
              {style.icon}
            </div>
            <span className="flex-1 text-[13px] leading-snug" style={{ color: "var(--text)" }}>
              {toast.message}
            </span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-[15px] leading-none"
              style={{ color: "var(--text-3)" }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
