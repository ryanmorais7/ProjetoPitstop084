import Link from "next/link";
import { hojeIso, horaAtualFortaleza } from "@/lib/agenda";
import {
  agendamentosDoDia,
  FiltroAgendamento,
  filtrosAgendamento,
  filtrosTipo,
  FiltroTipo,
  listarAgendamentos,
  planosAtivosPorCliente,
} from "@/lib/adminDados";
import { statusOperacional } from "@/lib/pitpass";
import AgendamentoCard from "@/components/admin/AgendamentoCard";

const vazioPorFiltro: Record<FiltroAgendamento, string> = {
  hoje: "Nenhum agendamento hoje.",
  proximos: "Nenhum agendamento pela frente.",
  atendimento: "Nenhum veículo em atendimento agora.",
  concluidos: "Nenhum atendimento concluído ainda.",
  cancelados: "Nenhum agendamento cancelado.",
  todos: "Nenhum agendamento por aqui.",
};

export default async function AgendamentosPage({ searchParams }: PageProps<"/admin/agendamentos">) {
  const params = await searchParams;
  const filtro = (filtrosAgendamento.find((f) => f.id === params.f)?.id ?? "hoje") as FiltroAgendamento;
  const tipo = (filtrosTipo.find((t) => t.id === params.t)?.id ?? "todos") as FiltroTipo;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  // buscar é procurar em tudo: com termo, o filtro de período não esconde resultado
  const filtroEfetivo: FiltroAgendamento = q ? "todos" : filtro;

  const hoje = hojeIso();
  const horaAgora = horaAtualFortaleza();
  const [registros, doDia] = await Promise.all([
    listarAgendamentos({ filtro: filtroEfetivo, tipo, q }),
    agendamentosDoDia(hoje),
  ]);
  const planosAtivos = await planosAtivosPorCliente(registros.map((r) => r.clienteId));

  const contar = (status: string) => doDia.filter((r) => statusOperacional(r, hoje) === status).length;
  const resumo = [
    { rotulo: "Hoje", valor: doDia.length },
    { rotulo: "Aguardando", valor: contar("aguardando") },
    { rotulo: "Em atendimento", valor: contar("em_atendimento") },
    { rotulo: "Concluídos", valor: contar("concluido") },
  ];

  const link = (f: FiltroAgendamento, t: FiltroTipo) => {
    const p = new URLSearchParams();
    if (f !== "hoje") p.set("f", f);
    if (t !== "todos") p.set("t", t);
    const qs = p.toString();
    return qs ? `/admin/agendamentos?${qs}` : "/admin/agendamentos";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {resumo.map((r) => (
            <div key={r.rotulo} className="flex items-baseline gap-2">
              <dd className="font-heading text-2xl font-bold tabular-nums">{r.valor}</dd>
              <dt className="adm-rotulo">{r.rotulo}</dt>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/agendamentos/novo" className="adm-btn adm-btn-primario">
            + Novo agendamento
          </Link>
          <Link href="/admin/pitpass" className="adm-btn">
            Ler PitPass
          </Link>
        </div>
      </div>

      <form method="GET" action="/admin/agendamentos" role="search" className="mt-6 flex gap-2">
        <label htmlFor="busca-agendamentos" className="sr-only">
          Buscar agendamentos
        </label>
        <input
          id="busca-agendamentos"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar nome, placa, WhatsApp ou P084"
          className="campo"
        />
        {tipo !== "todos" && <input type="hidden" name="t" value={tipo} />}
        <button type="submit" className="adm-btn shrink-0">
          Buscar
        </button>
      </form>

      <nav aria-label="Período" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {filtrosAgendamento.map((f) => {
          const selecionado = !q && f.id === filtro;
          return (
            <Link
              key={f.id}
              href={link(f.id, tipo)}
              aria-current={selecionado ? "true" : undefined}
              className={`flex min-h-10 shrink-0 items-center rounded-full border px-4 font-heading text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                selecionado
                  ? "border-adm-ink bg-adm-ink text-white"
                  : "border-black/15 bg-white text-adm-muted hover:border-black/40 hover:text-adm-ink"
              }`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Tipo de cliente" className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {filtrosTipo.map((t) => {
          const selecionado = t.id === tipo;
          const p = new URLSearchParams();
          if (q) p.set("q", q);
          else if (filtro !== "hoje") p.set("f", filtro);
          if (t.id !== "todos") p.set("t", t.id);
          const qs = p.toString();
          return (
            <Link
              key={t.id}
              href={qs ? `/admin/agendamentos?${qs}` : "/admin/agendamentos"}
              aria-current={selecionado ? "true" : undefined}
              className={`flex min-h-9 shrink-0 items-center rounded-full px-3 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
                selecionado ? "bg-gold/25 text-adm-ink" : "text-adm-muted hover:bg-black/[0.05] hover:text-adm-ink"
              }`}
            >
              {t.rotulo}
            </Link>
          );
        })}
      </nav>

      {q && (
        <p className="mt-5 text-sm text-adm-muted">
          {registros.length} resultado{registros.length === 1 ? "" : "s"} para “{q}” em todos os períodos.{" "}
          <Link href={link(filtro, tipo)} className="font-medium text-adm-ink underline underline-offset-4">
            Limpar busca
          </Link>
        </p>
      )}

      {registros.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-black/15 px-5 py-12 text-center">
          <p className="font-heading text-lg font-bold">{q ? "Nenhum agendamento encontrado." : vazioPorFiltro[filtro]}</p>
          <p className="mt-1 text-sm text-adm-muted">
            {q ? "Confira o termo ou tente a placa, o WhatsApp ou o código P084." : "Quando houver, eles aparecem aqui."}
          </p>
          <Link href="/admin/agendamentos/novo" className="adm-btn mt-5">
            + Novo agendamento
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {registros.map((r) => (
            <AgendamentoCard
              key={r.id}
              registro={r}
              planoAtivoDoCliente={r.clienteId ? planosAtivos.get(r.clienteId) : null}
              hoje={hoje}
              horaAgora={horaAgora}
            />
          ))}
        </div>
      )}
    </div>
  );
}
