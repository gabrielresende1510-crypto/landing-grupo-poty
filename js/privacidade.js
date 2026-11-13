// Entrada da página de privacidade: o tema, a escolha sobre cookies e o "Voltar ao site".
import { iniciarTema } from "./tema.js";
import { iniciarTopo } from "./topo.js";
import { iniciarConsentimento } from "./consentimento.js";

/**
 * "Voltar ao site": quem veio da landing volta pelo histórico, e a landing reabre o que estava aberto,
 * no mesmo ponto (M3). Quem abriu a privacidade direto, ou pediu outra aba, segue o link para o começo.
 */
function iniciarVoltar() {
  let veioDoSite = false;
  try {
    const de = new URL(document.referrer);
    const inicio = new URL("./", location.href);
    veioDoSite = de.origin === inicio.origin && de.pathname.replace(/index\.html$/, "") === inicio.pathname;
  } catch (e) { veioDoSite = false; }
  if (!veioDoSite || history.length < 2) return;
  for (const a of document.querySelectorAll("a[data-voltar]")) {
    a.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      history.back();
    });
  }
}

const seguro = (nome, fn) => { try { fn(); } catch (e) { console.error(`Falha em ${nome}:`, e); } };
seguro("tema", iniciarTema);
seguro("topo", iniciarTopo);
seguro("consentimento", iniciarConsentimento);
seguro("voltar", iniciarVoltar);
