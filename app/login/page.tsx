import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { BugLogo } from "@/components/BugLogo";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--app)" }}>
      <div className="w-[372px]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <BugLogo size={19} />
          </div>
          <div className="leading-[1.2] whitespace-nowrap">
            <div className="text-[14.5px] font-bold" style={{ color: "var(--text)" }}>Bug Report</div>
            <div className="text-[9.5px] font-mono tracking-[0.12em]" style={{ color: "var(--text-3)" }}>QA TOOLING</div>
          </div>
        </div>

        <div className="brg-card mt-[18px] p-[26px]" style={{ borderRadius: "12px" }}>
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>Iniciar sesión</div>
          <div className="text-[12.5px] mt-[3px]" style={{ color: "var(--text-3)" }}>
            Herramienta interna · acceso restringido
          </div>
          <LoginForm />
        </div>

        <div className="text-center text-[10.5px] mt-4 font-mono" style={{ color: "var(--text-3)" }}>
          acceso solo para QA Team
        </div>
      </div>
    </div>
  );
}
