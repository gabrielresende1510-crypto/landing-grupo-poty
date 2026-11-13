// Botão "Pausar animações" (WCAG 2.2.2): para todo movimento que começa sozinho.
import { $, ler, guardar } from "./util.js";

const CHAVE = "poty-movimento";
const raiz = document.documentElement;
let parou = false;

function aplicar(botao) {
  if (parou) raiz.dataset.movimento = "parado"; else delete raiz.dataset.movimento;
  botao?.setAttribute("aria-pressed", String(parou));
}

/** Liga o botão #movimento. aoMudar(parado) roda no início, se já estava parado, e a cada clique. */
export function iniciarMovimento(aoMudar) {
  const botao = $("#movimento");
  parou = ler(CHAVE) === "parado";
  aplicar(botao);
  if (parou) aoMudar(true);
  botao?.addEventListener("click", () => {
    parou = !parou;
    guardar(CHAVE, parou ? "parado" : "livre");
    aplicar(botao);
    aoMudar(parou);
  });
}

export function parado() { return parou; }
