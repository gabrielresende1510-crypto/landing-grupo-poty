import { $, $$, REDUZ, Ciclo, evento, alturaTopo, quandoVisivel, voltou } from "./util.js";
import { pulso } from "./rios.js";

// Página contínua (13/nov/2026): todas as seções aparecem rolando. O hub é um índice: cada cartão é um
// link que desce até o seu serviço, e os braços do rio se desenham quando o hub aparece na tela.

// Elementos buscados em iniciarServicos(): o módulo não toca no DOM ao ser importado.
let hub = null, grade = null, ramos = null, cartoes = [], secoes = {};

let desenhado = false; // os braços já foram desenhados (com animação ou prontos)
let ciclo = new Ciclo();

/**
 * Rola até el, que fica logo abaixo do topo fixo (a altura real vem do topo.js, em --topo). "instant" salta na hora
 * sem depender de o navegador conhecer esse valor (Safari antigo): tira a rolagem suave do <html> só nesse salto.
 */
function irPara(el, comportamento = REDUZ ? "auto" : "smooth") {
  const top = el.getBoundingClientRect().top + window.scrollY - (alturaTopo() || 64);
  if (comportamento !== "instant") { window.scrollTo({ top, behavior: comportamento }); return; }
  const raiz = document.documentElement, antes = raiz.style.scrollBehavior;
  raiz.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  raiz.style.scrollBehavior = antes;
}

/**
 * Caminho de cada braço, na posição de repouso dos cartões (offsetTop não conta
 * o transform de entrada). Quatro numa linha: o rio sai do meio e abre em quatro
 * braços. Em coluna: desce pela esquerda e entra em cada cartão.
 */
function caminhos() {
  // #ramos começa --g acima da grade e tem a largura dela.
  const g = parseFloat(getComputedStyle(grade).getPropertyValue("--g")) || 0;
  const x0 = grade.clientWidth / 2;
  const y = (c) => c.offsetTop + g;
  const umaLinha = cartoes.every((c) => Math.abs(c.offsetTop - cartoes[0].offsetTop) < 4);
  if (umaLinha) {
    return cartoes.map((c) => {
      const x = c.offsetLeft + c.offsetWidth / 2, yc = y(c);
      return `M${x0} 0C${x0} ${yc * 0.55} ${x} ${yc * 0.45} ${x} ${yc}`;
    });
  }
  const xl = 12, yTopo = y(cartoes[0]);
  return cartoes.map((c) => {
    const ym = y(c) + c.offsetHeight / 2;
    return `M${x0} 0C${x0} ${yTopo * 0.7} ${xl} ${yTopo * 0.3} ${xl} ${yTopo}V${ym}H${c.offsetLeft}`;
  });
}

function desenhar() {
  ramos.innerHTML = caminhos().map((d) => `<path d="${d}"/><circle r="3.5"/>`).join("");
}

function desenharCompletos() {
  desenhar();
  cartoes.forEach((c) => c.classList.add("vivo"));
}

function animarRamos(meu) {
  desenhar();
  const trilhas = $$("path", ramos), pontos = $$("circle", ramos);
  trilhas.forEach((p, i) => {
    const L = p.getTotalLength(), dur = 650 + L * 1.1, t0 = performance.now() + i * 110;
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
    const quadro = (agora) => {
      if (!meu.ativo) return;
      const k = Math.max(0, Math.min(1, (agora - t0) / dur));
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      p.style.strokeDashoffset = L * (1 - e);
      const pt = p.getPointAtLength(L * e);
      pontos[i].setAttribute("cx", pt.x);
      pontos[i].setAttribute("cy", pt.y);
      pontos[i].style.opacity = k > 0 && k < 1 ? 1 : 0;
      if (k < 1) requestAnimationFrame(quadro);
      else { p.style.strokeDasharray = "none"; cartoes[i].classList.add("vivo"); }
    };
    requestAnimationFrame(quadro);
  });
}

/**
 * O hub apareceu na tela: os braços se desenham uma vez só. Quem voltou para a página (voltar ou
 * recarga) já viu a animação: os braços vêm prontos. Com movimento reduzido, também.
 */
function acenderHub() {
  if (desenhado) return;
  desenhado = true;
  document.body.classList.add("hub-visto"); // a seta do "Ver o que fazemos" para de balançar
  if (REDUZ || voltou()) { desenharCompletos(); return; }
  animarRamos(ciclo = new Ciclo());
}

