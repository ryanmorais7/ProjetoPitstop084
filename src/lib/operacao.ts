import { duchaPitstop, servicosAvulsos } from "./data";

/**
 * Fluxo operacional do carro dentro da loja (Kanban da Agenda). Helpers puros, sem banco:
 * rodam no servidor e no navegador.
 *
 * O estágio é separado do `status` do agendamento. O status segue sendo a verdade comercial
 * ("confirmado" ocupa horário, "concluido" consome o benefício); o estágio diz onde o carro está.
 */
export const estagios = ["agendado", "chegou", "lavagem", "detail", "finalizacao", "pronto", "entregue"] as const;
export type Estagio = (typeof estagios)[number];

export const rotuloEstagio: Record<Estagio, string> = {
  agendado: "Agendado",
  chegou: "Chegou",
  lavagem: "Em lavagem",
  detail: "Em detail",
  finalizacao: "Finalização",
  pronto: "Pronto",
  entregue: "Entregue",
};

/** Estágios em que o cronômetro do card corre. */
export const estagiosComTempo: Estagio[] = ["lavagem", "detail", "finalizacao"];

export function estagioValido(valor: unknown): valor is Estagio {
  return typeof valor === "string" && (estagios as readonly string[]).includes(valor);
}

export type Setor = "lavagem" | "detail" | "manutencao";

interface ServicosDoRegistro {
  tipoAtendimento: string;
  servicoNome: string | null;
  servicosAdicionais: string | null;
}

export interface AnaliseServicos {
  /** Tem serviço técnico (polimento, vitrificação...): precisa do detailer. */
  exigeDetailer: boolean;
  /** Pra filtrar a agenda por tipo de serviço. */
  setor: Setor;
  /** Caminho esperado do carro. Sair dele é permitido, mas pede confirmação. */
  fluxo: Estagio[];
  /** Soma dos tempos estimados; null se algum serviço não tem tempo confirmado. */
  estimativaMin: number | null;
}

export function analisarServicos(registro: ServicosDoRegistro): AnaliseServicos {
  let exigeDetailer = false;
  let estimativaMin: number | null = null;

  if (registro.tipoAtendimento === "avulso") {
    let ids: string[] = [];
    try {
      ids = registro.servicosAdicionais
        ? (JSON.parse(registro.servicosAdicionais) as { id: string }[]).map((a) => a.id)
        : [];
    } catch {
      // JSON antigo mal formado: trata como Ducha simples
    }
    const adicionais = ids.map((id) => servicosAvulsos.find((s) => s.id === id));
    exigeDetailer = adicionais.some((s) => s?.exigeDetailer);
    const duracoes = [duchaPitstop.duracaoMin, ...adicionais.map((s) => s?.duracaoMin)];
    estimativaMin = duracoes.every((d): d is number => typeof d === "number")
      ? duracoes.reduce((soma, d) => soma + d, 0)
      : null;
  }

  const setor: Setor = exigeDetailer ? "detail" : registro.servicoNome === "Manutenção" ? "manutencao" : "lavagem";
  // todo avulso começa pela Ducha; com serviço técnico, segue pro detailer depois da lavagem
  const servico: Estagio[] = exigeDetailer ? ["lavagem", "detail"] : ["lavagem"];
  return { exigeDetailer, setor, fluxo: ["agendado", "chegou", ...servico, "finalizacao", "pronto", "entregue"], estimativaMin };
}

/**
 * Estágio atual. Registros anteriores ao Kanban não têm `estagio` gravado: deriva dos
 * horários reais que já existiam (check-in, início, conclusão). Cancelado não entra no quadro.
 */
export function estagioDoRegistro(
  registro: ServicosDoRegistro & {
    status: string;
    estagio: string | null;
    checkedInAt: Date | string | null;
    startedAt: Date | string | null;
  }
): Estagio | null {
  if (registro.status === "cancelado") return null;
  if (estagioValido(registro.estagio)) return registro.estagio;
  if (registro.status === "concluido") return "entregue";
  if (registro.startedAt) return "lavagem";
  if (registro.checkedInAt) return "chegou";
  return "agendado";
}

