"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PlanoId, Servico, VehicleSize } from "@/lib/data";

export type TipoAtendimento = "avulso" | "assinatura";

const STORAGE_KEY = "pitstop084:porte-veiculo";

interface SelectionContextValue {
  tipoAtendimento: TipoAtendimento | null;
  setTipoAtendimento: (tipo: TipoAtendimento | null) => void;
  planoSelecionado: PlanoId | null;
  selecionarPlano: (id: PlanoId) => void;
  /** Porte do veículo (P/G): escolha única, global, válida para toda a navegação atual. */
  porteVeiculo: VehicleSize;
  definirPorteVeiculo: (porte: VehicleSize) => void;
  avulsoSelecionado: Servico | null;
  selecionarAvulso: (servico: Servico) => void;
  reiniciarSelecao: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [porteVeiculo, setPorteVeiculo] = useState<VehicleSize>("P");
  const [avulsoSelecionado, setAvulsoSelecionado] = useState<Servico | null>(null);

  useEffect(() => {
    try {
      const salvo = window.sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata o estado a partir do sessionStorage (sistema externo) uma única vez, no mount
      if (salvo === "P" || salvo === "G") setPorteVeiculo(salvo);
    } catch {
      // sessionStorage indisponível (modo privado etc.), mantém o padrão "P"
    }
  }, []);

  function definirPorteVeiculo(porte: VehicleSize) {
    setPorteVeiculo(porte);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, porte);
    } catch {
      // sessionStorage indisponível, seleção permanece só em memória
    }
  }

  return (
    <SelectionContext.Provider
      value={{
        tipoAtendimento,
        setTipoAtendimento,
        planoSelecionado,
        selecionarPlano: setPlanoSelecionado,
        porteVeiculo,
        definirPorteVeiculo,
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
