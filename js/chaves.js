import { CHAVES } from "./config.js";
import { $$ } from "./util.js";

/** Liga ou desliga as variantes da página. Só as chaves booleanas; "cena" fica para a Tarefa 7. */
export function aplicarChaves(chaves = CHAVES) {
  for (const [nome, valor] of Object.entries(chaves)) {
    if (typeof valor !== "boolean") continue;
    const sel = (attr) => `[${attr}="${CSS.escape(nome)}"]`;
    // O HTML nasce com tudo ligado: chave ligada não mexe em [data-chave] (o HTML decide).
    if (!valor) for (const el of $$(sel("data-chave"))) el.hidden = true;
    for (const el of $$(sel("data-chave-off"))) el.hidden = valor;
  }
}
