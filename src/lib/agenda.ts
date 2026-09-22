import { diaFechado } from "./data";

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

