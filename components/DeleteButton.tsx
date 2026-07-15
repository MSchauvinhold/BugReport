"use client";

import { useTransition } from "react";
import { useToastStore } from "@/lib/store/toastStore";

type Props = {
  action: () => Promise<{ error?: string } | void>;
  label?: string;
  confirmMessage?: string;
};

export function DeleteButton({
  action,
  label = "Eliminar",
  confirmMessage = "¿Estás seguro? Esta acción no se puede deshacer.",
}: Props) {
  const [pending, startTransition] = useTransition();
  const toast = useToastStore();

  return (
    <button
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            const result = await action();
            // Si devuelve un error, la acción no redirigió: mostramos el aviso.
            if (result && result.error) {
              toast.error(result.error);
            }
          } catch (err) {
            console.error("delete action client error:", err);
            toast.error("No se pudo completar la acción. Intentá de nuevo.");
          }
        });
      }}
      disabled={pending}
      className="brg-btn brg-btn-danger brg-btn-sm"
    >
      {pending ? "Eliminando…" : label}
    </button>
  );
}
