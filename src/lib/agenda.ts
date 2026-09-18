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

function parseIso(dataIso: string): Date {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function formatarDataCurta(dataIso: string): string {
  const data = parseIso(dataIso);
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
  const inicio = parseIso(dataIso);
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