/** Roda fn quando a abertura (html.com-abertura) já saiu da tela. */
function depoisDaAbertura(fn) {
  const raiz = document.documentElement;
  if (!raiz.classList.contains("com-abertura")) { fn(); return; }
  const obs = new MutationObserver(() => {
    if (raiz.classList.contains("com-abertura")) return;
    obs.disconnect();
    fn();
  });
  obs.observe(raiz, { attributes: true, attributeFilter: ["class"] });
}

/** Passa o foco ao título da seção, para o Tab seguir dali. preventScroll: a rolagem é nossa. */
function focarTitulo(secao) {
  const h = secao.querySelector("h2:not([hidden])");
  if (!h) return;
  h.setAttribute("tabindex", "-1");
  h.focus({ preventScroll: true });
}

/** As seções que os links internos alcançam: o hub, os serviços, o teste e o fechamento. */
const ehAlvo = (id) => typeof id === "string" &&
  (id === "s-hub" || id === "s-teste" || id === "contato" || Object.prototype.hasOwnProperty.call(secoes, id));

/** Leva ao alvo de um link interno, logo abaixo do topo fixo, com o foco no título. Devolve false se não é nosso. */
function irAoAlvo(id, comportamento) {
  const alvo = ehAlvo(id) && document.getElementById(id);
  if (!alvo) return false;
  focarTitulo(alvo);
  irPara(alvo, comportamento);
  return true;
}

export function iniciarServicos() {
  hub = $("#s-hub");
  grade = $("#servicos4");
  ramos = $("#ramos");
  cartoes = $$(".sv", grade);
  secoes = Object.fromEntries($$(".servico").map((s) => [s.id, s]));

  // Começa quando o topo do hub passa dos 90% da altura da tela: quem rola com calma já encontra os braços
  // chegando aos cartões (no celular, o hub tem mais de 1.100 px, e 20% dele visível era tarde demais).
  quandoVisivel(hub, acenderHub, { limiar: 0, margem: "0px 0px -10% 0px" });

  // Links internos: o hub, um serviço, o teste ou o fechamento. Cobre também os cartões do hub, o menu
  // e os botões de WhatsApp sem número, que apontam para #contato.
  const contados = new Set(); // a medição conta cada serviço uma vez por visita, viesse do cartão ou do menu
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    // Ctrl, Cmd, Shift ou botão do meio: o navegador abre em outra aba ou janela, como em qualquer link
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.getAttribute("href").slice(1);
    if (!irAoAlvo(id)) return;
    e.preventDefault();
    if (id === "s-hub") pulso(); // "Ver o que fazemos": os rios aceleram enquanto a página desce
    if (Object.prototype.hasOwnProperty.call(secoes, id) && !contados.has(id)) {
      contados.add(id);
      evento("servico_aberto", { servico: id });
    }
  });

  // Mede os braços de novo quando a largura muda (celular girado). Só a altura (a barra do navegador
  // que some ou volta ao rolar) não muda os braços e não pode cortar a animação deles.
  let espera = 0, largura = document.documentElement.clientWidth;
  addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      const agora = document.documentElement.clientWidth;
      if (agora === largura) return;
      largura = agora;
      if (!desenhado) return;
      ciclo.parar();
      desenharCompletos();
    }, 150);
  });

  // Link direto (/#s-crm): leva agora e de novo quando a abertura e o carregamento acabarem, na hora (sem a
  // rolagem suave). Quem voltou para a página (voltar ou recarga) recebe a rolagem do rolagem.js: o hash não manda.
  if (voltou()) return;
  let id = "";
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = ""; } // hash malformado: como se não houvesse
  if (!ehAlvo(id) || !document.getElementById(id)) return;
  irAoAlvo(id, "instant");
  // Se a pessoa já mexeu na página antes do fim do carregamento, a rolagem dela vale: nada de puxar de volta.
  let mexeu = false;
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { mexeu = true; }, { once: true, passive: true });
  depoisDaAbertura(() => {
    const rolar = () => { if (!mexeu) irAoAlvo(id, "instant"); };
    if (document.readyState === "complete") rolar();
    else addEventListener("load", rolar, { once: true });
  });
}
