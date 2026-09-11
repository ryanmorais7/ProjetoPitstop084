import Link from "next/link";
import Logo from "./Logo";

const links = [
  { href: "#servicos", label: "Serviços" },
  { href: "#experiencia", label: "Experiência" },
  { href: "#planos", label: "Planos" },
  { href: "#historia", label: "História" },
];

export default function Header() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-asphalt/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo className="text-base" />
        <nav className="hidden gap-8 text-sm text-text-secondary md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="#agendamento"
          className="rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold tracking-wide text-asphalt transition hover:brightness-110"
        >
          Agendar
        </Link>
      </div>
    </header>
  );
}
