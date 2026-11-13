import { $, $$, REDUZ, quandoVisivel } from "./util.js";

/** Cada post parte de um ponto sorteado e se arruma na grade quando a cena aparece. */
function espalhar(posts) {
  posts.forEach((p, i) => {
    p.style.setProperty("--x", Math.round((Math.random() - 0.5) * 220) + "px");
    p.style.setProperty("--y", Math.round((Math.random() - 0.5) * 160) + "px");
    p.style.setProperty("--d", (0.05 + i * 0.07).toFixed(2) + "s");
  });
}

export function iniciarCriativos() {
  const cena = $("#cena-cr");
  if (!cena) return;
  if (REDUZ) { cena.classList.add("vivo"); return; }
  espalhar($$("#grade9 .post"));
  quandoVisivel(cena, () => cena.classList.add("vivo"), { limiar: 0.25 });
}
