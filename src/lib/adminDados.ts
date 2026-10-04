import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, assinaturas, clientes, veiculos } from "@/db/schema";
import { hojeIso } from "./agenda";
import { buscarClientes } from "./clientes";
import { planos, PlanoId, linkWhatsappPara, portesVeiculo, VehicleSize } from "./data";
import {
  analisarServicos,
  Estagio,
  estagioDoRegistro,
  EventoEstagio,
  lerHistoricoEstagios,
  Setor,
} from "./operacao";

/**
 * Consultas do admin operacional. Cada tela pede só o que mostra: listas não carregam
 * histórico completo de ninguém (isso fica na ficha do cliente).
 */

export type Agendamento = typeof agendamentos.$inferSelect;

export const filtrosAgendamento = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "proximos", rotulo: "Próximos" },
  { id: "atendimento", rotulo: "Em atendimento" },
  { id: "concluidos", rotulo: "Concluídos" },
  { id: "cancelados", rotulo: "Cancelados" },
  { id: "todos", rotulo: "Todos" },
] as const;
export type FiltroAgendamento = (typeof filtrosAgendamento)[number]["id"];

export const filtrosTipo = [
  { id: "todos", rotulo: "Todos" },
  { id: "avulso", rotulo: "PitStop 084" },
  { id: "pitpass", rotulo: "PitPass" },
  { id: "black", rotulo: "Black" },
  { id: "gold", rotulo: "Gold" },
  { id: "diamante", rotulo: "Diamante" },
] as const;
export type FiltroTipo = (typeof filtrosTipo)[number]["id"];

/** Nome, código P084, placa (sem hífen) ou WhatsApp (só dígitos). */
function criterioBusca(termoBruto: string): SQL | undefined {
  const termo = termoBruto.trim();
  if (termo.length < 2) return undefined;
  const digitos = termo.replace(/\D/g, "");
  const placa = termo.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const criterios: SQL[] = [ilike(agendamentos.nome, `%${termo}%`), ilike(agendamentos.codigo, `%${termo}%`)];
  if (placa.length >= 3) {
    criterios.push(
      sql`upper(regexp_replace(coalesce(${agendamentos.placa}, ''), '[^A-Za-z0-9]', '', 'g')) like ${"%" + placa + "%"}`
    );
  }
  if (digitos.length >= 4) {
    criterios.push(sql`regexp_replace(${agendamentos.telefone}, '[^0-9]', '', 'g') like ${"%" + digitos + "%"}`);
  }
  return or(...criterios);
}

export async function listarAgendamentos({
  filtro,
  tipo,
  q,
}: {
  filtro: FiltroAgendamento;
  tipo: FiltroTipo;
  q: string;
}): Promise<Agendamento[]> {
  const hoje = hojeIso();
  const condicoes: (SQL | undefined)[] = [criterioBusca(q)];

  if (filtro === "hoje") condicoes.push(eq(agendamentos.dia, hoje), sql`${agendamentos.status} <> 'cancelado'`);
  if (filtro === "proximos") condicoes.push(gte(agendamentos.dia, hoje), eq(agendamentos.status, "confirmado"));
  if (filtro === "atendimento") condicoes.push(eq(agendamentos.status, "confirmado"), isNotNull(agendamentos.startedAt));
  if (filtro === "concluidos") condicoes.push(eq(agendamentos.status, "concluido"));
  if (filtro === "cancelados") condicoes.push(eq(agendamentos.status, "cancelado"));

  if (tipo === "avulso") condicoes.push(eq(agendamentos.tipoAtendimento, "avulso"));
  if (tipo === "pitpass") condicoes.push(eq(agendamentos.tipoAtendimento, "assinatura"));
  if (tipo === "black" || tipo === "gold" || tipo === "diamante") {
    condicoes.push(eq(agendamentos.tipoAtendimento, "assinatura"), eq(agendamentos.plano, tipo));
  }

  // passado (concluídos, cancelados, todos) vem do mais recente pro mais antigo; o resto, em ordem de chegada
  const passado = filtro === "concluidos" || filtro === "cancelados" || filtro === "todos";
  return db
    .select()
    .from(agendamentos)
    .where(and(...condicoes))
    .orderBy(
      passado ? desc(agendamentos.dia) : asc(agendamentos.dia),
      passado ? desc(agendamentos.horario) : asc(agendamentos.horario)
    )
    .limit(passado ? 100 : 200);
}

export async function agendamentosDoDia(dia: string): Promise<Agendamento[]> {
  return db
    .select()
    .from(agendamentos)
    .where(and(eq(agendamentos.dia, dia), sql`${agendamentos.status} <> 'cancelado'`))
    .orderBy(asc(agendamentos.horario));
}

