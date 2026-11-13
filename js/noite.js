import { CHAVES } from "./config.js";
import { $, $$, REDUZ, Ciclo, SAI } from "./util.js";

/*
 * A mesma noite em dois WhatsApps. Os roteiros são dados: lista de passos.
 * Cada passo pode ter, nesta ordem de execução:
 *   relogio [hora, rótulo, marca]   troca o relógio do meio
 *   lado "sem" | "com" | "ambos" + dig (ms de "digitando", só no lado "com")
 *   tipo + texto + hora             bolha (pac, cli, sis, sis ruim)
 *   pend n                          contador "n sem resposta" do lado sem CRM
 *   pill texto                      etiqueta do lado com CRM
 *   res [lado, texto, classe]       resultado do lado
 *   apagar                          some com as mensagens
 *   espera ms                       pausa antes do próximo passo
 */
const NOITE = [
  { lado: "ambos", tipo: "pac", texto: "Oi, boa noite. Vocês atendem sábado?", hora: "21:04", pend: 1 },
  { lado: "com", dig: 1100, tipo: "cli", texto: "Boa noite. Atendemos, sim, das 8h às 12h. Você já é paciente aqui ou seria a primeira vez?", hora: "21:04", pill: "respondida na hora", espera: 900 },
  { relogio: ["21:05", "quinta, à noite", 0], lado: "sem", tipo: "pac", texto: "queria ver se tem horário pra esse sábado", hora: "21:05", pend: 2 },
  { lado: "com", tipo: "pac", texto: "primeira vez", hora: "21:05" },
  { lado: "com", dig: 1000, tipo: "cli", texto: "Que bom que você procurou a gente. A consulta seria pelo plano de saúde ou particular?", hora: "21:05", espera: 1000 },
  { relogio: ["21:06", "quinta, à noite", 0], lado: "com", tipo: "pac", texto: "pelo plano. vocês aceitam o Plano Exemplo?", hora: "21:06" },
  { lado: "com", dig: 1000, tipo: "cli", texto: "Aceitamos, sim. Para sábado tenho 9h ou 10h30. Qual fica melhor para você?", hora: "21:06", espera: 900 },
  { relogio: ["21:07", "quinta, à noite", 0], lado: "com", tipo: "pac", texto: "9h tá ótimo", hora: "21:07" },
  { lado: "com", dig: 900, tipo: "cli", texto: "Combinado: sábado, às 9h. Se precisar mudar, é só me chamar aqui.", hora: "21:07", espera: 500 },
  { lado: "com", tipo: "sis", texto: "Marina foi para Agendado · 1ª consulta · plano", espera: 1500 },
  { relogio: ["22:40", "quinta, mais tarde", 1], lado: "sem", tipo: "sis ruim", texto: "9 conversas novas, ninguém respondeu", pend: 11, espera: 1900 },
  { relogio: ["08:00", "sexta, a recepção abre", 2], lado: "sem", dig: 1100 },
  { lado: "sem", tipo: "cli", texto: "Bom dia, desculpe a demora. Ainda quer marcar para sábado?", hora: "08:12", espera: 1300 },
  { lado: "sem", tipo: "pac", texto: "ah, já consegui em outra clínica ontem à noite. obrigada", hora: "08:15", pend: 10, espera: 500 },
  { res: ["sem", "Marcou em outra clínica", "err"] },
  { res: ["com", "Na agenda: sábado, 9h", "ok"], espera: 5600 },
  { apagar: true, espera: 450 }
];

/** A tarde reaproveita a noite: muda só horários, rótulos e as palavras que dependem da hora. */
const TARDE_TROCAS = {
  "21:04": "14:04", "21:05": "14:05", "21:06": "14:06", "21:07": "14:07",
  "22:40": "16:40", "08:00": "18:00", "08:12": "18:02", "08:15": "18:05",
  "quinta, à noite": "quinta, à tarde", "sexta, a recepção abre": "a recepção fecha"
};
const TARDE_TEXTOS = [
  ["Oi, boa noite.", "Oi, boa tarde."],
  ["Boa noite. Atendemos", "Boa tarde. Atendemos"],
  ["Bom dia, desculpe a demora.", "Boa tarde, desculpe a demora."],
  ["ontem à noite", "hoje"]
];
const trocar = (v) => TARDE_TROCAS[v] ?? v;
function paraTarde(passos) {
  return passos.map((p) => {
    const q = { ...p };
    if (q.hora) q.hora = trocar(q.hora);
    if (q.relogio) q.relogio = [trocar(q.relogio[0]), trocar(q.relogio[1]), q.relogio[2]];
    if (q.texto) for (const [de, para] of TARDE_TEXTOS) q.texto = q.texto.replace(de, para);
    return q;
  });
}

