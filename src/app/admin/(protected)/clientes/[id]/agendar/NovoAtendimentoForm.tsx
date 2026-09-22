"use client";

import { useActionState, useMemo, useState } from "react";
import {
  duchaPitstop,
  servicosAvulsos,
  precoServico,
  listaPlanos,
  planos,
  servicosPorPlano,
  beneficiosAgendaveis,
  PlanoId,
  VehicleSize,
} from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import DateTimePicker from "@/components/DateTimePicker";
import { criarAgendamentoManual, NovoAtendimentoState } from "../../../../clientes/actions";

interface Veiculo {
  id: number;
  modelo: string;
  placa: string | null;
  porte: string;
}

interface Assinatura {
  id: number;
  plano: string;
}

const estadoInicial: NovoAtendimentoState = {};

export default function NovoAtendimentoForm({
  clienteId,
  nomeCliente,
  telefoneCliente,
  veiculos,
  assinaturaAtiva,
  nomePlanoAtivo,
  datasIso,
  chavesOcupadas,
}: {
  clienteId: number;
  nomeCliente: string;
  telefoneCliente: string;
  veiculos: Veiculo[];
  assinaturaAtiva: Assinatura | null;
  nomePlanoAtivo: string | null;
  datasIso: string[];
  chavesOcupadas: string[];
}) {
  const [estado, formAction, pendente] = useActionState(criarAgendamentoManual, estadoInicial);

  const veiculoPrincipal = veiculos[0];
  const [tipoAtendimento, setTipoAtendimento] = useState<"avulso" | "assinatura">(
    assinaturaAtiva ? "assinatura" : "avulso"
  );
  const [carro, setCarro] = useState(veiculoPrincipal?.modelo ?? "");
  const [placa, setPlaca] = useState(veiculoPrincipal?.placa ?? "");
  const [porte, setPorte] = useState<VehicleSize>((veiculoPrincipal?.porte as VehicleSize) ?? "P");
  const [avulsosIds, setAvulsosIds] = useState<Set<string>>(new Set());
  const [servicoPlano, setServicoPlano] = useState<string>(
    assinaturaAtiva ? servicosPorPlano[assinaturaAtiva.plano as PlanoId]?.[0] ?? "" : ""
  );
  const [dataSelecionadaIso, setDataSelecionadaIso] = useState<string | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [transporte, setTransporte] = useState<"" | "cliente_leva" | "leva_busca">("");
  const [valorAjustado, setValorAjustado] = useState("");

  const datasRapidas = useMemo(
    () => datasIso.map((iso) => new Date(iso + "T12:00:00Z")),
    [datasIso]
  );
  const ocupados = useMemo(() => new Set(chavesOcupadas), [chavesOcupadas]);

  const precoDucha = precoServico(duchaPitstop, porte) ?? 0;
  const totalAvulsos =
    precoDucha +
    servicosAvulsos
      .filter((s) => avulsosIds.has(s.id))
      .reduce((soma, s) => soma + (precoServico(s, porte) ?? 0), 0);
  const precoAssinatura = assinaturaAtiva ? planos[assinaturaAtiva.plano as PlanoId]?.precos[porte] ?? null : null;
  const precoCalculado = tipoAtendimento === "avulso" ? totalAvulsos : null;

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-6">
      <input type="hidden" name="clienteId" value={clienteId} />
      <input type="hidden" name="nome" value={nomeCliente} />
      <input type="hidden" name="telefone" value={telefoneCliente} />

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-secondary">O que o cliente deseja?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipoAtendimento("avulso")}
            className={`rounded-sm px-4 py-2 font-heading text-sm font-semibold ${
              tipoAtendimento === "avulso" ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary"
            }`}
          >
            Ducha + adicionais
          </button>
          <button
            type="button"
            onClick={() => setTipoAtendimento("assinatura")}
            className={`rounded-sm px-4 py-2 font-heading text-sm font-semibold ${
              tipoAtendimento === "assinatura" ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary"
            }`}
          >
            Benefício PitPass
          </button>
        </div>
      </div>
      <input type="hidden" name="tipoAtendimento" value={tipoAtendimento} />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Veículo</span>
          <input name="carro" value={carro} onChange={(e) => setCarro(e.target.value)} required className="campo" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Placa</span>
          <input name="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} className="campo" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Porte</span>
          <select
            name="porte"
            value={porte}
            onChange={(e) => setPorte(e.target.value as VehicleSize)}
            className="campo"
          >
            <option value="P">Hatch / Sedan (P)</option>
            <option value="G">SUV / Pick-up (G)</option>
          </select>
        </label>
      </div>

      {tipoAtendimento === "avulso" ? (
        <div>
          <div className="rounded-sm border border-gold/40 bg-gold/10 p-3 font-mono text-sm">
            <div className="flex justify-between">
              <span>Ducha Pitstop</span>
              <span className="text-gold">{formatarPreco(precoDucha)}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {servicosAvulsos.map((s) => {
              const selecionado = avulsosIds.has(s.id);
              const preco = precoServico(s, porte);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setAvulsosIds((atual) => {
                      const novo = new Set(atual);
                      if (novo.has(s.id)) novo.delete(s.id);
                      else novo.add(s.id);
                      return novo;
                    })
                  }
                  className={`rounded-sm border p-3 text-left text-sm ${
                    selecionado ? "border-gold bg-gold/10" : "border-white/10 bg-asphalt"
                  }`}
                >
                  <span className="font-heading font-bold">
                    {selecionado ? "✓ " : "+ "}
                    {s.nome}
                  </span>
                  <p className="mt-1 font-mono text-xs text-gold">
                    {preco != null ? formatarPreco(preco) : selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
                  </p>
                </button>
              );
            })}
          </div>
          {[...avulsosIds].map((id) => (
            <input key={id} type="hidden" name="avulsosIds" value={id} />
          ))}
          <p className="mt-3 font-mono text-sm">
            Total: <span className="font-bold text-gold">{formatarPreco(totalAvulsos)}</span>
          </p>
        </div>
      ) : (
        <div>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Plano</span>
            {assinaturaAtiva ? (
              <>
                <p className="campo bg-asphalt text-text-secondary">
                  {nomePlanoAtivo} (assinatura ativa deste cliente)
                </p>
                <input type="hidden" name="planoId" value={assinaturaAtiva.plano} />
                <input type="hidden" name="assinaturaId" value={assinaturaAtiva.id} />
              </>
            ) : (
              <select name="planoId" className="campo" defaultValue={listaPlanos[0].id}>
                {listaPlanos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-text-secondary">Benefício</span>
            <select
              name="servicoPlano"
              value={servicoPlano}
              onChange={(e) => setServicoPlano(e.target.value)}
              className="campo"
            >
              {(servicosPorPlano[(assinaturaAtiva?.plano as PlanoId) ?? listaPlanos[0].id] ?? []).map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
            {servicoPlano && beneficiosAgendaveis[servicoPlano] && (
              <p className="mt-1 text-xs text-text-secondary">{beneficiosAgendaveis[servicoPlano]}</p>
            )}
          </label>
          {precoAssinatura != null && !assinaturaAtiva && (
            <p className="mt-2 font-mono text-xs text-text-secondary">Mensalidade: {formatarPreco(precoAssinatura)}/mês (não é o preço deste atendimento)</p>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-secondary">Data e horário</p>
        <DateTimePicker
          datasRapidas={datasRapidas}
          dataSelecionadaIso={dataSelecionadaIso}
          onSelecionarData={(iso) => {
            setDataSelecionadaIso(iso);
            setHoraSelecionada(null);
          }}
          horarios={["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"]}
          ocupados={ocupados}
          horaSelecionada={horaSelecionada}
          onSelecionarHora={setHoraSelecionada}
        />
        <input type="hidden" name="dia" value={dataSelecionadaIso ?? ""} />
        <input type="hidden" name="horario" value={horaSelecionada ?? ""} />
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-secondary">Transporte</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["", "Cliente leva o veículo"],
              ["leva_busca", "Leva & Busca"],
            ] as const
          ).map(([valor, label]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTransporte(valor)}
              className={`rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wide ${
                transporte === valor ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="transporte" value={transporte} />
        {transporte === "leva_busca" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="enderecoRua" placeholder="Rua" className="campo" />
            <input name="enderecoNumero" placeholder="Número" className="campo" />
            <input name="enderecoBairro" placeholder="Bairro" className="campo" />
            <input name="enderecoReferencia" placeholder="Referência (opcional)" className="campo" />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">
            Ajustar valor (opcional{precoCalculado != null ? ` — calculado: ${formatarPreco(precoCalculado)}` : ""})
          </span>
          <input
            name="valorAjustado"
            value={valorAjustado}
            onChange={(e) => setValorAjustado(e.target.value)}
            placeholder="Ex.: 199,90"
            className="campo"
          />
        </label>
        {valorAjustado && (
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Motivo do ajuste</span>
            <input name="motivoAjuste" placeholder="Ex.: Desconto autorizado" className="campo" />
          </label>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-text-secondary">Observações deste atendimento</span>
        <textarea name="observacoes" rows={2} className="campo" placeholder="Ex.: risco na porta direita já existia." />
      </label>

      {estado?.erro && <p className="text-sm text-red-400">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente || !dataSelecionadaIso || !horaSelecionada}
        className="w-full rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pendente ? "Salvando..." : "Confirmar atendimento"}
      </button>
    </form>
  );
}
