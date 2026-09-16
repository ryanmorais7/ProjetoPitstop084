import { Plano, VehicleSize } from "@/lib/data";
import { formatarPreco } from "@/lib/format";

const estilosPorPlano: Record<
  Plano["id"],
  { card: string; nome: string; preco: string; cta: string; check: string }
> = {
  black: {
    card: "border border-white/15 bg-asphalt",
    nome: "text-white",
    preco: "text-white",
    cta: "bg-gold text-asphalt hover:brightness-110",
    check: "text-gold",
  },
  gold: {
    card: "border-2 border-gold bg-panel",
    nome: "text-gold",
    preco: "text-gold",
    cta: "bg-gold text-asphalt hover:brightness-110",
    check: "text-gold",
  },
  diamante: {
    card: "border border-black/10 bg-light",
    nome: "text-light-text",
    preco: "text-light-text",
    cta: "bg-light-text text-light hover:opacity-90",
    check: "text-gold",
  },
};

export default function PlanoCard({
  plano,
  porteVeiculo,
  onClick,
}: {
  plano: Plano;
  porteVeiculo: VehicleSize;
  onClick?: () => void;
}) {
  const estilo = estilosPorPlano[plano.id];
  const preco = plano.precos[porteVeiculo];
  const textoSecundario = plano.id === "diamante" ? "text-light-text-secondary" : "text-text-secondary";

  return (
    <div className={`relative flex h-full flex-col rounded-sm p-6 ${estilo.card}`}>
      {plano.badge && (
        <span className="mb-3 w-fit rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-asphalt">
          {plano.badge}
        </span>
      )}
      <h3 className={`font-heading text-2xl font-bold ${estilo.nome}`}>{plano.nome}</h3>

      <p key={porteVeiculo} className={`preco-fade mt-3 font-mono font-bold ${estilo.preco}`}>
        <span className="text-3xl">{formatarPreco(preco)}</span>
        <span className={`ml-1 text-sm font-normal ${textoSecundario}`}>/mês</span>
      </p>
      <p className={`mt-3 text-sm ${textoSecundario}`}>{plano.headline}</p>

      <ul className="mt-5 space-y-2 text-sm">
        {plano.beneficios.map((item) => (
          <li
            key={item}
            className={`flex items-start gap-2 ${plano.id === "diamante" ? "text-light-text" : "text-white"}`}
          >
            <span className={`mt-0.5 ${estilo.check}`}>⚡</span>
            {item}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        className={`mt-6 flex items-center justify-center gap-1 rounded-sm py-3 font-heading text-xs font-bold uppercase tracking-wide transition ${estilo.cta}`}
      >
        {plano.cta}
      </button>
    </div>
  );
}
