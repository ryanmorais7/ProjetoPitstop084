"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clientes, assinaturas } from "@/db/schema";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { buscarOuCriarCliente, buscarOuCriarVeiculo, calcularCiclo, criarAgendamento } from "@/lib/bookings";
import {
  PlanoId,
  planos,
  servicosPorPlano,
  duchaPitstop,
  servicosAvulsos,
  precoServico,
  VehicleSize,
} from "@/lib/data";

export async function criarClienteManual(formData: FormData) {
  await exigirSessaoAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim() || null;
  const porte = (formData.get("porte") === "G" ? "G" : "P") as VehicleSize;

  if (!nome || !telefone || !modelo) return;

  const { cliente } = await buscarOuCriarCliente({ nome, telefone });
  await buscarOuCriarVeiculo({ clienteId: cliente.id, modelo, placa, porte });

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${cliente.id}`);
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
    .set({ telefone, cep, rua, numero, complemento, bairro, cidade, uf, referencia, updatedAt: new Date() })
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
  const porte = (formData.get("porte") === "G" ? "G" : "P") as VehicleSize;
  if (!modelo) return;

  await buscarOuCriarVeiculo({ clienteId, modelo, placa, porte });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function ativarAssinatura(clienteId: number, formData: FormData) {
  await exigirSessaoAdmin();
  const plano = formData.get("plano") as PlanoId;
  if (!planos[plano]) return;

  const hoje = new Date();
  const inicioEm = hoje.toISOString().slice(0, 10);
  const { cicloInicio, cicloFim } = calcularCiclo(inicioEm);

  await db.insert(assinaturas).values({ clienteId, plano, status: "ativo", inicioEm, cicloInicio, cicloFim });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

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
  const porte = (formData.get("porte") === "G" ? "G" : "P") as VehicleSize;
  const tipoAtendimento = formData.get("tipoAtendimento") === "assinatura" ? "assinatura" : "avulso";
  const dia = String(formData.get("dia") ?? "");
  const horario = String(formData.get("horario") ?? "");
  const transporte = String(formData.get("transporte") ?? "") || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;
  const valorAjustadoStr = String(formData.get("valorAjustado") ?? "").trim();
  const motivoAjuste = String(formData.get("motivoAjuste") ?? "").trim() || null;

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

  if (tipoAtendimento === "avulso") {
    const avulsosIds = formData.getAll("avulsosIds").map(String);
    const adicionais = avulsosIds
      .map((id) => servicosAvulsos.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const totalAdicionais = adicionais.reduce((soma, s) => soma + (precoServico(s, porte) ?? 0), 0);
    preco = (precoServico(duchaPitstop, porte) ?? 0) + totalAdicionais;
    servicoId = duchaPitstop.id;
    servicoNome = duchaPitstop.nome;
    servicosAdicionaisJson = JSON.stringify(
      adicionais.map((s) => ({ id: s.id, nome: s.nome, preco: precoServico(s, porte) }))
    );
  } else {
    planoId = formData.get("planoId") as PlanoId;
    servicoPlano = String(formData.get("servicoPlano") ?? "");
    const plano = planos[planoId];
    if (!plano || !servicosPorPlano[planoId]?.includes(servicoPlano)) {
      return { erro: "Plano/benefício inválido." };
    }
    preco = plano.precos[porte];
    servicoNome = servicoPlano;

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
    porteVeiculo: porte,
    tipoAtendimento,
    dia,
    horario,
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
    assinaturaId,
  });

  if (!resultado.ok) {
    return { erro: resultado.erro };
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath(`/admin/clientes/${clienteId}`);
  redirect(`/admin/clientes/${clienteId}`);
}
