import { and, asc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, clientes, veiculos, beneficioUsos, assinaturas, StatusAgendamento } from "@/db/schema";
import {
  dataValidaParaAgendar,
  horarioValidoParaAgendar,
  hojeIso,
  intervaloOcupado,
  ocupaAgenda,
  situacaoDoHorario,
} from "./agenda";
import { CategoriaVeiculo, regrasBeneficios, PlanoId } from "./data";
import { digitosTelefone } from "./format";
import { gerarTokenCheckin } from "./checkin";
import { ocupacaoDaAgenda } from "./disponibilidade";
import { Estagio, lerHistoricoEstagios } from "./operacao";

export function normalizarTelefone(telefone: string): string {
  return digitosTelefone(telefone);
}

/**
 * O WhatsApp localiza o cadastro. Compara só os dígitos, com ou sem o 55 na frente, pra o
 * mesmo número nunca virar dois clientes por causa de máscara ou DDI.
 */
export async function buscarClientePorTelefone(telefone: string) {
  const digitos = normalizarTelefone(telefone);
  if (!digitos) return null;
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(sql`regexp_replace(${clientes.telefone}, '[^0-9]', '', 'g') in (${digitos}, ${"55" + digitos})`)
    .orderBy(asc(clientes.id))
    .limit(1);
  return cliente ?? null;
}

/** PitPass que identifica o assinante: o ativo, ou o cadastro feito no site aguardando conferência. */
export async function buscarAssinaturaVigente(clienteId: number) {
  const vigentes = await db
    .select()
    .from(assinaturas)
    .where(and(eq(assinaturas.clienteId, clienteId), inArray(assinaturas.status, ["ativo", "pendente"])))
    .orderBy(asc(assinaturas.id));
  return vigentes.find((a) => a.status === "ativo") ?? vigentes[0] ?? null;
}

export async function buscarOuCriarCliente({
  nome,
  telefone,
  origem,
}: {
  nome: string;
  telefone: string;
  /** Só é gravada quando o cliente é criado agora; nunca sobrescreve a origem de quem já existe. */
  origem?: string | null;
}) {
  const existente = await buscarClientePorTelefone(telefone);
  if (existente) return { cliente: existente, criado: false };

  const [novo] = await db
    .insert(clientes)
    .values({ nome: nome.trim(), telefone: telefone.trim(), origem: origem ?? null })
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
  /** Porte do carro (P/G) ou "MOTO". */
  porte: CategoriaVeiculo;
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
  /** reservados + utilizados (o que conta na cota). */
  usados: number;
  /** Agendado e ainda não concluído. Cancelar devolve; concluir consome. */
  reservados: number;
  utilizados: number;
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
    const utilizados = usos.filter((u) => u.status === "utilizado").length;
    resumo.push({
      beneficio,
      tipo: regra.tipo,
      limite: regra.limite,
      usados: usos.length,
      reservados: usos.length - utilizados,
      utilizados,
    });
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
  categoriaVeiculo: CategoriaVeiculo;
  tipoAtendimento: "avulso" | "assinatura";
  dia: string;
  horario: string;
  /** Duração estimada do atendimento inteiro, do catálogo. null = algum serviço sem duração definida. */
  duracaoMin: number | null;
  /** Buffer vigente da agenda (catalogo.bufferMin). */
  bufferMin: number;
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
  responsavelFechamento?: string | null;
  responsavelAtendimento?: string | null;
  /**
   * Encaixe: o carro já está na loja, sem reserva. Não passa pela validação de horário
   * (a hora é a de agora, fora da grade) e já entra como CHEGOU.
   */
  encaixe?: boolean;
  /** Se for uso de benefício PitPass, a assinatura ativa correspondente. */
  assinaturaId?: number | null;
}

export type ResultadoCriarAgendamento =
  | { ok: true; id: number; codigo: string; checkinToken: string; clienteId: number; clienteCodigo: string }
  | { ok: false; erro: string; status: number };

