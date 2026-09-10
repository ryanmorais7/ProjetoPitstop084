import { diferenciais } from "@/lib/data";

export default function Diferencial() {
  return (
    <section id="diferencial" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Diferencial</p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Lava jato comum x Pitstop 084
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-panel">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left font-heading text-sm uppercase text-text-secondary">
                  Aspecto
                </th>
                <th className="p-4 text-left font-heading text-sm uppercase text-text-secondary">
                  Lava jato comum
                </th>
                <th className="p-4 text-left font-heading text-sm uppercase text-gold">
                  Pitstop 084
                </th>
              </tr>
            </thead>
            <tbody>
              {diferenciais.map((linha, i) => (
                <tr key={linha.aspecto} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                  <td className="p-4 text-sm font-medium text-text-primary">{linha.aspecto}</td>
                  <td className="p-4 text-sm text-text-secondary">{linha.lavaJatoComum}</td>
                  <td className="p-4 text-sm text-cyan">{linha.pitstop084}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
