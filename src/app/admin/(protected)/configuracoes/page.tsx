import type { ReactNode } from "react";
import { diaFechado, enderecoPitstop, horariosAgendamento, linkComoChegar, whatsappNumero } from "@/lib/data";
import { formatarTelefone } from "@/lib/format";
import { ADMIN_SEM_SENHA } from "@/lib/adminAuth";
import { bufferDaAgenda, chavesConfiguracao, dadosEmpresa, lerConfiguracoes } from "@/lib/configuracoes";
import FormComAviso, { BotaoEnviar } from "@/components/admin/FormComAviso";
import { salvarConfiguracoesNegocio } from "../../servicos/actions";

const diasDaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Informações do negócio. Agenda (buffer) e dados do recibo são editáveis; o resto ainda vem do código. */
export default async function ConfiguracoesPage() {
  const diasAbertos = diasDaSemana.filter((_, i) => i !== diaFechado);
  const config = await lerConfiguracoes();
  const empresa = dadosEmpresa(config);

  return (
    <div className="max-w-3xl space-y-6">
      {ADMIN_SEM_SENHA && (
        <p role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#b42318]">
          O admin está aberto sem senha. Qualquer pessoa com o link vê os dados dos clientes. Religue a senha assim que
          possível.
        </p>
      )}

      <FormComAviso action={salvarConfiguracoesNegocio} mensagem="Configurações salvas" className="space-y-6">
        <section>
          <h2 className="adm-rotulo mb-3">Agenda</h2>
          <div className="adm-card p-5">
            <label className="block max-w-xs">
              <span className="adm-rotulo mb-1.5 block">Intervalo entre atendimentos (minutos)</span>
              <input name="bufferMin" inputMode="numeric" defaultValue={bufferDaAgenda(config)} className="campo" />
            </label>
            <p className="mt-2 text-sm text-adm-muted">
              Tempo de organização, movimentação e finalização somado depois de cada atendimento ao bloquear a agenda.
              Deixe 0 enquanto a operação não definir. A duração de cada serviço é ajustada em Serviços.
            </p>
          </div>
        </section>

        <section>
          <h2 className="adm-rotulo mb-3">Dados da empresa no recibo</h2>
          <div className="adm-card grid gap-3 p-5 sm:grid-cols-2">
            <Campo rotulo="Nome / razão social" name="empresaNome" valor={config[chavesConfiguracao.empresaNome]} padrao={empresa.nome} />
            <Campo rotulo="CNPJ ou CPF" name="empresaDocumento" valor={config[chavesConfiguracao.empresaDocumento]} padrao="Não informado (a linha não sai no recibo)" />
            <Campo rotulo="Endereço" name="empresaEndereco" valor={config[chavesConfiguracao.empresaEndereco]} padrao={empresa.endereco} largo />
            <Campo rotulo="Telefone" name="empresaTelefone" valor={config[chavesConfiguracao.empresaTelefone]} padrao={empresa.telefone} />
            <Campo
              rotulo="Observação padrão do recibo"
              name="reciboObservacao"
              valor={config[chavesConfiguracao.reciboObservacao]}
              padrao="Opcional. Ex.: Obrigado pela preferência."
              largo
            />
            <p className="text-sm text-adm-muted sm:col-span-2">
              Campo vazio usa o padrão mostrado em cinza. O recibo é um comprovante de serviço, não uma nota fiscal.
            </p>
          </div>
        </section>

        <BotaoEnviar className="adm-btn adm-btn-primario">Salvar configurações</BotaoEnviar>
      </FormComAviso>

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
        Nome, WhatsApp, endereço e horários da loja ainda são alterados no código (um único arquivo, usado pela landing
        e pelo admin).
      </p>
    </div>
  );
}

function Campo({
  rotulo,
  name,
  valor,
  padrao,
  largo,
}: {
  rotulo: string;
  name: string;
  valor: string | undefined;
  padrao: string;
  largo?: boolean;
}) {
  return (
    <label className={`block ${largo ? "sm:col-span-2" : ""}`}>
      <span className="adm-rotulo mb-1.5 block">{rotulo}</span>
      <input name={name} defaultValue={valor ?? ""} placeholder={padrao} className="campo" />
    </label>
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
