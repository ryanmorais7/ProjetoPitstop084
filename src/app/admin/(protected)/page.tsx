import Link from "next/link";
import { formatarDataCurta, hojeIso, horaAtualFortaleza } from "@/lib/agenda";
import { agendamentosDoDia, descreverServicos, planosAtivosPorCliente, whatsappDoCliente } from "@/lib/adminDados";
import { statusOperacional } from "@/lib/pitpass";
import ClienteBadge from "@/components/admin/ClienteBadge";
import AgendamentoCard, {
  nomePlanoDoAgendamento,
  ProximidadeChip,
} from "@/components/admin/AgendamentoCard";

export default async function VisaoGeralPage() {
  const hoje = hojeIso();
  const horaAgora = horaAtualFortaleza();
  const doDia = await agendamentosDoDia(hoje);
  const planosAtivos = await planosAtivosPorCliente(doDia.map((r) => r.clienteId));

  const porStatus = (status: string) => doDia.filter((r) => statusOperacional(r, hoje) === status);
  const aguardando = porStatus("aguardando");
  const checkin = porStatus("checkin");
  const emAtendimento = porStatus("em_atendimento");
  const concluidos = porStatus("concluido");
  // próximo cliente = primeiro de hoje que ainda não chegou (inclui quem está atrasado)
  const proximo = aguardando[0] ?? null;
  const emAndamento = [...emAtendimento, ...checkin];

  const numeros = [
    { rotulo: "Agendamentos de hoje", valor: doDia.length, href: "/admin/agendamentos?f=hoje" },
    { rotulo: "Aguardando chegada", valor: aguardando.length, href: "/admin/agendamentos?f=hoje" },
    { rotulo: "Em atendimento", valor: emAtendimento.length, href: "/admin/agendamentos?f=atendimento" },
    { rotulo: "Concluídos hoje", valor: concluidos.length, href: "/admin/agendamentos?f=hoje" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="adm-rotulo">Hoje</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatarDataCurta(hoje)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pitpass" className="adm-btn adm-btn-primario">
            Ler PitPass
          </Link>
          <Link href="/admin/agenda" className="adm-btn">
            Ver agenda
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numeros.map((n) => (
          <Link key={n.rotulo} href={n.href} className="adm-card p-4 transition-colors hover:border-black/25 sm:p-5">
            <p className="font-heading text-4xl font-bold leading-none tabular-nums">{n.valor}</p>
            <p className="adm-rotulo mt-3">{n.rotulo}</p>
          </Link>
        ))}
      </div>

      <section aria-labelledby="proximo-cliente">
        <h2 id="proximo-cliente" className="adm-rotulo mb-3">
          Próximo cliente
        </h2>
        {proximo ? (
          <div className="adm-card border-gold/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-heading text-5xl font-bold leading-none tabular-nums">{proximo.horario}</p>
              <ProximidadeChip registro={proximo} hoje={hoje} horaAgora={horaAgora} />
            </div>
            <p className="mt-4 font-heading text-2xl font-bold leading-tight">{proximo.nome}</p>
            <p className="mt-1 text-sm text-adm-muted">
              {proximo.carro}
              <span className="mx-1.5 text-black/25">•</span>
              <span className="font-mono font-medium text-adm-ink">{proximo.placa ?? "sem placa"}</span>
            </p>
            <p className="mt-1 text-sm font-medium">{descreverServicos(proximo)}</p>
            <ClienteBadge
              nomePlano={nomePlanoDoAgendamento(proximo, proximo.clienteId ? planosAtivos.get(proximo.clienteId) : null)}
              className="mt-3"
            />
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/admin/atendimentos/${proximo.id}`} className="adm-btn adm-btn-primario">
                Abrir
              </Link>
              <a href={whatsappDoCliente(proximo)} target="_blank" rel="noopener noreferrer" className="adm-btn">
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <Vazio>
            {doDia.length === 0 ? "Nenhum agendamento hoje." : "Ninguém aguardando chegada agora."}
          </Vazio>
        )}
      </section>

      <section aria-labelledby="em-andamento">
        <h2 id="em-andamento" className="adm-rotulo mb-3">
          Na loja agora · {emAndamento.length}
        </h2>
        {emAndamento.length > 0 ? (
          <div className="space-y-3">
            {emAndamento.map((r) => (
              <AgendamentoCard
                key={r.id}
                registro={r}
                planoAtivoDoCliente={r.clienteId ? planosAtivos.get(r.clienteId) : null}
                hoje={hoje}
                horaAgora={horaAgora}
              />
            ))}
          </div>
        ) : (
          <Vazio>Nenhum veículo em atendimento ou com check-in feito.</Vazio>
        )}
      </section>

      {aguardando.length > 1 && (
        <section aria-labelledby="aguardando">
          <h2 id="aguardando" className="adm-rotulo mb-3">
            Depois dele · {aguardando.length - 1}
          </h2>
          <div className="space-y-3">
            {aguardando.slice(1).map((r) => (
              <AgendamentoCard
                key={r.id}
                registro={r}
                planoAtivoDoCliente={r.clienteId ? planosAtivos.get(r.clienteId) : null}
                hoje={hoje}
                horaAgora={horaAgora}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-black/15 px-5 py-8 text-center text-sm text-adm-muted">
      {children}
    </p>
  );
}
