import Bolt from "./Bolt";

/**
 * Ícone isolado da marca (o mesmo raio usado no logo, nos CTAs e nas etiquetas de seção) —
 * ponto único de verdade pra manter o símbolo consistente em qualquer tamanho/contexto.
 */
export default function BrandMark({ className = "h-5 w-5" }: { className?: string }) {
  return <Bolt className={className} />;
}
