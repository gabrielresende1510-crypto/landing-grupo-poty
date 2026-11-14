import { $, $$, REDUZ, Ciclo, EASE, tempo } from "./util.js";

/** Landing page de exemplo (versão 6): três clínicas fictícias, cada uma com a sua página. */
const IC = {
  gota: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>',
  folha: '<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  brilho: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  rosto: '<circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M9 15c1.5 1.3 4.5 1.3 6 0"/>',
  dente: '<path d="M8 3c-3 0-4.5 2.5-4.5 5.5 0 4 1.5 9.5 3.5 12.5 1 1.5 2.5 1 3-1l1-4h2l1 4c.5 2 2 2.5 3 1 2-3 3.5-8.5 3.5-12.5C20.5 5.5 19 3 16 3c-1.6 0-2.6.8-4 .8S9.6 3 8 3z"/>',
  escova: '<path d="M4 20L13 11"/><rect x="12" y="4" width="8" height="7" rx="1.5"/><path d="M14 4v-1M17 4v-1"/>',
  escudo: '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  crianca: '<circle cx="12" cy="7" r="3"/><path d="M6 21c0-4 2.7-7 6-7s6 3 6 7"/>',
  pulso: '<path d="M3 12h4l2-5 4 10 2-5h6"/>'
};
const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