export type TipoMovimento = "natural" | "pular" | "voltar" | "fora-do-fluxo";

/** Próximo passo do fluxo = natural. Qualquer outra coisa é permitida, mas pede confirmação. */
export function tipoMovimento(fluxo: Estagio[], atual: Estagio, destino: Estagio): TipoMovimento {
  if (!fluxo.includes(destino)) return "fora-do-fluxo";
  const de = fluxo.indexOf(atual);
  const para = fluxo.indexOf(destino);
  // carro que está fora do fluxo (ex.: Ducha parada em "detail"): compara pela ordem geral
  const origem = de >= 0 ? de : fluxo.findIndex((e) => estagios.indexOf(e) > estagios.indexOf(atual)) - 1;
  if (para === origem + 1) return "natural";
  return para > origem ? "pular" : "voltar";
}

export interface CargaSetor {
  andamento: number;
  aguardando: number;
}

export interface CargaOperacional {
  lavagem: CargaSetor;
  detail: CargaSetor;
  finalizacao: number;
  nivel: "normal" | "atencao" | "alta";
  mensagem: string;
}

/**
 * Carga da equipe a partir do que está no quadro agora. Regras (dados reais, sem estimativa):
 * - aguardando lavagem = chegou e ainda não entrou na lavagem;
 * - aguardando detail = está na lavagem (ou chegou) e ainda vai pro detailer;
 * - ATENÇÃO = algum setor ocupado com carro esperando por ele;
 * - CAPACIDADE ALTA = 2 ou mais carros esperando pelo mesmo setor.
 */
export function cargaOperacional(cartoes: { estagio: Estagio; fluxo: Estagio[] }[]): CargaOperacional {
  const em = (estagio: Estagio) => cartoes.filter((c) => c.estagio === estagio);
  const lavagem: CargaSetor = { andamento: em("lavagem").length, aguardando: em("chegou").length };
  const detail: CargaSetor = {
    andamento: em("detail").length,
    aguardando: cartoes.filter((c) => (c.estagio === "chegou" || c.estagio === "lavagem") && c.fluxo.includes("detail")).length,
  };
  const finalizacao = em("finalizacao").length;

  const setores = [
    { nome: "Lavagem", ...lavagem },
    { nome: "Detail", ...detail },
  ];
  const cheio = setores.find((s) => s.aguardando >= 2);
  const comFila = setores.find((s) => s.aguardando >= 1 && s.andamento >= 1);

  if (cheio) return { lavagem, detail, finalizacao, nivel: "alta", mensagem: `${cheio.nome}: ${cheio.aguardando} aguardando` };
  if (comFila) return { lavagem, detail, finalizacao, nivel: "atencao", mensagem: `${comFila.nome} com fila` };
  return { lavagem, detail, finalizacao, nivel: "normal", mensagem: "Fluxo normal" };
}

export interface EventoEstagio {
  estagio: Estagio;
  em: string;
}

export function lerHistoricoEstagios(json: string | null): EventoEstagio[] {
  if (!json) return [];
  try {
    const lista = JSON.parse(json) as EventoEstagio[];
    return Array.isArray(lista) ? lista.filter((e) => estagioValido(e?.estagio) && typeof e.em === "string") : [];
  } catch {
    return [];
  }
}

/** Itens do checklist opcional de finalização. */
export const itensChecklistSaida = [
  { chave: "acabamento", rotulo: "Acabamento conferido" },
  { chave: "vidros", rotulo: "Vidros" },
  { chave: "rodas", rotulo: "Rodas e pneus" },
  { chave: "objetos", rotulo: "Objetos do cliente" },
  { chave: "observacoes", rotulo: "Observações finais" },
] as const;
