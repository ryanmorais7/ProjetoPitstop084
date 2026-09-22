import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, clientes, veiculos, beneficioUsos, assinaturas, StatusAgendamento } from "@/db/schema";
import { dataValidaParaAgendar, horarioValidoParaAgendar, hojeIso } from "./agenda";
import { VehicleSize, regrasBeneficios, PlanoId } from "./data";

export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

export async function buscarClientePorTelefone(telefone: string) {
  const digitos = normalizarTelefone(telefone);
  if (!digitos) return null;
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(sql`regexp_replace(${clientes.telefone}, '[^0-9]', '', 'g') = ${digitos}`)
    .limit(1);
  return cliente ?? null;
}

export async function buscarOuCriarCliente({ nome, telefone }: { nome: string; telefone: string }) {
  const existente = await buscarClientePorTelefone(telefone);
  if (existente) return { cliente: existente, criado: false };

  const [novo] = await db
    .insert(clientes)
    .values({ nome: nome.trim(), telefone: telefone.trim() })
    .returning();
  const codigo = `C084-${String(novo.id).padStart(4, "0")}`;
  const [atualizado] = await db
    .update(clientes)
    .set({ codigo })
    .where(eq(clientes.id, novo.id))
    .returning();
  return { cliente: atualizado, criado: true };
}

export async function buscarOuCriarVeiculo({
  clienteId,
  modelo,
  placa,
  porte,
}: {
  clienteId: number;
  modelo: string;
  placa?: string | null;
  porte: VehicleSize;
}) {
  const placaNormalizada = placa ? placa.trim().toUpperCase() : null;
  const existentes = await db.select().from(veiculos).where(eq(veiculos.clienteId, clienteId));
  const igual = existentes.find(
    (v) =>
      v.modelo.trim().toLowerCase() === modelo.trim().toLowerCase() &&
      (v.placa ?? null) === placaNormalizada
  );
  if (igual) return igual;

  const [novo] = await db
    .insert(veiculos)
    .values({
      clienteId,
      modelo: modelo.trim(),
      placa: placaNormalizada,
      porte,
      principal: existentes.length === 0,
    })
    .returning();
  return novo;
}

/** Ciclo de 30 dias corridos a partir da ativação (não há regra de "todo dia 1º" cadastrada hoje). */
export function calcularCiclo(inicioIso: string): { cicloInicio: string; cicloFim: string } {
  const [ano, mes, dia] = inicioIso.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mes - 1, dia));
  const fim = new Date(inicio.getTime() + 29 * 24 * 60 * 60 * 1000);
  const paraIsoUtc = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { cicloInicio: paraIsoUtc(inicio), cicloFim: paraIsoUtc(fim) };
}

interface DisponibilidadeBeneficio {
  disponivel: boolean;
  motivo?: string;
}

/**
 * Confere se um benefício ainda pode ser usado nesse ciclo/semana, comparando com
 * `regrasBeneficios` (derivado dos textos reais de `planos[x].beneficios`).
 */
export async function verificarBeneficioDisponivel({
  assinaturaId,
  plano,
  beneficio,
  cicloInicio,
}: {
  assinaturaId: number;
  plano: PlanoId;
  beneficio: string;
  cicloInicio: string;
}): Promise<DisponibilidadeBeneficio> {
  const regra = regrasBeneficios[plano]?.[beneficio];
  if (!regra) return { disponivel: false, motivo: "Esse plano não inclui esse benefício." };
  if (regra.limite === null) return { disponivel: true };

  let referencia = cicloInicio;
  if (regra.tipo === "semanal") {
    referencia = inicioDaSemanaIso();
  }

  const usos = await db
    .select()
    .from(beneficioUsos)
    .where(
      and(
        eq(beneficioUsos.assinaturaId, assinaturaId),
        eq(beneficioUsos.beneficio, beneficio),
        eq(beneficioUsos.cicloReferencia, referencia),
        ne(beneficioUsos.status, "liberado")
      )
    );

  if (usos.length >= regra.limite) {
    return {
      disponivel: false,
      motivo: regra.tipo === "semanal" ? "Já utilizado esta semana." : "Utilizado neste ciclo.",
    };
  }
  return { disponivel: true };
}

export interface ResumoBeneficio {
  beneficio: string;
  tipo: "ciclo" | "semanal";
  limite: number | null;
  usados: number;
}

/** Resumo real (não decorativo) do uso de cada benefício de uma assinatura, pro ciclo/semana vigente. */
export async function resumoBeneficiosAssinatura(
  assinaturaId: number,
  plano: PlanoId,
  cicloInicio: string
): Promise<ResumoBeneficio[]> {
  const regras = regrasBeneficios[plano] ?? {};
  const semanaAtual = inicioDaSemanaIso();

  const resumo: ResumoBeneficio[] = [];
  for (const [beneficio, regra] of Object.entries(regras)) {
    const referencia = regra.tipo === "semanal" ? semanaAtual : cicloInicio;
    const usos = await db
      .select()
      .from(beneficioUsos)
      .where(
        and(
          eq(beneficioUsos.assinaturaId, assinaturaId),
          eq(beneficioUsos.beneficio, beneficio),
          eq(beneficioUsos.cicloReferencia, referencia),
          ne(beneficioUsos.status, "liberado")
        )
      );
    resumo.push({ beneficio, tipo: regra.tipo, limite: regra.limite, usados: usos.length });
  }
  return resumo;
}