/* cenas planas de cada consultório, nas cores de cada clínica */
const ILU = {
  estetica: `<svg class="m-ilu" viewBox="0 0 240 160" aria-hidden="true">
<rect width="240" height="160" style="fill:var(--m-soft)"/><rect y="124" width="240" height="36" style="fill:var(--m-ac2)" opacity=".14"/>
<circle cx="52" cy="64" r="20" fill="none" stroke="#fff" stroke-width="6"/><path d="M52 84v40M42 124h20" fill="none" style="stroke:var(--m-tx)" stroke-width="2" opacity=".55"/>
<rect x="84" y="90" width="112" height="14" rx="7" style="fill:var(--m-ac)"/><rect x="86" y="81" width="32" height="11" rx="5.5" fill="#fff"/><rect x="132" y="84" width="44" height="7" rx="3.5" fill="#fff" opacity=".75"/>
<path d="M96 104v20M184 104v20" fill="none" style="stroke:var(--m-ac2)" stroke-width="4"/>
<rect x="196" y="58" width="34" height="4" rx="2" style="fill:var(--m-ac2)"/><rect x="200" y="42" width="7" height="16" rx="2" style="fill:var(--m-ac)"/><rect x="210" y="46" width="7" height="12" rx="2" fill="#fff"/><rect x="220" y="38" width="7" height="20" rx="2" style="fill:var(--m-ac2)" opacity=".8"/>
<rect x="206" y="108" width="14" height="16" rx="3" style="fill:var(--m-tx)" opacity=".6"/><ellipse cx="209" cy="98" rx="4.5" ry="11" style="fill:var(--m-ac2)" transform="rotate(-16 209 98)"/><ellipse cx="217" cy="97" rx="4.5" ry="12" style="fill:var(--m-ac2)" transform="rotate(16 217 97)"/><ellipse cx="213" cy="92" rx="4" ry="13" style="fill:var(--m-ac)"/>
</svg>`,
  odonto: `<svg class="m-ilu" viewBox="0 0 240 150" aria-hidden="true">
<rect width="240" height="150" style="fill:var(--m-soft)"/><rect y="118" width="240" height="32" style="fill:var(--m-ac2)" opacity=".12"/>
<rect x="150" y="22" width="62" height="40" rx="5" fill="#fff"/><path d="M175 30c-4 0-6 3-6 7 0 6 3 14 5 14 1.5 0 2-5 4-5s2.5 5 4 5c2 0 5-8 5-14 0-4-2-7-6-7-1.7 0-2.3 1-3 1s-1.3-1-3-1z" style="fill:var(--m-soft);stroke:var(--m-ac)" stroke-width="1.6"/>
<path d="M58 0v18l34 16" fill="none" style="stroke:var(--m-tx)" stroke-width="3" opacity=".45"/><rect x="86" y="30" width="28" height="12" rx="6" style="fill:var(--m-ac2)"/>
<path d="M40 104h68l28-32" fill="none" style="stroke:var(--m-ac)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M134 70l12-9" fill="none" style="stroke:var(--m-ac)" stroke-width="10" stroke-linecap="round"/>
<rect x="68" y="108" width="14" height="10" style="fill:var(--m-ac2)"/><rect x="50" y="116" width="50" height="6" rx="3" style="fill:var(--m-ac2)"/>
<path d="M152 98h40" fill="none" style="stroke:var(--m-tx)" stroke-width="2" opacity=".4"/><rect x="156" y="88" width="32" height="8" rx="2" fill="#fff"/>
<rect x="200" y="76" width="32" height="42" rx="3" fill="#fff" opacity=".85"/><path d="M200 97h32" fill="none" style="stroke:var(--m-soft)" stroke-width="2"/>
</svg>`,
  medica: `<svg class="m-ilu" viewBox="0 0 240 150" aria-hidden="true">
<rect width="240" height="150" style="fill:var(--m-soft)"/><rect y="118" width="240" height="32" style="fill:var(--m-ac2)" opacity=".12"/>
<rect x="26" y="20" width="36" height="28" rx="2" fill="#fff"/><path d="M32 28h24M32 34h18M32 40h12" fill="none" style="stroke:var(--m-soft)" stroke-width="2.5"/>
<circle cx="86" cy="32" r="10" fill="#fff"/><path d="M86 26v6l4 3" fill="none" style="stroke:var(--m-ac2)" stroke-width="1.6"/>
<rect x="20" y="92" width="100" height="6" rx="2" style="fill:var(--m-ac2)"/><path d="M28 98v20M112 98v20" fill="none" style="stroke:var(--m-ac2)" stroke-width="4"/>
<rect x="38" y="62" width="40" height="27" rx="3" style="fill:var(--m-tx)" opacity=".85"/><rect x="55" y="89" width="6" height="3" style="fill:var(--m-tx)" opacity=".85"/>
<path d="M43 76h7l3-7 4 13 3-6h10" fill="none" style="stroke:var(--m-soft)" stroke-width="1.8"/>
<path d="M88 90c0-8 7-8 7-14M88 90c0 5 11 5 11-3" fill="none" style="stroke:var(--m-ac)" stroke-width="2"/><circle cx="99" cy="86" r="3" style="fill:var(--m-ac)"/>
<rect x="138" y="88" width="88" height="11" rx="4" style="fill:var(--m-ac)"/><rect x="138" y="82" width="88" height="8" rx="4" fill="#fff"/><rect x="140" y="76" width="22" height="8" rx="4" fill="#fff"/>
<path d="M146 99v19M218 99v19" fill="none" style="stroke:var(--m-ac2)" stroke-width="4"/>
</svg>`
};
const MAPA = `<svg viewBox="0 0 220 84" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 30H220M0 64H220M62 0V84M152 0V84M0 84L96 0" stroke="#fff" stroke-width="6" fill="none" opacity=".8"/><circle cx="110" cy="44" r="9" stroke="none" style="fill:var(--m-ac)"/><circle cx="110" cy="44" r="3.5" stroke="none" fill="#fff"/></svg>`;
const FAQ = (l) => `<div class="m-faq"><p class="aberta"><b>${l[0][0]}</b><span>${l[0][1]}</span></p>${l.slice(1).map((p) => `<p>${p}</p>`).join("")}</div>`;
const ROD = `<div class="m-rod" data-b="3"><span>Responsável técnico: nome e registro no conselho</span><span>Privacidade · Cookies</span></div>`;

