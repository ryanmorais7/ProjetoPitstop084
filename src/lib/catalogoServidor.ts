import { cache } from "react";
import { db } from "@/db/client";
import { catalogoConfig } from "@/db/schema";
import { AjusteCatalogo, Catalogo, catalogoPadrao, montarCatalogo } from "./catalogo";
import { bufferDaAgenda, lerConfiguracoes } from "./configuracoes";

const numero = (valor: string | null): number | null => (valor == null ? null : Number(valor));

/**
 * Catálogo vigente = padrões do código + ajustes do admin. Uma leitura por requisição.
 * Se a tabela de ajustes não existir (migração pendente) ou o banco falhar, devolve o catálogo
 * padrão: landing e agendamento nunca ficam fora do ar por causa de configuração.
 */
export const carregarCatalogo = cache(async (): Promise<Catalogo> => {
  try {
    const [linhas, config] = await Promise.all([db.select().from(catalogoConfig), lerConfiguracoes()]);
    const ajustes: AjusteCatalogo[] = linhas.map((l) => ({
      ...l,
      precoP: numero(l.precoP),
      precoG: numero(l.precoG),
      precoMoto: numero(l.precoMoto),
    }));
    return montarCatalogo(ajustes, bufferDaAgenda(config));
  } catch {
    return catalogoPadrao;
  }
});
