"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PlanoId, AvulsoServico } from "@/lib/data";

interface SelectionContextValue {
  planoSelecionado: PlanoId | null;
  selecionarPlano: (id: PlanoId) => void;
  avulsoSelecionado: AvulsoServico | null;
  selecionarAvulso: (servico: AvulsoServico) => void;
  limparAvulso: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [avulsoSelecionado, setAvulsoSelecionado] = useState<AvulsoServico | null>(null);

  return (
    <SelectionContext.Provider
      value={{
        planoSelecionado,
        selecionarPlano: setPlanoSelecionado,
        avulsoSelecionado,
        selecionarAvulso: setAvulsoSelecionado,
        limparAvulso: () => setAvulsoSelecionado(null),
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection deve ser usado dentro de SelectionProvider");
  return ctx;
}
