import { PlanoId } from "./data";

/**
 * Identidade visual do PitPass por nível. Fonte única pra landing, confirmação, "Meu PitPass" e admin.
 *
 * Regra de marca: amarelo = PitStop084 / Black / Gold. O azul frio é EXCLUSIVO do PitPass Diamante,
 * como "edição especial": aparece só em acentos (nome do plano, borda, labels, moldura do QR).
 * O fundo de todos os cartões continua preto/grafite.
 *
 * As cores em si ficam em CSS custom properties (globals.css, classes `.pitpass-tema-*`);
 * aqui só se escolhe o tema e os textos.
 */
export type TemaPitPass = "avulso" | "black" | "gold" | "diamante";

export interface DefinicaoTemaPitPass {
  /** Classe que aplica os tokens (--pp-accent, --pp-label, --pitpass-anel...) ao cartão. */
  classe: string;
  /** Classe do selo usado no admin (ClienteBadge e afins). */
  classeBadge: string;
}

export const pitpassTheme: Record<TemaPitPass, DefinicaoTemaPitPass> = {
  avulso: { classe: "pitpass-tema-avulso", classeBadge: "pitpass-badge-gold" },
  black: { classe: "pitpass-tema-black", classeBadge: "pitpass-badge-gold" },
  gold: { classe: "pitpass-tema-gold", classeBadge: "pitpass-badge-gold" },
  diamante: { classe: "pitpass-tema-diamante", classeBadge: "pitpass-badge-diamante" },
};

/** Tema a partir do plano do agendamento (null/ausente = Ducha avulsa). */
export function temaDoPlano(plano: PlanoId | string | null | undefined): TemaPitPass {
  if (plano === "black" || plano === "gold" || plano === "diamante") return plano;
  return "avulso";
}
