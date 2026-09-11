import Link from "next/link";
import Logo from "./Logo";

const links = [
  { href: "#servicos", label: "Serviços" },
  { href: "#planos", label: "Planos" },
  { href: "#historia", label: "A Pitstop" },
  { href: "#instagram", label: "Instagram" },
  { href: "#agendamento", label: "Agendamento" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 pt-10 pb-28 md:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo className="text-base" />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
