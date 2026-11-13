import { $, $$, REDUZ, Ciclo } from "./util.js";
import { emDobraFechada } from "./enxuto.js";

const fmt = (n, moeda) => (moeda ? "R$ " : "") + n.toLocaleString("pt-BR");

let raiz, abas, partes, nums, dica, tablist;
let atual = "orc", ciclo = null;
let iniciado = false, visivel = false, pausado = false, foco = false, mexeu = false;

const visiveis = () => abas.filter((b) => !b.hidden);

/** Em telas estreitas a faixa das abas rola de lado: traz a aba acesa para dentro dela (só a faixa rola, a página não). */
function trazerParaDentro(b) {
  const L = tablist.getBoundingClientRect(), r = b.getBoundingClientRect();
  if (r.left < L.left || r.right > L.right) tablist.scrollTo({ left: tablist.scrollLeft + r.left - L.left - 8 });
}

function mostrar(id, animar = true) {
  atual = id;
  for (const b of abas) {
    const sel = b.dataset.aba === id;
    b.setAttribute("aria-selected", String(sel));
    b.tabIndex = sel ? 0 : -1;
    if (sel) trazerParaDentro(b);
  }
  partes.forEach((p) => { p.hidden = p.dataset.aba !== id; p.classList.remove("vivo"); });
  const p = partes.find((x) => x.dataset.aba === id);
  if (!animar || REDUZ) { p.classList.add("vivo"); return; }
  void p.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("vivo")));
}

function contar() {
  nums.forEach((b) => {
    const alvo = Number(b.dataset.n), moeda = b.hasAttribute("data-moeda");
    if (pausado) { b.textContent = fmt(alvo, moeda); return; }
    const t0 = performance.now();
    const f = (agora) => {
      if (pausado) { b.textContent = fmt(alvo, moeda); return; }
      const k = Math.min(1, (agora - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
      b.textContent = fmt(Math.round(alvo * e), moeda);
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
}

/** Troca de aba a cada 6 s, só enquanto o painel está na tela, sem pausa, sem foco nas abas e sem ninguém ter mexido. */
async function girar(meu) {
  try {
    for (;;) {
      await meu.espera(6000);
      const lista = visiveis();
      mostrar(lista[(lista.findIndex((b) => b.dataset.aba === atual) + 1) % lista.length].dataset.aba);
    }
  } catch (e) {
    if (e?.name !== "Parou") throw e;
  }
}

function atualizar() {
  const deve = iniciado && visivel && !pausado && !foco && !mexeu && !REDUZ;
  if (deve && !ciclo) { ciclo = new Ciclo(); girar(ciclo).catch((e) => console.error("Falha no painel:", e)); }
  if (!deve && ciclo) { ciclo.parar(); ciclo = null; }
}

function escolher(b, { focar = false } = {}) {
  mexeu = true;
  mostrar(b.dataset.aba);
  if (focar) b.focus();
  atualizar();
}

function teclado(e) {
  const lista = visiveis();
  const i = lista.indexOf(e.currentTarget);
  let alvo;
  if (e.key === "ArrowRight") alvo = lista[(i + 1) % lista.length];
  else if (e.key === "ArrowLeft") alvo = lista[(i - 1 + lista.length) % lista.length];
  else if (e.key === "Home") alvo = lista[0];
  else if (e.key === "End") alvo = lista[lista.length - 1];
  else return;
  e.preventDefault();
  escolher(alvo, { focar: true });
}

function aoPassarOMouse(e) {
  const alvo = e.target.closest("[data-dica]");
  if (!alvo) { dica.style.opacity = 0; return; }
  const r = raiz.getBoundingClientRect();
  dica.textContent = alvo.dataset.dica;
  dica.style.left = Math.max(8, Math.min(e.clientX - r.left + 12, r.width - dica.offsetWidth - 8)) + "px";
  dica.style.top = (e.clientY - r.top - 34) + "px";
  dica.style.opacity = 1;
}

export function iniciarPainel() {
  if (iniciado) return;
  raiz = $("#painel");
  if (!raiz) return;
  abas = $$(".p-abas [role=tab]", raiz);
  partes = $$(".p-aba", raiz);
  nums = $$(".p-kpis b[data-n]", raiz);
  dica = $(".p-dica", raiz);
  tablist = $(".p-abas", raiz);

  mostrar("orc", false);
  abas.forEach((b) => {
    b.addEventListener("click", () => escolher(b));
    b.addEventListener("keydown", teclado);
  });
  tablist.addEventListener("focusin", () => { foco = true; atualizar(); });
  tablist.addEventListener("focusout", (e) => { if (!tablist.contains(e.relatedTarget)) { foco = false; atualizar(); } });
  raiz.addEventListener("mousemove", aoPassarOMouse);
  raiz.addEventListener("mouseleave", () => (dica.style.opacity = 0));

  iniciado = true;
  if (REDUZ) return;
  nums.forEach((b) => (b.textContent = fmt(0, b.hasAttribute("data-moeda"))));
  let contou = false, cruzando = false;
  // Dentro de uma dobra fechada do celular o painel não conta como visível (o observador pode
  // avisar "cruzando" para um elemento sem altura). Ao abrir ou fechar a dobra, confere de novo.
  const avaliar = () => {
    visivel = cruzando && !emDobraFechada(raiz);
    if (visivel && !contou) { contou = true; contar(); }
    atualizar();
  };
  new IntersectionObserver((entradas) => {
    cruzando = entradas[entradas.length - 1].isIntersecting;
    avaliar();
  }, { threshold: 0.2 }).observe(raiz);
  document.addEventListener("poty:dobra", avaliar);
}

/** Para a troca de abas (botão "Pausar animações"). */
export function pausar() { pausado = true; atualizar(); }
/** Retoma a troca de abas. */
export function continuar() { pausado = false; atualizar(); }
