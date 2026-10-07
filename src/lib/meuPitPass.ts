import { and, asc, eq, gte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { hojeIso } from "./agenda";
import { PlanoId, planoValido, rotuloCategoriaVeiculo } from "./data";
import { telefoneValido } from "./format";
import { garantirTokenCheckin, urlCheckin } from "./checkin";

/**
 * "Meu PitPass": o cliente reencontra os próximos agendamentos sem login, só com o WhatsApp
 * do agendamento. A busca é sempre server-side e a resposta tem SÓ o que já está impresso no
 * PitPass (com o nome reduzido ao primeiro nome); nada de telefone, placa, observações,
 * endereço, preço ou histórico. O QR devolvido é o mesmo token salvo no agendamento.
 * Como só o telefone abre o PitPass, o QR sozinho não libera nada: a recepção confere a placa.
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
  return telefoneValido(entrada);
}

/** Valida e normaliza a entrada crua; null = WhatsApp inválido. */
export function prepararBusca(corpo: unknown): string | null {
  const { telefone } = (corpo ?? {}) as Record<string, unknown>;
  return typeof telefone === "string" ? normalizarTelefoneBusca(telefone) : null;
}

/** Só o primeiro nome sai na busca pública: quem digita o número não precisa do nome completo. */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

export async function buscarMeusPitPass(telefone: string, origem: string): Promise<PitPassPublico[]> {
  // telefone salvo pode ter máscara e/ou 55 na frente: compara só os dígitos
  const telefoneBate = sql`regexp_replace(${agendamentos.telefone}, '[^0-9]', '', 'g') in (${telefone}, ${"55" + telefone})`;

  const registros = await db
    .select()
    .from(agendamentos)
    .where(
      and(
        telefoneBate,
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
        nome: primeiroNome(r.nome),
        carro: r.carro,
        porteNome: rotuloCategoriaVeiculo(r.categoriaVeiculo),
        dia: r.dia,
        horario: r.horario,
        tipoAtendimento: ehAssinatura ? "assinatura" : "avulso",
        planoId: planoValido(r.plano) ? r.plano : null,
        beneficio: ehAssinatura ? r.servicoNome : null,
        servicos: ehAssinatura ? [] : [r.servicoNome ?? "Ducha Pitstop", ...adicionais],
        status: r.status === "concluido" ? "Concluído" : "Confirmado",
        checkinUrl: urlCheckin(origem, token),
      } satisfies PitPassPublico;
    })
  );
}
