"use client";

import { depoimentos } from "@/lib/data";
import { scrollToId } from "@/lib/scroll";
import Logo from "./Logo";

const links = [
  { id: "sobre", label: "Sobre" },
  { id: "servicos", label: "Serviços" },
  { id: "planos", label: "Planos" },
  { id: "agendamento", label: "Agendamento" },
];

// Placeholder até a @ real ser definida.
const INSTAGRAM_URL = "https://instagram.com/";

const depoimento = depoimentos[0];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 pt-10 pb-28 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <p className="mx-auto max-w-md text-center text-sm text-text-secondary sm:mx-0 sm:text-left">
          <span className="text-gold">&ldquo;</span>
          {depoimento.frase} <span className="text-text-secondary/70">— {depoimento.nome}</span>
        </p>

        <div className="mt-8 flex flex-col items-center gap-6 border-t border-white/10 pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo className="text-base" />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToId(link.id)}
                className="transition hover:text-text-primary"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-center text-xs text-text-secondary sm:flex-row sm:justify-between sm:text-left">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-gold"
          >
            Seguir a Pitstop no Instagram
          </a>
          <span>Endereço e horário de funcionamento a confirmar.</span>
        </div>
      </div>
    </footer>
  );
}
