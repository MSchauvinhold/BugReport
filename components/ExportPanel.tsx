"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

type ExportPanelProps = {
  markdown: string;
  jira: string;
  plain: string;
  baseName?: string;
};

const TABS = [
  { key: "markdown", label: "Markdown", ext: "md" },
  { key: "jira", label: "Jira", ext: "txt" },
  { key: "plain", label: "Texto plano", ext: "txt" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function downloadFile(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ markdown, jira, plain, baseName = "bug" }: ExportPanelProps) {
  const [active, setActive] = useState<TabKey>("markdown");
  const content: Record<TabKey, string> = { markdown, jira, plain };
  const activeTab = TABS.find((t) => t.key === active)!;

  return (
    <div className="mt-2">
      <div
        className="flex items-center justify-between px-[18px]"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex gap-1.5">
          {TABS.map((tab) => {
            const on = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className="text-[12.5px] transition-colors"
                style={{
                  padding: "11px 12px",
                  fontWeight: on ? 600 : 500,
                  color: on ? "var(--accent-text)" : "var(--text-3)",
                  borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile(`${baseName}.${activeTab.ext}`, content[active])}
            className="inline-flex items-center gap-1.5 rounded-[7px] text-[12px] font-semibold transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text)", padding: "6px 12px" }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14">
              <path d="M7 1.5v7M4 5.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 10.5v1a1 1 0 001 1h8a1 1 0 001-1v-1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Descargar .{activeTab.ext}
          </button>
          <CopyButton text={content[active]} label={`Copiar ${activeTab.label}`} />
        </div>
      </div>

      <pre
        className="overflow-auto whitespace-pre-wrap max-h-96"
        style={{
          background: "var(--code-bg)",
          color: "var(--code-text)",
          fontFamily: "var(--font-mono)",
          fontSize: "11.5px",
          lineHeight: 1.7,
          padding: "16px 18px",
        }}
      >
        {content[active]}
      </pre>
    </div>
  );
}