function inicioDaSemanaIso(): string {
  const hoje = hojeIso();
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const diaSemana = data.getUTCDay();
  data.setUTCDate(data.getUTCDate() - diaSemana);
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-${String(data.getUTCDate()).padStart(2, "0")}`;
}

export interface DadosNovoAgendamento {
  nome: string;
  telefone: string;
  carro: string;
  placa?: string | null;
  porteVeiculo: VehicleSize;
  tipoAtendimento: "avulso" | "assinatura";
  dia: string;
  horario: string;
  planoId?: PlanoId | null;
  servicoPlano?: string | null;
  servicoId?: string | null;
  servicoNome?: string | null;
  servicosAdicionaisJson?: string | null;
  preco: number | null;
  valorOriginal?: number | null;
  motivoAjuste?: string | null;
  transporte?: string | null;
  enderecoSnapshot?: string | null;
  observacoes?: string | null;
  origem: "landing" | "admin";
  /** Se for uso de benefício PitPass, a assinatura ativa correspondente. */
  assinaturaId?: number | null;
}

export type ResultadoCriarAgendamento =
  | { ok: true; id: number; codigo: string; clienteId: number; clienteCodigo: string }
  | { ok: false; erro: string; status: number };

export async function criarAgendamento(dados: DadosNovoAgendamento): Promise<ResultadoCriarAgendamento> {
  if (!horarioValidoParaAgendar(dados.dia, dados.horario)) {
    return { ok: false, erro: "Data ou horário inválido.", status: 400 };
  }
  if (!dataValidaParaAgendar(dados.dia)) {
    return { ok: false, erro: "Data inválida.", status: 400 };
  }

  const { cliente } = await buscarOuCriarCliente({ nome: dados.nome, telefone: dados.telefone });
  const veiculo = await buscarOuCriarVeiculo({
    clienteId: cliente.id,
    modelo: dados.carro,
    placa: dados.placa,
    porte: dados.porteVeiculo,
  });

  let registro;
  try {
    [registro] = await db
      .insert(agendamentos)
      .values({
        clienteId: cliente.id,
        veiculoId: veiculo.id,
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        carro: dados.carro.trim(),
        placa: dados.placa ? dados.placa.trim().toUpperCase() : null,
        tipoAtendimento: dados.tipoAtendimento,
        plano: dados.planoId ?? null,
        categoriaVeiculo: dados.porteVeiculo,
        servicoId: dados.servicoId ?? null,
        servicoNome: dados.servicoNome ?? dados.servicoPlano ?? null,
        servicosAdicionais: dados.servicosAdicionaisJson ?? null,
        preco: dados.preco != null ? dados.preco.toFixed(2) : null,
        valorOriginal: dados.valorOriginal != null ? dados.valorOriginal.toFixed(2) : null,
        motivoAjuste: dados.motivoAjuste ?? null,
        transporte: dados.transporte ?? null,
        enderecoSnapshot: dados.enderecoSnapshot ?? null,
        observacoes: dados.observacoes ?? null,
        origem: dados.origem,
        dia: dados.dia,
        horario: dados.horario,
      })
      .returning({ id: agendamentos.id });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    if (mensagem.includes("agendamento_slot_ativo") || mensagem.includes("duplicate key")) {
      return { ok: false, erro: "Horário já reservado", status: 409 };
    }
    throw e;
  }

  const codigo = `P084-${String(registro.id).padStart(4, "0")}`;
  await db.update(agendamentos).set({ codigo }).where(eq(agendamentos.id, registro.id));

  if (dados.assinaturaId && dados.servicoPlano) {
    const [assinatura] = await db.select().from(assinaturas).where(eq(assinaturas.id, dados.assinaturaId));
    if (assinatura) {
      await db.insert(beneficioUsos).values({
        assinaturaId: assinatura.id,
        agendamentoId: registro.id,
        beneficio: dados.servicoPlano,
        status: "reservado",
        cicloReferencia: assinatura.cicloInicio,
      });
    }
  }

  return { ok: true, id: registro.id, codigo, clienteId: cliente.id, clienteCodigo: cliente.codigo ?? "" };
}

export async function atualizarStatus(id: number, status: StatusAgendamento) {
  await db.update(agendamentos).set({ status }).where(eq(agendamentos.id, id));

  const usos = await db.select().from(beneficioUsos).where(eq(beneficioUsos.agendamentoId, id));
  if (usos.length > 0) {
    const novoStatusBeneficio = status === "concluido" ? "utilizado" : status === "cancelado" ? "liberado" : null;
    if (novoStatusBeneficio) {
      for (const uso of usos) {
        await db.update(beneficioUsos).set({ status: novoStatusBeneficio }).where(eq(beneficioUsos.id, uso.id));
      }
    }
  }
}
