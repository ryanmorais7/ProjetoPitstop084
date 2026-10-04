"use client";

import { ReactNode, useActionState, useMemo, useState } from "react";
import {
  duchaPitstop,
  servicosAvulsos,
  precoServico,
  listaPlanos,
  planos,
  servicosPorPlano,
  lavagensPlano,
  horariosAgendamento,
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

function Etapa({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="adm-card p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-heading text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-adm-ink font-mono text-xs font-semibold text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`min-h-11 rounded-lg border px-4 text-left text-sm font-semibold transition-colors ${
        ativo ? "border-gold bg-gold/20 text-adm-ink" : "border-black/15 bg-white text-adm-muted hover:border-black/40 hover:text-adm-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function NovoAtendimentoForm({
  clienteId,
  nomeCliente,
  telefoneCliente,
  veiculos,
  assinaturaAtiva,
  nomePlanoAtivo,
  datasIso,
  chavesOcupadas,
  encaixe = false,
  diaInicial = null,
  horaInicial = null,
}: {
  /** Carro já na loja, sem reserva: não escolhe data/hora e entra direto em CHEGOU. */
  encaixe?: boolean;
  /** Slot escolhido na Agenda (clique em DISPONÍVEL). */
  diaInicial?: string | null;
  horaInicial?: string | null;
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
  // null = "outro veículo" (digitado na hora; vira um veículo novo do cliente)
  const [veiculoId, setVeiculoId] = useState<number | null>(veiculoPrincipal?.id ?? null);
  const [carro, setCarro] = useState(veiculoPrincipal?.modelo ?? "");
  const [placa, setPlaca] = useState(veiculoPrincipal?.placa ?? "");
  const [porte, setPorte] = useState<VehicleSize>((veiculoPrincipal?.porte as VehicleSize) ?? "P");
  const [avulsosIds, setAvulsosIds] = useState<Set<string>>(new Set());
  const [planoId, setPlanoId] = useState<PlanoId>((assinaturaAtiva?.plano as PlanoId) ?? listaPlanos[0].id);
  const [servicoPlano, setServicoPlano] = useState<string>(servicosPorPlano[planoId]?.[0] ?? "");
  // slot vindo da Agenda só vale se ainda estiver livre
  const slotInicialLivre = Boolean(diaInicial && horaInicial && !chavesOcupadas.includes(`${diaInicial}-${horaInicial}`));
  const [dataSelecionadaIso, setDataSelecionadaIso] = useState<string | null>(diaInicial);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(slotInicialLivre ? horaInicial : null);
  const [transporte, setTransporte] = useState<"" | "leva_busca">("");
  const [valorAjustado, setValorAjustado] = useState("");

  const datasRapidas = useMemo(() => datasIso.map((iso) => new Date(iso + "T12:00:00Z")), [datasIso]);
  const ocupados = useMemo(() => new Set(chavesOcupadas), [chavesOcupadas]);

  const precoDucha = precoServico(duchaPitstop, porte) ?? 0;
  const adicionaisEscolhidos = servicosAvulsos.filter((s) => avulsosIds.has(s.id));
  const totalAvulsos = precoDucha + adicionaisEscolhidos.reduce((soma, s) => soma + (precoServico(s, porte) ?? 0), 0);
  const temAvaliacao = adicionaisEscolhidos.some((s) => s.requiresEvaluation);
  const precoAssinatura = planos[planoId]?.precos[porte] ?? null;

  function escolherVeiculo(v: Veiculo | null) {
    setVeiculoId(v?.id ?? null);
    setCarro(v?.modelo ?? "");
    setPlaca(v?.placa ?? "");
    if (v) setPorte(v.porte as VehicleSize);
  }

  function escolherPlano(id: PlanoId) {
    setPlanoId(id);
    setServicoPlano(servicosPorPlano[id]?.[0] ?? "");
  }

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />
      <input type="hidden" name="nome" value={nomeCliente} />
      <input type="hidden" name="telefone" value={telefoneCliente} />
      <input type="hidden" name="tipoAtendimento" value={tipoAtendimento} />
      {encaixe && <input type="hidden" name="encaixe" value="1" />}

      <Etapa numero={1} titulo="Veículo">
        {veiculos.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {veiculos.map((v) => (
              <Opcao key={v.id} ativo={veiculoId === v.id} onClick={() => escolherVeiculo(v)}>
                {v.modelo}
                <span className="ml-2 font-mono text-xs font-normal text-adm-muted">{v.placa ?? "sem placa"}</span>
              </Opcao>
            ))}
            <Opcao ativo={veiculoId === null} onClick={() => escolherVeiculo(null)}>
              + Outro veículo
            </Opcao>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Veículo *</span>
            <input name="carro" value={carro} onChange={(e) => setCarro(e.target.value)} required className="campo" placeholder="Modelo" />
          </label>
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Placa</span>
            <input
              name="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="campo font-mono uppercase"
              placeholder="ABC1D23"
            />
          </label>
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Porte</span>
            <select name="porte" value={porte} onChange={(e) => setPorte(e.target.value as VehicleSize)} className="campo">
              <option value="P">Hatch / Sedan (P)</option>
              <option value="G">SUV / Pick-up (G)</option>
            </select>
          </label>
        </div>
        {!placa && (
          <p className="mt-2 text-xs text-adm-muted">
            Sem placa, a recepção não consegue conferir o veículo no check-in. Peça ao cliente se puder.
          </p>
        )}
      </Etapa>

      <Etapa numero={2} titulo="Serviço">
        <div className="flex flex-wrap gap-2">
          <Opcao ativo={tipoAtendimento === "avulso"} onClick={() => setTipoAtendimento("avulso")}>
            Ducha + adicionais
          </Opcao>
          <Opcao ativo={tipoAtendimento === "assinatura"} onClick={() => setTipoAtendimento("assinatura")}>
            Benefício PitPass
          </Opcao>
        </div>

        {tipoAtendimento === "avulso" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between rounded-lg border border-gold bg-gold/15 px-4 py-3 text-sm font-semibold">
              <span>Ducha Pitstop (base)</span>
              <span className="tabular-nums">{formatarPreco(precoDucha)}</span>
            </div>
            <p className="adm-rotulo mb-2 mt-5">Adicionais</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {servicosAvulsos.map((s) => {
                const selecionado = avulsosIds.has(s.id);
                const preco = precoServico(s, porte);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selecionado}
                    onClick={() =>
                      setAvulsosIds((atual) => {
                        const novo = new Set(atual);
                        if (novo.has(s.id)) novo.delete(s.id);
                        else novo.add(s.id);
                        return novo;
                      })
                    }
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                      selecionado ? "border-gold bg-gold/15" : "border-black/15 bg-white hover:border-black/40"
                    }`}
                  >
                    <span className="font-semibold leading-snug">
                      <span className="mr-2 font-mono text-adm-muted">{selecionado ? "✓" : "+"}</span>
                      {s.nome}
                    </span>
                    <span className="shrink-0 text-right font-mono text-xs text-adm-muted">
                      {preco != null ? formatarPreco(preco) : selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
                    </span>
                  </button>
                );
              })}
            </div>
            {[...avulsosIds].map((id) => (
              <input key={id} type="hidden" name="avulsosIds" value={id} />
            ))}
            <div className="mt-4 flex items-baseline justify-between border-t border-adm-line pt-4">
              <span className="adm-rotulo">Total</span>
              <span className="font-heading text-2xl font-bold tabular-nums">{formatarPreco(totalAvulsos)}</span>
            </div>
            {temAvaliacao && (
              <p className="mt-1 text-right text-xs text-adm-muted">+ serviço mediante avaliação, fora do total.</p>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="adm-rotulo mb-1.5 block">Plano</span>
              {assinaturaAtiva ? (
                <>
                  <p className="campo flex items-center bg-black/[0.03]">{nomePlanoAtivo} · assinatura ativa</p>
                  <input type="hidden" name="planoId" value={assinaturaAtiva.plano} />
                  <input type="hidden" name="assinaturaId" value={assinaturaAtiva.id} />
                </>
              ) : (
                <select
                  name="planoId"
                  aria-label="Plano"
                  className="campo"
                  value={planoId}
                  onChange={(e) => escolherPlano(e.target.value as PlanoId)}
                >
                  {listaPlanos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Benefício</span>
              <select name="servicoPlano" value={servicoPlano} onChange={(e) => setServicoPlano(e.target.value)} className="campo">
                {(servicosPorPlano[planoId] ?? []).map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            {servicoPlano && lavagensPlano[servicoPlano]?.shortDescription && (
              <p className="text-sm text-adm-muted sm:col-span-2">{lavagensPlano[servicoPlano].shortDescription}</p>
            )}
            {!assinaturaAtiva && (
              <p className="rounded-lg bg-[#fdf1cf] px-4 py-3 text-sm text-[#7a5600] sm:col-span-2">
                Este cliente não tem PitPass ativo: o uso do benefício não será descontado de nenhum ciclo.
                {precoAssinatura != null && ` Mensalidade do plano: ${formatarPreco(precoAssinatura)}/mês.`}
              </p>
            )}
          </div>
        )}
      </Etapa>

      {encaixe ? (
        <Etapa numero={3} titulo="Encaixe">
          <p className="text-sm text-adm-muted">
            Sem reserva: o atendimento entra com a data e a hora de agora e o carro vai direto para CHEGOU no quadro.
            A agenda de horários da landing não é alterada.
          </p>
          <label className="mt-4 block">
            <span className="adm-rotulo mb-1.5 block">Responsável pelo atendimento</span>
            <input name="responsavelAtendimento" className="campo" placeholder="Lavador ou detailer" />
          </label>
        </Etapa>
      ) : (
      <Etapa numero={3} titulo="Data e horário">
        <DateTimePicker
          claro
          datasRapidas={datasRapidas}
          dataSelecionadaIso={dataSelecionadaIso}
          onSelecionarData={(iso) => {
            setDataSelecionadaIso(iso);
            setHoraSelecionada(null);
          }}
          horarios={horariosAgendamento}
          ocupados={ocupados}
          horaSelecionada={horaSelecionada}
          onSelecionarHora={setHoraSelecionada}
        />
        {!dataSelecionadaIso && <p className="mt-3 text-sm text-adm-muted">Escolha o dia para ver os horários livres.</p>}
        <input type="hidden" name="dia" value={dataSelecionadaIso ?? ""} />
        <input type="hidden" name="horario" value={horaSelecionada ?? ""} />
      </Etapa>
      )}

      <Etapa numero={4} titulo="Entrega e observações">
        <div className="flex flex-wrap gap-2">
          <Opcao ativo={transporte === ""} onClick={() => setTransporte("")}>
            Cliente leva o veículo
          </Opcao>
          <Opcao ativo={transporte === "leva_busca"} onClick={() => setTransporte("leva_busca")}>
            Leva & Busca
          </Opcao>
        </div>
        <input type="hidden" name="transporte" value={transporte} />
        {transporte === "leva_busca" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="enderecoRua" aria-label="Rua" placeholder="Rua" className="campo" />
            <input name="enderecoNumero" aria-label="Número" placeholder="Número" className="campo" />
            <input name="enderecoBairro" aria-label="Bairro" placeholder="Bairro" className="campo" />
            <input name="enderecoReferencia" aria-label="Referência" placeholder="Referência (opcional)" className="campo" />
          </div>
        )}

        <label className="mt-5 block">
          <span className="adm-rotulo mb-1.5 block">Observações deste atendimento</span>
          <textarea name="observacoes" rows={2} className="campo" placeholder="Ex.: risco já existente na porta direita." />
          <span className="mt-1 block text-xs text-adm-muted">
            Valem só para este atendimento. Preferências permanentes ficam na ficha do cliente.
          </span>
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Responsável pelo fechamento</span>
            <input name="responsavelFechamento" className="campo" placeholder="Quem fechou este agendamento" />
          </label>
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">
              Ajustar valor{tipoAtendimento === "avulso" ? ` (calculado: ${formatarPreco(totalAvulsos)})` : ""}
            </span>
            <input
              name="valorAjustado"
              inputMode="decimal"
              value={valorAjustado}
              onChange={(e) => setValorAjustado(e.target.value)}
              placeholder="Opcional. Ex.: 199,90"
              className="campo"
            />
          </label>
          {valorAjustado && (
            <label className="block sm:col-span-2">
              <span className="adm-rotulo mb-1.5 block">Motivo do ajuste</span>
              <input name="motivoAjuste" placeholder="Ex.: desconto autorizado" className="campo" />
            </label>
          )}
        </div>
      </Etapa>

      {estado?.erro && (
        <p role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#b42318]">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente || (!encaixe && (!dataSelecionadaIso || !horaSelecionada))}
        className="adm-btn adm-btn-primario min-h-14 w-full text-base"
      >
        {pendente
          ? "Salvando..."
          : encaixe
          ? "Registrar encaixe e dar entrada"
          : dataSelecionadaIso && horaSelecionada
          ? `Confirmar agendamento · ${horaSelecionada}`
          : "Escolha data e horário"}
      </button>
    </form>
  );
}
