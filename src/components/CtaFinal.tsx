import Link from "next/link";
import Logo from "./Logo";

export default function CtaFinal() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gold/30 bg-panel p-10 text-center">
        <Logo className="text-xl" />
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl">
          Seu carro merece hora marcada
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Assine um plano e deixe a manutenção do seu carro no automático, ou agende um serviço
          avulso quando precisar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="#assinatura"
            className="rounded-full bg-gold px-6 py-3 font-heading font-semibold text-asphalt transition hover:brightness-110"
          >
            Quero assinar
          </Link>
          <Link
            href="#avulsos"
            className="rounded-full border border-white/15 px-6 py-3 font-heading font-semibold text-text-primary transition hover:border-cyan hover:text-cyan"
          >
            Ver serviços avulsos
          </Link>
        </div>
      </div>
    </section>
  );
}
