import { VELOCIDADE } from "./config.js";

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const tempo = (ms) => (REDUZ ? 0 : ms * VELOCIDADE);

export const EASE = "cubic-bezier(.65,0,.35,1)";
export const SAI = "cubic-bezier(.22,1,.36,1)";

/** Controla uma sequência de esperas que pode ser cancelada de uma vez. */
export class Ciclo {
  ativo = true;
  #pendentes = new Set();
  espera(ms) {
    return new Promise((resolve, reject) => {
      const parou = () => { const e = new Error("Parou"); e.name = "Parou"; return e; };
      if (!this.ativo) return reject(parou());
      const item = { id: 0, rejeitar: () => reject(parou()) };
      item.id = setTimeout(() => { this.#pendentes.delete(item); resolve(); }, tempo(ms));
      this.#pendentes.add(item);
    });
  }
  parar() {
    this.ativo = false;
    for (const p of this.#pendentes) { clearTimeout(p.id); p.rejeitar(); }
    this.#pendentes.clear();
  }
}

/**
 * Chama fn quando el aparece na tela. margem segue o rootMargin do IntersectionObserver (ex.: "0px 0px -10% 0px"
 * só conta o que passou dos 90% da altura da tela). Devolve uma função que cancela a observação.
 */
export function quandoVisivel(el, fn, { limiar = 0.3, umaVez = true, margem = "0px" } = {}) {
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      fn(e);
      if (umaVez) obs.disconnect();
    }
  }, { threshold: limiar, rootMargin: margem });
  obs.observe(el);
  return () => obs.disconnect();
}

export function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
export function guardar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) {} }
export function lerSessao(chave) { try { return sessionStorage.getItem(chave); } catch (e) { return null; } }
export function guardarSessao(chave, valor) { try { sessionStorage.setItem(chave, valor); } catch (e) {} }

/**
 * As dobras abertas do celular ficam na própria entrada do histórico (history.state). Voltam junto
 * com o botão voltar e com a recarga, começam vazias num link novo e somem quando a aba fecha.
 */
const estadoDoHistorico = () => { try { const s = history.state; return s && typeof s === "object" ? s : {}; } catch (e) { return {}; } };
/** Devolve false se o navegador recusou a gravação (o Safari limita quantas vezes por minuto). */
export function guardarHistorico(chave, valor) { try { history.replaceState({ ...estadoDoHistorico(), [chave]: valor }, ""); return true; } catch (e) { return false; } }

/** A pessoa voltou para esta página (botão voltar ou recarga), e não chegou por um link novo. */
export function voltou() {
  try { const t = performance.getEntriesByType("navigation")[0]?.type; return t === "back_forward" || t === "reload"; } catch (e) { return false; }
}

/**
 * Devolve o que foi guardado só se a pessoa voltou. Num link novo para o mesmo endereço, o navegador
 * pode manter o estado antigo: aí ele é apagado, para não reabrir nada depois.
 */
export function retomarDoHistorico(chave) {
  const s = estadoDoHistorico();
  if (voltou()) return s[chave] ?? null;
  if (s[chave] != null) guardarHistorico(chave, null);
  return null;
}

/**
 * Leva o foco ao título principal da página (main h1), sem rolar. Usado quando
 * o elemento focado some (Pular, botões do aviso de cookies), para o foco não cair no body.
 */
export function focarPrincipal() {
  const h = $("main h1");
  if (!h) return;
  h.setAttribute("tabindex", "-1");
  h.focus({ preventScroll: true });
}

/** Altura atual do topo fixo, medida pelo topo.js (variável --topo no <html>). */
export function alturaTopo() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topo")) || 0;
}

/** Evento de medição. Só existe depois do aceite dos cookies (gtag). */
export function evento(nome, params = {}) {
  if (typeof window.gtag === "function") window.gtag("event", nome, params);
}
