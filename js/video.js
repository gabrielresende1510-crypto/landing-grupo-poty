import { $, $$, REDUZ, Ciclo, tempo } from "./util.js";

/** Vídeo de exemplo: quatro partes, cada uma com a sua legenda palavra por palavra. */
export const LEG = ["Você adia a consulta porque não sabe por onde começar?", "Será que isso é normal, ou já é hora de marcar uma avaliação?", "Na primeira consulta, explicamos cada passo, com calma.", "Fale com a clínica pelo WhatsApp."];
const DUR = 3600, PALAVRA = 150;

let passos, barras, leg, tela;
let iniciado = false, visivel = false, pausado = false, ciclo = null, parte = 0;
// Pausa no meio de uma parte: quanto já correu (em ms "nominais") e quantas palavras já acenderam.
let retomada = null, rodou = false;

const zerar = (b) => { b.getAnimations().forEach((a) => a.cancel()); b.style.transform = "scaleX(0)"; };

function legenda(n) {
  leg.textContent = "";
  return LEG[n].split(" ").map((w) => { const s = document.createElement("span"); s.textContent = w + " "; leg.append(s); return s; });
}

async function rodar(meu) {
  try {
    for (;;) {
      const n = parte;
      let palavras, t = 0;
      if (retomada) {
        // Continua de onde parou: a barra já existe (pausada) e a legenda já está escrita.
        ({ decorrido: t } = retomada); retomada = null;
        palavras = [...leg.children];
      } else {
        if (n === 0) barras.forEach(zerar);
        passos.forEach((p, k) => p.classList.toggle("on", k === n));
        zerar(barras[n]);
        barras[n].animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: tempo(DUR), fill: "forwards", easing: "linear" });
        palavras = legenda(n);
      }
      for (const [k, s] of palavras.entries()) {
        if (s.classList.contains("on")) continue;
        const quando = (k + 1) * PALAVRA;
        await meu.espera(Math.max(0, quando - t));
        t = Math.max(t, quando);
        s.classList.add("on");
      }
      await meu.espera(Math.max(0, DUR - t));
      parte = (n + 1) % 4;
    }
  } catch (e) {
    if (e?.name !== "Parou") throw e;
  }
}

function atualizar() {
  const deve = iniciado && visivel && !pausado && !REDUZ;
  if (deve && !ciclo) { rodou = true; ciclo = new Ciclo(); rodar(ciclo).catch((e) => console.error("Falha no vídeo:", e)); }
  if (!deve && ciclo) { ciclo.parar(); ciclo = null; }
}

/** Sem movimento: o quadro final, com todas as barras cheias. */
function quadroFinal() {
  passos.forEach((p, k) => p.classList.toggle("on", k === 3));
  barras.forEach((b) => { b.style.transform = "scaleX(1)"; });
  leg.textContent = LEG[3];
}

export function iniciarVideo() {
  if (iniciado) return;
  tela = $("#cena-video .v-tela");
  if (!tela) return;
  passos = $$("#cena-video .itens li").sort((a, b) => a.dataset.p - b.dataset.p);
  barras = $$(".v-barras b", tela);
  leg = $("#v-leg");
  iniciado = true;
  if (REDUZ) { quadroFinal(); return; }
  if (pausado) quadroFinal(); // pausa gravada desde o início: o quadro final, não um vídeo apagado
  else {
    passos.forEach((p) => p.classList.remove("on"));
    barras.forEach(zerar);
    leg.textContent = "";
  }
  new IntersectionObserver((entradas) => {
    visivel = entradas[entradas.length - 1].isIntersecting;
    atualizar();
  }, { threshold: 0.3 }).observe(tela);
}

/** Para o vídeo (botão "Pausar animações"). Retoma a partir da parte atual, no ponto em que parou. */
export function pausar() {
  if (ciclo && barras) {
    const a = barras[parte].getAnimations()[0];
    const ct = Number(a?.currentTime) || 0;
    retomada = a ? { decorrido: Math.min(DUR, ct / tempo(DUR) * DUR) } : null;
  }
  pausado = true;
  atualizar();
  barras?.forEach((b) => b.getAnimations().forEach((a) => { if (a.playState === "running") a.pause(); })); // as terminadas ficam como estão
  // Pausou antes de o vídeo rodar: mostra o quadro final, como no movimento reduzido.
  if (iniciado && !REDUZ && !rodou) quadroFinal();
}
/** Retoma o vídeo. Só as animações pausadas voltam a andar; as terminadas ficam cheias. */
export function continuar() {
  pausado = false;
  atualizar();
  barras?.forEach((b) => b.getAnimations().forEach((a) => { if (a.playState === "paused") a.play(); }));
}
