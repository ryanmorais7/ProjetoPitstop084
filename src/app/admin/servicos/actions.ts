"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { catalogoConfig } from "@/db/schema";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { catalogoPadrao, chaveAjustePlano, itemPorId } from "@/lib/catalogo";
import { chavesConfiguracao, salvarConfiguracoes } from "@/lib/configuracoes";
import { categoriasCuidado, planoValido } from "@/lib/data";

/** "199,90" → 199.9. Vazio ou inválido = null (volta a valer o padrão do catálogo). */
function numero(valor: FormDataEntryValue | null): number | null {
  const bruto = String(valor ?? "").trim();
  // com vírgula decimal, ponto é separador de milhar ("1.299,90")
  const texto = bruto.includes(",") ? bruto.replace(/\./g, "").replace(",", ".") : bruto;
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const preco = (valor: FormDataEntryValue | null): string | null => numero(valor)?.toFixed(2) ?? null;

function minutos(valor: FormDataEntryValue | null): number | null {
  const n = numero(valor);
  return n != null && n > 0 ? Math.min(Math.round(n), 24 * 60) : null;
}

type Ajuste = Omit<typeof catalogoConfig.$inferInsert, "itemId" | "updatedAt">;

async function gravarAjuste(itemId: string, ajuste: Ajuste) {
  await db
    .insert(catalogoConfig)
    .values({ itemId, ...ajuste })
    .onConflictDoUpdate({ target: catalogoConfig.itemId, set: { ...ajuste, updatedAt: new Date() } });
  // landing, agendamento e admin leem o mesmo catálogo: o ajuste vale na hora
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

/**
 * Ajusta um serviço do catálogo (preço, duração, ativo...). O serviço em si continua definido em
 * src/lib/data.ts; aqui só se grava a diferença. Nome de lavagem/manutenção de plano não muda:
 * é a chave das cotas do PitPass.
 */
export async function salvarServico(itemId: string, formData: FormData) {
  await exigirSessaoAdmin();
  const item = itemPorId(catalogoPadrao, itemId);
  if (!item) return;

  const marcado = (campo: string) => formData.get(campo) === "on";
  const categoria = String(formData.get("categoria") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const temPreco = !item.beneficioDePlano;

  await gravarAjuste(itemId, {
    nome: !item.beneficioDePlano && nome && nome !== item.nome ? nome : null,
    categoria: item.tipo === "adicional" && categoria in categoriasCuidado ? categoria : null,
    precoP: temPreco ? preco(formData.get("precoP")) : null,
    precoG: temPreco ? preco(formData.get("precoG")) : null,
    precoMoto: temPreco ? preco(formData.get("precoMoto")) : null,
    duracaoMin: minutos(formData.get("duracaoMin")),
    ativo: marcado("ativo"),
    requerAvaliacao: temPreco ? marcado("requerAvaliacao") : null,
    requerDetailer: marcado("requerDetailer"),
    requerLavador: marcado("requerLavador"),
    podeSerAdicional: item.tipo === "adicional" ? marcado("podeSerAdicional") : null,
  });
}

/** Mensalidade e ativação de um plano (os benefícios e cotas continuam no catálogo). */
export async function salvarPlano(planoId: string, formData: FormData) {
  await exigirSessaoAdmin();
  if (!planoValido(planoId)) return;
  await gravarAjuste(chaveAjustePlano(planoId), {
    precoP: preco(formData.get("precoP")),
    precoG: preco(formData.get("precoG")),
    precoMoto: preco(formData.get("precoMoto")),
    ativo: formData.get("ativo") === "on",
  });
}

/** Configurações do negócio: buffer da agenda e dados que saem no recibo. */
export async function salvarConfiguracoesNegocio(formData: FormData) {
  await exigirSessaoAdmin();
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim() || null;
  await salvarConfiguracoes({
    [chavesConfiguracao.bufferMin]: String(minutos(formData.get("bufferMin")) ?? 0),
    [chavesConfiguracao.empresaNome]: texto("empresaNome"),
    [chavesConfiguracao.empresaDocumento]: texto("empresaDocumento"),
    [chavesConfiguracao.empresaEndereco]: texto("empresaEndereco"),
    [chavesConfiguracao.empresaTelefone]: texto("empresaTelefone"),
    [chavesConfiguracao.reciboObservacao]: texto("reciboObservacao"),
  });
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}