/* Títulos do exemplo são parágrafos (p.t4, p.t5): não entram na lista de títulos da página. */
const TIPOS = {
  // Os itens da estética também estão no index.html (#lp-i0 a #lp-i2, o estado sem JS): mude os dois juntos.
  estetica: {
    rotulo: "Exemplo de página de uma clínica de estética",
    itens: ["Um ambiente calmo e o que a clínica faz, logo no topo.", "A profissional, com CRM e, se tiver especialidade, o RQE, e como é a avaliação.", "Tratamentos e perguntas frequentes, antes de chamar."],
    html: () => `<div class="e-topo" data-b="0"><b>Exemplo Estética</b><i class="m-menu"></i></div>
<div class="e-ilu">${ILU.estetica}</div>
<div class="e-hero"><p class="t4">Cuidado com a pele, com calma e sem pressa.</p><p>Avaliação individual, em Teresina.</p><span class="m-bt">Agendar avaliação</span></div>
<div class="m-bloco"><p class="t5">Tratamentos</p><div class="e-trat"><div>${ic("rosto")}Avaliação facial</div><div>${ic("gota")}Limpeza de pele</div><div>${ic("brilho")}Peeling</div><div>${ic("folha")}Cuidados com a pele</div></div></div>
<div class="m-bloco" data-b="1"><p class="t5">Como é a avaliação</p><ol class="e-linha"><li><b>Conversa</b><span>Você conta o que quer cuidar.</span></li><li><b>Avaliação</b><span>A profissional examina e explica.</span></li><li><b>Plano</b><span>Você decide com calma.</span></li></ol></div>
<div class="m-bloco"><p class="t5">Quem cuida de você</p><div class="e-prof"><span class="av">NS</span><div><b>Dra. Nome Sobrenome</b><small>Médica · CRM e RQE</small></div></div></div>
<div class="m-bloco" data-b="2"><p class="t5">Perguntas frequentes</p>${FAQ([["Quanto tempo dura a avaliação?", "Cerca de 40 minutos. Confirme pelo WhatsApp."], "Precisa de preparo antes?", "Atendem aos sábados?"])}</div>${ROD}`
  },
  odonto: {
    rotulo: "Exemplo de página de uma clínica de odontologia",
    itens: ["Atendimentos e convênios logo no topo, sem procurar.", "O responsável técnico com nome e CRO, como pede o CFO.", "Convênios aceitos, atendimento infantil e endereço."],
    html: () => `<div class="o-topo" data-b="0"><b>${ic("dente")}Exemplo Odonto</b><span>Agendar</span></div>
<div class="o-hero">${ILU.odonto}</div>
<div class="o-tit"><div class="o-badges"><span>Atendimento infantil</span><span>Convênios</span></div><p class="t4">Consulta com hora marcada e explicação em cada etapa.</p><p>Adultos e crianças, em Teresina.</p><span class="m-bt">Agendar consulta</span></div>
<div class="m-bloco"><p class="t5">Atendimentos</p><div class="o-grid"><div>${ic("dente")}Avaliação</div><div>${ic("escova")}Limpeza</div><div>${ic("escudo")}Prevenção</div><div>${ic("crianca")}Infantil</div></div></div>
<div class="m-bloco" data-b="1"><p class="t5">Responsável técnico</p><div class="o-rt"><span class="av">NS</span><div><b>Dr. Nome Sobrenome</b><small>CRO-PI e número do registro</small></div></div></div>
<div class="m-bloco" data-b="2"><p class="t5">Convênios aceitos</p><div class="o-conv"><span>Convênio A</span><span>Convênio B</span><span>Convênio C</span></div><small class="m-obs">Não achou o seu? Pergunte pelo WhatsApp.</small></div>
<div class="m-bloco"><p class="t5">Onde estamos</p><div class="m-mapa">${MAPA}</div><span>Rua Exemplo, 100 · Teresina, PI</span></div>
<div class="m-bloco"><p class="t5">Perguntas frequentes</p>${FAQ([["Atendem crianças?", "Sim, a partir dos 3 anos, com hora marcada."], "Tem estacionamento?", "Atendem urgência?"])}</div>${ROD}`
  },
  medica: {
    rotulo: "Exemplo de página de uma clínica médica",
    itens: ["Especialidades e horário de atendimento logo no topo.", "O corpo clínico, com CRM e RQE de cada médico.", "Especialidades, convênios e perguntas frequentes."],
    html: () => `<div class="sm-topo" data-b="0"><span class="lg">${ic("pulso")}</span><b>Exemplo Saúde</b><i class="m-menu"></i></div>
<div class="sm-hero">${ILU.medica}</div>
<div class="sm-agenda"><p class="t4">Consulta, check-up e retorno no mesmo lugar.</p><p>Segunda a sexta, 7h às 19h. Sábado, 7h às 12h.</p><span class="m-bt">Agendar consulta</span></div>
<div class="m-bloco"><p class="t5">Especialidades</p><ul class="sm-lista"><li>Clínica médica<small>RQE do médico</small></li><li>Cardiologia<small>RQE do médico</small></li><li>Pediatria<small>RQE do médico</small></li></ul></div>
<div class="m-bloco" data-b="1"><p class="t5">Corpo clínico</p><div class="sm-eq"><div><span class="av">NS</span><b>Dra. Nome Sobrenome</b><small>CRM e RQE</small></div><div><span class="av">NS</span><b>Dr. Nome Sobrenome</b><small>CRM e RQE</small></div></div></div>
<div class="m-bloco"><p class="t5">Convênios</p><div class="o-conv"><span>Convênio A</span><span>Convênio B</span><span>Particular</span></div></div>
<div class="m-bloco" data-b="2"><p class="t5">Perguntas frequentes</p>${FAQ([["Atendem convênio?", "Alguns. Pergunte pelo WhatsApp qual é o seu."], "Preciso levar exames antigos?", "Quanto tempo dura a consulta?"])}</div>${ROD}`
  }
};
const ORDEM = ["estetica", "odonto", "medica"];

