import type { ReactNode } from "react";
import { diaFechado, enderecoPitstop, horariosAgendamento, linkComoChegar, whatsappNumero } from "@/lib/data";
import { formatarTelefone } from "@/lib/format";
import { ADMIN_SEM_SENHA } from "@/lib/adminAuth";

const diasDaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Informações do negócio em modo leitura: o que a landing e a agenda usam hoje. */
export default function ConfiguracoesPage() {
  const diasAbertos = diasDaSemana.filter((_, i) => i !== diaFechado);

  return (
    <div className="max-w-3xl space-y-6">
      {ADMIN_SEM_SENHA && (
        <p role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#b42318]">
          O admin está aberto sem senha. Qualquer pessoa com o link vê os dados dos clientes. Religue a senha assim que
          possível.
        </p>
      )}

      <Bloco titulo="Negócio">
        <Linha rotulo="Nome">{enderecoPitstop.nome} · Premium Car Studio</Linha>
        <Linha rotulo="WhatsApp da loja">{formatarTelefone(whatsappNumero.replace(/^55/, ""))}</Linha>
        <Linha rotulo="Endereço">
          {enderecoPitstop.linha1}, {enderecoPitstop.linha2}, {enderecoPitstop.linha3}
          <a
            href={linkComoChegar}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 font-medium underline underline-offset-4"
          >
            Ver no mapa
          </a>
        </Linha>
      </Bloco>

      <Bloco titulo="Horários de atendimento">
        <Linha rotulo="Dias">
          {diasAbertos[0]} a {diasAbertos[diasAbertos.length - 1]} · fechado: {diasDaSemana[diaFechado]}
        </Linha>
        <Linha rotulo="Horários da agenda">
          <span className="flex flex-wrap gap-1.5">
            {horariosAgendamento.map((h) => (
              <span key={h} className="adm-chip adm-status-confirmado">
                {h}
              </span>
            ))}
          </span>
        </Linha>
        <Linha rotulo="Bloqueios pontuais">Feitos na Agenda, horário por horário.</Linha>
      </Bloco>

      <p className="text-sm text-adm-muted">
        Esses dados ainda são alterados no código (um único arquivo, usado pela landing e pelo admin).
      </p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="adm-rotulo mb-3">{titulo}</h2>
      <dl className="adm-card divide-y divide-adm-line">{children}</dl>
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <dt className="adm-rotulo sm:pt-1">{rotulo}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
