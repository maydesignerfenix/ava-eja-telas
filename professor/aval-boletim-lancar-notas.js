(function () {
  "use strict";

  const B = window.AvalBoletim;
  const { COMPS, LIMITS, PASS, esc } = B;
  const students = B.load();
  let savedSnapshot = JSON.stringify(students);

  const FIELD_LABEL = { online: "Online", presencial: "Presencial", participacao: "Participação", complementar: "Em processo" };

  const params = new URLSearchParams(location.search);
  const state = {
    comp: COMPS.includes(params.get("c")) ? params.get("c") : "C1",
    query: "",
    onlyMissing: params.get("state") === "pendentes",
    selected: new Set(),
    invalid: new Set(), // "id:field"
    sortKey: null,
    sortDir: "asc",
  };

  const pickerEl = document.getElementById("comp-picker");
  const bodyEl = document.getElementById("ln-body");
  const emptyEl = document.getElementById("empty");
  const progressEl = document.getElementById("comp-progress");
  const onlyMissingEl = document.getElementById("only-missing");
  const searchEl = document.getElementById("search");
  const selectAllEl = document.getElementById("select-all");
  const massCountEl = document.getElementById("mass-count");
  const massFieldEl = document.getElementById("mass-field");
  const massValueEl = document.getElementById("mass-value");
  const massSuffixEl = document.getElementById("mass-suffix");
  const massApplyEl = document.getElementById("mass-apply");
  const saveEl = document.getElementById("save");
  const saveStatusEl = document.getElementById("save-status");
  const nextEl = document.getElementById("next-comp");

  const g = (s) => s.grades[state.comp];
  const base = (gr) => (gr.presencial == null || gr.participacao == null ? null : gr.online + gr.presencial + gr.participacao);
  const needsComplement = (gr) => { const b = base(gr); return b != null && b < PASS; };

  /* ---------- Competency picker ---------- */
  function renderPicker() {
    pickerEl.innerHTML = COMPS.map((c) => {
      const p = B.compProgress(students, c);
      const pressed = c === state.comp;
      if (p.complete) {
        return `<button class="comp-pill" type="button" data-comp="${c}" aria-pressed="${pressed}" aria-label="${c}: completa">
          <span class="comp-pill__check" aria-hidden="true">✓</span><span class="comp-pill__name">${c}</span></button>`;
      }
      const pct = p.total ? (p.launched / p.total) * 100 : 0;
      return `<button class="comp-card" type="button" data-comp="${c}" aria-pressed="${pressed}">
        <span class="comp-card__top"><span class="comp-card__name">${c}</span><span class="comp-card__missing">faltam ${p.missing}</span></span>
        <span class="comp-card__bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
        <span class="comp-card__count">${p.launched} de ${p.total} lançadas</span></button>`;
    }).join("");
  }

  function renderContext() {
    const p = B.compProgress(students, state.comp);
    document.querySelectorAll("[data-ctx-comp]").forEach((el) => (el.textContent = state.comp));
    progressEl.textContent = `${p.launched} de ${p.total} lançadas${p.cc ? ` · ${p.cc} com CC` : ""}`;
    const idx = COMPS.indexOf(state.comp);
    const next = COMPS[(idx + 1) % COMPS.length];
    nextEl.textContent = idx === COMPS.length - 1 ? `Voltar: ${next} ›` : `Próxima: ${next} ›`;
    nextEl.dataset.comp = next;
  }

  /* ---------- Rows ---------- */
  function fieldHtml(s, field) {
    const gr = g(s);
    const v = gr[field];
    const id = `f-${s.id}-${field}`;
    const max = LIMITS[field];
    const label = `${FIELD_LABEL[field]} · até ${max}`;
    const invalid = state.invalid.has(`${s.id}:${field}`);
    const input = `<input class="ln-field" id="${id}" type="text" inputmode="numeric" maxlength="3" autocomplete="off"
      data-id="${s.id}" data-field="${field}" value="${v == null ? "" : v}" aria-label="${label} – ${esc(s.name)}"
      ${invalid ? 'aria-invalid="true"' : ""} />`;
    return `<div class="ln-cell ln-cell--field" data-cell="${field}"><label class="ln-label" for="${id}">${label}</label>${input}${invalid ? `<span class="ln-error">0 a ${max}</span>` : ""}</div>`;
  }

  function procHtml(s) {
    const gr = g(s);
    const label = `Em processo · até ${LIMITS.complementar}`;
    if (!needsComplement(gr)) {
      return `<div class="ln-cell ln-cell--proc" data-cell="complementar"><span class="ln-label">${label}</span><span class="ln-none" aria-label="Não se aplica">—</span><span class="ln-caption">Complementar</span></div>`;
    }
    const id = `f-${s.id}-complementar`;
    const invalid = state.invalid.has(`${s.id}:complementar`);
    return `<div class="ln-cell ln-cell--field ln-cell--proc" data-cell="complementar"><label class="ln-label" for="${id}">${label}</label>
      <input class="ln-field ln-field--pending" id="${id}" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—"
        data-id="${s.id}" data-field="complementar" value="${gr.complementar == null ? "" : gr.complementar}"
        aria-label="Nota complementar (em processo) – ${esc(s.name)}" ${invalid ? 'aria-invalid="true"' : ""} />
      ${invalid ? `<span class="ln-error">0 a ${LIMITS.complementar}</span>` : ""}<span class="ln-caption">Complementar</span></div>`;
  }

  function finalHtml(s) {
    const f = B.finalGrade(g(s));
    const cls = f == null ? "ln-final--none" : f < PASS ? "ln-final--low" : "";
    return `<span class="ln-label">Nota ${state.comp}</span><strong class="ln-final ${cls}">${f == null ? "—" : f}</strong>`;
  }
  function sitHtml(s) {
    const done = B.finalGrade(g(s)) != null;
    return `<span class="ln-label">Situação</span><span class="ln-sit${done ? "" : " ln-sit--pending"}">${done ? "✓ lançada" : "pendente"}</span>`;
  }

  function rowHtml(s) {
    const gr = g(s);
    const checked = state.selected.has(s.id);
    if (gr.cc) {
      return `<div class="ln-row ln-row--cc" role="row" data-row="${s.id}">
        <div class="ln-id"><input type="checkbox" disabled aria-label="${esc(s.name)} – competência certificada" />${esc(s.name)}</div>
        <div class="ln-cert"><span class="cc-pill">CC</span><span>RDS · ${gr.ccDate}</span></div></div>`;
    }
    return `<div class="ln-row${checked ? " is-selected" : ""}" role="row" data-row="${s.id}">
      <div class="ln-id"><input type="checkbox" data-select="${s.id}" ${checked ? "checked" : ""} aria-label="Marcar ${esc(s.name)}" />${esc(s.name)}</div>
      <div class="ln-cell ln-cell--field"><span class="ln-label">Online · até ${LIMITS.online}</span><span class="ln-field ln-field--ro" aria-label="Online (automática): ${gr.online}">${gr.online}</span></div>
      ${fieldHtml(s, "presencial")}
      ${fieldHtml(s, "participacao")}
      ${procHtml(s)}
      <div class="ln-cell" data-cell="final">${finalHtml(s)}</div>
      <div class="ln-cell" data-cell="sit">${sitHtml(s)}</div>
    </div>`;
  }

  function visibleStudents() {
    const q = B.normalize(state.query.trim());
    let list = students.filter((s) => (!q || B.normalize(s.name).includes(q)) && (!state.onlyMissing || (!g(s).cc && B.finalGrade(g(s)) == null)));
    if (state.sortKey) {
      const dir = state.sortDir === "asc" ? 1 : -1;
      const val = (s) => {
        if (state.sortKey === "name") return s.name;
        if (g(s).cc) return 999;
        if (state.sortKey === "final") return B.finalGrade(g(s)) ?? -1;
        if (state.sortKey === "status") return B.finalGrade(g(s)) == null ? 0 : 1;
        return g(s)[state.sortKey] ?? -1;
      };
      list = list.slice().sort((a, b) => { const x = val(a), y = val(b); return (typeof x === "string" ? x.localeCompare(y, "pt-BR") : x - y) * dir; });
    }
    return list;
  }

  function render() {
    renderPicker();
    renderContext();
    const list = visibleStudents();
    bodyEl.innerHTML = list.map(rowHtml).join("");
    emptyEl.hidden = list.length > 0;
    document.querySelectorAll(".ln-head [data-sort]").forEach((b) => {
      if (b.dataset.sort === state.sortKey) b.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      else b.removeAttribute("aria-sort");
    });
    updateSelection();
    updateSaveState();
    B.renderIndicators(students);
  }

  /** Refresh the derived cells of one row without re-rendering inputs being edited. */
  function refreshRow(s) {
    const row = bodyEl.querySelector(`[data-row="${s.id}"]`);
    if (!row) return;
    row.querySelector('[data-cell="final"]').innerHTML = finalHtml(s);
    row.querySelector('[data-cell="sit"]').innerHTML = sitHtml(s);
    const proc = row.querySelector('[data-cell="complementar"]');
    const wantsField = needsComplement(g(s));
    if (wantsField !== proc.classList.contains("ln-cell--field")) {
      if (!wantsField) { g(s).complementar = null; state.invalid.delete(`${s.id}:complementar`); }
      proc.outerHTML = procHtml(s);
    }
    renderPicker();
    renderContext();
    B.renderIndicators(students);
    updateSaveState();
  }

  /* ---------- Editing + validation ---------- */
  function parseGrade(raw, max) {
    const t = raw.trim();
    if (t === "") return { ok: true, value: null };
    if (!/^\d{1,3}$/.test(t)) return { ok: false };
    const n = Number(t);
    return n <= max ? { ok: true, value: n } : { ok: false };
  }

  function setInvalid(input, key, invalid, max) {
    const cell = input.closest(".ln-cell");
    let err = cell.querySelector(".ln-error");
    if (invalid) {
      state.invalid.add(key);
      input.setAttribute("aria-invalid", "true");
      if (!err) {
        err = document.createElement("span");
        err.className = "ln-error";
        err.id = input.id + "-err";
        input.insertAdjacentElement("afterend", err);
      }
      err.textContent = `0 a ${max}`;
      input.setAttribute("aria-describedby", err.id);
    } else {
      state.invalid.delete(key);
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      if (err) err.remove();
    }
  }

  bodyEl.addEventListener("input", (e) => {
    const input = e.target.closest(".ln-field[data-field]");
    if (!input) return;
    const s = students.find((x) => String(x.id) === input.dataset.id);
    const field = input.dataset.field;
    const max = LIMITS[field];
    const r = parseGrade(input.value, max);
    setInvalid(input, `${s.id}:${field}`, !r.ok, max);
    g(s)[field] = r.ok ? r.value : null;
    refreshRow(s);
  });

  // Enter → same field of the next student (Shift+Enter → previous)
  bodyEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const input = e.target.closest(".ln-field[data-field]");
    if (!input) return;
    e.preventDefault();
    const fields = [...bodyEl.querySelectorAll(`.ln-field[data-field="${input.dataset.field}"]`)];
    const i = fields.indexOf(input);
    const next = fields[e.shiftKey ? i - 1 : i + 1];
    if (next) { next.focus(); next.select(); }
  });

  /* ---------- Selection + mass fill ---------- */
  const selectable = () => visibleStudents().filter((s) => !g(s).cc);

  function updateSelection() {
    const n = state.selected.size;
    massCountEl.textContent = n ? `${n} ${n === 1 ? "estudante marcado" : "estudantes marcados"}` : "nenhum estudante marcado";
    massCountEl.classList.toggle("is-active", n > 0);
    const sel = selectable();
    const all = sel.length > 0 && sel.every((s) => state.selected.has(s.id));
    selectAllEl.checked = all;
    selectAllEl.indeterminate = !all && sel.some((s) => state.selected.has(s.id));
    updateMass();
  }

  function updateMass() {
    const field = massFieldEl.value;
    const max = LIMITS[field];
    massValueEl.placeholder = `0 a ${max}`;
    massSuffixEl.textContent = `de ${max}%`;
    const r = parseGrade(massValueEl.value, max);
    const invalid = massValueEl.value.trim() !== "" && !r.ok;
    massValueEl.closest(".mass__value").classList.toggle("is-invalid", invalid);
    massValueEl.setAttribute("aria-invalid", String(invalid));
    massApplyEl.disabled = !(state.selected.size && r.ok && r.value != null);
  }

  bodyEl.addEventListener("change", (e) => {
    const box = e.target.closest("[data-select]");
    if (!box) return;
    const id = Number(box.dataset.select);
    if (box.checked) state.selected.add(id); else state.selected.delete(id);
    box.closest(".ln-row").classList.toggle("is-selected", box.checked);
    updateSelection();
  });

  selectAllEl.addEventListener("change", () => {
    selectable().forEach((s) => (selectAllEl.checked ? state.selected.add(s.id) : state.selected.delete(s.id)));
    render();
  });

  document.getElementById("select-missing").addEventListener("click", () => {
    state.selected.clear();
    students.filter((s) => !g(s).cc && B.finalGrade(g(s)) == null).forEach((s) => state.selected.add(s.id));
    render();
  });

  massFieldEl.addEventListener("change", updateMass);
  massValueEl.addEventListener("input", updateMass);
  massApplyEl.addEventListener("click", () => {
    const field = massFieldEl.value;
    const r = parseGrade(massValueEl.value, LIMITS[field]);
    if (!r.ok || r.value == null) return;
    let applied = 0;
    students.forEach((s) => {
      if (!state.selected.has(s.id) || g(s).cc) return;
      if (field === "complementar" && !needsComplement(g(s))) return;
      g(s)[field] = r.value;
      state.invalid.delete(`${s.id}:${field}`);
      applied++;
    });
    state.selected.clear();
    massValueEl.value = "";
    render();
    massCountEl.textContent = `${FIELD_LABEL[field]} = ${r.value} aplicado a ${applied} ${applied === 1 ? "estudante" : "estudantes"}`;
  });

  /* ---------- Save + navigation ---------- */
  function updateSaveState() {
    const dirty = JSON.stringify(students) !== savedSnapshot;
    const hasInvalid = state.invalid.size > 0;
    saveEl.disabled = !dirty || hasInvalid;
    saveStatusEl.textContent = hasInvalid ? "Corrija as notas inválidas" : dirty ? "Alterações não salvas" : "Tudo salvo";
    saveStatusEl.classList.toggle("is-dirty", dirty || hasInvalid);
  }

  saveEl.addEventListener("click", () => {
    if (state.invalid.size) return;
    B.save(students);
    savedSnapshot = JSON.stringify(students);
    updateSaveState();
  });

  function selectComp(c) {
    state.comp = c;
    state.selected.clear();
    state.invalid.clear();
    const url = new URL(location.href);
    url.searchParams.set("c", c);
    history.replaceState(null, "", url);
    render();
  }

  pickerEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-comp]");
    if (!btn) return;
    selectComp(btn.dataset.comp);
    pickerEl.querySelector(`[data-comp="${btn.dataset.comp}"]`).focus();
  });
  nextEl.addEventListener("click", () => selectComp(nextEl.dataset.comp));

  document.querySelector(".ln-head").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sort]");
    if (!btn) return;
    const key = btn.dataset.sort;
    state.sortDir = state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc";
    state.sortKey = key;
    render();
  });

  onlyMissingEl.checked = state.onlyMissing;
  onlyMissingEl.addEventListener("change", () => { state.onlyMissing = onlyMissingEl.checked; render(); });
  searchEl.addEventListener("input", () => { state.query = searchEl.value; render(); });
  B.bindClassFilters(() => render());

  window.addEventListener("beforeunload", (e) => {
    if (JSON.stringify(students) !== savedSnapshot) { e.preventDefault(); e.returnValue = ""; }
  });

  render();
})();
