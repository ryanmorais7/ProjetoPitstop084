/**
 * Helpers puros do PitPass (sem banco, sem Node): rodam tanto no navegador (leitor do admin)
 * quanto no servidor.
 */

const TIMEZONE = "America/Fortaleza";

/** Formato do token do QR: base64url gerado em `gerarTokenCheckin` (src/lib/checkin.ts). */
export const PADRAO_TOKEN_CHECKIN = /^[A-Za-z0-9_-]{16,64}$/;

/** Caminho público que vai dentro do QR. Só o token: nada de nome, telefone, placa ou endereço. */
export function caminhoCheckin(token: string): string {
  return `/checkin/${token}`;
}

/**
 * Normaliza o que o funcionário digitar ("p084 44", "P084-0044", "0044", "44") pro formato
 * salvo no banco ("P084-0044"). Devolve null se não parecer um código PitPass.
 */
export function normalizarCodigoPitPass(entrada: string): string | null {
  const limpo = entrada.trim().toUpperCase().replace(/\s+/g, "");
  const match = limpo.match(/^(?:P084-?)?(\d{1,6})$/);
  if (!match) return null;
  return `P084-${match[1].padStart(4, "0")}`;
}

export type ReferenciaPitPass = { tipo: "token"; valor: string } | { tipo: "codigo"; valor: string };

/**
 * Interpreta o conteúdo lido do QR (URL ".../checkin/<token>") ou digitado (código P084).
 * O domínio da URL é ignorado de propósito: só o token importa, e ele é validado no servidor.
 */
export function interpretarLeituraPitPass(texto: string): ReferenciaPitPass | null {
  const bruto = texto.trim();
  const porUrl = bruto.match(/\/checkin\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/);
  if (porUrl && PADRAO_TOKEN_CHECKIN.test(porUrl[1])) return { tipo: "token", valor: porUrl[1] };

  const codigo = normalizarCodigoPitPass(bruto);
  if (codigo) return { tipo: "codigo", valor: codigo };

  if (PADRAO_TOKEN_CHECKIN.test(bruto)) return { tipo: "token", valor: bruto };
  return null;
}

export type EtapaAtendimento = "aguardando" | "checkin" | "em_atendimento" | "concluido" | "cancelado";

/**
 * Etapa real do atendimento, derivada dos status existentes + timestamps.
 * O status do banco continua "confirmado" | "concluido" | "cancelado"; check-in e início
 * só marcam horário, sem criar status novo.
 */
export function etapaAtendimento(registro: {
  status: string;
  checkedInAt: Date | string | null;
  startedAt: Date | string | null;
}): EtapaAtendimento {
  if (registro.status === "cancelado") return "cancelado";
  if (registro.status === "concluido") return "concluido";
  if (registro.startedAt) return "em_atendimento";
  if (registro.checkedInAt) return "checkin";
  return "aguardando";
}

export const rotuloEtapa: Record<EtapaAtendimento, string> = {
  aguardando: "Aguardando chegada",
  checkin: "Check-in feito",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/** "YYYY-MM-DD" de um timestamp real, no fuso da loja (pra exibir com formatarDataCurta). */
export function dataIsoFortaleza(data: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(data));
}

/** "19:31" no fuso da loja, a partir de um timestamp real do banco. */
export function formatarHoraFortaleza(data: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(data));
}
