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
  /** true assim que o usuário escolhe o porte explicitamente (não apenas o padrão "P" inicial). */
  porteDefinidoPeloUsuario: boolean;
  /** Cuidados adicionais escolhidos no configurador "Monte seu Pitstop" (a Ducha é sempre a base implícita, nunca entra aqui). */
  avulsosSelecionados: Servico[];
  alternarAvulso: (servico: Servico) => void;
  reiniciarSelecao: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [porteVeiculo, setPorteVeiculo] = useState<VehicleSize>("P");
  const [porteDefinidoPeloUsuario, setPorteDefinidoPeloUsuario] = useState(false);
  const [avulsosSelecionados, setAvulsosSelecionados] = useState<Servico[]>([]);

  useEffect(() => {
    try {
      const salvo = window.sessionStorage.getItem(STORAGE_KEY);
      if (salvo === "P" || salvo === "G") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata o estado a partir do sessionStorage (sistema externo) uma única vez, no mount
        setPorteVeiculo(salvo);
        setPorteDefinidoPeloUsuario(true);
      }
    } catch {
      // sessionStorage indisponível (modo privado etc.), mantém o padrão "P"
    }
  }, []);

  function definirPorteVeiculo(porte: VehicleSize) {
    setPorteVeiculo(porte);
    setPorteDefinidoPeloUsuario(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, porte);
    } catch {
      // sessionStorage indisponível, seleção permanece só em memória
    }
  }

  function alternarAvulso(servico: Servico) {
    setAvulsosSelecionados((atual) =>
      atual.some((s) => s.id === servico.id)
        ? atual.filter((s) => s.id !== servico.id)
        : [...atual, servico]
    );
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
        porteDefinidoPeloUsuario,
        avulsosSelecionados,
        alternarAvulso,
        reiniciarSelecao: () => {
          setTipoAtendimento(null);
          setPlanoSelecionado(null);
          setAvulsosSelecionados([]);
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
