import type { Metadata } from "next";
import Link from "next/link";
import { buscarAgendamentoPorToken } from "@/lib/checkin";
import BrandLogo from "@/components/BrandLogo";
import CarSparkMark from "@/components/CarSparkMark";

export const metadata: Metadata = {
  title: "PitPass · PitStop084",
  robots: { index: false, follow: false },
};

/**
 * Página pública do QR do PitPass. Qualquer pessoa pode abrir a URL, então mostra só o mínimo:
 * se o PitPass é válido e o código P084. Nada de nome, telefone, placa ou endereço, e nenhuma
 * ação: check-in, início e conclusão ficam só no /admin (com sessão).
 */
export default async function CheckinPublicoPage({ params }: PageProps<"/checkin/[token]">) {
  const { token } = await params;
  const registro = await buscarAgendamentoPorToken(token);

  const situacao = !registro
    ? "invalido"
    : registro.status === "cancelado"
    ? "cancelado"
    : registro.status === "concluido"
    ? "utilizado"
    : "valido";

  const titulo = {
    valido: "PitPass válido",
    utilizado: "PitPass já utilizado",
    cancelado: "PitPass cancelado",
    invalido: "PitPass não encontrado",
  }[situacao];

  const instrucao = {
    valido: "Apresente este PitPass na recepção ao chegar.",
    utilizado: "Este atendimento já foi concluído. Obrigado por escolher a PitStop084.",
    cancelado: "Este agendamento foi cancelado. Fale com a PitStop para marcar um novo horário.",
    invalido: "Confira o link ou fale com a PitStop pelo WhatsApp.",
  }[situacao];

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="pitpass-entra w-full max-w-xs text-center">
        <div className="pitpass-cartao rounded-xl border border-white/10 px-6 py-8">
          <CarSparkMark className={`mx-auto h-9 w-9 ${situacao === "valido" ? "text-white" : "text-text-secondary"}`} />
          <p
            className={`mt-5 font-heading text-xl font-bold tracking-[0.12em] ${
              situacao === "valido" ? "text-gold" : "text-text-primary"
            }`}
          >
            {situacao === "valido" && "✓ "}
            {titulo}
          </p>
          {registro?.codigo && situacao !== "invalido" && (
            <p className="mt-3 font-mono text-2xl font-semibold tracking-[0.08em] text-white">{registro.codigo}</p>
          )}
          <p className="mt-4 text-sm text-text-secondary">{instrucao}</p>
        </div>

        <Link href="/" className="mt-8 inline-flex justify-center opacity-90 transition hover:opacity-100">
          <BrandLogo className="text-sm" />
        </Link>
      </div>
    </main>
  );
}
