import { ReactNode } from "react";
import Link from "next/link";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { logout } from "../actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await exigirSessaoAdmin();

  return (
    <div className="min-h-screen bg-asphalt text-text-primary">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-heading text-sm font-bold uppercase tracking-widest">
              Pitstop 084 · Admin
            </span>
            <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-wide text-text-secondary">
              <Link href="/admin/agendamentos" className="transition hover:text-gold">
                Agendamentos
              </Link>
              <Link href="/admin/agenda" className="transition hover:text-gold">
                Agenda
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:text-gold"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
