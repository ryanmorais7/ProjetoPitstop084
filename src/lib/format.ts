export function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";

  const ddd = digitos.slice(0, 2);
  const nono = digitos.slice(2, 3);
  const parte1 = digitos.slice(3, 7);
  const parte2 = digitos.slice(7, 11);

  let resultado = `(${ddd}`;
  if (digitos.length >= 2) resultado += ") ";
  if (nono) resultado += nono;
  if (digitos.length > 3) resultado += " ";
  if (parte1) resultado += parte1;
  if (digitos.length > 7) resultado += "-";
  if (parte2) resultado += parte2;

  return resultado;
}
