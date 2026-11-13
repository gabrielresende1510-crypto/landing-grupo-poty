// Topo fixo: mede a altura real do .s-topo e guarda em --topo no <html>.
// O CSS usa a variável no scroll-padding-top (o foco não fica atrás do topo) e o
// servicos.js no irPara(). O base.css traz um valor de reserva por largura, para quem não tem JS.
import { $ } from "./util.js";

let obs = null;

export function iniciarTopo() {
  if (obs) return;
  const topo = $(".s-topo");
  if (!topo) return;
  const raiz = document.documentElement;
  const medir = () => raiz.style.setProperty("--topo", Math.ceil(topo.getBoundingClientRect().height) + "px");
  medir();
  // Muda com a largura (quebra de linha, celular girado) e quando as fontes chegam.
  obs = new ResizeObserver(medir);
  obs.observe(topo);
}
