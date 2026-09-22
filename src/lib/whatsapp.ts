import { formatarDataCurta } from "./agenda";

function linhaData(dataIso: string, horario: string): string {
  return `${formatarDataCurta(dataIso).replace(" • ", ", ")}`.concat(`\nHorário: ${horario}`);
}

export function mensagemAgendamentoAvulso({
  nome,
  veiculo,
  porteNome,
  servico,
  dataIso,
  horario,
  codigo,
  observacoes,
}: {
  nome: string;
  veiculo: string;
  porteNome: string;
  servico: string;
  dataIso: string;
  horario: string;
  codigo: string;
  observacoes?: string | null;
}): string {
  const linhas = [
    "🚘✨ Novo agendamento PitStop 084",
    "",
    `Cliente: ${nome}`,
    `Veículo: ${veiculo} • ${porteNome}`,
    `Serviço: ${servico}`,
    `Data: ${linhaData(dataIso, horario)}`,
    `Código: ${codigo}`,
  ];
  if (observacoes) linhas.push("", `Obs.: ${observacoes}`);
  linhas.push("", "Agendamento realizado pelo site.", "Até lá! 🟡⚫");
  return linhas.join("\n");
}

export function mensagemAgendamentoPitPass({
  nome,
  veiculo,
  porteNome,
  plano,
  beneficio,
  dataIso,
  horario,
  codigo,
  observacoes,
}: {
  nome: string;
  veiculo: string;
  porteNome: string;
  plano: string;
  beneficio: string;
  dataIso: string;
  horario: string;
  codigo: string;
  observacoes?: string | null;
}): string {
  const linhas = [
    `💎 Novo agendamento PitPass • ${plano.toUpperCase()}`,
    "",
    `Cliente: ${nome}`,
    `Veículo: ${veiculo} • ${porteNome}`,
    `Benefício: ${beneficio}`,
    `Data: ${linhaData(dataIso, horario)}`,
    `Código: ${codigo}`,
  ];
  if (observacoes) linhas.push("", `Obs.: ${observacoes}`);
  linhas.push("", "PitPass identificado.", "Até lá! 🟡⚫");
  return linhas.join("\n");
}