let fone, tela, rolo, zap, itens, textos, botoes, tablist;
let atual = "estetica", y = 0, anim = null, ciclo = null, escolha = null;
let iniciado = false, visivel = false, pausado = false, foco = false, escolheu = false;

function rolar(alvo) {
  if (anim) anim.cancel();
  const de = y; y = alvo;
  if (REDUZ) { rolo.style.transform = `translateY(${-alvo}px)`; return; }
  anim = rolo.animate([{ transform: `translateY(${-de}px)` }, { transform: `translateY(${-alvo}px)` }], { duration: tempo(1100), easing: EASE, fill: "forwards" });
}

function marcarTipo(t) {
  botoes.forEach((b) => {
    const sel = b.dataset.tipo === t;
    b.setAttribute("aria-selected", String(sel));
    b.tabIndex = sel ? 0 : -1;
  });
}

function montar(t, animar = true) {
  atual = t; marcarTipo(t);
  fone.dataset.tipo = t;
  fone.setAttribute("aria-label", TIPOS[t].rotulo);
  rolo.innerHTML = TIPOS[t].html();
  textos.forEach((s, k) => { s.textContent = TIPOS[t].itens[k]; if (animar && !REDUZ) s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 }); });
  if (anim) anim.cancel();
  anim = null; y = 0; rolo.style.transform = "";
}

async function trocar(t, meu) {
  marcarTipo(t);
  tela.classList.add("trocando");
  await meu.espera(300);
  montar(t);
  tela.classList.remove("trocando");
}

/** Um passeio pela página: topo, confiança, dúvidas, botão. Depois, o próximo tipo (se ninguém escolheu). */
async function rodar(meu) {
  try {
    for (;;) {
      // posição de cada bloco em relação ao rolo (não depende do offsetParent)
      const blocos = $$("[data-b]", rolo).sort((a, b) => a.dataset.b - b.dataset.b);
      const topoRolo = () => rolo.getBoundingClientRect().top;
      const max = Math.max(0, rolo.scrollHeight - tela.clientHeight);
      for (let k = 0; k < 4; k++) {
        itens.forEach((li, j) => li.classList.toggle("on", j === k));
        zap.classList.toggle("brilha", k === 3);
        rolar(k === 0 ? 0 : Math.min(max, blocos[k].getBoundingClientRect().top - topoRolo() - 30));
        await meu.espera(k === 0 ? 2600 : 3000);
      }
      zap.classList.remove("brilha");
      itens.forEach((li) => li.classList.remove("on"));
      rolar(0);
      await meu.espera(1300);
      if (!escolheu && !foco) await trocar(ORDEM[(ORDEM.indexOf(atual) + 1) % ORDEM.length], meu);
    }
  } catch (e) {
    if (e?.name !== "Parou") throw e;
  }
}

