/**
 * Contexto que acompanha o fluxo "novo agendamento" entre as telas (buscar cliente → cadastrar →
 * agendar): encaixe (carro já na loja, sem reserva) ou data/hora já escolhidas na Agenda.
 * Só passa adiante o que é válido; nada de repassar query string crua.
 */
export interface ContextoAgendar {
  encaixe: boolean;
  dia: string | null;
  hora: string | null;
}

type Parametros = Record<string, string | string[] | undefined> | FormData;

function ler(origem: Parametros, nome: string): string {
  const valor = origem instanceof FormData ? origem.get(nome) : origem[nome];
  return typeof valor === "string" ? valor : "";
}

export function lerContextoAgendar(origem: Parametros): ContextoAgendar {
  const dia = ler(origem, "dia");
  const hora = ler(origem, "hora");
  return {
    encaixe: ler(origem, "encaixe") === "1",
    dia: /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null,
    hora: /^\d{2}:\d{2}$/.test(hora) ? hora : null,
  };
}

/** "" ou "encaixe=1" / "dia=...&hora=...", pronto pra colar depois de ? ou &. */
export function queryContextoAgendar(contexto: ContextoAgendar): string {
  const p = new URLSearchParams();
  if (contexto.encaixe) p.set("encaixe", "1");
  else {
    if (contexto.dia) p.set("dia", contexto.dia);
    if (contexto.hora) p.set("hora", contexto.hora);
  }
  return p.toString();
}
