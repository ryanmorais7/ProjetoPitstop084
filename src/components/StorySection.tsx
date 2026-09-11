import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function StorySection() {
  return (
    <section id="historia" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Nossa história
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Por que a Pitstop existe?
          </h2>
        </Reveal>

        <Reveal delayMs={100}>
          <p className="mb-3 mt-10 font-mono text-xs uppercase tracking-widest text-gold">
            Texto de exemplo, substituir pelo conteúdo real do cliente
          </p>
          <p className="max-w-xl text-lg leading-relaxed text-text-secondary">
            A Pitstop nasceu da vontade de tratar o carro do jeito que ele merece: com hora
            marcada, cuidado técnico e constância. Começamos atendendo bairro por bairro e hoje
            reunimos uma equipe treinada pra cuidar de cada detalhe, da lavagem ao acabamento.
            Nosso compromisso é simples: menos fila, mais qualidade.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
