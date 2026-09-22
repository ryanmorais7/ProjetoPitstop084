import BrandLogoCompact from "./BrandLogoCompact";

/** Versão completa da marca — wordmark + raio + "Premium Car Studio". Pra header desktop, footer e CTA final. */
export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <BrandLogoCompact />
      <span className="mt-1 font-mono text-[0.5em] font-medium uppercase tracking-[0.35em] text-text-secondary">
        Premium Car Studio
      </span>
    </span>
  );
}
