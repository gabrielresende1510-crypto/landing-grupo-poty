import { WHATSAPP, MENSAGENS } from "./config.js";
import { $$, evento } from "./util.js";

/** Link do wa.me com a mensagem. Sem número, devolve "#contato". */
export function linkWhatsApp(mensagem) {
  if (!WHATSAPP) return "#contato";
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

export function iniciarWhatsApp() {
  for (const a of $$("a[data-wa]")) {
    const link = linkWhatsApp(MENSAGENS[a.dataset.wa] ?? "");
    a.setAttribute("href", link);
    if (link === "#contato") {
      a.removeAttribute("target");
      a.removeAttribute("rel");
    } else {
      a.target = "_blank";
      a.rel = "noopener";
    }
    a.addEventListener("click", () => evento("clique_whatsapp", { botao: a.dataset.botao }));
  }
}