/** Nome do plano ativo de cada cliente (só dos ids pedidos). */
export async function planosAtivosPorCliente(ids: (number | null)[]): Promise<Map<number, string>> {
  const unicos = [...new Set(ids.filter((id): id is number => id != null))];
  if (unicos.length === 0) return new Map();
  const ativas = await db
    .select({ clienteId: assinaturas.clienteId, plano: assinaturas.plano })
    .from(assinaturas)
    .where(and(inArray(assinaturas.clienteId, unicos), eq(assinaturas.status, "ativo")));
  return new Map(ativas.map((a) => [a.clienteId, planos[a.plano as PlanoId]?.nome ?? a.plano]));
}

interface AdicionalJson {
  nome: string;
}

/** "Ducha Pitstop + Higienização Interna" ou o benefício do plano. */
export function descreverServicos(registro: Agendamento): string {
  if (registro.tipoAtendimento === "assinatura") {
    return registro.servicoNome ?? (registro.plano ? registro.plano.toUpperCase() : "-");
  }
  const partes = [registro.servicoNome ?? "Ducha Pitstop"];
  if (registro.servicosAdicionais) {
    try {
      partes.push(...(JSON.parse(registro.servicosAdicionais) as AdicionalJson[]).map((a) => a.nome));
    } catch {
      // JSON antigo mal formado: mostra só o serviço principal
    }
  }
  return partes.join(" + ");
}

/** Abre a conversa com o CLIENTE (não com a loja), com uma mensagem pronta pra recepção editar. */
export function whatsappDoCliente(registro: { nome: string; telefone: string; codigo?: string | null }): string {
  const primeiroNome = registro.nome.trim().split(/\s+/)[0];
  const sobre = registro.codigo ? `, sobre o seu agendamento ${registro.codigo}` : "";
  return linkWhatsappPara(registro.telefone, `Olá, ${primeiroNome}! Aqui é da PitStop084${sobre}.`);
}

export interface ClienteResumo {
  id: number;
  codigo: string | null;
  nome: string;
  telefone: string;
  nomePlano: string | null;
  veiculo: string | null;
  placa: string | null;
  ultimaVisita: string | null;
  proximo: { dia: string; horario: string } | null;
}

/** Lista de clientes com o mínimo pra identificar: sem histórico, só última visita e próximo horário agregados. */
export async function listarClientesResumo(q: string): Promise<ClienteResumo[]> {
  const termo = q.trim();
  const base = termo
    ? (await buscarClientes(termo)).slice(0, 60)
    : await db.select().from(clientes).orderBy(desc(clientes.updatedAt)).limit(60);
  if (base.length === 0) return [];

  const ids = base.map((c) => c.id);
  const hoje = hojeIso();
  const [carros, planosAtivos, agregados] = await Promise.all([
    db.select().from(veiculos).where(inArray(veiculos.clienteId, ids)),
    planosAtivosPorCliente(ids),
    db
      .select({
        clienteId: agendamentos.clienteId,
        ultimaVisita: sql<string | null>`max(${agendamentos.dia}) filter (where ${agendamentos.status} = 'concluido')`,
        proximo: sql<string | null>`min(${agendamentos.dia} || ' ' || ${agendamentos.horario}) filter (where ${agendamentos.status} = 'confirmado' and ${agendamentos.dia} >= ${hoje})`,
      })
      .from(agendamentos)
      .where(inArray(agendamentos.clienteId, ids))
      .groupBy(agendamentos.clienteId),
  ]);

  const agregadoPorCliente = new Map(agregados.map((a) => [a.clienteId, a]));
  return base.map((c) => {
    const doCliente = carros.filter((v) => v.clienteId === c.id);
    const principal = doCliente.find((v) => v.principal) ?? doCliente[0];
    const agregado = agregadoPorCliente.get(c.id);
    const [dia, horario] = agregado?.proximo?.split(" ") ?? [];
    return {
      id: c.id,
      codigo: c.codigo,
      nome: c.nome,
      telefone: c.telefone,
      nomePlano: planosAtivos.get(c.id) ?? null,
      veiculo: principal?.modelo ?? null,
      placa: principal?.placa ?? null,
      ultimaVisita: agregado?.ultimaVisita ?? null,
      proximo: dia && horario ? { dia, horario } : null,
    };
  });
}

/** Busca global: clientes e agendamentos (de qualquer data) que batem com o termo. */
export async function buscaGlobal(q: string) {
  const termo = q.trim();
  const criterio = criterioBusca(termo);
  if (!criterio) return { clientes: [] as ClienteResumo[], agendamentos: [] as Agendamento[] };

  const [clientesEncontrados, agendamentosEncontrados] = await Promise.all([
    listarClientesResumo(termo),
    db
      .select()
      .from(agendamentos)
      .where(criterio)
      .orderBy(desc(agendamentos.dia), desc(agendamentos.horario))
      .limit(20),
  ]);
  return { clientes: clientesEncontrados.slice(0, 20), agendamentos: agendamentosEncontrados };
}

