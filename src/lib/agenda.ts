import { diaFechado, horariosAgendamento } from "./data";

const TIMEZONE = "America/Fortaleza";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const mesAbreviado = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

/** "YYYY-MM-DD" da data/hora atual em America/Fortaleza — nunca depender do timezone do runtime (Vercel roda em UTC). */
export function hojeIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "HH:MM" da hora atual em America/Fortaleza, pra comparar com horariosAgendamento e bloquear horários já passados. */
export function horaAtualFortaleza(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/**
 * Um Date "neutro" ancorado ao meio-dia UTC pra representar só um dia de calendário
 * (Y-M-D), sem carregar hora local nenhuma — toda leitura correspondente usa os métodos
 * getUTC*, nunca getDate()/getDay() locais, pra não depender do timezone do runtime.
 */
function dataDoDia(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
}

export function paraIso(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Próximos dias corridos a partir de HOJE (America/Fortaleza), pulando o dia de fechamento (domingo). */
export function proximasDatasUteis(quantidade = 6): Date[] {
  const [anoHoje, mesHoje, diaHoje] = hojeIso().split("-").map(Number);
  const datas: Date[] = [];
  let cursor = dataDoDia(anoHoje, mesHoje, diaHoje);

  while (datas.length < quantidade) {
    if (cursor.getUTCDay() !== diaFechado) datas.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return datas;
}

function parseIso(dataIso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return null;
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = dataDoDia(ano, mes, dia);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Uma data ISO é válida pra agendar quando: formato correto, dia real do calendário,
 * não cai no dia de fechamento, e não é anterior a hoje (America/Fortaleza).
 */
export function dataValidaParaAgendar(dataIso: string): boolean {
  const data = parseIso(dataIso);
  if (!data) return false;
  if (data.getUTCDay() === diaFechado) return false;
  return dataIso >= hojeIso();
}

/** Se `dia`+`horario` caem em hoje, o horário precisa ainda não ter passado (America/Fortaleza). */
export function horarioValidoParaAgendar(dataIso: string, horario: string): boolean {
  if (!dataValidaParaAgendar(dataIso)) return false;
  if (dataIso === hojeIso() && horario <= horaAtualFortaleza()) return false;
  return true;
}

/** Se `dataIso` não for uma data ISO válida (ex.: registro antigo salvo como nome de dia), devolve o valor original em vez de "undefined". */
export function formatarDataCurta(dataIso: string): string {
  const data = parseIso(dataIso);
  if (!data) return dataIso;
  return `${diaAbreviadoCurto[data.getUTCDay()]} • ${data.getUTCDate()} ${mesAbreviado[data.getUTCMonth()]}`;
}

/**
 * Disponibilidade por INTERVALO. Um atendimento ocupa de `horario` até `horario + duração +
 * buffer`, não só o horário inicial. Funções puras: o navegador usa pra desenhar os horários e
 * o servidor usa as mesmas pra validar (a validação que vale é a do servidor).
 */

/** Atendimento sem duração definida ocupa um horário da grade, como era antes dos intervalos. */
export const DURACAO_SEM_DEFINICAO_MIN = 60;

export function minutosDoHorario(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

export function horarioDosMinutos(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export interface Intervalo {
  inicio: number;
  fim: number;
}

/** Minutos do dia que um atendimento bloqueia. `bufferMin` = organização/movimentação depois dele. */
export function intervaloOcupado(horario: string, duracaoMin: number | null | undefined, bufferMin = 0): Intervalo {
  const inicio = minutosDoHorario(horario);
  return { inicio, fim: inicio + (duracaoMin && duracaoMin > 0 ? duracaoMin : DURACAO_SEM_DEFINICAO_MIN) + bufferMin };
}

/** Fim do expediente = fim do último horário da grade. */
export function fimDoExpediente(horarios: string[] = horariosAgendamento): number {
  return Math.max(...horarios.map(minutosDoHorario)) + DURACAO_SEM_DEFINICAO_MIN;
}

/** Só quem começa num horário da grade ocupa a agenda; encaixe (hora quebrada) não bloqueia reserva. */
export function ocupaAgenda(horario: string, horarios: string[] = horariosAgendamento): boolean {
  return horarios.includes(horario);
}

export type SituacaoHorario = "livre" | "ocupado" | "sem-janela";

/**
 * - "ocupado": o horário inicial cai dentro de um atendimento ou bloqueio;
 * - "sem-janela": o início está livre, mas a duração bate em outro atendimento/bloqueio ou
 *   passa do fim do expediente;
 * - "livre": cabe inteiro.
 */
export function situacaoDoHorario({
  horario,
  duracaoMin,
  bufferMin = 0,
  ocupados,
  horarios = horariosAgendamento,
}: {
  horario: string;
  duracaoMin: number | null | undefined;
  bufferMin?: number;
  /** Intervalos já ocupados NAQUELE dia (atendimentos + bloqueios). */
  ocupados: Intervalo[];
  horarios?: string[];
}): SituacaoHorario {
  const novo = intervaloOcupado(horario, duracaoMin, bufferMin);
  if (ocupados.some((o) => novo.inicio >= o.inicio && novo.inicio < o.fim)) return "ocupado";
  if (ocupados.some((o) => novo.inicio < o.fim && o.inicio < novo.fim)) return "sem-janela";
  // o buffer é tempo interno da loja: só o serviço em si precisa terminar dentro do expediente
  if (novo.fim - bufferMin > fimDoExpediente(horarios)) return "sem-janela";
  return "livre";
}

/** Instante atual em ms. O servidor entrega isso ao quadro da Agenda pra hidratar os cronômetros sem divergência. */
export function agoraMs(): number {
  return Date.now();
}
