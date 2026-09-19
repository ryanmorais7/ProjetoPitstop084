import { diaFechado, enderecoPitstop } from "./data";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const mesAbreviado = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

export function paraIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function hojeIso(): string {
  return paraIso(new Date());
}

/** Próximos dias corridos a partir de hoje, pulando o dia de fechamento (domingo). */
export function proximasDatasUteis(quantidade = 6): Date[] {
  const datas: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (datas.length < quantidade) {
    if (cursor.getDay() !== diaFechado) datas.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}

function parseIso(dataIso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return null;
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return Number.isNaN(data.getTime()) ? null : data;
}

/** Se `dataIso` não for uma data ISO válida (ex.: registro antigo salvo como nome de dia), devolve o valor original em vez de "undefined". */
export function formatarDataCurta(dataIso: string): string {
  const data = parseIso(dataIso);
  if (!data) return dataIso;
  return `${diaAbreviadoCurto[data.getDay()]} • ${data.getDate()} ${mesAbreviado[data.getMonth()]}`;
}

function formatarDataICS(data: Date): string {
  return data.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function linkGoogleCalendar({
  dataIso,
  horario,
  titulo,
  detalhes,
}: {
  dataIso: string;
  horario: string;
  titulo: string;
  detalhes: string;
}): string {
  const [hora, minuto] = horario.split(":").map(Number);
  const inicio = parseIso(dataIso) ?? new Date();
  inicio.setHours(hora ?? 0, minuto ?? 0, 0, 0);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const endereco = `${enderecoPitstop.linha1}, ${enderecoPitstop.linha2}, ${enderecoPitstop.linha3}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${formatarDataICS(inicio)}/${formatarDataICS(fim)}`,
    details: detalhes,
    location: endereco,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
