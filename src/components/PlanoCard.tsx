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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col rounded-sm border p-6 text-left transition ${
        selecionado
          ? "border-gold bg-panel"
          : plano.destaque
          ? "border-gold/40 bg-panel hover:border-gold"
          : "border-white/10 bg-panel hover:border-white/25"
      }`}
    >
      {plano.destaque && (
        <span className="mb-3 w-fit rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-asphalt">
          Mais exclusivo
        </span>
      )}
      <h3 className="font-heading text-xl font-bold">{plano.nome}</h3>
      <p className="mt-1 font-mono text-sm text-gold">{formatarPreco(plano.precoMensal)}/mês</p>
      <p className="mt-2 text-sm text-text-secondary">{plano.descricao}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {plano.beneficios.map((item) => (
          <li key={item} className="flex items-start gap-2 text-text-primary">
            <span className="mt-0.5 text-gold">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <span
        className={`mt-6 flex items-center gap-1 font-mono text-xs uppercase tracking-wide ${
          plano.destaque ? "text-gold" : "text-text-secondary"
        }`}
      >
        Quero ser {plano.nome} →
      </span>
    </button>
  );
}
