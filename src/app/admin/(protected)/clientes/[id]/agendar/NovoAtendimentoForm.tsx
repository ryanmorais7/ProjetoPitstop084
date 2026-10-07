"use client";

import { ReactNode, useActionState, useMemo, useState } from "react";
import {
  CategoriaVeiculo,
  categoriaVeiculoValida,
  precoPlano,
  precoServico,
  servicosPorPlano,
  lavagensPlano,
  horariosAgendamento,
  PlanoId,
  tipoDaCategoria,
} from "@/lib/data";
import {
  adicionaisPara,
  Catalogo,
  duracaoTotal,
  formatarDuracao,
  itemDoBeneficio,
  planosPara,
  servicoBase,
} from "@/lib/catalogo";
import { situacaoDoHorario } from "@/lib/agenda";
import type { Ocupacao } from "@/lib/disponibilidade";
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
  ocupacao,
  catalogo,
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
  /** Trechos já ocupados da agenda (atendimentos com a sua duração + bloqueios). */
  ocupacao: Ocupacao[];
  /** Catálogo vigente: mesmos serviços, preços e durações do site. */
  catalogo: Catalogo;
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
  const categoriaDe = (valor: string | undefined): CategoriaVeiculo => (categoriaVeiculoValida(valor) ? valor : "P");
  const [porte, setPorte] = useState<CategoriaVeiculo>(categoriaDe(veiculoPrincipal?.porte));
  const [avulsosIds, setAvulsosIds] = useState<Set<string>>(new Set());
  const planosDoVeiculo = planosPara(catalogo, tipoDaCategoria(porte), false);
  const [planoEscolhido, setPlanoEscolhido] = useState<PlanoId | null>((assinaturaAtiva?.plano as PlanoId) ?? null);
  // sem assinatura ativa, o plano precisa ser do mesmo tipo de veículo (carro x moto)
  const planoId: PlanoId =
    planoEscolhido && (assinaturaAtiva || planosDoVeiculo.some((p) => p.id === planoEscolhido))
      ? planoEscolhido
      : planosDoVeiculo[0].id;
  const beneficios = servicosPorPlano[planoId] ?? [];
  const [beneficioEscolhido, setBeneficioEscolhido] = useState<string>("");
  const servicoPlano = beneficios.includes(beneficioEscolhido) ? beneficioEscolhido : (beneficios[0] ?? "");
  const [dataSelecionadaIso, setDataSelecionadaIso] = useState<string | null>(diaInicial);
  const [horaEscolhida, setHoraEscolhida] = useState<string | null>(horaInicial);
  const [transporte, setTransporte] = useState<"" | "leva_busca">("");
  const [valorAjustado, setValorAjustado] = useState("");

  const datasRapidas = useMemo(() => datasIso.map((iso) => new Date(iso + "T12:00:00Z")), [datasIso]);

  // serviço base e adicionais do veículo (Ducha Pitstop pra carro, Ducha Moto pra moto)
  const ehMoto = porte === "MOTO";
  const base = servicoBase(catalogo, porte);
  const adicionaisDoVeiculo = adicionaisPara(catalogo, porte, false);
  const precoBase = base ? precoServico(base, porte) : null;
  const adicionaisEscolhidos = adicionaisDoVeiculo.filter((s) => avulsosIds.has(s.id));
  const totalAvulsos = (precoBase ?? 0) + adicionaisEscolhidos.reduce((soma, s) => soma + (precoServico(s, porte) ?? 0), 0);
  const temAvaliacao = adicionaisEscolhidos.some((s) => s.requiresEvaluation);
  const precoAssinatura = precoPlano(catalogo.planos[planoId], porte);

  // duração do atendimento montado: é ela que decide em quais horários ele cabe
  const lavagem = itemDoBeneficio(catalogo, servicoPlano);
  const duracaoMin =
    tipoAtendimento === "avulso"
      ? base
        ? duracaoTotal([base, ...adicionaisEscolhidos])
        : null
      : lavagem
      ? duracaoTotal([lavagem])
      : null;
  const situacaoDe = (dia: string, hora: string) =>
    situacaoDoHorario({
      horario: hora,
      duracaoMin,
      bufferMin: catalogo.bufferMin,
      ocupados: ocupacao.filter((o) => o.dia === dia),
    });
  // o horário escolhido (ou vindo da Agenda) só vale enquanto comportar o atendimento
  const horaSelecionada =
    dataSelecionadaIso && horaEscolhida && situacaoDe(dataSelecionadaIso, horaEscolhida) === "livre" ? horaEscolhida : null;
  const setHoraSelecionada = setHoraEscolhida;

  function escolherVeiculo(v: Veiculo | null) {
    setVeiculoId(v?.id ?? null);
    setCarro(v?.modelo ?? "");
    setPlaca(v?.placa ?? "");
    if (v) setPorte(categoriaDe(v.porte));
  }

  const escolherPlano = setPlanoEscolhido;
  const setServicoPlano = setBeneficioEscolhido;

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
            <span className="adm-rotulo mb-1.5 block">Tipo / porte</span>
            <select name="porte" value={porte} onChange={(e) => setPorte(categoriaDe(e.target.value))} className="campo">
              <option value="P">Carro · Hatch / Sedan (P)</option>
              <option value="G">Carro · SUV / Pick-up (G)</option>
              <option value="MOTO">Moto</option>
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
            {ehMoto ? "Ducha Moto + adicionais" : "Ducha + adicionais"}
          </Opcao>
          <Opcao ativo={tipoAtendimento === "assinatura"} onClick={() => setTipoAtendimento("assinatura")}>
            Benefício PitPass
          </Opcao>
        </div>

        {tipoAtendimento === "avulso" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between rounded-lg border border-gold bg-gold/15 px-4 py-3 text-sm font-semibold">
              <span>
                {base?.nome ?? "Serviço base"} (base)
                {base?.duracaoMin ? (
                  <span className="ml-2 font-mono text-xs font-normal text-adm-muted">{formatarDuracao(base.duracaoMin)}</span>
                ) : null}
              </span>
              <span className="tabular-nums">{precoBase != null ? formatarPreco(precoBase) : "Preço a definir"}</span>
            </div>
            {precoBase == null && (
              <p className="mt-2 text-xs text-adm-muted">
                Esse serviço ainda não tem preço cadastrado em Serviços. Informe o valor cobrado em Ajustar valor.
              </p>
            )}
            <p className="adm-rotulo mb-2 mt-5">Adicionais</p>
            {adicionaisDoVeiculo.length === 0 && (
              <p className="text-sm text-adm-muted">Nenhum adicional cadastrado para esse tipo de veículo.</p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {adicionaisDoVeiculo.map((s) => {
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
                      {s.duracaoMin ? (
                        <span className="ml-2 font-mono text-xs font-normal text-adm-muted">+ {formatarDuracao(s.duracaoMin)}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-right font-mono text-xs text-adm-muted">
                      {preco != null ? formatarPreco(preco) : selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
                    </span>
                  </button>
                );
              })}
            </div>
            {adicionaisEscolhidos.map((s) => (
              <input key={s.id} type="hidden" name="avulsosIds" value={s.id} />
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
                  {planosDoVeiculo.map((p) => (
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
                {beneficios.map((nome) => (
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
          situacao={(hora) => (dataSelecionadaIso ? situacaoDe(dataSelecionadaIso, hora) : "livre")}
          horaSelecionada={horaSelecionada}
          onSelecionarHora={setHoraSelecionada}
        />
        {!dataSelecionadaIso && <p className="mt-3 text-sm text-adm-muted">Escolha o dia para ver os horários livres.</p>}
        <p className="mt-3 text-sm text-adm-muted">
          {duracaoMin != null
            ? `Duração estimada: ${formatarDuracao(duracaoMin)}${
                catalogo.bufferMin ? ` + ${catalogo.bufferMin} min de intervalo` : ""
              }. Só ficam livres os horários que comportam o atendimento inteiro.`
            : "Algum serviço escolhido ainda não tem duração cadastrada: o atendimento ocupa um horário da agenda."}
        </p>
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
