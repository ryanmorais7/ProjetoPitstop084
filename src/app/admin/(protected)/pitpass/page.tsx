import LeitorPitPass from "./LeitorPitPass";

export default async function LerPitPassPage({ searchParams }: PageProps<"/admin/pitpass">) {
  const { codigo } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">PitStop084 · PitPass</p>
      <h1 className="mt-1 font-heading text-2xl font-bold">Ler PitPass</h1>
      <p className="mt-1 mb-6 text-sm text-text-secondary">
        Leia o QR na chegada do cliente para abrir a ficha do atendimento.
      </p>
      <LeitorPitPass codigoInicial={typeof codigo === "string" ? codigo : ""} />
    </div>
  );
}
