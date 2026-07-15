import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BUG_STATUSES, BUG_STATUS_TOKENS } from "@/lib/bugStatus";

type PageProps = { params: Promise<{ id: string }> };

const SEVERITIES = ["Crítica", "Alta", "Media", "Baja"] as const;
const SEV_COLOR: Record<string, string> = {
  "Crítica": "var(--sev-crit-dot)",
  "Alta": "var(--sev-high-dot)",
  "Media": "var(--sev-med-dot)",
  "Baja": "var(--sev-low-dot)",
};

function buildWeeklyTrend(timestamps: number[]): { label: string; value: number }[] {
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: 8 }, (_, i) => {
    const idx = 7 - i; // 7 = hace 8 semanas … 0 = esta semana
    const end = now - idx * WEEK;
    const start = end - WEEK;
    return {
      label: new Date(end).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
      value: timestamps.filter((t) => t > start && t <= end).length,
    };
  });
}

// Antigüedad promedio (en días) de los bugs que siguen sin cerrar.
// Vive fuera del componente para no usar Date.now() en el render (regla de pureza).
function avgOpenAgeDays(openCreatedAt: number[]): number {
  if (openCreatedAt.length === 0) return 0;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const totalMs = openCreatedAt.reduce((sum, t) => sum + (now - t), 0);
  return Math.round(totalMs / openCreatedAt.length / DAY);
}

export default async function DashboardPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const bugs = await prisma.bug.findMany({
    where: { projectId: id },
    select: { severity: true, status: true, module: true, createdAt: true },
  });
  // Transiciones de estado registradas en el historial, para la tasa de reapertura.
  const statusEvents = await prisma.bugEvent.findMany({
    where: { type: "status", bug: { projectId: id } },
    select: { detail: true },
  });

  const total = bugs.length;
  const count = (pred: (b: (typeof bugs)[number]) => boolean) => bugs.filter(pred).length;

  const isOpen = (s: string) => s !== "Cerrado";
  const closed = count((b) => b.status === "Cerrado");
  const closedPct = total ? Math.round((closed / total) * 100) : 0;

  // Críticos que todavía no están cerrados: lo que más urge mirar.
  const criticalOpen = count((b) => b.severity === "Crítica" && isOpen(b.status));

  // Tasa de reapertura: de cada corrección entregada, cuántas volvieron a fallar.
  const fixes = statusEvents.filter((e) => e.detail.endsWith("→ Corregido")).length;
  const reopens = statusEvents.filter((e) => e.detail.endsWith("→ Reabierto")).length;
  const reopenRate = fixes > 0 ? Math.round((reopens / fixes) * 100) : null;

  // Antigüedad promedio de los bugs sin cerrar.
  const openAge = avgOpenAgeDays(
    bugs.filter((b) => isOpen(b.status)).map((b) => new Date(b.createdAt).getTime())
  );

  const bySeverity = SEVERITIES.map((s) => ({ label: s, value: count((b) => b.severity === s), color: SEV_COLOR[s] }));
  const byStatus = BUG_STATUSES.map((s) => ({ label: s, value: count((b) => b.status === s), color: BUG_STATUS_TOKENS[s].fg }));

  const moduleMap = new Map<string, number>();
  for (const b of bugs) {
    const m = b.module?.trim() || "Sin módulo";
    moduleMap.set(m, (moduleMap.get(m) ?? 0) + 1);
  }
  const byModule = [...moduleMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Tendencia: 8 semanas móviles de 7 días terminando hoy
  const weeks = buildWeeklyTrend(bugs.map((b) => new Date(b.createdAt).getTime()));
  const weekMax = Math.max(1, ...weeks.map((w) => w.value));

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/projects/${id}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>Panel del proyecto</div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{project.name} · {project.prefix}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        {total === 0 ? (
          <div className="brg-card py-16 text-center" style={{ borderRadius: "12px" }}>
            <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
              Todavía no hay bugs cargados. Las métricas aparecen cuando empieces a reportar.
            </div>
          </div>
        ) : (
          <div className="max-w-[980px] mx-auto flex flex-col gap-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Total de bugs" value={total} hint={`${closedPct}% cerrados`} />
              <StatTile
                label="Críticos sin resolver"
                value={criticalOpen}
                accent={SEV_COLOR["Crítica"]}
                hint={criticalOpen > 0 ? "requieren atención" : "ninguno pendiente"}
              />
              <StatTile
                label="Tasa de reapertura"
                value={reopenRate === null ? "—" : `${reopenRate}%`}
                accent={reopenRate && reopenRate > 0 ? BUG_STATUS_TOKENS["Reabierto"].fg : undefined}
                hint={fixes > 0 ? `${reopens} de ${fixes} correcciones` : "sin correcciones aún"}
              />
              <StatTile
                label="Antigüedad promedio"
                value={openAge === 0 ? "—" : `${openAge} d`}
                hint="de los bugs sin cerrar"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Bugs por severidad">
                <BarList rows={bySeverity} total={total} withDot />
              </ChartCard>
              <ChartCard title="Bugs por estado">
                <BarList rows={byStatus} total={total} withDot />
              </ChartCard>
            </div>

            <ChartCard title="Bugs por módulo">
              <BarList
                rows={byModule.map((m) => ({ ...m, color: "var(--accent)" }))}
                total={Math.max(1, ...byModule.map((m) => m.value))}
              />
            </ChartCard>

            {/* Tendencia semanal */}
            <ChartCard title="Bugs creados por semana" subtitle="Últimas 8 semanas">
              <div className="flex items-end gap-2.5 h-40 pt-2">
                {weeks.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>{w.value}</span>
                    <div
                      className="w-full rounded-t-[4px]"
                      style={{
                        height: `${(w.value / weekMax) * 100}%`,
                        minHeight: w.value > 0 ? "4px" : "0",
                        background: "var(--accent)",
                      }}
                    />
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>{w.label}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </>
  );
}

function StatTile({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: string }) {
  return (
    <div className="brg-card p-[18px]">
      <div className="flex items-center gap-2">
        {accent && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />}
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</span>
      </div>
      <div className="text-[28px] font-bold mt-1.5 leading-none" style={{ color: "var(--text)" }}>{value}</div>
      {hint && <div className="text-[11px] mt-1.5" style={{ color: "var(--text-3)" }}>{hint}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="brg-card p-[18px]">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{title}</span>
        {subtitle && <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function BarList({
  rows,
  total,
  withDot,
}: {
  rows: { label: string; value: number; color?: string }[];
  total: number;
  withDot?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-[110px] shrink-0 flex items-center gap-1.5">
            {withDot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />}
            <span className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>{r.label}</span>
          </div>
          <div className="flex-1 h-4 rounded-[4px] overflow-hidden" style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded-[4px]"
              style={{ width: `${total ? (r.value / total) * 100 : 0}%`, minWidth: r.value > 0 ? "4px" : "0", background: r.color ?? "var(--accent)" }}
            />
          </div>
          <span className="w-7 text-right text-[12px] font-semibold tabular-nums shrink-0" style={{ color: "var(--text)" }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
