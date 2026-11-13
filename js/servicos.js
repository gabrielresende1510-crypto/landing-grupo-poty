import { $, $$, REDUZ, Ciclo, SAI, evento, alturaTopo, guardarHistorico, retomarDoHistorico, rolarNaHora } from "./util.js";
import { pulso } from "./rios.js";

// Elementos buscados em iniciarServicos(): o módulo não toca no DOM ao ser importado.
let hub = null, grade = null, ramos = null, cartoes = [], secoes = {};

let aberto = false;
let ciclo = new Ciclo();

/** Rola até el, que fica logo abaixo do topo fixo (a altura real vem do topo.js, em --topo). */
function irPara(el, comportamento = REDUZ ? "auto" : "smooth") {
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (alturaTopo() || 64), behavior: comportamento });
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
 * M3: o hub, os serviços abertos e a rolagem ficam anotados no histórico, para reabrir tudo no mesmo
 * ponto quando a pessoa volta da privacidade (botão voltar, recarga ou "Voltar ao site").
 */
const CHAVE = "poty-servicos", ROLAGEM = "poty-rolagem";
const ehServico = (id) => typeof id === "string" && Object.prototype.hasOwnProperty.call(secoes, id);
function lembrar() {
  // Com algo aberto, quem devolve a rolagem é o restaurar(): o navegador do iPhone devolve cedo
  // demais, quando a página ainda está curta.
  try { history.scrollRestoration = "manual"; } catch (e) {}
  guardarHistorico(CHAVE, { hub: aberto, abertos: Object.keys(secoes).filter((id) => secoes[id].classList.contains("aberta")) });
}
// O Safari limita as gravações no histórico (cerca de 100 a cada 30 s): a rolagem só é gravada
// quando muda de verdade, e não a cada parada curta.
let rolagemGravada = null;
function lembrarRolagem() {
  if (!aberto) return;
  const y = Math.round(window.scrollY);
  if (Math.abs(y - (rolagemGravada ?? -1e9)) < 4) return;
  if (guardarHistorico(ROLAGEM, y)) rolagemGravada = y; // recusada: tenta de novo na próxima parada
}

/**
 * A pessoa voltou: reabre na hora o que estava aberto, com os braços já desenhados, sem animação
 * e sem contar de novo na medição, e rola até onde ela estava. Devolve true se reabriu.
 */
function restaurar() {
  const salvo = retomarDoHistorico(CHAVE), y = retomarDoHistorico(ROLAGEM);
  if (!salvo || !salvo.hub) {
    try { history.scrollRestoration = "auto"; } catch (e) {}
    return false;
  }
  aberto = true;
  document.body.classList.add("aberto");
  for (const id of Array.isArray(salvo.abertos) ? salvo.abertos : []) {
    if (!ehServico(id)) continue;
    secoes[id].classList.add("aberta");
    marcar(id, true);
  }
  desenharCompletos();
  if (Number.isFinite(y)) rolagemGravada = y;
  // Se a pessoa mexer na página antes do fim do carregamento, a rolagem dela vale.
  let mexeu = false;
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { mexeu = true; }, { once: true, passive: true });
  const rolar = () => { if (Number.isFinite(y) && !mexeu) rolarNaHora(y); };
  // Rola depois que todas as partes da página iniciaram (as dobras do celular reabrem no enxuto.js).
  queueMicrotask(rolar);
  // As fontes e o resto da página ainda podem mexer na posição dos cartões: desenha e rola de novo no fim.
  const deNovo = () => { if (aberto) desenharCompletos(); rolar(); };
  document.fonts?.ready.then(deNovo);
  if (document.readyState !== "complete") addEventListener("load", deNovo, { once: true });
  return true;
}

/** Mostra o hub e desenha os braços. Chamar de novo só rola (se pedido). */
export async function revelar(rolar = true) {
  if (aberto) { if (rolar) irPara(hub); return; }
  aberto = true;
  const meu = ciclo = new Ciclo();
  document.body.classList.add("aberto");
  lembrar();
  pulso();
  try {
    await meu.espera(40);
    if (rolar) irPara(hub);
    await meu.espera(rolar ? 480 : 60);
    if (REDUZ) desenharCompletos(); else animarRamos(meu);
  } catch (e) { if (e.name !== "Parou") throw e; }
}

