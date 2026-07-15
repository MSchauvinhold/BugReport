"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBugFormStore, isBugFormDirty } from "@/lib/store/bugFormStore";

/**
 * Link de "volver" que pide confirmación si el formulario de bug tiene
 * cambios sin guardar antes de salir.
 */
export function GuardedBackLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        if (isBugFormDirty(useBugFormStore.getState())) {
          e.preventDefault();
          const ok = confirm(
            "Tenés cambios sin guardar en el formulario. ¿Querés salir igualmente?"
          );
          if (ok) router.push(href);
        }
      }}
    >
      {children}
    </Link>
  );
}
