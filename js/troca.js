// Primeira tela: o final do título troca a cada 2,8 s.
import { $$, REDUZ, tempo } from "./util.js";

// Os finais são buscados em iniciar(): o módulo não toca no DOM ao ser importado.
let spans = [];
let i = 0, relogio = 0, pausado = false, ligado = false;

function mostra(n) {
  spans.forEach((s, k) => {
    s.classList.toggle("on", k === n);
    s.classList.toggle("sai", k === i && k !== n);
  });
  i = n;
}

/** Liga a troca. Chamar de novo não faz nada. Com movimento reduzido, fica o primeiro final. */
export function iniciar() {
  if (ligado || REDUZ) return;
  spans = $$("#troca span");
  if (!spans.length) return;
  ligado = true;
  girar();
}

function girar() {
  if (relogio || pausado || !ligado) return;
  relogio = setInterval(() => mostra((i + 1) % spans.length), tempo(2800));
}

/** Para a troca e deixa o final que está na tela. Vale também antes de iniciar(). */
export function pausar() { pausado = true; clearInterval(relogio); relogio = 0; }
/** Volta a trocar, se já foi iniciada. */
export function continuar() { pausado = false; girar(); }

export function parar() {
  clearInterval(relogio); relogio = 0; ligado = false;
  spans.forEach((s, k) => { s.classList.toggle("on", k === 0); s.classList.remove("sai"); });
  i = 0;
}
