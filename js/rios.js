// Primeira tela: os dois rios de pontos (Sol e Rio) que se encontram no Y.
import { $, REDUZ } from "./util.js";

// Elementos buscados em iniciar(): o módulo não toca no DOM ao ser importado.
let c = null, g = null, hero = null, txt = null;
const raiz = document.documentElement;

let W = 0, H = 0, P = null, caixa = null, larg = 22, parts = [], cores = {};
let id = 0, ult = 0, vel = 1;
let ligado = false, visivel = false, pausado = false, esperaMedir = 0;
let obsVista = null, obsTamanho = null, obsTema = null;

// Ponto (bzX, bzY) e direção (tgX, tgY) da curva: bz() e tg() escrevem nestas variáveis em vez
// de criar dois arrays por ponto a cada quadro (centenas de pontos, 60 vezes por segundo).
let bzX = 0, bzY = 0, tgX = 0, tgY = 0;
const bz = (p, t) => {
  const u = 1 - t;
  bzX = u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0];
  bzY = u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1];
};
const tg = (p, t) => {
  const u = 1 - t;
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  const L = Math.hypot(dx, dy) || 1;
  tgX = dx / L; tgY = dy / L;
};

function medir() {
  const r = hero.getBoundingClientRect();
  W = r.width; H = r.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const estreito = W < 720;
  const jy = H * (estreito ? 0.9 : 0.86);
  const xa = W * (estreito ? 0.07 : 0.14), xb = W - xa;
  P = {
    L: [[xa, -24], [xa, jy * 0.58], [W / 2, jy * 0.5], [W / 2, jy]],
    R: [[xb, -24], [xb, jy * 0.58], [W / 2, jy * 0.5], [W / 2, jy]],
    S: [[W / 2, jy], [W / 2, jy + (H - jy) * 0.4], [W / 2, H - (H - jy) * 0.2], [W / 2, H + 30]]
  };
  const tr = txt.getBoundingClientRect();
  caixa = { x0: tr.left - r.left - 10, x1: tr.right - r.left + 10, y0: tr.top - r.top - 10, y1: tr.bottom - r.top + 10 };
  larg = estreito ? 12 : 22;
}

function novo(braco, comeco) {
  return {
    b: braco, f: 0,
    t: comeco ? -Math.random() * 1.15 : -Math.random() * 0.12,
    v: 0.115 + Math.random() * 0.05,
    off: Math.random() + Math.random() - 1,
    r: 1.1 + Math.random() * 1.7
  };
}

// L = rio Sol, R = rio claro (a cor do "Poty" do logo, que muda com o tema).
function lerCores() {
  const cs = getComputedStyle(raiz);
  cores = { L: cs.getPropertyValue("--sol").trim() || "#F0A83A", R: cs.getPropertyValue("--logo-poty").trim() || "#0E4250" };
}

function passo(dt) {
  for (const p of parts) {
    p.t += p.v * dt * (p.f ? 2.4 : 1) * vel;
    if (p.t >= 1) {
      if (!p.f) { p.f = 1; p.t = 0; } else Object.assign(p, novo(Math.random() < 0.5 ? "L" : "R", false));
    }
  }
}

function leito() {
  const faixa = (p, cor, w) => {
    g.beginPath(); g.moveTo(p[0][0], p[0][1]);
    g.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
    g.strokeStyle = cor; g.lineWidth = w; g.stroke();
  };
  g.save(); g.lineCap = "butt";
  g.globalAlpha = W < 720 ? 0.07 : 0.09;
  faixa(P.L, cores.L, larg * 1.5); faixa(P.R, cores.R, larg * 1.5);
  g.globalAlpha = 0.07; faixa(P.S, cores.R, larg * 1.7);
  g.restore();
}

function pinta() {
  g.clearRect(0, 0, W, H);
  leito();
  for (const p of parts) {
    if (p.t < 0) continue;
    const path = p.f ? P.S : P[p.b];
    bz(path, p.t); tg(path, p.t);
    const x = bzX, y = bzY, tx = tgX, ty = tgY;
    const w = p.f ? larg * 0.85 : larg * (1 - 0.5 * p.t);
    const X = x - ty * p.off * w, Y = y + tx * p.off * w;
    let a = 0.85;
    if (!p.f && p.t < 0.07) a *= p.t / 0.07;
    if (p.f) a *= 1 - p.t * 0.75;
    if (X > caixa.x0 && X < caixa.x1 && Y > caixa.y0 && Y < caixa.y1) a *= 0.2;
    g.globalAlpha = a; g.fillStyle = cores[p.b];
    g.beginPath(); g.arc(X, Y, p.r, 0, 6.2832); g.fill();
  }
  g.globalAlpha = 1;
}

function quadro(agora) {
  const dt = Math.min(0.05, (agora - ult) / 1000);
  ult = agora;
  vel = 1 + (vel - 1) * 0.965;
  passo(dt); pinta();
  id = requestAnimationFrame(quadro);
}

function girar() {
  if (id || REDUZ || pausado || !ligado || !visivel) return;
  ult = performance.now();
  id = requestAnimationFrame(quadro);
}
function frear() { cancelAnimationFrame(id); id = 0; }

/** Liga os rios. Chamar de novo não faz nada. */
export function iniciar() {
  if (ligado) return;
  c = $("#rios"); hero = $("#hero"); txt = $("#hero-txt");
  if (!c || !hero) return;
  g = c.getContext("2d");
  ligado = true;
  medir(); lerCores();
  const n = W < 720 ? 320 : 640;
  parts = Array.from({ length: n }, (_, i) => novo(i % 2 ? "L" : "R", true));
  if (REDUZ || pausado) {
    // Parado desde o começo: um quadro só, como no movimento reduzido.
    parts.forEach((p) => (p.t = Math.random()));
    pinta();
  }
  if (!REDUZ) {
    visivel = true; // o observador corrige no primeiro aviso
    obsVista = new IntersectionObserver((es) => {
      visivel = es[es.length - 1].isIntersecting;
      if (visivel) girar(); else frear();
    });
    obsVista.observe(hero);
    girar();
  }
  // Janela redimensionada ou celular girado: mede de novo, no máximo a cada 150 ms.
  obsTamanho = new ResizeObserver(() => {
    clearTimeout(esperaMedir);
    esperaMedir = setTimeout(() => { medir(); if (REDUZ || pausado) pinta(); }, 150);
  });
  obsTamanho.observe(hero);
  // Tema trocado: as cores mudam na hora.
  obsTema = new MutationObserver(() => { lerCores(); if (REDUZ || pausado) pinta(); });
  obsTema.observe(raiz, { attributes: true, attributeFilter: ["data-tema"] });
}

/** Dá um empurrão nos pontos; a velocidade volta ao normal sozinha. */
export function pulso() { vel = 3.4; }

/** Para o laço e deixa o desenho atual na tela. Vale também antes de iniciar(). */
export function pausar() {
  pausado = true; frear();
  if (P && ligado) pinta(); // se a tela acabou de ser medida (o canvas esvaziou), o desenho não pode sumir
}
/** Volta a animar, se o hero estiver na tela. */
export function continuar() { pausado = false; girar(); }

export function parar() {
  ligado = false; visivel = false;
  frear();
  clearTimeout(esperaMedir);
  for (const o of [obsVista, obsTamanho, obsTema]) o?.disconnect();
  obsVista = obsTamanho = obsTema = null;
  g?.clearRect(0, 0, c.width, c.height);
}
