import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sessão do /admin com senha única, sem biblioteca de auth/sessão.
 * Usa apenas Web Crypto (crypto.subtle) para assinar/verificar o cookie.
 */

export const COOKIE_SESSAO = "pitstop_admin_sessao";
const DURACAO_SESSAO_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function chaveAssinatura(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hashHex(valor: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(valor));
  return toHex(digest);
}

/** Compara em tempo constante via hash — evita vazar o tamanho/prefixo da senha real por timing. */
export async function senhaValida(candidata: string): Promise<boolean> {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) return false;
  const [a, b] = await Promise.all([hashHex(candidata), hashHex(esperada)]);
  return a === b;
}

export async function criarTokenSessao(): Promise<string> {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("SESSION_SECRET não configurada");
  const expira = Date.now() + DURACAO_SESSAO_MS;
  const chave = await chaveAssinatura(segredo);
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(String(expira)));
  return `${expira}.${toHex(assinatura)}`;
}

/**
 * Confere a sessão a partir dos cookies da requisição atual. Usar dentro de cada
 * Server Component/Server Action protegida, não só no proxy — Server Functions são
 * chamadas POST pra rota de origem e podem escapar de um matcher mal configurado.
 */
export async function exigirSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESSAO)?.value;
  if (!(await tokenValido(token))) {
    redirect("/admin/login");
  }
}

export async function tokenValido(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiraStr, assinaturaHex] = token.split(".");
  if (!expiraStr || !assinaturaHex) return false;
  const expira = Number(expiraStr);
  if (Number.isNaN(expira) || expira < Date.now()) return false;

  const segredo = process.env.SESSION_SECRET;
  if (!segredo) return false;
  try {
    const chave = await chaveAssinatura(segredo);
    return crypto.subtle.verify(
      "HMAC",
      chave,
      fromHex(assinaturaHex),
      new TextEncoder().encode(expiraStr)
    );
  } catch {
    return false;
  }
}
