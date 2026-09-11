export type AlvoNecessidade =
  | { tipo: "avulso"; avulsoId: string }
  | { tipo: "whatsapp"; mensagem: string };

export interface Necessidade {
  id: string;
  titulo: string;
  alvo: AlvoNecessidade;
}

export const necessidades: Necessidade[] = [
  { id: "brilho", titulo: "Brilho", alvo: { tipo: "avulso", avulsoId: "lavagem-detalhada" } },
  { id: "limpeza", titulo: "Limpeza", alvo: { tipo: "avulso", avulsoId: "lavagem-simples" } },
  { id: "interior", titulo: "Interior", alvo: { tipo: "avulso", avulsoId: "higienizacao-interna" } },
  { id: "protecao", titulo: "Proteção", alvo: { tipo: "avulso", avulsoId: "polimento" } },
];

export const necessidadeIndecisa: Necessidade = {
  id: "duvida",
  titulo: "Não sabe? Fale com a gente.",
  alvo: {
    tipo: "whatsapp",
    mensagem: "Olá! Não sei qual serviço da Pitstop 084 combina com meu carro, pode me ajudar?",
  },
};
