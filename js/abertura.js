import { $, $$, Ciclo, EASE, SAI, tempo, guardarSessao, focarPrincipal } from "./util.js";

const RITMO = 0.9, BIG = 2.4, SOL = "#F0A83A";
const BIGT = `translate(190px,31.5px) scale(${BIG}) translate(-335px,-50px)`;
const IDT = "translate(335px,50px) scale(1) translate(-335px,-50px)";
const FIM = 2150, SUBIR = 650, PULAR = 450;
const SOBE = [{ transform: "translateY(0)" }, { transform: "translateY(calc(-100% - 82px))" }];
const SOBE_EASE = "cubic-bezier(.7,0,.2,1)";

/**
 * Abertura "do caos à ordem": pontos viram o Y do logo, o logo se desenha
 * e a camada sobe. Só toca com html.com-abertura (primeira visita da sessão,
 * sem reduzir movimento). aoTerminar é chamado uma vez só, quando a página
 * começa a aparecer: a 25% da subida da camada, ou no começo da subida rápida
 * do Pular. Sem abertura, é chamado na hora. A limpeza (tirar com-abertura,
 * esconder a camada) vem depois, no fim da subida.
 */
export function iniciarAbertura(aoTerminar) {
  const html = document.documentElement;
  const ab = $("#abertura");
  if (!html.classList.contains("com-abertura") || !ab) { aoTerminar(); return; }

  const arte = $("#arte"), cv = $("#pontos"), ctx = cv.getContext("2d"), botao = $("#pular");
  // Avisa o script do head que a abertura começou (até aqui, o Pular e o timer de 3 s são dele).
  // Vem depois das buscas: se uma delas falhar, o head ainda tira a camada.
  html.dataset.abertura = "tocando";
  const q = (s) => arte.querySelector(s);
  const qa = (s) => $$(s, arte);
  const anims = [];
  const tracos = []; // traços que já começaram a se desenhar
  const ciclo = new Ciclo();
  let raf = 0, lift = null, terminou = false, pulou = false, avisou = false;
  const avisar = () => { if (avisou) return; avisou = true; aoTerminar(); };

  function A(el, frames, o) {
    const a = el.animate(frames, { fill: "both", easing: EASE, ...o, delay: tempo((o.delay || 0) * RITMO), duration: tempo(o.duration * RITMO) });
    anims.push(a);
    return a;
  }
  const draw = (el, delay, duration, easing = EASE) => {
    const a = A(el, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { delay, duration, easing });
    a.onfinish = () => (el.style.strokeDasharray = "none");
    tracos.push(el);
    return a;
  };
  const show = (el, delay, duration, from = "translateY(0)") => A(el, [{ opacity: 0, transform: from }, { opacity: 1, transform: "translateY(0)" }], { delay, duration, easing: SAI });

  function letras(d) {
    const lp = qa(".lp"), lt = qa(".lt");
    draw(lp[0], d, 380); draw(lp[1], d + 70, 380);
    draw(q(".lo"), d + 110, 440);
    draw(lt[0], d + 190, 320); draw(lt[1], d + 230, 320);
    qa(".gl").forEach((e, i) => draw(e, d + 230 + i * 35, 300));
    show(q(".perna"), d + 420, 260, "none");
    show(q(".assin"), d + 420, 450, "translateY(8px)");
  }

  function particulas() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const M = q("svg").getScreenCTM();
    const cs = getComputedStyle(html);
    const corPoty = cs.getPropertyValue("--logo-poty").trim();
    const rgb = cs.getPropertyValue("--rgb-linha").trim();
    const pts = [];
    const mk = (tx, ty, cor) => ({ x0: Math.random() * r.width, y0: Math.random() * r.height, vx: (Math.random() - 0.5) * 46, vy: (Math.random() - 0.5) * 46, tx, ty, cor, rad: 1.5 + Math.random() * 1.9, d: Math.random() * 170, x: 0, y: 0, a: 1 });
    const add = (sel, n, cor) => {
      const p = q(sel), L = p.getTotalLength();
      const w = 20 * BIG * M.a * 0.34;
      for (let i = 0; i < n; i++) {
        const pt = p.getPointAtLength((L * (i + 0.5)) / n);
        const s = new DOMPoint(190 + BIG * (pt.x - 335), 31.5 + BIG * (pt.y - 50) + 38).matrixTransform(M);
        pts.push(mk(s.x - r.left + (Math.random() - 0.5) * w, s.y - r.top + (Math.random() - 0.5) * w, cor));
      }
    };
    add(".y1", 32, SOL); add(".y2", 32, corPoty); add(".y3", 12, corPoty);
    for (let i = 0; i < 36; i++) { const p = mk(0, 0, i % 2 ? "#8FCFC9" : "#2F8A8A"); p.ruido = true; pts.push(p); }
    const clamp = (x) => Math.max(0, Math.min(1, x));
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const passo = tempo(RITMO);
    const t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / passo;
      pinta(t);
      if (t < 1200) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, r.width, r.height);
    }
    function pinta(t) {
      ctx.clearRect(0, 0, r.width, r.height);
      const some = clamp((t - 900) / 260);
      for (const p of pts) {
        const dx = p.x0 + (p.vx * t) / 1000, dy = p.y0 + (p.vy * t) / 1000;
        if (p.ruido) { p.x = dx; p.y = dy; p.a = 1 - clamp((t - 240) / 480); }
        else { const e = ease(clamp((t - 280 - p.d) / 540)); p.x = dx + (p.tx - dx) * e; p.y = dy + (p.ty - dy) * e; p.a = 1 - some; }
      }
      const la = (1 - clamp((t - 120) / 420)) * 0.28;
      if (la > 0.01) {
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 72) { ctx.strokeStyle = `rgba(${rgb},${la * (1 - d / 72)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (const p of pts) {
        if (p.a <= 0) continue;
        ctx.globalAlpha = p.a; ctx.fillStyle = p.cor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
  }
  function limparPontos() { cancelAnimationFrame(raf); ctx.clearRect(0, 0, cv.width, cv.height); }

  function fim() {
    if (terminou) return;
    terminou = true;
    ciclo.parar();
    limparPontos();
    anims.forEach((a) => a.cancel());
    // Todo traço termina sem tracejado, mesmo se o aviso de fim (onfinish) ainda não chegou quando a camada sai
    // (com a máquina cheia, os quadros atrasam e o timer do fim pode passar na frente).
    tracos.forEach((el) => (el.style.strokeDasharray = "none"));
    html.classList.remove("com-abertura");
    ab.hidden = true;
    avisar();
  }

  /** A subida natural da camada já começou? */
  function subindo() {
    if (!lift) return false;
    const t = lift.effect.getComputedTiming();
    return t.localTime !== null && t.localTime >= t.delay;
  }

  async function pular() {
    if (pulou || terminou) return;
    pulou = true;
    const focado = document.activeElement === botao;
    ciclo.parar();
    avisar();
    anims.forEach((a) => { if (a !== lift) a.finish(); });
    limparPontos();
    if (subindo()) {
      // No meio da subida: acelera a mesma subida, sem a camada voltar para baixo.
      lift.updatePlaybackRate(3);
      try { await lift.finished; } catch (e) { /* cancelada: o fim() abaixo limpa */ }
    } else {
      if (lift) lift.cancel();
      anims.push(ab.animate(SOBE, { duration: tempo(PULAR), easing: SOBE_EASE, fill: "both" }));
      try { await new Ciclo().espera(PULAR); } catch (e) { return; }
    }
    fim();
    // O botão sumiu com a camada: o foco vai para o título, e não para o body.
    if (focado) focarPrincipal();
  }

  /** Erro inesperado: a camada nunca pode prender a página. "Parou" é só cancelamento. */
  function falhou(e) { if (e && e.name === "Parou") return; fim(); }

  async function tocar() {
    try { await linhaDoTempo(); } catch (e) { falhou(e); }
  }

  async function linhaDoTempo() {
    A($(".yy", arte), [{ transform: BIGT }, { transform: IDT }], { delay: 1150, duration: 620 });
    draw(q(".y1"), 760, 380, SAI); draw(q(".y2"), 760, 380, SAI);
    draw(q(".y3"), 990, 180, "cubic-bezier(.3,0,.2,1)");
    letras(1230);
    lift = A(ab, SOBE, { delay: FIM, duration: SUBIR, easing: SOBE_EASE });
    particulas();
    await ciclo.espera((FIM + SUBIR * 0.25) * RITMO);
    avisar();
    await ciclo.espera(SUBIR * 0.75 * RITMO);
    fim();
  }

  botao.addEventListener("click", pular);
  guardarSessao("poty-abertura", "vista");
  // Sem fontes em 300 ms, começa mesmo assim, com a fonte de reserva
  // (o único texto da camada é a assinatura, que só entra perto de 1,4 s).
  const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontes, new Promise((ok) => setTimeout(ok, tempo(300)))]).then(() => { if (!terminou && !pulou) tocar(); });
}
