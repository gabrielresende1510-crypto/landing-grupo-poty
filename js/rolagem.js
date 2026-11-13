import { guardarHistorico, retomarDoHistorico } from "./util.js";

/**
 * Voltar da privacidade (ou recarregar) cai no mesmo ponto da página (M3). O navegador do iPhone devolve
 * a rolagem cedo demais, antes de as dobras do celular fecharem, e o ponto escorrega. Por isso a página
 * anota a rolagem na própria entrada do histórico e, quando a pessoa volta, devolve ela mesma.
 */
const CHAVE = "poty-rolagem";
let gravada = null;

/** Rola na hora até y, mesmo com scroll-behavior:smooth no <html>. */
function rolarNaHora(y) {
  const raiz = document.documentElement, antes = raiz.style.scrollBehavior;
  raiz.style.scrollBehavior = "auto";
  window.scrollTo(0, y);
  raiz.style.scrollBehavior = antes;
}

// O Safari limita as gravações no histórico (cerca de 100 a cada 30 s): só grava quando a rolagem muda de verdade.
function lembrar() {
  const y = Math.round(window.scrollY);
  if (Math.abs(y - (gravada ?? -1e9)) < 4) return;
  if (!guardarHistorico(CHAVE, y)) {
    // Recusada: o ponto anotado ficou velho. Quem devolve volta a ser o navegador, e a página tenta de novo na próxima parada.
    try { history.scrollRestoration = "auto"; } catch (e) {}
    return;
  }
  gravada = y;
  // Com a rolagem anotada, quem devolve é a página.
  try { history.scrollRestoration = "manual"; } catch (e) {}
}

function devolver() {
  const y = retomarDoHistorico(CHAVE);
  // Só devolve se, ao sair, a página tinha assumido a devolução (a última gravação deu certo).
  let manual = false;
  try { manual = history.scrollRestoration === "manual"; } catch (e) {}
  if (!Number.isFinite(y) || !manual) return;
  gravada = y;
  // Se a pessoa mexer na página antes do fim do carregamento, a rolagem dela vale.
  let mexeu = false;
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { mexeu = true; }, { once: true, passive: true });
  const rolar = () => { if (!mexeu) rolarNaHora(y); };
  // Depois que todas as partes da página iniciaram (as dobras do celular reabrem no enxuto.js)...
  queueMicrotask(rolar);
  // ...e de novo quando as fontes e o resto da página terminam de mexer na altura.
  document.fonts?.ready.then(rolar);
  if (document.readyState !== "complete") addEventListener("load", rolar, { once: true });
}

export function iniciarRolagem() {
  devolver();
  // Anota quando a rolagem para (e não a cada quadro), ao esconder a aba e ao sair da página.
  let espera = 0;
  addEventListener("scroll", () => { clearTimeout(espera); espera = setTimeout(lembrar, 500); }, { passive: true });
  addEventListener("pagehide", lembrar);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") lembrar(); });
}
