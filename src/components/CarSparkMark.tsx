/** Isotipo da Pitstop 084: carro + dois brilhos. Símbolo do PitPass (não usa o raio). */
export default function CarSparkMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 17.5c-1.4 0-2.5-1-2.5-2.3v-1.9c0-.7.4-1.4 1-1.8l1.9-1.3 1.7-3.4C8.6 5.4 10 4.5 11.6 4.5h5.3c1.5 0 2.9.8 3.5 2.1l1.7 3.5 1.9 1.3c.6.4 1 1.1 1 1.8v1.9c0 1.3-1.1 2.3-2.5 2.3H6Z"
        fill="currentColor"
      />
      <path
        d="M7.5 11.3h13m-9.6-5.8-2.1 4.3M18.2 5.5l2.1 4.3"
        stroke="var(--color-asphalt, #0a0a0b)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="8.7" cy="15.1" r="1.4" fill="var(--color-asphalt, #0a0a0b)" />
      <circle cx="23.3" cy="15.1" r="1.4" fill="var(--color-asphalt, #0a0a0b)" />
      <path
        d="M26.3 2.6c.3 1.6 1 2.3 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.3 2.3-1 2.6-2.6Z"
        fill="var(--color-gold, #e8ab1f)"
      />
      <path
        d="M30 8.4c.2 1 .6 1.4 1.6 1.6-1 .2-1.4.6-1.6 1.6-.2-1-.6-1.4-1.6-1.6 1-.2 1.4-.6 1.6-1.6Z"
        fill="var(--color-gold, #e8ab1f)"
      />
    </svg>
  );
}
