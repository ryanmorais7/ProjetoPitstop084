"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToId } from "@/lib/scroll";
import { useSelection } from "@/context/SelectionContext";
import BrandLogo from "./BrandLogo";
import BrandLogoCompact from "./BrandLogoCompact";
import BrandMark from "./BrandMark";

const links = [
  { id: "sobre", label: "Sobre" },
  { id: "servicos", label: "Ducha rápida" },
  { id: "planos", label: "Planos" },
  { id: "agendamento", label: "Agendamentos" },
];

export default function Header() {
  const { setTipoAtendimento } = useSelection();
  const pathname = usePathname();
  const naHome = pathname === "/";

  function souAssinante() {
    setTipoAtendimento("assinatura");
    scrollToId("agendamento");
  }

  const logo = (
    <>
      <span className="hidden sm:inline-flex">
        <BrandLogo className="text-base" />
      </span>
      <span className="sm:hidden">
        <BrandLogoCompact className="text-base" />
      </span>
    </>
  );

  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-asphalt/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {naHome ? (
          <button type="button" onClick={() => scrollToId("hero")} className="transition hover:opacity-80">
            {logo}
          </button>
        ) : (
          <Link href="/" className="transition hover:opacity-80">
            {logo}
          </Link>
        )}
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={souAssinante}
            className="hidden font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 transition hover:text-gold hover:underline lg:inline"
          >
            Sou assinante
          </button>
          <button
            type="button"
            onClick={() => scrollToId("agendamento")}
            className="flex items-center gap-1.5 rounded-sm bg-gold px-4 py-2.5 font-heading text-xs font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            <BrandMark className="h-3.5 w-3.5" />
            Agendar
          </button>
        </div>
      </div>
    </header>
  );
}
