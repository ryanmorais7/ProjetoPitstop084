"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/admin", rotulo: "Visão Geral", icone: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/agenda", rotulo: "Agenda", icone: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" },
  { href: "/admin/agendamentos", rotulo: "Agendamentos", icone: "M5 6h14M5 12h14M5 18h9" },
  { href: "/admin/clientes", rotulo: "Clientes", icone: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6" },
  { href: "/admin/pitpass", rotulo: "PitPass", icone: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" },
  { href: "/admin/servicos", rotulo: "Serviços", icone: "M4 7h16M4 12h16M4 17h16M8 5v4M15 10v4M11 15v4" },
  { href: "/admin/configuracoes", rotulo: "Configurações", icone: "M12 15a3 3 0 100-6 3 3 0 000 6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" },
];

/** Título do cabeçalho a partir da rota (a navegação fica só na sidebar). */
function tituloDaRota(caminho: string): string {
  if (caminho === "/admin") return "Visão Geral";
  if (caminho.startsWith("/admin/agendamentos/novo")) return "Novo agendamento";
  if (caminho.startsWith("/admin/atendimentos")) return "Ficha do atendimento";
  if (caminho.startsWith("/admin/busca")) return "Busca";
  if (caminho.startsWith("/admin/clientes/novo")) return "Novo cliente";
  if (/^\/admin\/clientes\/\d+\/agendar/.test(caminho)) return "Novo agendamento";
  if (/^\/admin\/clientes\/\d+/.test(caminho)) return "Ficha do cliente";
  return itens.find((i) => ativo(caminho, i.href))?.rotulo ?? "Admin";
}

function ativo(caminho: string, href: string): boolean {
  if (href === "/admin") return caminho === "/admin";
  if (href === "/admin/agendamentos" && caminho.startsWith("/admin/atendimentos")) return true;
  // "/admin/agenda" não pode acender em "/admin/agendamentos"
  return caminho === href || caminho.startsWith(href + "/");
}

type Aviso = { id: number; texto: string; tipo: "ok" | "erro" };
const AvisoContext = createContext<(texto: string, tipo?: Aviso["tipo"]) => void>(() => {});

/** Feedback curto de uma ação ("Check-in realizado"). Substitui alert() nativo. */
export function useAviso() {
  return useContext(AvisoContext);
}

function Icone({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Navegacao({ caminho, sair, aoNavegar }: { caminho: string; sair: () => Promise<void>; aoNavegar?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <p className="font-heading text-lg font-bold leading-none tracking-[0.08em]">
          PITSTOP<span className="text-gold-ink">084</span>
        </p>
        <p className="adm-rotulo mt-1.5">Admin</p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {itens.map((item) => {
          const selecionado = ativo(caminho, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={aoNavegar}
              aria-current={selecionado ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                selecionado ? "bg-gold/20 font-semibold text-adm-ink" : "text-adm-muted hover:bg-black/[0.04] hover:text-adm-ink"
              }`}
            >
              <Icone d={item.icone} />
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-adm-line px-3 py-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-adm-muted transition-colors hover:bg-black/[0.04] hover:text-adm-ink"
        >
          <Icone d="M10 6l-6 6 6 6M4 12h16" />
          Voltar para o site
        </Link>
        <form action={sair}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-adm-muted transition-colors hover:bg-black/[0.04] hover:text-adm-ink"
          >
            <Icone d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h9" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminShell({ children, sair }: { children: ReactNode; sair: () => Promise<void> }) {
  const caminho = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avisar = useCallback((texto: string, tipo: Aviso["tipo"] = "ok") => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setAviso({ id: Date.now(), texto, tipo });
    temporizador.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [menuAberto]);

  return (
    <AvisoContext.Provider value={avisar}>
      <div className="admin lg:flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-adm-line bg-white lg:block">
          <Navegacao caminho={caminho} sair={sair} />
        </aside>

        {menuAberto && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuAberto(false)}
              className="absolute inset-0 cursor-default bg-black/40"
              style={{ animation: "preco-fade 0.2s ease-out" }}
            />
            <div className="gaveta-esquerda absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] bg-white shadow-xl">
              <Navegacao caminho={caminho} sair={sair} aoNavegar={() => setMenuAberto(false)} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-adm-line bg-white/95 px-4 backdrop-blur lg:px-8">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-adm-ink hover:bg-black/[0.04] lg:hidden"
            >
              <Icone d="M4 7h16M4 12h16M4 17h16" />
            </button>
            <h1 className="min-w-0 truncate font-heading text-lg font-bold tracking-wide">{tituloDaRota(caminho)}</h1>

            <form action="/admin/busca" method="GET" role="search" className="ml-auto hidden w-full max-w-sm md:block">
              <label className="sr-only" htmlFor="busca-global">
                Buscar no admin
              </label>
              <input
                id="busca-global"
                type="search"
                name="q"
                placeholder="Buscar nome, WhatsApp, placa, P084 ou C084"
                className="campo text-sm"
              />
            </form>
            <Link
              href="/admin/busca"
              aria-label="Buscar"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-adm-ink hover:bg-black/[0.04] md:hidden"
            >
              <Icone d="M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4" />
            </Link>
            <Link href="/admin/agendamentos/novo" className="adm-btn adm-btn-primario shrink-0">
              <span aria-hidden="true">+</span>
              <span className="hidden sm:inline">Novo agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>

        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
          {aviso && (
            <p
              key={aviso.id}
              className={`passo-entra pointer-events-auto rounded-lg px-5 py-3 font-heading text-sm font-bold tracking-[0.1em] shadow-lg ${
                aviso.tipo === "erro" ? "bg-[#b42318] text-white" : "bg-adm-ink text-white"
              }`}
            >
              {aviso.tipo === "ok" && <span className="mr-2 text-gold">✓</span>}
              {aviso.texto}
            </p>
          )}
        </div>
      </div>
    </AvisoContext.Provider>
  );
}
