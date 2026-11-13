import { iniciarTema } from "./tema.js";
import { aplicarChaves } from "./chaves.js";
import { iniciarWhatsApp } from "./whatsapp.js";
import { iniciarAbertura } from "./abertura.js";
import { iniciarTopo } from "./topo.js";
import * as rios from "./rios.js";
import * as troca from "./troca.js";
import { iniciarServicos } from "./servicos.js";
import * as noite from "./noite.js";
import * as painel from "./painel.js";
import * as video from "./video.js";
import * as exemplos from "./exemplos.js";
import { iniciarCriativos } from "./criativos.js";
import { iniciarTeste } from "./teste.js";
import { iniciarEnxuto } from "./enxuto.js";
import { iniciarMovimento } from "./movimento.js";
import { iniciarConsentimento } from "./consentimento.js";

// Cada tarefa seguinte acrescenta a sua linha, nesta ordem.
// Cada parte roda isolada: o erro de uma fica no console, mas não derruba as outras
// (a abertura e os rios precisam subir mesmo se uma parte falhar).
const seguro = (nome, fn) => { try { fn(); } catch (e) { console.error(`Falha em ${nome}:`, e); } };

seguro("tema", iniciarTema);
seguro("topo", iniciarTopo);
seguro("chaves", aplicarChaves);
seguro("whatsapp", iniciarWhatsApp);
seguro("servicos", iniciarServicos);
seguro("noite", noite.iniciarNoite);
seguro("painel", painel.iniciarPainel);
seguro("video", video.iniciarVideo);
seguro("exemplos", exemplos.iniciarExemplos);
seguro("criativos", iniciarCriativos);
seguro("enxuto", iniciarEnxuto);
seguro("teste", iniciarTeste);
seguro("consentimento", iniciarConsentimento);
// Botão "Pausar animações": cada módulo para sozinho; um erro não derruba os outros.
seguro("movimento", () => iniciarMovimento((parado) => {
  for (const [nome, m] of Object.entries({ rios, troca, noite, painel, video, exemplos })) {
    seguro(nome, parado ? m.pausar : m.continuar);
  }
}));
seguro("abertura", () => iniciarAbertura(() => {
  seguro("rios", rios.iniciar);
  seguro("troca", troca.iniciar);
}));
