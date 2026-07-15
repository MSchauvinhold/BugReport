import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PrintButton } from "@/components/PrintButton";

type PageProps = { params: Promise<{ id: string; bugId: string }> };

export default async function BugPrintPage({ params }: PageProps) {
  const { id, bugId } = await params;
  const user = await requireUser();
  const bug = await prisma.bug.findUnique({
    where: { id: bugId },
    include: { project: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!bug || bug.projectId !== id || bug.project.userId !== user.id) notFound();

  const visibleId = `${bug.project.prefix}-${bug.bugNumber.toString().padStart(3, "0")}`;
  const reportedBy = bug.events.find((e) => e.type === "created")?.username ?? bug.events[0]?.username ?? null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Barra de acciones (no se imprime) */}
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px] no-print"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <Link href={`/projects/${id}/bugs/${bugId}`} className="text-lg" style={{ color: "var(--text-3)" }}>‹</Link>
          <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Vista para PDF</span>
        </div>
        <PrintButton />
      </div>

      {/* Documento */}
      <div className="print-doc mx-auto my-8 max-w-[720px] px-10 py-9 brg-card" style={{ borderRadius: "12px" }}>
        <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-text)" }}>{visibleId}</span>
              <SeverityBadge severity={bug.severity} />
              <StatusBadge status={bug.status} />
            </div>
            <h1 className="text-[18px] font-bold mt-2" style={{ color: "var(--text)" }}>{bug.title}</h1>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>{bug.project.name}</div>
            <div className="text-[10.5px] font-mono" style={{ color: "var(--text-3)" }}>{bug.project.prefix}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Meta label="Prioridad">{bug.priority}</Meta>
          <Meta label="Estado">{bug.status}</Meta>
          <Meta label="Módulo">{bug.module || "—"}</Meta>
          <Meta label="Entorno">{bug.environment || "—"}</Meta>
        </div>

        {bug.description?.trim() && (
          <Section title="Descripción">
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.description}</p>
          </Section>
        )}

        <Section title="Pasos para reproducir">
          <ol className="flex flex-col gap-1.5">
            {bug.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12.5px]" style={{ color: "var(--text-2)" }}>
                <span className="font-mono shrink-0" style={{ color: "var(--text-3)" }}>{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </Section>

        <div className="grid grid-cols-2 gap-5 mt-5">
          <Section title="Resultado esperado" color="var(--success)">
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.expected}</p>
          </Section>
          <Section title="Resultado actual" color="var(--danger)">
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.actual}</p>
          </Section>
        </div>

        {bug.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>Tags:</span>
            {bug.tags.map((t) => (
              <span key={t} className="text-[11px] font-semibold rounded-[5px]"
                style={{ background: "var(--accent-soft)", color: "var(--accent-text)", padding: "2px 7px" }}>{t}</span>
            ))}
          </div>
        )}

        {bug.screenshots.length > 0 && (
          <Section title="Evidencia">
            <div className="flex flex-wrap gap-2.5">
              {bug.screenshots.map((url, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={url} src={url} alt={`Evidencia ${i + 1}`} className="max-h-48 rounded-lg"
                  style={{ border: "1px solid var(--border-2)" }} />
              ))}
            </div>
          </Section>
        )}

        {bug.notes?.trim() && (
          <Section title="Notas adicionales">
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.notes}</p>
          </Section>
        )}

        <div className="mt-7 pt-4 text-[10.5px] font-mono" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
          {visibleId} · Reportado por @{reportedBy ?? "—"} el {new Date(bug.createdAt).toLocaleDateString("es-AR")} · Bug Report Generator
        </div>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>{label}</div>
      <div className="text-[12.5px]" style={{ color: "var(--text)" }}>{children}</div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="text-[12px] font-bold mb-2" style={{ color: color ?? "var(--text)" }}>{title}</div>
      {children}
    </div>
  );
}
