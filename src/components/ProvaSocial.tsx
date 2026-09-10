const depoimentos = [
  {
    nome: "Marcos A.",
    carro: "HB20 2022",
    frase: "Nunca mais lembrei de levar o carro pra lavar, chega limpo toda semana.",
  },
  {
    nome: "Juliana R.",
    carro: "Compass 2021",
    frase: "O plano Diamante deixou o interior impecável, parece carro novo.",
  },
  {
    nome: "Felipe S.",
    carro: "Onix 2023",
    frase: "Marcar horário e não pegar fila mudou completamente minha rotina.",
  },
];

export default function ProvaSocial() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">
            O que dizem
          </p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Quem já assina</h2>
          <p className="mx-auto mt-3 max-w-md font-mono text-xs uppercase tracking-widest text-gold">
            Depoimentos de exemplo, substituir por relatos reais de clientes
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {depoimentos.map((depoimento) => (
            <div
              key={depoimento.nome}
              className="rounded-2xl border border-white/10 bg-panel p-6"
            >
              <p className="text-text-primary">&ldquo;{depoimento.frase}&rdquo;</p>
              <p className="mt-4 text-sm text-text-secondary">
                <span className="text-text-primary">{depoimento.nome}</span> — {depoimento.carro}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
