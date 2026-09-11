import { Plano } from "@/lib/data";
import { formatarPreco } from "@/lib/format";

export default function PlanoCard({
  plano,
  selecionado,
  onClick,
}: {
  plano: Plano;
  selecionado?: boolean;
  onClick?: () => void;
}) {
  const diamante = plano.destaque;

  return (
    <button
      type="button"
      onClick={onClick}
      style={
        diamante
          ? { background: "linear-gradient(160deg, #22190a 0%, #17181b 55%, #17181b 100%)" }
          : undefined
      }
      className={`relative flex h-full flex-col rounded-sm p-6 text-left transition ${
        diamante
          ? "border-2 border-gold shadow-[0_0_50px_-12px_rgba(232,171,31,0.45)]"
          : selecionado
          ? "border border-gold bg-panel"
          : "border border-white/10 bg-panel hover:border-white/30"
      }`}
    >
      {diamante && (
        <span className="mb-3 w-fit rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-asphalt">
          Mais exclusivo
        </span>
      )}
      <h3 className="font-heading text-xl font-bold text-white">{plano.nome}</h3>
      <p className={`mt-1 font-mono font-bold text-gold ${diamante ? "text-3xl" : "text-2xl"}`}>
        {formatarPreco(plano.precoMensal)}
        <span className="text-sm font-normal text-text-secondary">/mês</span>
      </p>
      <p className="mt-2 text-sm text-text-secondary">{plano.descricao}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {plano.beneficios.map((item) => (
          <li key={item} className="flex items-start gap-2 text-white">
            <span className="mt-0.5 text-gold">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <span
        className={`mt-6 flex items-center justify-center gap-1 rounded-sm py-3 font-heading text-xs font-bold uppercase tracking-wide ${
          diamante
            ? "bg-gold text-asphalt"
            : "border border-gold text-gold"
        }`}
      >
        Quero ser {plano.nome}
      </span>
    </button>
  );
}