export async function criarAgendamento(dados: DadosNovoAgendamento): Promise<ResultadoCriarAgendamento> {
  if (!dados.encaixe) {
    if (!horarioValidoParaAgendar(dados.dia, dados.horario)) {
      return { ok: false, erro: "Data ou horário inválido.", status: 400 };
    }
    if (!dataValidaParaAgendar(dados.dia)) {
      return { ok: false, erro: "Data inválida.", status: 400 };
    }
    if (!ocupaAgenda(dados.horario)) {
      return { ok: false, erro: "Horário fora da agenda.", status: 400 };
    }
    // o atendimento precisa caber inteiro: do início até início + duração (+ buffer)
    const ocupados = await ocupacaoDaAgenda({ soDia: dados.dia, bufferMin: dados.bufferMin });
    const situacao = situacaoDoHorario({
      horario: dados.horario,
      duracaoMin: dados.duracaoMin,
      bufferMin: dados.bufferMin,
      ocupados,
    });
    if (situacao === "ocupado") return { ok: false, erro: "Horário já reservado", status: 409 };
    if (situacao === "sem-janela") {
      return {
        ok: false,
        erro: "Esse horário não comporta a duração do atendimento. Escolha outro horário.",
        status: 409,
      };
    }
  }

  const { cliente } = await buscarOuCriarCliente({
    nome: dados.nome,
    telefone: dados.telefone,
    origem: dados.origem === "landing" ? "site" : null,
  });
  const veiculo = await buscarOuCriarVeiculo({
    clienteId: cliente.id,
    modelo: dados.carro,
    placa: dados.placa,
    porte: dados.categoriaVeiculo,
  });

  const checkinToken = gerarTokenCheckin();
  let registro;
  try {
    // A trava por dia enfileira as reservas concorrentes do mesmo dia dentro da transação:
    // quem entra depois já enxerga quem entrou antes na conferência logo abaixo.
    const [, inseridos] = await db.batch([
      db.execute(sql`select pg_advisory_xact_lock(hashtext(${"agenda:" + dados.dia}))`),
      db
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
        categoriaVeiculo: dados.categoriaVeiculo,
        servicoId: dados.servicoId ?? null,
        servicoNome: dados.servicoNome ?? dados.servicoPlano ?? null,
        duracaoMin: dados.duracaoMin,
        servicosAdicionais: dados.servicosAdicionaisJson ?? null,
        preco: dados.preco != null ? dados.preco.toFixed(2) : null,
        valorOriginal: dados.valorOriginal != null ? dados.valorOriginal.toFixed(2) : null,
        motivoAjuste: dados.motivoAjuste ?? null,
        transporte: dados.transporte ?? null,
        enderecoSnapshot: dados.enderecoSnapshot ?? null,
        observacoes: dados.observacoes ?? null,
        origem: dados.origem,
        responsavelFechamento: dados.responsavelFechamento ?? null,
        responsavelAtendimento: dados.responsavelAtendimento ?? null,
        dia: dados.dia,
        horario: dados.horario,
          checkinToken,
        })
        .returning({ id: agendamentos.id }),
    ]);
    [registro] = inseridos;
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    if (mensagem.includes("agendamento_slot_ativo") || mensagem.includes("duplicate key")) {
      return { ok: false, erro: "Horário já reservado", status: 409 };
    }
    throw e;
  }

  // Conferência depois de gravar: se duas reservas passaram pela checagem ao mesmo tempo e os
  // intervalos se cruzam, vale a que entrou primeiro (menor id) e esta é desfeita.
  if (!dados.encaixe) {
    const meu = intervaloOcupado(dados.horario, dados.duracaoMin, dados.bufferMin);
    const anteriores = await db
      .select({ horario: agendamentos.horario, duracaoMin: agendamentos.duracaoMin })
      .from(agendamentos)
      .where(
        and(eq(agendamentos.dia, dados.dia), ne(agendamentos.status, "cancelado"), lt(agendamentos.id, registro.id))
      );
    const cruzou = anteriores
      .filter((a) => ocupaAgenda(a.horario))
      .map((a) => intervaloOcupado(a.horario, a.duracaoMin, dados.bufferMin))
      .some((outro) => meu.inicio < outro.fim && outro.inicio < meu.fim);
    if (cruzou) {
      await db.delete(agendamentos).where(eq(agendamentos.id, registro.id));
      return { ok: false, erro: "Horário já reservado", status: 409 };
    }
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

  if (dados.encaixe) await moverEstagio(registro.id, "chegou");

  return {
    ok: true,
    id: registro.id,
    codigo,
    checkinToken,
    clienteId: cliente.id,
    clienteCodigo: cliente.codigo ?? "",
  };
}

