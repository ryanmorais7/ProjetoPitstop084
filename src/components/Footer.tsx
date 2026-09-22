"use client";

import { scrollToId } from "@/lib/scroll";
import BrandLogo from "./BrandLogo";

const links = [
  { id: "sobre", label: "Sobre" },
  { id: "servicos", label: "Serviços" },
  { id: "planos", label: "Planos" },
  { id: "agendamento", label: "Agendamento" },
];

const INSTAGRAM_URL = "https://www.instagram.com/pitstop084";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 pt-10 pb-28 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <BrandLogo className="items-center text-base sm:items-start" />
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

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-text-secondary sm:text-left">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-gold">
            Seguir a Pitstop no Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
