"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientes, assinaturas } from "@/db/schema";
import { adicionaisPara, duracaoTotal, itemDoBeneficio, servicoBase } from "@/lib/catalogo";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { hojeIso, horaAtualFortaleza } from "@/lib/agenda";
import { lerContextoAgendar, queryContextoAgendar } from "@/lib/contextoAgendar";
import { buscarOuCriarCliente, buscarOuCriarVeiculo, calcularCiclo, criarAgendamento } from "@/lib/bookings";
import {
  CategoriaVeiculo,
  categoriaVeiculoValida,
  PlanoId,
  planoValido,
  precoPlano,
  servicosPorPlano,
  precoServico,
  origensCliente,
} from "@/lib/data";

/** Categoria do veículo vinda de um formulário do admin: "P" | "G" | "MOTO" (padrão P). */
function categoriaDoForm(valor: FormDataEntryValue | null): CategoriaVeiculo {
  return categoriaVeiculoValida(valor) ? valor : "P";
}

function origemValida(valor: FormDataEntryValue | null): string | null {
  return origensCliente.find((o) => o.id === valor)?.id ?? null;
}

export async function criarClienteManual(formData: FormData) {
  await exigirSessaoAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim() || null;
  const porte = categoriaDoForm(formData.get("porte"));

  if (!nome || !telefone || !modelo) return;

  const { cliente } = await buscarOuCriarCliente({ nome, telefone, origem: origemValida(formData.get("origem")) });
  await buscarOuCriarVeiculo({ clienteId: cliente.id, modelo, placa, porte });

  revalidatePath("/admin/clientes");
  // vindo do "Novo agendamento", segue direto pro passo de veículo/serviço
  if (formData.get("destino") !== "agendar") redirect(`/admin/clientes/${cliente.id}`);
  const extra = queryContextoAgendar(lerContextoAgendar(formData));
  redirect(`/admin/clientes/${cliente.id}/agendar${extra ? `?${extra}` : ""}`);
}

