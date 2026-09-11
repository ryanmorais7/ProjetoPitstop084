import Link from "next/link";
import Logo from "./Logo";
import Reveal from "./Reveal";

export default function CtaFinal() {
  return (
    <section className="bg-surface px-6 py-24">
      <Reveal className="mx-auto max-w-3xl rounded-sm border border-gold/25 bg-panel p-10 text-center">
        <Logo className="text-xl" />
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl">
          Seu carro merece hora marcada.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Assine um plano e deixe a manutenção do seu carro no automático, ou agende um serviço
          avulso quando precisar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="#agendamento"
            className="rounded-sm bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            Agendar agora
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
