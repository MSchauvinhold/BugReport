import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TestCaseGenerator } from "@/components/TestCaseGenerator";
import { SavedTestCases } from "@/components/SavedTestCases";
import { NewModuleInput } from "@/components/NewModuleInput";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ module?: string }>;
};

const SIN_MODULO = "Sin módulo";

export default async function TestCasesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { module } = await searchParams;
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const allCases = await prisma.testCase.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  const groupKey = (c: (typeof allCases)[number]) => c.module?.trim() || SIN_MODULO;
  const namedModules = [...new Set(allCases.map((c) => c.module?.trim()).filter((m): m is string => !!m))];

  // ---------- Vista de detalle: dentro de un módulo ----------
  if (module) {
    const cases = allCases.filter((c) => groupKey(c) === module);
    const generatorModule = module === SIN_MODULO ? undefined : module;

    return (
      <>
        <div
          className="h-14 shrink-0 flex items-center gap-2.5 px-[22px]"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <Link href={`/projects/${id}/test-cases`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>
              Casos de prueba <span style={{ color: "var(--text-3)", fontWeight: 400 }}>/ {module}</span>
            </div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{project.name} · {project.prefix}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-[22px]">
          <div className="max-w-[820px] mx-auto flex flex-col gap-4">
            <TestCaseGenerator projectId={id} module={generatorModule} />
            <SavedTestCases projectId={id} cases={cases} />
          </div>
        </div>
      </>
    );
  }

  // ---------- Índice de módulos ----------
  const groups = new Map<string, typeof allCases>();
  for (const c of allCases) {
    const key = groupKey(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === SIN_MODULO) return 1;
    if (b === SIN_MODULO) return -1;
    return a.localeCompare(b, "es");
  });

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center gap-2.5 px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <Link href={`/projects/${id}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>Casos de prueba</div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{project.name} · {project.prefix}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        <div className="max-w-[820px] mx-auto flex flex-col gap-4">
          <NewModuleInput existing={namedModules} />

          {sortedKeys.length === 0 ? (
            <div className="brg-card py-12 text-center" style={{ borderRadius: "11px" }}>
              <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
                Agregá un módulo arriba (ej: «Login») o entrá directo a generar casos sin agrupar.
              </div>
              <Link
                href={`/projects/${id}/test-cases?module=${encodeURIComponent(SIN_MODULO)}`}
                className="inline-block mt-3 text-[12.5px] font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                Generar sin módulo →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedKeys.map((key) => {
                const items = groups.get(key)!;
                const passed = items.filter((c) => c.status === "Pasó").length;
                const failed = items.filter((c) => c.status === "Falló").length;
                const pendingCount = items.filter((c) => c.status === "Pendiente").length;
                return (
                  <Link
                    key={key}
                    href={`/projects/${id}/test-cases?module=${encodeURIComponent(key)}`}
                    className="brg-card p-[18px] flex flex-col gap-2.5 transition-colors hover:border-[var(--accent)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold truncate" style={{ color: key === SIN_MODULO ? "var(--text-3)" : "var(--text)" }}>
                        {key}
                      </span>
                      <span className="text-[11px] shrink-0" style={{ color: "var(--text-3)" }}>
                        {items.length} {items.length === 1 ? "caso" : "casos"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px]">
                      <span style={{ color: "var(--st-done-fg)" }}>{passed} pasaron</span>
                      <span style={{ color: "var(--danger)" }}>{failed} fallaron</span>
                      {pendingCount > 0 && <span style={{ color: "var(--text-3)" }}>{pendingCount} pendientes</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
