"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CategoriaVeiculo, PlanoId, Servico, TipoVeiculo, VehicleSize } from "@/lib/data";
import { Catalogo, catalogoPadrao, motoDisponivelNoSite } from "@/lib/catalogo";

export type TipoAtendimento = "avulso" | "assinatura";

const STORAGE_KEY = "pitstop084:porte-veiculo";

interface SelectionContextValue {
  /** Catálogo vigente (padrões + ajustes do admin), entregue pelo servidor. */
  catalogo: Catalogo;
  /** A Ducha Moto já tem preço e está ativa: só então a moto aparece no site. */
  motoDisponivel: boolean;
  tipoAtendimento: TipoAtendimento | null;
  setTipoAtendimento: (tipo: TipoAtendimento | null) => void;
  planoSelecionado: PlanoId | null;
  selecionarPlano: (id: PlanoId) => void;
  /** Porte do carro (P/G): só tem sentido quando `tipoVeiculo` é "carro". */
  porteVeiculo: VehicleSize;
  definirPorteVeiculo: (porte: VehicleSize) => void;
  tipoVeiculo: TipoVeiculo;
  definirMoto: () => void;
  /** O que define preço, duração e serviços: porte do carro ou "MOTO". */
  categoriaVeiculo: CategoriaVeiculo;
  /** true assim que o usuário escolhe o veículo explicitamente (não apenas o padrão "P" inicial). */
  porteDefinidoPeloUsuario: boolean;
  /** Cuidados adicionais escolhidos (a Ducha é sempre a base implícita, nunca entra aqui). */
  avulsosSelecionados: Servico[];
  alternarAvulso: (servico: Servico) => void;
  reiniciarSelecao: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children, catalogo = catalogoPadrao }: { children: ReactNode; catalogo?: Catalogo }) {
  const motoDisponivel = motoDisponivelNoSite(catalogo);
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [porteVeiculo, setPorteVeiculo] = useState<VehicleSize>("P");
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>("carro");
  const [porteDefinidoPeloUsuario, setPorteDefinidoPeloUsuario] = useState(false);
  const [avulsosSelecionados, setAvulsosSelecionados] = useState<Servico[]>([]);

  useEffect(() => {
    try {
      const salvo = window.sessionStorage.getItem(STORAGE_KEY);
      if (salvo === "P" || salvo === "G") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata o estado a partir do sessionStorage (sistema externo) uma única vez, no mount
        setPorteVeiculo(salvo);
        setPorteDefinidoPeloUsuario(true);
      } else if (salvo === "MOTO" && motoDisponivel) {
        setTipoVeiculo("moto");
        setPorteDefinidoPeloUsuario(true);
      }
    } catch {
      // sessionStorage indisponível (modo privado etc.), mantém o padrão "P"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só no mount
  }, []);

  function lembrar(categoria: CategoriaVeiculo) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, categoria);
    } catch {
      // sessionStorage indisponível, seleção permanece só em memória
    }
  }

  function trocarTipo(novo: TipoVeiculo) {
    if (novo === tipoVeiculo) return;
    setTipoVeiculo(novo);
    // adicional de carro não serve em moto (e vice-versa): a escolha recomeça
    setAvulsosSelecionados([]);
    setPlanoSelecionado(null);
  }

  function definirPorteVeiculo(porte: VehicleSize) {
    trocarTipo("carro");
    setPorteVeiculo(porte);
    setPorteDefinidoPeloUsuario(true);
    lembrar(porte);
  }

  function definirMoto() {
    trocarTipo("moto");
    setPorteDefinidoPeloUsuario(true);
    lembrar("MOTO");
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
        catalogo,
        motoDisponivel,
        tipoAtendimento,
        setTipoAtendimento,
        planoSelecionado,
        selecionarPlano: setPlanoSelecionado,
        porteVeiculo,
        definirPorteVeiculo,
        tipoVeiculo,
        definirMoto,
        categoriaVeiculo: tipoVeiculo === "moto" ? "MOTO" : porteVeiculo,
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
