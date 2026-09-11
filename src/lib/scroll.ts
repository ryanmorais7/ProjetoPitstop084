const ALTURA_HEADER = 72;

/**
 * Rola até a seção pelo id, sempre, mesmo se a hash da URL já for a mesma
 * (um link href="#id" só rola da primeira vez que a hash muda; cliques
 * repetidos no mesmo CTA viram clique morto). Usar isto em todo CTA de ação
 * (Agendar, Escolher serviço, Quero ser Premium/Diamante etc.), não em
 * `<Link href="#id">` puro.
 */
export function scrollToId(id: string) {
  const elemento = document.getElementById(id);
  if (!elemento) return;
  const top = elemento.getBoundingClientRect().top + window.scrollY - ALTURA_HEADER;
  window.scrollTo({ top, behavior: "smooth" });
}
