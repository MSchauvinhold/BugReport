import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center gap-2.5 px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <Link href="/projects" className="text-lg" style={{ color: "var(--text-3)" }}>‹</Link>
        <div className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Nuevo proyecto</div>
      </div>

      <div className="flex-1 overflow-y-auto p-[26px]">
        <div className="max-w-[540px] mx-auto">
          <div className="brg-card p-[22px]">
            <ProjectForm
              action={createProject}
              cancelHref="/projects"
              submitLabel="Crear proyecto"
            />
          </div>
        </div>
      </div>
    </>
  );
}
