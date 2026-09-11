"use client";

import { scrollToId } from "@/lib/scroll";
import Logo from "./Logo";

const links = [
  { id: "sobre", label: "Sobre" },
  { id: "servicos", label: "Serviços" },
  { id: "planos", label: "Planos" },
];

export default function Header() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-asphalt/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo className="text-base" />
        <nav className="hidden gap-8 text-sm text-text-secondary md:flex">
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
        <button
          type="button"
          onClick={() => scrollToId("agendamento")}
          className="rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold tracking-wide text-asphalt transition hover:brightness-110"
        >
          ⚡ Agendar
        </button>
      </div>
    </header>
  );
}