function marcar(id, valor) {
  const c = cartoes.find((x) => x.dataset.alvo === id);
  c.setAttribute("aria-expanded", String(valor));
  c.querySelector("em").firstChild.textContent = valor ? "Fechar " : "Ver como funciona ";
}

export function abrir(id, rolar = false) {
  const s = secoes[id];
  if (!s) return;
  if (!aberto) revelar(false);
  if (s.classList.contains("aberta")) { if (rolar) irPara(s); return; }
  s.classList.add("aberta");
  marcar(id, true);
  lembrar();
  evento("servico_aberto", { servico: id });
  if (!REDUZ) s.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 650, easing: SAI });
  if (rolar) irPara(s);
}

export function fechar(id) {
  const s = secoes[id];
  if (!s) return;
  s.classList.remove("aberta");
  marcar(id, false);
  lembrar();
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

/** Leva ao alvo de um link interno, abrindo o que estiver escondido. Devolve false se não é nosso. */
function irAoAlvo(id, comportamento) {
  const alvo = id && document.getElementById(id);
  if (!alvo) return false;
  if (id === "s-hub") revelar(false);
  else if (secoes[id]) abrir(id);
  else if (alvo.classList.contains("revela")) revelar(false);
  else return false;
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
  for (const s of Object.values(secoes)) {
    const f = document.createElement("button");
    f.type = "button";
    f.className = "b-lin fechar-sv";
    f.textContent = "Fechar e voltar aos serviços";
    f.addEventListener("click", () => {
      fechar(s.id);
      cartoes.find((x) => x.dataset.alvo === s.id)?.focus({ preventScroll: true });
      irPara(hub);
    });
    s.append(f);
  }

  for (const c of cartoes) {
    // Só com JS as seções nascem fechadas: o atributo vem daqui, e não do HTML (sem JS, tudo está aberto).
    c.setAttribute("aria-expanded", "false");
    c.addEventListener("click", () => {
      const id = c.dataset.alvo;
      if (secoes[id].classList.contains("aberta")) fechar(id); else abrir(id, true);
    });
  }

  $("#ver-tudo").addEventListener("click", () => {
    Object.keys(secoes).forEach((id) => abrir(id, false));
    irPara(secoes["s-crm"]);
  });

  // Links internos: o hub, um serviço ou uma seção que começa escondida.
  // Cobre também os botões de WhatsApp sem número, que apontam para #contato.
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const id = a.getAttribute("href").slice(1);
    if (id === "s-hub") { e.preventDefault(); revelar(true); focarTitulo(hub); return; }
    if (irAoAlvo(id)) e.preventDefault();
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
      if (!aberto) return;
      ciclo.parar();
      desenharCompletos();
    }, 150);
  });

  // Um erro aqui (estado estranho no histórico) não pode levar o resto: a página volta a ficar
  // fechada, como numa visita nova, e o estado guardado é apagado.
  let reabriu = false;
  try { reabriu = restaurar(); } catch (e) {
    console.error("Falha ao reabrir o que estava aberto:", e);
    aberto = false;
    document.body.classList.remove("aberto");
    for (const id of Object.keys(secoes)) {
      secoes[id].classList.remove("aberta");
      try { marcar(id, false); } catch (e3) {}
    }
    guardarHistorico(CHAVE, null);
    guardarHistorico(ROLAGEM, null);
    try { history.scrollRestoration = "auto"; } catch (e2) {}
  }
  // A rolagem é anotada quando para (e não a cada quadro), ao esconder a aba e ao sair da página.
  let esperaRolagem = 0;
  addEventListener("scroll", () => { clearTimeout(esperaRolagem); esperaRolagem = setTimeout(lembrarRolagem, 500); }, { passive: true });
  addEventListener("pagehide", lembrarRolagem);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") lembrarRolagem(); });

  // Link direto (/#s-crm): abre agora e rola de novo quando a abertura e o carregamento acabarem.
  // Quem voltou para a página já teve tudo reaberto no ponto em que estava: o hash não manda mais.
  if (reabriu) return;
  let id = "";
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = ""; } // hash malformado: como se não houvesse
  const alvo = id && document.getElementById(id);
  if (alvo && (id === "s-hub" || ehServico(id) || alvo.classList.contains("revela"))) {
    irAoAlvo(id, "auto");
    depoisDaAbertura(() => {
      const rolar = () => irAoAlvo(id, "auto");
      if (document.readyState === "complete") rolar();
      else addEventListener("load", rolar, { once: true });
    });
  }
}
