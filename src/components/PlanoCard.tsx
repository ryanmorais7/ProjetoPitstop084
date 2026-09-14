import { Plano } from "@/lib/data";
import { formatarPreco } from "@/lib/format";

export default function PlanoCard({ plano, onClick }: { plano: Plano; onClick?: () => void }) {
  const destaque = plano.destaque && plano.disponivel;
  const precoInicial = plano.categorias?.[0]?.precoMensal;

  return (
    <button
      type="button"
      onClick={plano.disponivel ? onClick : undefined}
      disabled={!plano.disponivel}
      style={
        destaque
          ? { background: "linear-gradient(160deg, #22190a 0%, #17181b 55%, #17181b 100%)" }
          : undefined
      }
      className={`relative flex h-full flex-col rounded-sm p-6 text-left transition ${
        destaque
          ? "border-2 border-gold shadow-[0_0_50px_-12px_rgba(232,171,31,0.45)]"
          : plano.disponivel
          ? "border border-white/10 bg-panel hover:border-white/30"
          : "border border-white/10 bg-panel opacity-60"
      }`}
    >
      {destaque && (
        <span className="mb-3 w-fit rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-asphalt">
          Mais exclusivo
        </span>
      )}
      <h3 className="font-heading text-xl font-bold text-white">{plano.nome}</h3>

      {plano.disponivel ? (
        <p className="mt-1 font-mono text-2xl font-bold text-gold">
          A partir de {formatarPreco(precoInicial ?? 0)}
          <span className="text-sm font-normal text-text-secondary">/mês</span>
        </p>
      ) : (
        <p className="mt-1 font-mono text-sm uppercase tracking-wide text-text-secondary">
          Em breve
        </p>
      )}

      <p className="mt-2 text-sm text-text-secondary">{plano.descricao}</p>

      {plano.disponivel && plano.beneficios && (
        <ul className="mt-4 space-y-2 text-sm">
          {plano.beneficios.slice(0, 4).map((item) => (
            <li key={item.titulo} className="flex items-start gap-2 text-white">
              <span className="mt-0.5 text-gold">✓</span>
              {item.titulo}
            </li>
          ))}
        </ul>
      )}

      <span
        className={`mt-6 flex items-center justify-center gap-1 rounded-sm py-3 font-heading text-xs font-bold uppercase tracking-wide ${
          !plano.disponivel
            ? "border border-white/10 text-text-secondary"
            : destaque
            ? "bg-gold text-asphalt"
            : "border border-gold text-gold"
        }`}
      >
        {plano.disponivel ? "Ver detalhes" : "Em breve"}
      </span>
    </button>
  );
}
