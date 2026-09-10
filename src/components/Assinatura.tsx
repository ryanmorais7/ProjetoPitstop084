"use client";

import { useMemo, useState } from "react";
import { planos } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import FakeQrCode from "./FakeQrCode";

type Etapa = "dados" | "pagamento" | "confirmacao";

interface DadosCadastro {
  nome: string;
  telefone: string;
  veiculo: string;
  dataNascimento: string;
  endereco: string;
}

const dadosVazios: DadosCadastro = {
  nome: "",
  telefone: "",
  veiculo: "",
  dataNascimento: "",
  endereco: "",
};

const etapas: { id: Etapa; label: string }[] = [
  { id: "dados", label: "Dados" },
  { id: "pagamento", label: "Pagamento" },
  { id: "confirmacao", label: "Confirmação" },
];

export default function Assinatura() {
  const { planoSelecionado, selecionarPlano } = useSelection();
  const [etapa, setEtapa] = useState<Etapa>("dados");
  const [dados, setDados] = useState<DadosCadastro>(dadosVazios);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const plano = useMemo(
    () => planos.find((p) => p.id === planoSelecionado) ?? planos[0],
    [planoSelecionado]
  );

  const dadosValidos =
    dados.nome.trim().length > 1 &&
    dados.telefone.trim().length > 7 &&
    dados.veiculo.trim().length > 1 &&
    dados.dataNascimento.trim().length > 0;

  const etapaIndex = etapas.findIndex((e) => e.id === etapa);

  function atualizarCampo<K extends keyof DadosCadastro>(campo: K, valor: DadosCadastro[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function confirmarPagamento() {
    setProcessandoPagamento(true);
    setTimeout(() => {
      setProcessandoPagamento(false);
      setEtapa("confirmacao");
    }, 1500);
  }

  function recomecar() {
    setDados(dadosVazios);
    setEtapa("dados");
  }

  return (
    <section id="assinatura" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Assinatura</p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Vamos ativar seu plano</h2>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4">
          {etapas.map((e, i) => (
            <div key={e.id} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${
                    i <= etapaIndex ? "bg-gold text-asphalt" : "bg-panel text-text-secondary"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-text-secondary">{e.label}</span>
              </div>
              {i < etapas.length - 1 && (
                <span
                  className={`h-px w-10 ${i < etapaIndex ? "bg-gold" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel p-8">
          <div className="mb-6 flex items-center justify-between rounded-lg bg-asphalt px-4 py-3">
            <span className="text-sm text-text-secondary">Plano selecionado</span>
            <div className="flex items-center gap-3">
              <select
                value={plano.id}
                onChange={(e) => selecionarPlano(e.target.value as typeof plano.id)}
                className="rounded bg-panel px-2 py-1 font-heading text-sm text-gold"
              >
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <span className="font-mono text-sm text-text-primary">
                {formatarPreco(plano.precoMensal)}/mês
              </span>
            </div>
          </div>

          {etapa === "dados" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (dadosValidos) setEtapa("pagamento");
              }}
            >
              <Campo label="Nome completo *">
                <input
                  required
                  value={dados.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  className="campo"
                  placeholder="Seu nome"
                />
              </Campo>
              <Campo label="Telefone *">
                <input
                  required
                  value={dados.telefone}
                  onChange={(e) => atualizarCampo("telefone", e.target.value)}
                  className="campo"
                  placeholder="(11) 90000-0000"
                />
              </Campo>
              <Campo label="Veículo *">
                <input
                  required
                  value={dados.veiculo}
                  onChange={(e) => atualizarCampo("veiculo", e.target.value)}
                  className="campo"
                  placeholder="Modelo e placa"
                />
              </Campo>
              <Campo label="Data de nascimento *">
                <input
                  required
                  type="date"
                  value={dados.dataNascimento}
                  onChange={(e) => atualizarCampo("dataNascimento", e.target.value)}
                  className="campo"
                />
              </Campo>
              <Campo label="Endereço (opcional, para retirada/entrega)">
                <input
                  value={dados.endereco}
                  onChange={(e) => atualizarCampo("endereco", e.target.value)}
                  className="campo"
                  placeholder="Rua, número, bairro"
                />
              </Campo>

              <button
                type="submit"
                disabled={!dadosValidos}
                className="mt-4 w-full rounded-full bg-gold py-3 font-heading font-semibold text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar para pagamento
              </button>
            </form>
          )}

          {etapa === "pagamento" && (
            <div className="flex flex-col items-center text-center">
              <p className="mb-4 text-sm text-text-secondary">
                Escaneie o QR Code no app do seu banco para pagar via Pix
              </p>
              <FakeQrCode seed={plano.id === "premium" ? 7 : 21} />
              <p className="mt-4 font-mono text-2xl font-semibold text-gold">
                {formatarPreco(plano.precoMensal)}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Simulação de pagamento, nenhuma cobrança real será feita
              </p>

              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => setEtapa("dados")}
                  className="flex-1 rounded-full border border-white/15 py-3 font-heading font-semibold text-text-primary transition hover:border-cyan hover:text-cyan"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmarPagamento}
                  disabled={processandoPagamento}
                  className="flex-1 rounded-full bg-gold py-3 font-heading font-semibold text-asphalt transition disabled:opacity-60"
                >
                  {processandoPagamento ? "Confirmando..." : "Já paguei"}
                </button>
              </div>
            </div>
          )}

          {etapa === "confirmacao" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/10 text-2xl text-cyan">
                ✓
              </div>
              <h3 className="font-heading text-xl font-bold">Assinatura ativada</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Bem-vindo(a), {dados.nome.split(" ")[0] || "cliente"}. Seu plano {plano.nome} já
                está ativo.
              </p>

              <div className="mt-6 space-y-2 rounded-lg bg-asphalt p-4 text-left font-mono text-sm">
                <Linha label="Plano" valor={plano.nome} />
                <Linha label="Valor" valor={`${formatarPreco(plano.precoMensal)}/mês`} />
                <Linha label="Veículo" valor={dados.veiculo} />
                <Linha label="Fidelidade mínima" valor="3 meses" />
              </div>

              <p className="mt-4 text-xs text-text-secondary">
                Você ganha um brinde no mês do seu aniversário. Guardamos a data para isso.
              </p>

              <button
                onClick={recomecar}
                className="mt-6 rounded-full border border-white/15 px-6 py-2 text-sm text-text-secondary transition hover:border-cyan hover:text-cyan"
              >
                Fazer nova simulação
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{valor}</span>
    </div>
  );
}
