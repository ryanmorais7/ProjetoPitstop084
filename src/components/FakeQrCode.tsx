function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export default function FakeQrCode({ seed = 42, size = 9 }: { seed?: number; size?: number }) {
  const random = seededRandom(seed);
  const cells = Array.from({ length: size * size }, () => random() > 0.45);

  return (
    <div className="rounded-xl bg-text-primary p-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-40 w-40">
        {cells.map((filled, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const isCorner =
            (x < 2 && y < 2) || (x < 2 && y > size - 3) || (x > size - 3 && y < 2);
          return filled || isCorner ? (
            <rect key={i} x={x} y={y} width={1} height={1} fill="#0c0e10" />
          ) : null;
        })}
      </svg>
    </div>
  );
}
