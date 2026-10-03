import LeitorPitPass from "./LeitorPitPass";

export default async function LerPitPassPage({ searchParams }: PageProps<"/admin/pitpass">) {
  const { codigo } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="font-heading text-2xl font-bold">Ler PitPass</h2>
      <p className="mt-1 mb-6 text-sm text-adm-muted">
        Leia o QR na chegada do cliente para abrir a ficha. Depois confirme a placa do veículo e faça o check-in.
      </p>
      <LeitorPitPass codigoInicial={typeof codigo === "string" ? codigo : ""} />
    </div>
  );
}
