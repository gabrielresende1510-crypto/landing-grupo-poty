// Aviso de cookies e Google Analytics. Nada do Google carrega antes do "Aceitar".
import { GA_ID } from "./config.js";
import { $, $$, ler, guardar, focarPrincipal } from "./util.js";

const CHAVE = "poty-cookies";
let carregado = false;
let gatilho = null; // botão que reabriu o aviso, para devolver o foco
let obsFaixa = null; // mede a faixa enquanto ela está na tela

const aviso = () => $("#cookies");

/** Injeta o gtag.js e liga a medição. Só roda depois do aceite. */
function carregar() {
  if (!GA_ID) return;
  window["ga-disable-" + GA_ID] = false;
  if (carregado) return;
  carregado = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });
}

/** Desliga a medição na hora e apaga os cookies _ga e _ga_* deste site. */
function desligar() {
  if (GA_ID) window["ga-disable-" + GA_ID] = true;
  const partes = location.hostname.split(".");
  const dominios = [null];
  for (let i = 0; i < partes.length - 1; i++) dominios.push("." + partes.slice(i).join("."));
  for (const par of document.cookie.split(";")) {
    const nome = par.split("=")[0].trim();
    if (!/^(_ga(_.+)?|_gid|_gat.*)$/.test(nome)) continue;
    for (const d of dominios) {
      document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (d ? `; domain=${d}` : "");
    }
  }
}

/**
 * Enquanto a faixa está na tela, a página ganha embaixo o espaço dela (padding do body) e o foco
 * para acima dela (scroll-padding do html): o fim da página e o rodapé não ficam escondidos (WCAG 2.4.11).
 */
function reservar(el) {
  const aplicar = () => {
    const h = el.hidden ? 0 : Math.ceil(el.getBoundingClientRect().height);
    document.body.style.paddingBottom = h ? h + "px" : "";
    document.documentElement.style.scrollPaddingBottom = h ? h + "px" : "";
  };
  aplicar();
  if (!obsFaixa) { obsFaixa = new ResizeObserver(aplicar); obsFaixa.observe(el); } // a faixa muda de altura com a largura
}
function liberar() {
  obsFaixa?.disconnect();
  obsFaixa = null;
  document.body.style.paddingBottom = "";
  document.documentElement.style.scrollPaddingBottom = "";
}

function mostrar() {
  const el = aviso();
  if (!el) return;
  el.hidden = false;
  reservar(el);
}

/** Espera a abertura sair antes de mostrar o aviso (por baixo dela, o teclado chegaria nos botões). */
function mostrarQuandoLivre() {
  const html = document.documentElement;
  if (!html.classList.contains("com-abertura")) { mostrar(); return; }
  const obs = new MutationObserver(() => {
    if (html.classList.contains("com-abertura")) return;
    obs.disconnect(); mostrar();
  });
  obs.observe(html, { attributes: true, attributeFilter: ["class"] });
}

let atual = null; // a escolha que vale nesta página aberta

function escolher(valor) {
  guardar(CHAVE, valor);
  atual = valor;
  const el = aviso();
  const focoNoAviso = !!el && el.contains(document.activeElement);
  if (el) el.hidden = true;
  liberar();
  if (valor === "aceito") carregar();
  else desligar(); // recusa: a flag liga e os cookies do Google saem, se houver
  // O botão sumiu com a faixa: o foco volta a quem reabriu o aviso ou, no aviso inicial, vai ao título.
  if (gatilho && document.contains(gatilho)) gatilho.focus();
  else if (focoNoAviso) focarPrincipal();
  gatilho = null;
}

/** Reabre o aviso para a pessoa mudar a escolha. */
export function abrirPreferencias() {
  if (!GA_ID) return;
  const ativo = document.activeElement;
  gatilho = ativo && ativo !== document.body ? ativo : null;
  mostrar();
  aviso()?.focus();
}

export function iniciarConsentimento() {
  if (!GA_ID) return;
  for (const b of $$("[data-revogar]")) {
    b.hidden = false;
    b.closest(".rev")?.removeAttribute("hidden");
    b.addEventListener("click", abrirPreferencias);
  }
  const el = aviso();
  if (el) {
    $("[data-cookies='aceitar']", el)?.addEventListener("click", () => escolher("aceito"));
    $("[data-cookies='recusar']", el)?.addEventListener("click", () => escolher("recusado"));
  }
  const escolha = (atual = ler(CHAVE));
  if (escolha === "aceito") carregar();
  else if (escolha !== "recusado") mostrarQuandoLivre();
  // Voltou pela memória do navegador (bfcache), sem carregar de novo: a escolha pode ter mudado em
  // outra página (as Preferências da privacidade). Se mudou, carrega de novo para valer a escolha
  // nova; o que estava aberto e a rolagem voltam juntos (servicos.js).
  addEventListener("pageshow", (e) => { if (e.persisted && ler(CHAVE) !== atual) location.reload(); });
}
