import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { BugLogo } from "@/components/BugLogo";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: "#0a0b0d", color: "#e8e9eb" }}
    >
      {/* Atmósfera: glow índigo + textura de puntos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(620px 420px at 20% 28%, rgba(110,99,246,0.20), transparent 62%), radial-gradient(520px 520px at 88% 88%, rgba(110,99,246,0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 50% 38%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 38%, black, transparent 72%)",
        }}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-[880px] grid md:grid-cols-2 rounded-[20px] overflow-hidden"
        style={{
          background: "rgba(22,23,26,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 40px 90px -25px rgba(0,0,0,0.75)",
        }}
      >
        {/* Marca centrada (solo desktop) */}
        <aside
          className="hidden md:flex flex-col items-center justify-center p-9 relative"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(158deg, rgba(110,99,246,0.16), rgba(110,99,246,0.015) 58%)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
              style={{ background: "#6e63f6", boxShadow: "0 12px 30px -6px rgba(110,99,246,0.7)" }}
            >
              <BugLogo size={30} />
            </div>
            <div className="text-center leading-tight">
              <div className="text-[21px] font-bold" style={{ letterSpacing: "-0.01em" }}>Bug Report</div>
              <div className="text-[10px] font-mono tracking-[0.24em] mt-1.5" style={{ color: "#8a8f98" }}>QA TOOLING</div>
            </div>
          </div>

          <div className="absolute bottom-7 text-[10.5px] font-mono" style={{ color: "#565b64" }}>v 1.0</div>
        </aside>

        {/* Formulario */}
        <section className="p-8 sm:p-9">
          {/* Marca compacta (solo mobile) */}
          <div className="flex md:hidden items-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: "#6e63f6" }}>
              <BugLogo size={18} />
            </div>
            <div className="leading-[1.15]">
              <div className="text-[14px] font-bold">Bug Report</div>
              <div className="text-[9px] font-mono tracking-[0.18em]" style={{ color: "#8a8f98" }}>QA TOOLING</div>
            </div>
          </div>

          <h2 className="text-[19px] font-bold" style={{ letterSpacing: "-0.01em" }}>Iniciar sesión</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "#9da1a9" }}>
            Entrá para gestionar tus bugs y reportes.
          </p>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
