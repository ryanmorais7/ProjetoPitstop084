import BrandMark from "./BrandMark";

/** Versão compacta da marca — só o wordmark + raio, sem subtítulo. Pra navbar mobile e espaços apertados. */
export default function BrandLogoCompact({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-heading font-bold leading-none ${className}`}>
      <span className="inline-block -skew-x-6 text-text-primary">PitStop</span>
      <span className="inline-block -skew-x-6 text-gold">084</span>
      <BrandMark className="h-[0.8em] w-[0.8em] shrink-0 text-gold" />
    </span>
  );
}
