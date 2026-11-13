import { $, ler, guardar } from "./util.js";

export function iniciarTema() {
  const html = document.documentElement;
  const botao = $("#tema");
  if (!botao) return;
  const rotular = () => botao.setAttribute("aria-label", html.dataset.tema === "escuro" ? "Mudar para o tema claro" : "Mudar para o tema escuro");
  rotular();
  botao.addEventListener("click", () => {
    const novo = html.dataset.tema === "escuro" ? "claro" : "escuro";
    html.dataset.tema = novo;
    guardar("poty-tema", novo);
    rotular();
  });
  // Sem escolha guardada, acompanha o sistema.
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (ler("poty-tema")) return;
    html.dataset.tema = e.matches ? "escuro" : "claro";
    rotular();
  });
}