function comecar() {
  const c = ciclo = new Ciclo();
  rodar(c).catch((e) => console.error("Falha no exemplo:", e));
}

function atualizar() {
  const deve = iniciado && visivel && !pausado && !REDUZ && !escolha;
  if (deve && !ciclo) comecar();
  if (!deve && ciclo) {
    ciclo.parar(); ciclo = null;
    tela.classList.remove("trocando"); marcarTipo(atual);
  }
}

/** A escolha de quem usa vale mesmo com o celular fora da tela: a troca termina e o passeio recomeça no tipo escolhido. */
function escolher(b, { focar = false } = {}) {
  escolheu = true;
  const t = b.dataset.tipo;
  if (focar) b.focus();
  if (t === atual && !ciclo && !escolha) return;
  if (ciclo) { ciclo.parar(); ciclo = null; }
  escolha?.parar();
  if (REDUZ) { escolha = null; montar(t, false); return; }
  const c = escolha = new Ciclo();
  trocar(t, c)
    .then(() => { if (escolha === c) { escolha = null; atualizar(); } })
    .catch((e) => { if (e?.name !== "Parou") console.error("Falha no exemplo:", e); });
}

function teclado(e) {
  const i = botoes.indexOf(e.currentTarget);
  let alvo;
  if (e.key === "ArrowRight") alvo = botoes[(i + 1) % botoes.length];
  else if (e.key === "ArrowLeft") alvo = botoes[(i - 1 + botoes.length) % botoes.length];
  else if (e.key === "Home") alvo = botoes[0];
  else if (e.key === "End") alvo = botoes[botoes.length - 1];
  else return;
  e.preventDefault();
  escolher(alvo, { focar: true });
}

export function iniciarExemplos() {
  if (iniciado) return;
  fone = $("#lp-fone"); tela = $("#lp-tela"); rolo = $("#lp-rolo"); zap = $("#m-zap");
  if (!fone || !tela || !rolo || !zap) return;
  itens = $$("#cena-lp .itens li").sort((a, b) => a.dataset.b - b.dataset.b);
  textos = [0, 1, 2].map((k) => $("#lp-i" + k));
  botoes = $$(".tipos button");
  tablist = $(".tipos");
  montar("estetica", false);
  botoes.forEach((b) => {
    b.addEventListener("click", () => escolher(b));
    b.addEventListener("keydown", teclado);
  });
  tablist.addEventListener("focusin", () => { foco = true; });
  tablist.addEventListener("focusout", (e) => { if (!tablist.contains(e.relatedTarget)) foco = false; });
  iniciado = true;
  // Fraunces e Nunito só baixam quando o celular de exemplo chega perto da tela (secoes.css, .lp-fone.perto):
  // com a página contínua, ele já está na página desde a carga, bem abaixo da primeira tela.
  const perto = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    fone.classList.add("perto");
    perto.disconnect();
    // As duas já: o exemplo troca sozinho de tipo de clínica, e a Nunito da odontologia vem logo depois.
    try { document.fonts?.load('600 1em "Fraunces"'); document.fonts?.load('800 1em "Nunito"'); } catch (e) {}
  }, { rootMargin: "600px 0px" });
  // A seção, e não o celular: o topo dela chega antes, e as fontes começam a baixar mais cedo.
  perto.observe(fone.closest("section") || fone);
  if (REDUZ) return;
  new IntersectionObserver((entradas) => {
    visivel = entradas[entradas.length - 1].isIntersecting;
    atualizar();
  }, { threshold: 0.3 }).observe(fone);
}

/** Para o passeio e o rodízio (botão "Pausar animações"). */
export function pausar() { pausado = true; atualizar(); }
/** Retoma o passeio e o rodízio. */
export function continuar() { pausado = false; atualizar(); }
