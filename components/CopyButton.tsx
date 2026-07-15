"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-[7px] text-[12px] font-semibold transition-colors"
      style={
        copied
          ? { background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)", padding: "6px 12px" }
          : { background: "var(--accent)", border: "1px solid var(--accent)", color: "#fff", padding: "6px 12px" }
      }
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 14 14">
            <polyline points="3,7.5 6,10 11,4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          ¡Copiado!
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 14 14">
            <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M5.5 3V2.2A1 1 0 016.5 1.2h4.3a1 1 0 011 1v4.3a1 1 0 01-1 1H10" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