const MANHA = [
  { lado: "ambos", tipo: "pac", texto: "Oi, vocês atendem sábado?", hora: "ontem 19:40" },
  { lado: "sem", tipo: "sis ruim", texto: "A recepção abre o WhatsApp: 14 conversas misturadas", hora: "08:00", pend: 1, espera: 1500 },
  { lado: "com", tipo: "sis", texto: "A recepção abre o CRM: 3 conversas esperando, da mais antiga para a mais nova", hora: "08:00", pill: "3 esperando", espera: 1500 },
  { relogio: ["08:02", "sexta, de manhã", 1], lado: "com", dig: 1100, tipo: "cli", texto: "Bom dia, Marina. Atendemos, sim, das 8h às 12h. Quer marcar para este sábado?", hora: "08:02", espera: 900 },
  { lado: "com", tipo: "pac", texto: "quero sim, 9h dá?", hora: "08:03" },
  { lado: "com", dig: 900, tipo: "cli", texto: "Dá, sim. Marcado: sábado, 9h.", hora: "08:03", espera: 500 },
  { lado: "com", tipo: "sis", texto: "Marina foi para Agendado", espera: 1500 },
  { relogio: ["09:30", "sexta, de manhã", 2], lado: "sem", dig: 1100 },
  { lado: "sem", tipo: "cli", texto: "Bom dia. Atendemos, sim. Ainda quer marcar?", hora: "09:30", pend: 0, espera: 1300 },
  { lado: "sem", tipo: "pac", texto: "já marquei em outro lugar, obrigada", hora: "09:34", espera: 500 },
  { res: ["sem", "Marcou em outra clínica", "err"] },
  { res: ["com", "Na agenda: sábado, 9h", "ok"], espera: 5600 },
  { apagar: true, espera: 450 }
];

const ROTEIROS = {
  noite: {
    passos: NOITE,
    relogio: ["21:04", "quinta, à noite", 0],
    resumo: "Sem CRM: a mensagem das 21h fica sem resposta até de manhã, e a paciente marca em outra clínica. Com CRM: a atendente responde na hora, pergunta se é a primeira consulta e se é pelo plano ou particular, e marca sábado às 9h."
  },
  tarde: {
    passos: paraTarde(NOITE),
    relogio: ["14:04", "quinta, à tarde", 0],
    resumo: "Sem CRM: a mensagem das 14h fica sem resposta até o fim da tarde, e a paciente marca em outra clínica. Com CRM: a atendente responde na hora, pergunta se é a primeira consulta e se é pelo plano ou particular, e marca sábado às 9h.",
    titulo: "O que acontece com a mensagem que chega na hora mais cheia da recepção?",
    lead: "A mesma tarde, em dois WhatsApps. Só um deles tem CRM.",
    gat: "Quem responde em até 1 hora tem quase 7 vezes mais chance de a conversa avançar. Na hora mais cheia, a recepção não dá conta de todas as mensagens."
  },
  manha: {
    passos: MANHA,
    relogio: ["08:00", "sexta, de manhã", 0],
    resumo: "Sem CRM: a recepção procura a mensagem entre 14 conversas e responde tarde, e a paciente já marcou em outro lugar. Com CRM: a equipe abre o dia vendo quem está esperando e marca sábado às 9h."
  }
};

const escolher = () => (!CHAVES.atendenteIA ? ROTEIROS.manha : CHAVES.cena === "tarde" ? ROTEIROS.tarde : ROTEIROS.noite);

let roteiro, chats, res, pills, hora, quando, marcas;
let ciclo = null, pos = { i: 0, fase: 0 };
let iniciado = false, visivel = false, pausado = false, rodou = false;

function bolha(chat, tipo, texto, h) {
  const m = document.createElement("div");
  m.className = "msg " + tipo;
  m.append(document.createTextNode(texto));
  if (h) { const t = document.createElement("time"); t.textContent = h; m.append(t); }
  chat.append(m);
  if (!REDUZ) m.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 280, easing: SAI });
}

function digitando(chat) {
  const d = document.createElement("div");
  d.className = "msg digitando cli";
  d.innerHTML = "<i></i><i></i><i></i>";
  chat.append(d);
  return d;
}

