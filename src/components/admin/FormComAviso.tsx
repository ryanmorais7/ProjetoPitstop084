"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useAviso } from "./AdminShell";

/** Formulário de Server Action que confirma na tela ("Preferências salvas") quando termina. */
export default function FormComAviso({
  action,
  mensagem,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  mensagem: string;
  className?: string;
  children: ReactNode;
}) {
  const avisar = useAviso();

  return (
    <form
      className={className}
      action={async (formData) => {
        try {
          await action(formData);
          avisar(mensagem);
        } catch {
          avisar("Não foi possível salvar. Tente de novo.", "erro");
        }
      }}
    >
      {children}
    </form>
  );
}

/** Botão de envio que mostra o carregamento do formulário onde está. */
export function BotaoEnviar({ children, className = "adm-btn" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Salvando..." : children}
    </button>
  );
}
