import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--app)" }}>
      <div className="brg-card max-w-md w-full p-8 text-center">
        <div
          className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 text-xl"
          style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
        >
          ?
        </div>
        <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Página no encontrada</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          El proyecto o bug que buscás no existe o fue eliminado.
        </p>
        <Link href="/projects" className="brg-btn brg-btn-primary inline-flex">
          Volver a proyectos
        </Link>
      </div>
    </div>
  );
}
