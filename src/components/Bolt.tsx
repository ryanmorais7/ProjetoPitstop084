/** Raio da marca: mark geométrico, sem arredondamentos, pensado pra funcionar pequeno (label) e maior (logo/CTA). */
export default function Bolt({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.5 1.2 4.2 13.6h6.4L9 22.8l10.8-13.4h-6.6l1.3-8.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
