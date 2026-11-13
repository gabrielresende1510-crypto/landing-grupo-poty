import { $$, retomarDoHistorico, guardarHistorico } from "./util.js";

const CELULAR = matchMedia("(max-width: 719px)");

/**
 * Celular enxuto: dobras com botão "+" e cartões das cenas que ganham um botão. Só abaixo de 720 px.
 * O <li> do cartão continua item de lista: o botão fica dentro dele, com o título, e controla o texto (<span>).
 */
export function iniciarEnxuto() {
  const dobras = $$(".dobra");
  const avisar = () => document.dispatchEvent(new CustomEvent("poty:dobra"));

  const abrirDobra = (d, aberta) => {
    d.classList.toggle("aberta", aberta);
    d.querySelector(".d-bt").setAttribute("aria-expanded", String(aberta));
    d.querySelector(".d-corpo").inert = CELULAR.matches && !aberta;
  };

  // As dobras abertas ficam anotadas no histórico (M3). Ao voltar, a dobra já nasce
  // aberta junto com a classe enx, então não há animação de abrir.
  const CHAVE = "poty-dobras";
  const salvas = retomarDoHistorico(CHAVE);
  const lembrar = () => guardarHistorico(CHAVE, dobras.filter((d) => d.classList.contains("aberta")).map((d) => d.id));

  dobras.forEach((d) => {
    d.classList.add("enx");
    if (Array.isArray(salvas) && salvas.includes(d.id)) abrirDobra(d, true);
    d.querySelector(".d-bt").addEventListener("click", () => {
      abrirDobra(d, !d.classList.contains("aberta"));
      lembrar();
      avisar();
    });
  });

  const marcar = (c, aberto) => {
    c.li.classList.toggle("aberto", aberto);
    c.bt.setAttribute("aria-expanded", String(aberto));
  };
  const cartoes = [];
  $$(".cena .itens li").forEach((li, k) => {
    const titulo = li.querySelector(":scope > b"), texto = li.querySelector(":scope > span");
    if (!titulo || !texto) return;
    if (!texto.id) texto.id = "cartao-" + k;
    const bt = document.createElement("button");
    bt.type = "button";
    bt.className = "c-bt";
    bt.setAttribute("aria-controls", texto.id);
    const c = { li, titulo, bt };
    bt.addEventListener("click", () => marcar(c, !li.classList.contains("aberto")));
    cartoes.push(c);
  });

  // Abaixo de 720 px: o título entra no botão e as dobras fechadas ficam inertes.
  // A partir de 720 px, o botão sai, o título volta como texto e tudo fica aberto.
  const aplicar = () => {
    const cel = CELULAR.matches;
    for (const c of cartoes) {
      c.li.classList.toggle("cartao", cel);
      if (cel && !c.bt.isConnected) {
        c.titulo.replaceWith(c.bt);
        c.bt.append(c.titulo);
        marcar(c, c.li.classList.contains("aberto"));
      } else if (!cel && c.bt.isConnected) {
        c.bt.replaceWith(c.titulo);
        c.li.classList.remove("aberto");
      }
    }
    dobras.forEach((d) => { d.querySelector(".d-corpo").inert = cel && !d.classList.contains("aberta"); });
    avisar();
  };
  CELULAR.addEventListener("change", aplicar);
  aplicar();
}

/** Diz se o elemento está dentro de uma dobra fechada do celular (não conta como visível). */
export function emDobraFechada(el) {
  const d = el.closest(".dobra.enx");
  return !!d && CELULAR.matches && !d.classList.contains("aberta");
}
