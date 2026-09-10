export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-heading font-bold tracking-wide ${className}`}>
      Pitstop 084 <span className="text-gold">⚡</span>
    </span>
  );
}