/** Tudo que um card do Kanban e o painel lateral precisam, já serializável pro navegador. */
export interface CartaoAgenda {
  id: number;
  clienteId: number | null;
  codigo: string | null;
  dia: string;
  horario: string;
  nome: string;
  telefone: string;
  carro: string;
  placa: string | null;
  porteNome: string;
  servico: string;
  adicionais: string[];
  /** null = cliente PitStop 084 (avulso, sem plano). */
  nomePlano: string | null;
  /** Todos os planos PitPass incluem atendimento prioritário. */
  prioridade: boolean;
  estagio: Estagio;
  /** ISO de quando entrou no estágio atual (null em registro antigo, sem cronômetro). */
  estagioDesde: string | null;
  /** ISO do início do serviço, pra comparar com o tempo estimado. */
  iniciadoEm: string | null;
  estimativaMin: number | null;
  exigeDetailer: boolean;
  setor: Setor;
  fluxo: Estagio[];
  responsavel: string | null;
  observacoes: string | null;
  preferencias: string | null;
  levaBusca: boolean;
  endereco: { rua?: string; numero?: string; bairro?: string; referencia?: string } | null;
  clienteAguardando: boolean;
  checklistSaida: Record<string, boolean>;
  historico: EventoEstagio[];
  whatsappUrl: string;
  avisoProntoUrl: string;
}

function lerJson<T>(json: string | null, padrao: T): T {
  if (!json) return padrao;
  try {
    return JSON.parse(json) as T;
  } catch {
    return padrao;
  }
}

/** Cards do dia pro Kanban e pra visão por horários (cancelados ficam de fora). */
export async function cartoesDoDia(dia: string): Promise<CartaoAgenda[]> {
  const registros = await agendamentosDoDia(dia);
  const idsClientes = [...new Set(registros.map((r) => r.clienteId).filter((id): id is number => id != null))];
  const [planosAtivos, preferencias] = await Promise.all([
    planosAtivosPorCliente(idsClientes),
    idsClientes.length > 0
      ? db
          .select({ id: clientes.id, preferencias: clientes.preferencias })
          .from(clientes)
          .where(inArray(clientes.id, idsClientes))
      : Promise.resolve([]),
  ]);
  const preferenciaPorCliente = new Map(preferencias.map((p) => [p.id, p.preferencias]));

  return registros.flatMap((r) => {
    const estagio = estagioDoRegistro(r);
    if (!estagio) return [];
    const analise = analisarServicos(r);
    const ehAssinatura = r.tipoAtendimento === "assinatura";
    const nomePlano =
      ehAssinatura && r.plano
        ? (planos[r.plano as PlanoId]?.nome ?? r.plano)
        : ((r.clienteId ? planosAtivos.get(r.clienteId) : null) ?? null);
    const primeiroNome = r.nome.trim().split(/\s+/)[0];

    return [
      {
        id: r.id,
        clienteId: r.clienteId,
        codigo: r.codigo,
        dia: r.dia,
        horario: r.horario,
        nome: r.nome,
        telefone: r.telefone,
        carro: r.carro,
        placa: r.placa,
        porteNome: (portesVeiculo[r.categoriaVeiculo as VehicleSize] ?? portesVeiculo.P).nome,
        servico: ehAssinatura ? (r.servicoNome ?? "-") : (r.servicoNome ?? "Ducha Pitstop"),
        adicionais: ehAssinatura ? [] : lerJson<AdicionalJson[]>(r.servicosAdicionais, []).map((a) => a.nome),
        nomePlano,
        prioridade: Boolean(nomePlano),
        estagio,
        estagioDesde: r.estagioDesde ? new Date(r.estagioDesde).toISOString() : null,
        iniciadoEm: r.startedAt ? new Date(r.startedAt).toISOString() : null,
        estimativaMin: analise.estimativaMin,
        exigeDetailer: analise.exigeDetailer,
        setor: analise.setor,
        fluxo: analise.fluxo,
        responsavel: r.responsavelAtendimento,
        observacoes: r.observacoes,
        preferencias: (r.clienteId ? preferenciaPorCliente.get(r.clienteId) : null) ?? null,
        levaBusca: r.transporte === "leva_busca",
        endereco: lerJson<CartaoAgenda["endereco"]>(r.enderecoSnapshot, null),
        clienteAguardando: Boolean(r.clienteAguardando),
        checklistSaida: lerJson<Record<string, boolean>>(r.checklistSaida, {}),
        historico: lerHistoricoEstagios(r.historicoEstagios),
        whatsappUrl: whatsappDoCliente(r),
        avisoProntoUrl: linkWhatsappPara(r.telefone, `Olá, ${primeiroNome}! Seu veículo já está pronto na PitStop084.`),
      } satisfies CartaoAgenda,
    ];
  });
}
