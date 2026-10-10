(function () {
  "use strict";

  const B = window.AvalBoletim;
  const students = B.load();
  const SORT_ICON = '<img src="assets/prof-aval/chevrons-up-down.svg" width="9" height="12" alt="" />';
  const STATUS = { incompleto: "INCOMPLETO", "em-processo": "EM PROCESSO", aprovado: "APROVADO" };
  const STATUS_ORDER = { "em-processo": 0, incompleto: 1, aprovado: 2 };

  const headEl = document.getElementById("grade-head");
  const bodyEl = document.getElementById("grade-body");
  const emptyEl = document.getElementById("empty");
  const countEl = document.getElementById("student-count");
  const searchEl = document.getElementById("search");

  const state = { query: "", sortKey: null, sortDir: "asc" };

  function sortBtn(key, label, extraClass = "") {
    const sorted = state.sortKey === key ? ` aria-sort="${state.sortDir === "asc" ? "ascending" : "descending"}"` : "";
    return `<button class="th-sort ${extraClass}" type="button" data-sort="${key}"${sorted}>${label} ${SORT_ICON}</button>`;
  }

  function renderHead() {
    const comps = B.COMPS.map((c) => {
      const p = B.compProgress(students, c);
      const status = p.complete
        ? `<a class="grade-head__status grade-head__status--done" href="aval-boletim-lancar-notas.html?c=${c}">completa</a>`
        : `<a class="grade-head__status grade-head__status--pending" href="aval-boletim-lancar-notas.html?c=${c}" aria-label="${c}: ${p.launched} de ${p.total} lançadas – lançar notas">${p.launched} de ${p.total}</a>`;
      return `<div role="columnheader">${sortBtn(c, c)}${status}</div>`;
    }).join("");
    headEl.innerHTML = `
      <div role="columnheader">${sortBtn("name", "ESTUDANTE")}</div>
      ${comps}
      <div role="columnheader">${sortBtn("process", "<span><span>EM</span><span>PROCESSO</span></span>", "th-sort--process")}</div>
      <div role="columnheader"><span class="th-info">${sortBtn("total", "SOMATÓRIA")}<span class="th-info__icon" title="Média das competências; aparece quando todas estão lançadas"> ⓘ</span></span></div>
      <div role="columnheader">${sortBtn("status", "SITUAÇÃO")}</div>`;
  }

  function gradeHtml(v) {
    if (v === "cc") return `<span class="grade grade--cc">cc</span>`;
    if (v == null) return `<span class="grade grade--none" aria-label="não lançada">—</span>`;
    return `<span class="grade${v < B.PASS ? " grade--low" : ""}">${v}</span>`;
  }

  function rowHtml(s) {
    const sum = B.summary(s);
    const cells = B.COMPS.map((c, i) => `
      <div class="grade-cell" role="cell"><span class="grade-cell__label">${c}</span><span class="grade-cell__value">${gradeHtml(sum.finals[i])}</span></div>`).join("");
    const proc = sum.complementar
      ? `<span class="grade grade--none">+${sum.complementar.value}</span><span class="grade-sub">${sum.complementar.comp}</span>`
      : `<span class="grade grade--none">—</span>`;
    const total = sum.total != null
      ? gradeHtml(sum.total)
      : `<span class="grade grade--none">—</span><span class="grade-sub">faltam ${sum.missing}</span>`;
    return `
      <div class="grade-row" role="row">
        <div class="grade-cell grade-name" role="rowheader">${B.esc(s.name)}</div>
        ${cells}
        <div class="grade-cell grade-cell--process" role="cell"><span class="grade-cell__label">Em Processo</span><span class="grade-cell__value">${proc}</span></div>
        <div class="grade-cell grade-cell--sum" role="cell"><span class="grade-cell__label">Somatória</span><span class="grade-cell__value">${total}</span></div>
        <div class="grade-cell grade-status" role="cell"><span class="grade-cell__label">Situação</span><span class="badge-sit badge-sit--${sum.status}">${STATUS[sum.status]}</span></div>
      </div>`;
  }

  function sortValue(s, key) {
    const sum = B.summary(s);
    if (key === "name") return s.name;
    if (key === "status") return STATUS_ORDER[sum.status];
    if (key === "total") return sum.total == null ? -1 : sum.total;
    if (key === "process") return sum.complementar ? sum.complementar.value : -1;
    const v = sum.finals[B.COMPS.indexOf(key)];
    return v === "cc" ? 101 : v == null ? -1 : v;
  }

  function render() {
    renderHead();
    const q = B.normalize(state.query.trim());
    let list = students.filter((s) => !q || B.normalize(s.name).includes(q));
    if (state.sortKey) {
      const dir = state.sortDir === "asc" ? 1 : -1;
      list = list.slice().sort((a, b) => {
        const x = sortValue(a, state.sortKey), y = sortValue(b, state.sortKey);
        return (typeof x === "string" ? x.localeCompare(y, "pt-BR") : x - y) * dir;
      });
    }
    bodyEl.innerHTML = list.map(rowHtml).join("");
    emptyEl.hidden = list.length > 0;
    countEl.textContent = `${list.length} ${list.length === 1 ? "estudante" : "estudantes"}`;
    B.renderIndicators(students);
  }

  headEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sort]");
    if (!btn) return;
    const key = btn.dataset.sort;
    state.sortDir = state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc";
    state.sortKey = key;
    render();
    headEl.querySelector(`[data-sort="${key}"]`).focus();
  });

  searchEl.addEventListener("input", () => { state.query = searchEl.value; render(); });
  B.bindClassFilters(() => { state.query = searchEl.value; render(); });

  const help = document.getElementById("help");
  const helpToggle = document.getElementById("help-toggle");
  helpToggle.addEventListener("click", () => {
    help.hidden = !help.hidden;
    helpToggle.setAttribute("aria-expanded", String(!help.hidden));
  });

  // Export the visible table as CSV.
  document.getElementById("export").addEventListener("click", () => {
    const header = ["Estudante", ...B.COMPS, "Em processo", "Somatória", "Situação"];
    const lines = students.map((s) => {
      const sum = B.summary(s);
      return [s.name, ...sum.finals.map((v) => (v == null ? "" : v)), sum.complementar ? `+${sum.complementar.value} ${sum.complementar.comp}` : "", sum.total == null ? "" : sum.total, STATUS[sum.status]];
    });
    const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "boletim-turma.csv" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  render();
})();
