export default function Sobre() {
  return (
    <section id="sobre" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Nossa história</p>
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Sobre a Pitstop 084</h2>
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-panel p-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-gold">
            Texto de exemplo, substituir pelo conteúdo real do cliente
          </p>
          <p className="text-text-secondary">
            A Pitstop 084 nasceu da vontade de tratar o carro do jeito que ele merece: com hora
            marcada, cuidado técnico e constância. Começamos atendendo bairro por bairro e hoje
            reunimos uma equipe treinada para lavagem detalhada, manutenção semanal e cuidados que
            vão do chassis à parte interna do veículo. Nosso compromisso é simples: menos fila,
            mais qualidade.
          </p>
        </div>
      </div>
    </section>
  );
}
