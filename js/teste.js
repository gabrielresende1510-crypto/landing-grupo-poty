import { $, $$, REDUZ, evento } from "./util.js";
import { MENSAGENS } from "./config.js";
import { linkWhatsApp } from "./whatsapp.js";

/** `ruim` é a resposta que marca um ponto de atenção. */
export const PERGUNTAS = [
  { t: "Já aconteceu de uma mensagem no WhatsApp ficar sem resposta até o dia seguinte?", ruim: "sim", area: "WhatsApp" },
  { t: "A recepção sabe dizer quantos pacientes pediram horário nesta semana?", ruim: "nao", area: "Acompanhamento dos pacientes" },
  { t: "Quando alguém diz \"vou pensar\", a equipe volta a falar com essa pessoa?", ruim: "nao", area: "Acompanhamento dos pacientes" },
  { t: "O seu Instagram mostra, logo de cara, como marcar uma consulta?", ruim: "nao", area: "Instagram" },
  { t: "A clínica publica vídeos gravados com roteiro, e não só fotos?", ruim: "nao", area: "Vídeo" },
  { t: "Existe uma página da clínica que leva direto ao WhatsApp?", ruim: "nao", area: "Landing page" },
  { t: "A recepção já teve treinamento para atender pelo WhatsApp?", ruim: "nao", area: "Treinamento" }
];

const TEXTOS = {
  baixo: "Bom sinal. A análise ainda pode mostrar ajustes finos no Instagram e no atendimento.",
  medio: "Há pontos que podem estar fazendo a clínica perder pacientes. Vale olhar com calma, um por vez.",
  alto: "A sua clínica pode estar perdendo pacientes sem perceber. Dá para olhar por partes, começando pelo que pesa mais."
};
const textoDaFaixa = (pontos) => (pontos <= 1 ? TEXTOS.baixo : pontos <= 4 ? TEXTOS.medio : TEXTOS.alto);

/** Conta os pontos de atenção. Função pura. */
export function resultadoTeste(respostas) {
  let pontos = 0;
  const areas = [];
  PERGUNTAS.forEach((p, i) => {
    if (respostas[i] !== p.ruim) return;
    pontos++;
    if (!areas.includes(p.area)) areas.push(p.area);
  });
  const mensagem = `ANÁLISE\nFiz o teste do site: ${pontos} de ${PERGUNTAS.length} pontos de atenção`
    + (areas.length ? ` (${areas.join(", ")}).` : ".");
  return { pontos, areas, mensagem };
}

export function iniciarTeste() {
  const caixa = $("#t-q"), perg = $("#t-perg"), cont = $("#t-cont"), barra = $("#t-barra"), res = $("#t-res");
  const botaoWa = $("#t-res a[data-wa]"), numero = $("#t-n");
  const voz = $("#t-voz");
  const total = PERGUNTAS.length;
  const segs = $$("#t-seg i");
  let respostas = [], ocupado = false, timer = 0, timersSeg = [];

  function ajustarLink(mensagem) {
    const link = linkWhatsApp(mensagem);
    botaoWa.setAttribute("href", link);
    if (link === "#contato") {
      botaoWa.removeAttribute("target");
      botaoWa.removeAttribute("rel");
    } else {
      botaoWa.target = "_blank";
      botaoWa.rel = "noopener";
    }
  }

  function mostrar() {
    const i = respostas.length;
    perg.textContent = PERGUNTAS[i].t;
    cont.textContent = `${i + 1} de ${total}`;
    barra.style.width = `${(i / total) * 100}%`;
    voz.textContent = `Pergunta ${i + 1} de ${total}: ${PERGUNTAS[i].t}`;
  }

  /** Guarda contra toque duplo. aria-busy: a pergunta está trocando (o leitor de tela espera). */
  function ocupar(sim) {
    ocupado = sim;
    if (sim) caixa.setAttribute("aria-busy", "true"); else caixa.removeAttribute("aria-busy");
  }

  function fim() {
    const r = resultadoTeste(respostas);
    voz.textContent = ""; // o resultado recebe o foco; a região viva não repete a pergunta 7
    barra.style.width = "100%";
    cont.textContent = "Pronto";
    caixa.hidden = true;
    res.hidden = false;
    numero.textContent = r.pontos;
    timersSeg = segs.map((s, k) => setTimeout(() => s.classList.toggle("on", k < r.pontos), REDUZ ? 0 : 120 * k));
    $("#t-txt").textContent = textoDaFaixa(r.pontos);
    $("#t-areas").replaceChildren(...r.areas.map((a) => { const s = document.createElement("span"); s.textContent = a; return s; }));
    $("#t-msg").textContent = `A mensagem já vai pronta:\n${r.mensagem}`;
    ajustarLink(r.mensagem);
    numero.parentElement.focus({ preventScroll: true });
    evento("teste_concluido", { pontos: r.pontos });
  }

  function responder(r) {
    if (ocupado) return;
    respostas.push(r);
    const acabou = respostas.length >= total;
    ocupar(true);
    if (REDUZ) {
      // Sem animação a pergunta troca na hora; a guarda de 250 ms segura a segunda batida de um toque duplo.
      acabou ? fim() : mostrar();
      timer = setTimeout(() => ocupar(false), 250);
      return;
    }
    caixa.classList.add("sai");
    timer = setTimeout(() => {
      if (acabou) { ocupar(false); fim(); return; }
      mostrar();
      caixa.classList.remove("sai");
      caixa.classList.add("entra");
      void caixa.offsetWidth;
      caixa.classList.remove("entra");
      ocupar(false);
    }, 300);
  }

  function zerar(comFoco) {
    clearTimeout(timer);
    timersSeg.forEach(clearTimeout);
    respostas = [];
    ocupar(false);
    caixa.hidden = false;
    caixa.classList.remove("sai", "entra");
    res.hidden = true;
    segs.forEach((s) => s.classList.remove("on"));
    ajustarLink(MENSAGENS.analise);
    mostrar();
    if (comFoco) $('.t-bt[data-r="sim"]').focus({ preventScroll: true });
  }

  $$(".t-bt").forEach((b) => b.addEventListener("click", () => responder(b.dataset.r)));
  $("#t-refazer").addEventListener("click", () => zerar(true));
  zerar(false);
}
