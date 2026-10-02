import { and, asc, eq, gte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { hojeIso } from "./agenda";
import { PlanoId, portesVeiculo, VehicleSize } from "./data";
import { garantirTokenCheckin, urlCheckin } from "./checkin";
import { normalizarCodigoPitPass } from "./pitpass";

/**
 * "Meu PitPass": o cliente reencontra os próximos agendamentos sem login.
 * Chave = WhatsApp + (placa OU código P084). Nunca nome. A resposta tem SÓ o que
 * já está impresso no PitPass dele; nada de observações, endereço, preço ou histórico.
 */

export interface PitPassPublico {
  codigo: string;
  nome: string;
  carro: string;
  porteNome: string;
  dia: string;
  horario: string;
  tipoAtendimento: "avulso" | "assinatura";
  planoId: PlanoId | null;
  /** Benefício do plano (assinante) ou null. */
  beneficio: string | null;
  /** Ducha + adicionais (avulso). */
  servicos: string[];
  status: "Confirmado" | "Concluído";
  checkinUrl: string;
}

/** Só dígitos; tira o 55 do Brasil se vier colado. Precisa sobrar DDD + número (10 ou 11 dígitos). */
export function normalizarTelefoneBusca(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, "");
  if (digitos.length >= 12 && digitos.startsWith("55")) digitos = digitos.slice(2);
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

/**
 * Maiúsculas, sem espaço/hífen ("abc-1d23" → "ABC1D23"). Placa BR tem 7 caracteres, mas a busca
 * aceita 5–8 porque o cadastro nunca validou o formato (precisa bater exatamente com o salvo).
 */
export function normalizarPlacaBusca(entrada: string): string | null {
  const placa = entrada.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return placa.length >= 5 && placa.length <= 8 ? placa : null;
}

export type BuscaPitPass =
  | { tipo: "placa"; telefone: string; placa: string }
  | { tipo: "codigo"; telefone: string; codigo: string };

/** Valida e normaliza a entrada crua; null = dados inválidos. */
export function prepararBusca(corpo: unknown): BuscaPitPass | null {
  const { telefone, placa, codigo } = (corpo ?? {}) as Record<string, unknown>;
  const tel = typeof telefone === "string" ? normalizarTelefoneBusca(telefone) : null;
  if (!tel) return null;
  if (typeof codigo === "string" && codigo.trim()) {
    const cod = normalizarCodigoPitPass(codigo);
    return cod ? { tipo: "codigo", telefone: tel, codigo: cod } : null;
  }
  if (typeof placa === "string") {
    const pl = normalizarPlacaBusca(placa);
    return pl ? { tipo: "placa", telefone: tel, placa: pl } : null;
  }
  return null;
}

export async function buscarMeusPitPass(busca: BuscaPitPass, origem: string): Promise<PitPassPublico[]> {
  // telefone salvo pode ter máscara e/ou 55 na frente: compara só os dígitos
  const telefoneBate = sql`regexp_replace(${agendamentos.telefone}, '[^0-9]', '', 'g') in (${busca.telefone}, ${"55" + busca.telefone})`;
  const chave =
    busca.tipo === "placa"
      ? sql`upper(regexp_replace(coalesce(${agendamentos.placa}, ''), '[^A-Za-z0-9]', '', 'g')) = ${busca.placa}`
      : eq(agendamentos.codigo, busca.codigo);

  const registros = await db
    .select()
    .from(agendamentos)
    .where(
      and(
        telefoneBate,
        chave,
        gte(agendamentos.dia, hojeIso()),
        ne(agendamentos.status, "cancelado"),
        // concluído só aparece se for de hoje (acabou de sair da loja); o resto é "próximo"
        or(eq(agendamentos.status, "confirmado"), eq(agendamentos.dia, hojeIso()))
      )
    )
    .orderBy(asc(agendamentos.dia), asc(agendamentos.horario))
    .limit(10);

  return Promise.all(
    registros.map(async (r) => {
      const token = await garantirTokenCheckin(r);
      let adicionais: string[] = [];
      if (r.servicosAdicionais) {
        try {
          adicionais = (JSON.parse(r.servicosAdicionais) as { nome: string; preco: number | null }[])
            .filter((a) => a.preco != null) // "mediante avaliação" não entra no PitPass, igual à confirmação
            .map((a) => a.nome);
        } catch {
          // JSON antigo mal formado: mostra só o serviço principal
        }
      }
      const ehAssinatura = r.tipoAtendimento === "assinatura";
      return {
        codigo: r.codigo ?? "",
        nome: r.nome,
        carro: r.carro,
        porteNome: (portesVeiculo[r.categoriaVeiculo as VehicleSize] ?? portesVeiculo.P).nome,
        dia: r.dia,
        horario: r.horario,
        tipoAtendimento: ehAssinatura ? "assinatura" : "avulso",
        planoId: (r.plano as PlanoId | null) ?? null,
        beneficio: ehAssinatura ? r.servicoNome : null,
        servicos: ehAssinatura ? [] : [r.servicoNome ?? "Ducha Pitstop", ...adicionais],
        status: r.status === "concluido" ? "Concluído" : "Confirmado",
        checkinUrl: urlCheckin(origem, token),
      } satisfies PitPassPublico;
    })
  );
}
