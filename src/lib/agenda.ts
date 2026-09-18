import { enderecoPitstop } from "./data";

const diasSemanaIndice: Record<string, number> = {
  Domingo: 0,
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
};

const diaAbreviadoCurto: Record<string, string> = {
  Domingo: "DOM",
  Segunda: "SEG",
  Terça: "TER",
  Quarta: "QUA",
  Quinta: "QUI",
  Sexta: "SEX",
  Sábado: "SÁB",
};

const mesAbreviado = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

/**
 * Os horários hoje só existem como nome de dia da semana recorrente (ex.: "Sexta"),
 * não como data de calendário — isso não muda aqui. Esta função só calcula a próxima
 * data real correspondente, para exibição no PitPass e para o link "Adicionar à agenda".
 */
export function proximaOcorrencia(diaSemana: string, horario: string): Date {
  const alvo = diasSemanaIndice[diaSemana] ?? 1;
  const [hora, minuto] = horario.split(":").map(Number);

  const data = new Date();
  data.setHours(hora ?? 0, minuto ?? 0, 0, 0);

  const diaAtual = data.getDay();
  let diff = alvo - diaAtual;
  if (diff < 0 || (diff === 0 && data.getTime() < Date.now())) diff += 7;
  data.setDate(data.getDate() + diff);

  return data;
}

export function formatarDataCurta(diaSemana: string, horario: string): string {
  const data = proximaOcorrencia(diaSemana, horario);
  return `${diaAbreviadoCurto[diaSemana] ?? diaSemana.slice(0, 3).toUpperCase()} • ${data.getDate()} ${
    mesAbreviado[data.getMonth()]
  }`;
}

function formatarDataICS(data: Date): string {
  return data.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function linkGoogleCalendar({
  diaSemana,
  horario,
  titulo,
  detalhes,
}: {
  diaSemana: string;
  horario: string;
  titulo: string;
  detalhes: string;
}): string {
  const inicio = proximaOcorrencia(diaSemana, horario);
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