/**
 * Move o carro de estágio (Kanban da Agenda, check-in, concluir...). Único lugar que escreve
 * `estagio`: mantém os horários reais, o histórico de movimentação, o `status` comercial e o
 * uso do benefício PitPass coerentes entre si.
 * - pronto/entregue = serviço concluído (status "concluido", benefício consumido);
 * - voltar pra antes de pronto reabre o agendamento (status "confirmado", benefício reservado).
 * Nada do histórico é apagado.
 */
export async function moverEstagio(id: number, destino: Estagio): Promise<boolean> {
  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.id, id));
  if (!registro || registro.status === "cancelado") return false;

  const agora = new Date();
  const concluido = destino === "pronto" || destino === "entregue";
  const historico = [...lerHistoricoEstagios(registro.historicoEstagios), { estagio: destino, em: agora.toISOString() }];

  await db
    .update(agendamentos)
    .set({
      estagio: destino,
      estagioDesde: agora,
      historicoEstagios: JSON.stringify(historico),
      status: concluido ? "concluido" : "confirmado",
      checkedInAt: destino === "agendado" ? null : (registro.checkedInAt ?? agora),
      startedAt: destino === "agendado" || destino === "chegou" ? null : (registro.startedAt ?? agora),
      completedAt: concluido ? (registro.completedAt ?? agora) : null,
      readyAt: concluido ? (registro.readyAt ?? agora) : null,
      deliveredAt: destino === "entregue" ? (registro.deliveredAt ?? agora) : null,
    })
    .where(eq(agendamentos.id, id));

  // benefício: concluir consome, reabrir volta a reservar (uso já liberado por cancelamento não muda)
  await db
    .update(beneficioUsos)
    .set({ status: concluido ? "utilizado" : "reservado" })
    .where(and(eq(beneficioUsos.agendamentoId, id), ne(beneficioUsos.status, "liberado")));

  return true;
}

/** Check-in na chegada: grava o horário real uma única vez, só pra agendamentos ainda abertos. */
export async function registrarCheckin(id: number) {
  await db
    .update(agendamentos)
    .set({ checkedInAt: sql`coalesce(${agendamentos.checkedInAt}, now())` })
    .where(and(eq(agendamentos.id, id), eq(agendamentos.status, "confirmado")));
}

/** Início do atendimento. Se o check-in foi pulado, registra os dois no mesmo instante. */
export async function iniciarAtendimento(id: number) {
  await db
    .update(agendamentos)
    .set({
      checkedInAt: sql`coalesce(${agendamentos.checkedInAt}, now())`,
      startedAt: sql`coalesce(${agendamentos.startedAt}, now())`,
    })
    .where(and(eq(agendamentos.id, id), eq(agendamentos.status, "confirmado")));
}

export async function atualizarStatus(id: number, status: StatusAgendamento) {
  // Concluir também grava o horário real de conclusão (só na primeira vez).
  await db
    .update(agendamentos)
    .set(
      status === "concluido"
        ? { status, completedAt: sql`coalesce(${agendamentos.completedAt}, now())` }
        : { status }
    )
    .where(eq(agendamentos.id, id));

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
