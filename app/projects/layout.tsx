import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bugs: true } } },
  });

  const sidebarProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    prefix: p.prefix,
    bugCount: p._count.bugs,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar username={user.username} projects={sidebarProjects} />
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--app)" }}>
        {children}
      </div>
      <CommandPalette />
    </div>
  );
}
