(function () {
  "use strict";

  const STATUS = {
    "nao-iniciada": { label: "Não iniciada", className: "badge--nao-iniciada", order: 0 },
    "em-correcao": { label: "Em correção", className: "badge--em-correcao", order: 1 },
    corrigido: { label: "Corrigido", className: "badge--corrigido", order: 2 },
  };

  // Action kinds seen in Figma 4157:65292:
  //  iniciar      INICIAR ATIVIDADE (outline, full width)
  //  refazer      REFAZER (outline) + info
  //  finalizada   FINALIZADA (disabled) + info
  //  dep-pendente DEPENDÊNCIA (outline) + INICIAR (disabled) + info
  //  dep-bloq     DEPENDÊNCIA (disabled) + info
  //  dep-feita    DEPENDÊNCIA (disabled) + INICIAR (outline) + info
  //  correcao     VER CORREÇÃO (outline + icon)
  const START = "28/04/26 - 16:14";
  const rows = [
    ["Leitura e interpretação de textos do cotidiano", "nao-iniciada", "iniciar"],
    ["Matemática nas situações do dia a dia", "em-correcao", "refazer"],
    ["Sociedade, cidadania e direitos", "em-correcao", "finalizada"],
    ["Matemática nas situações do dia a dia", "em-correcao", "finalizada"],
    ["Comunicação e linguagens no dia a dia", "nao-iniciada", "dep-pendente"],
    ["Comunicação e linguagens no dia a dia", "nao-iniciada", "dep-pendente"],
    ["Comunicação e linguagens no dia a dia", "nao-iniciada", "dep-bloq"],
    ["Leitura e interpretação de textos do cotidiano", "em-correcao", "refazer"],
    ["Comunicação e linguagens no dia a dia", "em-correcao", "dep-feita"],
    ["Comunicação e linguagens no dia a dia", "nao-iniciada", "iniciar"],
    ["Textos, mídias e tecnologia digitais", "corrigido", "correcao"],
    ["Textos, mídias e tecnologia digitais", "nao-iniciada", "iniciar"],
    ["Raciocínio lógico e resolução de problemas", "nao-iniciada", "iniciar", "INDETERMINADO"],
    ["Ciência e tecnologia no cotidiano", "corrigido", "finalizada", "INDETERMINADO"],
    ["Geografia, espaço e cidadania", "corrigido", "finalizada", "INDETERMINADO"],
    ["Leitura e interpretação de textos do cotidiano", "corrigido", "finalizada"],
  ].map(([title, status, action, end], i) => ({ id: i + 1, title, status, action, start: START, end: end || START }));

  const TIPS = {
    refazer: "Você pode refazer esta atividade enquanto ela estiver aberta.",
    finalizada: "Atividade finalizada. Não é possível enviar novamente.",
    "dep-pendente": "Conclua a atividade de dependência para liberar esta atividade.",
    "dep-bloq": "A atividade de dependência ainda não está disponível.",
    "dep-feita": "Dependência concluída. A atividade já pode ser iniciada.",
  };

  const $ = (id) => document.getElementById(id);
  const listEl = $("plan-list");
  const emptyEl = $("empty-state");
  const countEl = $("plan-count");
  const searchAll = $("search-all");
  const searchList = $("search-list");
  const sortEl = $("sort-select");
  const dialog = $("filter-dialog");
  const filterStatusEl = $("filter-status");
  const state = { query: "", status: "", sort: "" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const start = (a, label, cls) => `<a class="btn btn--outline-sm ${cls}" href="realizar-atividade.html?atividade=${a.id}">${label}</a>`;
  const disabled = (label, cls) => `<button class="btn btn--outline-sm btn--disabled ${cls}" type="button" aria-disabled="true">${label}</button>`;
  const info = (a) => `<button class="plan-info" type="button" data-tip="${esc(TIPS[a.action])}" aria-label="${esc(TIPS[a.action])}"><img src="assets/est-acomp/info-outline.svg" width="20" height="20" alt="" /></button>`;

  function actions(a) {
    switch (a.action) {
      case "iniciar": return `<div class="plan-row__actions plan-row__actions--single">${start(a, "INICIAR ATIVIDADE", "btn--wide")}</div>`;
      case "refazer": return `<div class="plan-row__actions plan-row__actions--single"><a class="btn btn--outline-sm btn--std" href="realizar-atividade.html?atividade=${a.id}&amp;tentativa=2">REFAZER</a>${info(a)}</div>`;
      case "finalizada": return `<div class="plan-row__actions plan-row__actions--single">${disabled("FINALIZADA", "btn--std")}${info(a)}</div>`;
      case "dep-pendente": return `<div class="plan-row__actions">${start(a, "DEPENDÊNCIA", "btn--dep")}${disabled("INICIAR", "btn--start")}${info(a)}</div>`;
      case "dep-bloq": return `<div class="plan-row__actions plan-row__actions--single">${disabled("DEPENDÊNCIA", "btn--std")}${info(a)}</div>`;
      case "dep-feita": return `<div class="plan-row__actions">${disabled("DEPENDÊNCIA", "btn--dep")}${start(a, "INICIAR", "btn--start")}${info(a)}</div>`;
      case "correcao": return `<div class="plan-row__actions plan-row__actions--single"><a class="btn btn--outline-sm btn--wide" href="devolutiva.html?atividade=textos-midias"><img src="assets/est-acomp/fact-check.svg" width="20" height="20" alt="" />VER CORREÇÃO</a></div>`;
      default: return "";
    }
  }

  function rowTemplate(a) {
    const s = STATUS[a.status];
    return `
      <li class="plan-row">
        <div class="plan-row__main">
          <h3 class="plan-row__title"><span title="${esc(a.title)}">${esc(a.title)}</span></h3>
          <div class="plan-row__col plan-row__col--status">
            <p class="plan-row__label">STATUS</p>
            <span class="badge ${s.className}">${s.label}</span>
          </div>
          <div class="plan-row__duration"><img src="assets/est-acomp/alarm-off.svg" width="20" height="20" alt="Atividade sem duração" title="Atividade sem duração" /></div>
          <div class="plan-row__col plan-row__col--start">
            <p class="plan-row__label">INICIA EM</p>
            <p class="plan-row__date">${a.start}</p>
          </div>
          <div class="plan-row__col">
            <p class="plan-row__label">TERMINA EM</p>
            <p class="plan-row__date">${a.end}</p>
          </div>
        </div>
        ${actions(a)}
      </li>`;
  }

  function render() {
    const q = normalize(state.query.trim());
    let items = rows.filter((a) => (!q || normalize(a.title).includes(q)) && (!state.status || a.status === state.status));
    if (state.sort) {
      const [key, dir] = state.sort.split(":");
      const d = dir === "desc" ? -1 : 1;
      items = items.slice().sort((x, y) => (key === "title" ? x.title.localeCompare(y.title, "pt-BR") : STATUS[x.status].order - STATUS[y.status].order) * d);
    }
    listEl.innerHTML = items.map(rowTemplate).join("");
    emptyEl.hidden = items.length > 0;
    countEl.textContent = q || state.status ? `${items.length} ${items.length === 1 ? "Atividade" : "Atividades"}` : "87 Atividades";
  }

  function onSearch(e) {
    state.query = e.target.value;
    (e.target === searchAll ? searchList : searchAll).value = e.target.value;
    render();
  }
  searchAll.addEventListener("input", onSearch);
  searchList.addEventListener("input", onSearch);
  sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });

  $("open-filter").addEventListener("click", () => { filterStatusEl.value = state.status; dialog.showModal(); });
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "apply") state.status = filterStatusEl.value;
    if (dialog.returnValue === "clear") state.status = "";
    render();
  });

  // Pagination: visual state only until wired to the API.
  const numbered = Array.from(document.querySelectorAll(".page-btn[data-page]")).filter((b) => /^\d+$/.test(b.dataset.page));
  document.querySelectorAll(".page-btn[data-page]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cur = numbered.findIndex((b) => b.classList.contains("is-active"));
      const p = btn.dataset.page;
      const next = p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(numbered.length - 1, cur + 1) : numbered.indexOf(btn);
      numbered.forEach((b, i) => { b.classList.toggle("is-active", i === next); i === next ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"); });
    })
  );

  // ?status=em-correcao opens the list pre-filtered
  const qs = new URLSearchParams(location.search);
  if (STATUS[qs.get("status")]) state.status = qs.get("status");
  render();
})();
