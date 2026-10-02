import qrcode from "qrcode-generator";

const MARGEM = 2; // zona de silêncio (em módulos) exigida pelos leitores

/** Monta um único <path> com todos os módulos escuros: SVG leve, nítido em qualquer tamanho. */
function caminhoQr(conteudo: string): { tamanho: number; d: string } | null {
  try {
    const qr = qrcode(0, "M");
    qr.addData(conteudo);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let linha = 0; linha < n; linha++) {
      for (let coluna = 0; coluna < n; coluna++) {
        if (qr.isDark(linha, coluna)) d += `M${coluna + MARGEM} ${linha + MARGEM}h1v1h-1z`;
      }
    }
    return { tamanho: n + MARGEM * 2, d };
  } catch {
    return null;
  }
}

/**
 * QR Code real (não decorativo). Fundo claro por legibilidade: leitores de câmera lidam mal
 * com QR invertido. Se a geração falhar, não renderiza nada e o código P084 vira o fallback.
 */
export default function QrCode({
  conteudo,
  className = "",
  titulo = "QR Code do PitPass",
}: {
  conteudo: string;
  className?: string;
  titulo?: string;
}) {
  const qr = caminhoQr(conteudo);
  if (!qr) return null;

  return (
    <svg
      viewBox={`0 0 ${qr.tamanho} ${qr.tamanho}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={titulo}
      className={className}
    >
      <rect width={qr.tamanho} height={qr.tamanho} fill="#ffffff" />
      <path d={qr.d} fill="#0a0a0b" />
    </svg>
  );
}