function relogio([h, txt, k]) {
  hora.textContent = h;
  quando.textContent = txt;
  marcas.forEach((m, j) => m.classList.toggle("on", j <= k));
  if (!REDUZ) hora.animate([{ opacity: 0.25, transform: "translateY(5px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: SAI });
}

function pendentes(n) {
  pills.sem.hidden = n === 0;
  pills.sem.textContent = n + " sem resposta";
  if (n && !REDUZ) pills.sem.animate([{ transform: "scale(1.08)" }, { transform: "none" }], { duration: 300, easing: SAI });
}

function resultado(lado, txt, cls) {
  const el = res[lado];
  el.innerHTML = "";
  const t = document.createElement("span");
  t.className = "tag " + cls;
  t.textContent = txt;
  el.append(t);
  if (!REDUZ) t.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: SAI });
}

function limpar() {
  chats.sem.innerHTML = "";
  chats.com.innerHTML = "";
  res.sem.innerHTML = "";
  res.com.innerHTML = "";
  pendentes(0);
  pills.com.hidden = true;
  relogio(roteiro.relogio);
}

const lados = (p) => (p.lado === "ambos" ? ["sem", "com"] : [p.lado]);

/** A parte do passo que acontece de uma vez (sem esperas). */
function aplicar(p) {
  if (p.relogio) relogio(p.relogio);
  if (p.texto) for (const l of lados(p)) bolha(chats[l], p.tipo, p.texto, p.hora);
  if (p.pend !== undefined) pendentes(p.pend);
  if (p.pill) { pills.com.hidden = false; pills.com.textContent = p.pill; }
  if (p.res) resultado(...p.res);
  if (p.apagar) for (const c of Object.values(chats)) [...c.children].forEach((m) => m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }));
}

async function rodar(meu) {
  try {
    for (;;) {
      const passos = roteiro.passos;
      for (; pos.i < passos.length; pos.i++, pos.fase = 0) {
        const p = passos[pos.i];
        if (pos.i === 0 && pos.fase === 0) { limpar(); await meu.espera(600); }
        if (pos.fase === 0) {
          if (p.dig) {
            const d = digitando(chats[p.lado]);
            try { await meu.espera(p.dig); } finally { d.remove(); }
          }
          aplicar(p);
          pos.fase = 1;
        }
        if (p.espera) await meu.espera(p.espera);
      }
      pos = { i: 0, fase: 0 };
    }
  } catch (e) {
    if (e?.name !== "Parou") throw e;
  }
}

/** Cena inteira de uma vez, para quem pediu menos movimento. */
function mostrarFinal() {
  limpar();
  for (const p of roteiro.passos) if (!p.apagar) aplicar(p);
}

function atualizar() {
  const deve = iniciado && visivel && !pausado && !REDUZ;
  if (deve && !ciclo) { rodou = true; ciclo = new Ciclo(); rodar(ciclo).catch((e) => console.error("Falha na cena:", e)); }
  if (!deve && ciclo) { ciclo.parar(); ciclo = null; }
}

function escreverTexto(roteiroAtual) {
  const { titulo, lead, gat, resumo } = roteiroAtual;
  const r = $("#n-resumo");
  if (r) r.textContent = resumo;
  if (titulo) { const h = $('#s-crm h2[data-chave="atendenteIA"]'); if (h) h.textContent = titulo; }
  if (lead) { const l = $('#s-crm .lead[data-chave="atendenteIA"]'); if (l) l.textContent = lead; }
  if (gat) {
    const p = $('.gat p[data-chave="atendenteIA"]');
    if (p?.firstChild?.nodeType === Node.TEXT_NODE) p.firstChild.textContent = gat;
  }
}

export function iniciarNoite() {
  if (iniciado) return;
  const noite = $("#noite");
  if (!noite) return;
  roteiro = escolher();
  chats = { sem: $("#n-sem .n-chat"), com: $("#n-com .n-chat") };
  res = { sem: $("#n-sem .n-res"), com: $("#n-com .n-res") };
  pills = { sem: $("#n-pill-a"), com: $("#n-pill-b") };
  hora = $("#n-hora b");
  quando = $("#n-hora > span");
  marcas = $$(".n-marcas i");
  escreverTexto(roteiro);
  limpar();
  iniciado = true;
  if (REDUZ || pausado) mostrarFinal(); // pausa gravada desde o início: a cena final, não dois chats vazios
  if (REDUZ) return;
  new IntersectionObserver((entradas) => {
    visivel = entradas[entradas.length - 1].isIntersecting;
    atualizar();
  }, { threshold: 0.15 }).observe(noite);
}

/** Congela a cena no ponto em que está (botão "Pausar animações"). */
export function pausar() {
  pausado = true; atualizar();
  if (iniciado && !REDUZ && !rodou) mostrarFinal(); // ainda não rodou: mostra a cena final
}
/** Retoma de onde parou. */
export function continuar() { pausado = false; atualizar(); }
