export type AlvoNecessidade =
  | { tipo: "avulso"; avulsoId: string }
  | { tipo: "plano" }
  | { tipo: "whatsapp"; mensagem: string };

export interface Necessidade {
  id: string;
  titulo: string;
  descricao: string;
  alvo: AlvoNecessidade;
}

export const necessidades: Necessidade[] = [
  {
    id: "brilho",
    titulo: "Recuperar o brilho",
    descricao: "Hidratação e acabamento pra devolver presença ao carro.",
    alvo: { tipo: "avulso", avulsoId: "lavagem-detalhada" },
  },
  {
    id: "limpeza",
    titulo: "Deixar tudo limpo",
    descricao: "Uma lavagem externa completa, rápida e bem feita.",
    alvo: { tipo: "avulso", avulsoId: "lavagem-simples" },
  },
  {
    id: "interior",
    titulo: "Cuidar do interior",
    descricao: "Bancos, carpetes e ar-condicionado, ponta a ponta.",
    alvo: { tipo: "avulso", avulsoId: "higienizacao-interna" },
  },
  {
    id: "protecao",
    titulo: "Proteger a pintura",
    descricao: "Uma camada a mais entre o seu carro e o dia a dia.",
    alvo: { tipo: "avulso", avulsoId: "polimento" },
  },
  {
    id: "completo",
    titulo: "Lavagem completa, sempre",
    descricao: "Cuidado semanal, sem precisar lembrar de agendar.",
    alvo: { tipo: "plano" },
  },
  {
    id: "duvida",
    titulo: "Não sei qual escolher",
    descricao: "A gente te ajuda a decidir pelo WhatsApp.",
    alvo: { tipo: "whatsapp", mensagem: "Olá! Não sei qual serviço da Pitstop 084 combina com meu carro, pode me ajudar?" },
  },
];
