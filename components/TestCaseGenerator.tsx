"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/store/toastStore";
import { saveTestCases } from "@/app/actions/testcases";
import { CopyButton } from "./CopyButton";

type TestCase = {
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
};

function toMarkdownTable(cases: TestCase[]): string {
  const header = "| # | Caso | Precondiciones | Pasos | Resultado esperado |\n|---|------|----------------|-------|--------------------|";
  const rows = cases.map((c, i) => {
    const steps = c.steps.map((s, j) => `${j + 1}. ${s}`).join("<br>");
    const pre = c.preconditions || "—";
    return `| ${i + 1} | ${c.title} | ${pre} | ${steps} | ${c.expectedResult} |`;
  });
  return [header, ...rows].join("\n");
}

function toGherkin(cases: TestCase[]): string {
  return cases
    .map((c) => {
      const lines: string[] = [`Scenario: ${c.title}`];
      if (c.preconditions) lines.push(`  Given ${c.preconditions}`);
      c.steps.forEach((s, i) => lines.push(`  ${i === 0 ? "When" : "And"} ${s}`));
      lines.push(`  Then ${c.expectedResult}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function TestCaseGenerator({ projectId }: { projectId: string }) {
  const toast = useToastStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<TestCase[] | null>(null);
  const [tab, setTab] = useState<"table" | "gherkin" | "markdown">("table");
  const [saving, startSaving] = useTransition();

  function save() {
    if (!cases || cases.length === 0) return;
    startSaving(async () => {
      const res = await saveTestCases(projectId, cases);
      if (!res.ok) {
        toast.error(res.error ?? "No se pudieron guardar los casos.");
        return;
      }
      toast.success(`${res.count} casos guardados en el proyecto.`);
      setCases(null);
      setText("");
      router.refresh();
    });
  }

  async function generate() {
    if (text.trim().length < 5) {
      toast.error("Describí la funcionalidad con un poco más de detalle.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudieron generar los casos.");
        return;
      }
      setCases(data.testCases);
      setTab("table");
      toast.success(`Se generaron ${data.testCases.length} casos de prueba.`);
    } catch (err) {
      console.error("ai test-cases error:", err);
      toast.error("No se pudieron generar los casos. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="brg-card p-[18px]">
        <label className="brg-label">Funcionalidad o user story</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Pegá la user story o describí la funcionalidad a cubrir, con sus reglas y validaciones. Cuanto más contexto, más completos los casos."
          className="brg-input"
          style={{ padding: "10px 12px" }}
        />
        <div className="flex justify-end mt-2.5">
          <button onClick={generate} disabled={loading} className="brg-btn brg-btn-primary brg-btn-sm">
            {loading ? "Generando casos…" : "Generar casos de prueba"}
          </button>
        </div>
      </div>

      {cases && cases.length > 0 && (
        <div className="brg-card overflow-hidden">
          <div className="flex items-center justify-between px-[18px]" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-1.5">
              {([
                ["table", "Tabla"],
                ["gherkin", "Gherkin"],
                ["markdown", "Markdown"],
              ] as const).map(([key, label]) => {
                const on = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="text-[12.5px] transition-colors"
                    style={{
                      padding: "11px 12px",
                      fontWeight: on ? 600 : 500,
                      color: on ? "var(--accent-text)" : "var(--text-3)",
                      borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent",
                      marginBottom: "-1px",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={tab === "gherkin" ? toGherkin(cases) : toMarkdownTable(cases)} />
              <button onClick={save} disabled={saving} className="brg-btn brg-btn-primary brg-btn-sm">
                {saving ? "Guardando…" : `Guardar ${cases.length} casos`}
              </button>
            </div>
          </div>

          {tab === "table" ? (
            <div className="p-[18px] flex flex-col gap-3">
              {cases.map((c, i) => (
                <div key={i} className="rounded-[10px] p-3.5" style={{ border: "1px solid var(--border)" }}>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }}>
                      TC-{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{c.title}</span>
                  </div>
                  {c.preconditions && (
                    <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                      <span style={{ color: "var(--text-3)" }}>Precondiciones: </span>{c.preconditions}
                    </div>
                  )}
                  <ol className="mt-2 flex flex-col gap-1">
                    {c.steps.map((s, j) => (
                      <li key={j} className="flex gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                        <span className="font-mono shrink-0" style={{ color: "var(--text-3)" }}>{j + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                    <span style={{ color: "var(--success)" }}>Esperado: </span>{c.expectedResult}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre
              className="overflow-auto whitespace-pre-wrap max-h-[480px]"
              style={{
                background: "var(--code-bg)",
                color: "var(--code-text)",
                fontFamily: "var(--font-mono)",
                fontSize: "11.5px",
                lineHeight: 1.7,
                padding: "16px 18px",
              }}
            >
              {tab === "gherkin" ? toGherkin(cases) : toMarkdownTable(cases)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