export async function editarCliente(clienteId: number, formData: FormData) {
  await exigirSessaoAdmin();

  const telefone = String(formData.get("telefone") ?? "").trim();
  const cep = String(formData.get("cep") ?? "").trim() || null;
  const rua = String(formData.get("rua") ?? "").trim() || null;
  const numero = String(formData.get("numero") ?? "").trim() || null;
  const complemento = String(formData.get("complemento") ?? "").trim() || null;
  const bairro = String(formData.get("bairro") ?? "").trim() || null;
  const cidade = String(formData.get("cidade") ?? "").trim() || null;
  const uf = String(formData.get("uf") ?? "").trim() || null;
  const referencia = String(formData.get("referencia") ?? "").trim() || null;

  await db
    .update(clientes)
    .set({
      telefone,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      referencia,
      origem: origemValida(formData.get("origem")),
      updatedAt: new Date(),
    })
    .where(eq(clientes.id, clienteId));

  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function adicionarPreferencia(clienteId: number, formData: FormData) {
  await exigirSessaoAdmin();
  const preferencias = String(formData.get("preferencias") ?? "").trim();
  await db.update(clientes).set({ preferencias, updatedAt: new Date() }).where(eq(clientes.id, clienteId));
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function adicionarVeiculo(clienteId: number, formData: FormData) {
  await exigirSessaoAdmin();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim() || null;
  const porte = categoriaDoForm(formData.get("porte"));
  if (!modelo) return;

  await buscarOuCriarVeiculo({ clienteId, modelo, placa, porte });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function ativarAssinatura(clienteId: number, formData: FormData) {
  await exigirSessaoAdmin();
  const plano = formData.get("plano");
  if (!planoValido(plano)) return;
  const veiculoId = Number(formData.get("veiculoId")) || null;

  const inicioEm = hojeIso();
  const { cicloInicio, cicloFim } = calcularCiclo(inicioEm);

  // um cadastro feito pelo cliente no site (pendente) vira o PitPass ativo: não cria um segundo
  const [pendente] = await db
    .select()
    .from(assinaturas)
    .where(and(eq(assinaturas.clienteId, clienteId), eq(assinaturas.status, "pendente")));
  if (pendente) {
    await db
      .update(assinaturas)
      .set({ plano, status: "ativo", veiculoId: veiculoId ?? pendente.veiculoId, updatedAt: new Date() })
      .where(eq(assinaturas.id, pendente.id));
  } else {
    await db.insert(assinaturas).values({ clienteId, plano, veiculoId, status: "ativo", inicioEm, cicloInicio, cicloFim });
  }
  revalidatePath(`/admin/clientes/${clienteId}`);
}

/** Também confirma ("ativo") ou recusa ("cancelado") um PitPass pendente, cadastrado pelo cliente no site. */
export async function alterarStatusAssinatura(assinaturaId: number, clienteId: number, status: "ativo" | "pausado" | "cancelado") {
  await exigirSessaoAdmin();
  await db.update(assinaturas).set({ status, updatedAt: new Date() }).where(eq(assinaturas.id, assinaturaId));
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export interface NovoAtendimentoState {
  erro?: string;
}

export async function criarAgendamentoManual(
  _estado: NovoAtendimentoState | undefined,
  formData: FormData
): Promise<NovoAtendimentoState> {
  await exigirSessaoAdmin();

  const clienteId = Number(formData.get("clienteId"));
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const carro = String(formData.get("carro") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim() || null;
  const porte = categoriaDoForm(formData.get("porte"));
  const tipoAtendimento = formData.get("tipoAtendimento") === "assinatura" ? "assinatura" : "avulso";
  // encaixe: carro já na loja, sem reserva. Entra com a data e a hora de agora (fora da grade).
  const encaixe = formData.get("encaixe") === "1";
  const dia = encaixe ? hojeIso() : String(formData.get("dia") ?? "");
  const horario = encaixe ? horaAtualFortaleza() : String(formData.get("horario") ?? "");
  const responsavelAtendimento = String(formData.get("responsavelAtendimento") ?? "").trim() || null;
  const transporte = String(formData.get("transporte") ?? "") || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;
  const valorAjustadoStr = String(formData.get("valorAjustado") ?? "").trim();
  const motivoAjuste = String(formData.get("motivoAjuste") ?? "").trim() || null;
  const responsavelFechamento = String(formData.get("responsavelFechamento") ?? "").trim() || null;

  if (!clienteId || !nome || !telefone || !carro || !dia || !horario) {
    return { erro: "Preencha os campos obrigatórios." };
  }

  let preco: number | null = null;
  let servicoId: string | null = null;
  let servicoNome: string | null = null;
  let servicosAdicionaisJson: string | null = null;
  let planoId: PlanoId | null = null;
  let servicoPlano: string | null = null;
  let assinaturaId: number | null = null;
  let duracaoMin: number | null = null;

  // mesmo catálogo do site: serviço base e adicionais compatíveis com o veículo (carro ou moto)
  const catalogo = await carregarCatalogo();

  if (tipoAtendimento === "avulso") {
    const base = servicoBase(catalogo, porte);
    if (!base) return { erro: "Não há serviço base cadastrado para esse veículo." };
    const permitidos = adicionaisPara(catalogo, porte, false);
    const adicionais = [...new Set(formData.getAll("avulsosIds").map(String))]
      .map((id) => permitidos.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const valores = [base, ...adicionais].map((s) => precoServico(s, porte));
    // serviço ainda sem preço definido (ex.: moto): fica sem valor até a recepção ajustar
    preco = valores.every((v) => v == null) ? null : valores.reduce<number>((soma, v) => soma + (v ?? 0), 0);
    servicoId = base.id;
    servicoNome = base.nome;
    servicosAdicionaisJson = JSON.stringify(
      adicionais.map((s) => ({ id: s.id, nome: s.nome, preco: precoServico(s, porte) }))
    );
    duracaoMin = duracaoTotal([base, ...adicionais]);
  } else {
    const planoDoForm = formData.get("planoId");
    servicoPlano = String(formData.get("servicoPlano") ?? "");
    if (!planoValido(planoDoForm) || !servicosPorPlano[planoDoForm].includes(servicoPlano)) {
      return { erro: "Plano/benefício inválido." };
    }
    planoId = planoDoForm;
    preco = precoPlano(catalogo.planos[planoId], porte);
    servicoNome = servicoPlano;
    // o benefício referencia um serviço real do catálogo (ficha, duração, equipe)
    const lavagem = itemDoBeneficio(catalogo, servicoPlano);
    servicoId = lavagem?.id ?? null;
    duracaoMin = lavagem ? duracaoTotal([lavagem]) : null;

    const assinaturaIdForm = formData.get("assinaturaId");
    if (assinaturaIdForm) assinaturaId = Number(assinaturaIdForm);
  }

  const valorOriginal = preco;
  if (valorAjustadoStr) {
    const ajustado = Number(valorAjustadoStr.replace(",", "."));
    if (!Number.isNaN(ajustado)) preco = ajustado;
  }

  const enderecoSnapshot =
    transporte === "leva_busca"
      ? JSON.stringify({
          rua: String(formData.get("enderecoRua") ?? ""),
          numero: String(formData.get("enderecoNumero") ?? ""),
          bairro: String(formData.get("enderecoBairro") ?? ""),
          referencia: String(formData.get("enderecoReferencia") ?? ""),
        })
      : null;

  const resultado = await criarAgendamento({
    nome,
    telefone,
    carro,
    placa,
    categoriaVeiculo: porte,
    tipoAtendimento,
    dia,
    horario,
    duracaoMin,
    bufferMin: catalogo.bufferMin,
    planoId,
    servicoPlano,
    servicoId,
    servicoNome,
    servicosAdicionaisJson,
    preco,
    valorOriginal: valorAjustadoStr && valorOriginal !== preco ? valorOriginal : null,
    motivoAjuste: valorAjustadoStr && valorOriginal !== preco ? motivoAjuste : null,
    transporte,
    enderecoSnapshot,
    observacoes,
    origem: "admin",
    responsavelFechamento,
    responsavelAtendimento,
    encaixe,
    assinaturaId,
  });

  if (!resultado.ok) {
    return { erro: resultado.erro };
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath(`/admin/clientes/${clienteId}`);
  // encaixe volta pro quadro: o carro já aparece em CHEGOU
  redirect(encaixe ? "/admin/agenda" : `/admin/atendimentos/${resultado.id}?novo=1`);
}
