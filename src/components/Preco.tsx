import { formatarPrecoPartes } from "@/lib/format";

/**
 * Preço em partes: "R$" pequeno + valor em algarismos tabulares. O tamanho e a cor vêm de
 * quem usa (className); a moeda acompanha em proporção.
 */
export default function Preco({ valor, className = "" }: { valor: number; className?: string }) {
  const partes = formatarPrecoPartes(valor);

  return (
    <span className={`preco inline-flex items-baseline whitespace-nowrap ${className}`}>
      <span className="preco-moeda">{partes.moeda}</span>
      {partes.valor}
    </span>
  );
}
