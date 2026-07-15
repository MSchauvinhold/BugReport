import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusSelector } from "@/components/StatusSelector";
import { ExportPanel } from "@/components/ExportPanel";
import { DeleteButton } from "@/components/DeleteButton";
import { toMarkdown, toJira, toPlainText } from "@/lib/exporters";
import { deleteBug } from "@/app/actions/bugs";
import { requireUser } from "@/lib/auth";

type PageProps = { params: Promise<{ id: string; bugId: string }> };

export default async function BugDetailPage({ params }: PageProps) {
  const { id, bugId } = await params;

  const user = await requireUser();
  const bug = await prisma.bug.findUnique({
    where: { id: bugId },
    include: { project: true, events: { orderBy: { createdAt: "desc" } } },
  });
  if (!bug || bug.projectId !== id || bug.project.userId !== user.id) notFound();

  const visibleId = `${bug.project.prefix}-${bug.bugNumber.toString().padStart(3, "0")}`;
  const deleteAction = deleteBug.bind(null, bugId, id);
  const reportedBy =
    bug.events.find((e) => e.type === "created")?.username ??
    bug.events.at(-1)?.username ??
    null;
  const exportBug = {
    ...bug,
    project: bug.project,
    reportedBy,
  };

  return (
    <>
      <div
        className="shrink-0 flex items-center justify-between px-[22px] py-[11px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/projects/${id}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--accent-text)" }}>{visibleId}</span>
              <SeverityBadge severity={bug.severity} />
            </div>
            <div className="text-[15px] font-semibold mt-[3px] truncate" style={{ color: "var(--text)" }}>{bug.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href={`/projects/${id}/bugs/${bugId}/edit`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Editar
          </Link>
          <Link href={`/projects/${id}/bugs/${bugId}/print`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Exportar PDF
          </Link>
          <Link href={`/projects/${id}/bugs/new?from=${bugId}`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Duplicar
          </Link>
          <DeleteButton
            action={deleteAction}
            label="Eliminar bug"
            confirmMessage={`¿Eliminar el bug ${visibleId}?`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px] space-y-4">
        {/* Metadatos */}
        <div className="brg-card p-[18px]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[18px]">
            <Field label="Prioridad"><span style={{ fontFamily: "var(--font-mono)" }}>{bug.priority}</span></Field>
            <Field label="Estado"><StatusSelector bugId={bugId} currentStatus={bug.status} /></Field>
            <Field label="Módulo">{bug.module || "—"}</Field>
            <Field label="Entorno">{bug.environment || "—"}</Field>
          </div>

          {bug.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {bug.tags.map((tag) => (
                <span key={tag} className="text-[11.5px] font-semibold rounded-[5px]"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-text)", padding: "3px 8px" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-[11px] mt-4" style={{ color: "var(--text-3)" }}>
            Reportado por <span className="font-medium">@{reportedBy ?? "—"}</span> · Creado: {new Date(bug.createdAt).toLocaleString("es-AR")} · Actualizado: {new Date(bug.updatedAt).toLocaleString("es-AR")}
          </div>
        </div>

        {/* Descripción */}
        {bug.description?.trim() && (
          <div className="brg-card p-[18px]">
            <div className="text-[13px] font-semibold mb-2" style={{ color: "var(--text)" }}>Descripción</div>
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.description}</p>
          </div>
        )}

        {/* Pasos + Resultados */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="brg-card p-[18px]">
            <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text)" }}>Pasos para reproducir</div>
            <ol className="flex flex-col gap-2.5">
              {bug.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center"
                    style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-[1.5]" style={{ color: "var(--text-2)" }}>{step}</span>
                </li>
              ))}
            </ol>

            {bug.screenshots.length > 0 && (
              <>
                <div className="text-[13px] font-semibold mt-4 mb-2.5" style={{ color: "var(--text)" }}>Evidencia</div>
                <div className="flex flex-wrap gap-2.5">
                  {bug.screenshots.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Evidencia ${i + 1}`} className="h-16 w-[88px] object-cover rounded-lg transition-colors"
                        style={{ border: "1px solid var(--border-2)" }} />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="brg-card p-[18px]">
              <div className="text-[12.5px] font-semibold mb-[7px]" style={{ color: "var(--success)" }}>Resultado esperado</div>
              <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.expected}</p>
            </div>
            <div className="brg-card p-[18px]">
              <div className="text-[12.5px] font-semibold mb-[7px]" style={{ color: "var(--danger)" }}>Resultado actual</div>
              <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.actual}</p>
            </div>
          </div>
        </div>

        {/* Notas adicionales */}
        {bug.notes?.trim() && (
          <div className="brg-card p-[18px]">
            <div className="text-[13px] font-semibold mb-2" style={{ color: "var(--text)" }}>Notas adicionales</div>
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>{bug.notes}</p>
          </div>
        )}

        {/* Exportación */}
        <div className="brg-card overflow-hidden">
          <div className="px-[18px] pt-3.5 text-[13px] font-semibold" style={{ color: "var(--text)" }}>Exportar reporte</div>
          <ExportPanel
            markdown={toMarkdown(exportBug)}
            jira={toJira(exportBug)}
            plain={toPlainText(exportBug)}
            baseName={visibleId}
          />
        </div>

        {/* Historial */}
        <div className="brg-card p-[18px]">
          <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text)" }}>Historial</div>
          <ol className="flex flex-col gap-0">
            {bug.events.map((ev, i) => (
              <li key={ev.id} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className="w-2 h-2 rounded-full mt-[5px]"
                    style={{ background: ev.type === "status" ? "var(--st-fix-fg)" : "var(--accent)" }}
                  />
                  {i < bug.events.length - 1 && (
                    <span className="w-px flex-1 my-1" style={{ background: "var(--border-2)" }} />
                  )}
                </div>
                <div className="pb-3.5 min-w-0">
                  <div className="text-[12.5px]" style={{ color: "var(--text)" }}>
                    {ev.type === "created" && "Bug creado"}
                    {ev.type === "duplicated" && (ev.detail || "Bug duplicado")}
                    {ev.type === "edited" && "Bug editado"}
                    {ev.type === "status" && (
                      <>Estado: <span style={{ fontFamily: "var(--font-mono)" }}>{ev.detail}</span></>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    <span className="font-medium">@{ev.username}</span> · {new Date(ev.createdAt).toLocaleString("es-AR")}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] mb-1.5" style={{ color: "var(--text-3)" }}>{label}</div>
      <div className="text-[13px]" style={{ color: "var(--text)" }}>{children}</div>
    </div>
  );
}
