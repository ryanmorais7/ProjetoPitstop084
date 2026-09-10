import Link from "next/link";
import Logo from "./Logo";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#planos", label: "Planos" },
  { href: "#avulsos", label: "Avulsos" },
  { href: "#diferencial", label: "Diferencial" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-asphalt/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo className="text-lg" />
        <nav className="hidden gap-6 text-sm text-text-secondary md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="#assinatura"
          className="rounded-full bg-gold px-4 py-2 text-sm font-heading font-semibold text-asphalt transition hover:brightness-110"
        >
          Assinar
        </Link>
      </div>
    </header>
  );
}
