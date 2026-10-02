"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToId } from "@/lib/scroll";
import { useSelection } from "@/context/SelectionContext";
import BrandLogo from "./BrandLogo";
import BrandLogoCompact from "./BrandLogoCompact";
import BrandMark from "./BrandMark";
import CarSparkMark from "./CarSparkMark";
import { abrirMeuPitPass } from "./MeuPitPass";

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
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    // header ganha fundo mais sólido e sombra leve depois que a página sai do topo
    const verificar = () => setRolou(window.scrollY > 24);
    const quadro = requestAnimationFrame(verificar); // página pode abrir já rolada (refresh, âncora)
    window.addEventListener("scroll", verificar, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", verificar);
    };
  }, []);

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
    <header
      className={`fixed top-0 z-40 w-full border-b backdrop-blur transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        rolou
          ? "border-white/10 bg-asphalt/95 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.9)]"
          : "border-white/5 bg-asphalt/80"
      }`}
    >
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
        <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex lg:gap-8">
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
          <button
            type="button"
            onClick={abrirMeuPitPass}
            className="flex items-center gap-1.5 text-text-primary transition hover:text-gold"
          >
            <CarSparkMark className="h-3.5 w-4" />
            Meu PitPass
          </button>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* mobile: acesso compacto, sem apertar o header */}
          <button
            type="button"
            onClick={abrirMeuPitPass}
            aria-label="Meu PitPass"
            className="flex items-center gap-1.5 rounded-sm border border-white/15 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-primary transition-colors hover:border-gold hover:text-gold md:hidden"
          >
            <CarSparkMark className="h-3.5 w-4" />
            <span className="hidden min-[400px]:inline">PitPass</span>
          </button>
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
