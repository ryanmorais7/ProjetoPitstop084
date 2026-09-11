"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PlanoId, AvulsoServico } from "@/lib/data";

export type TipoAtendimento = "avulso" | "assinatura";

interface SelectionContextValue {
  tipoAtendimento: TipoAtendimento | null;
  setTipoAtendimento: (tipo: TipoAtendimento | null) => void;
  planoSelecionado: PlanoId | null;
  selecionarPlano: (id: PlanoId) => void;
  avulsoSelecionado: AvulsoServico | null;
  selecionarAvulso: (servico: AvulsoServico) => void;
  reiniciarSelecao: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [avulsoSelecionado, setAvulsoSelecionado] = useState<AvulsoServico | null>(null);

  return (
    <SelectionContext.Provider
      value={{
        tipoAtendimento,
        setTipoAtendimento,
        planoSelecionado,
        selecionarPlano: setPlanoSelecionado,
        avulsoSelecionado,
        selecionarAvulso: setAvulsoSelecionado,
        reiniciarSelecao: () => {
          setTipoAtendimento(null);
          setPlanoSelecionado(null);
          setAvulsoSelecionado(null);
        },
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
