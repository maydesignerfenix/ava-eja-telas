/* Professor · Criar atividade – 3-step wizard.
   Query params: ?etapa=1|2|3 &state=
     etapa 1: vazio (default) | preenchido | erro
     etapa 2: vazio (default) | modal | modal-selecionadas | adicionadas
     etapa 3: fechado (default) | aberto
   Without params the last session state (sessionStorage) is restored. */
(function () {
  "use strict";

  const D = window.AtividadeDados;
  const $ = (id) => document.getElementById(id);
  const esc = D.escapeHtml;
  const MAX_TAGS = 4;
  const PANELS = ["para", "duracao", "tempo", "dependencia", "tentativas", "random"];

  const blankAgenda = () => ({
    open: {}, para: "turma", turmas: [], inicio: "", fim: "",
    tempoOn: false, tempo: "", dependenciaOn: false, dep: "", depAtividade: "", depNota: "", depHabilidade: "", depCaderno: "",
    correcao: false, tentativasOn: false, tentativas: "02", randomOn: false, randomQtd: "", randomPts: "",
  });
  const blankState = () => ({
    etapa: 1,
    config: { segmento: "", area: "", competencia: "", habilidade: "", marcadores: [] },
    questoes: [],
    agenda: blankAgenda(),
  });
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------------------------------------------------------- state */
  const params = new URLSearchParams(location.search);
  const qEtapa = Number(params.get("etapa")) || 0;
  const qState = params.get("state") || "";
  let state;
  const showErrors = { 1: false, 2: false, 3: false };
  let collapsed = false; // current step body collapsed via its header

  if (qEtapa || qState) {
    state = blankState();
    state.etapa = Math.min(Math.max(qEtapa || 1, 1), 3);
    if (state.etapa === 1 && qState === "preenchido") state.config = clone(D.FILLED_STEP1);
    if (state.etapa > 1) state.config = clone(D.FILLED_DONE);
    if (state.etapa === 3 || qState === "adicionadas") state.questoes = clone(D.DEFAULT_QUESTIONS);
    if (state.etapa === 3 && qState === "aberto") {
      Object.assign(state.agenda, {
        open: Object.fromEntries(PANELS.map((p) => [p, true])),
        turmas: ["Anos Iniciais - AI", "EJA - Webinar"],
        inicio: "2026-11-23T16:00", fim: "2026-11-29T19:00",
      });
    }
    if (state.etapa === 1 && qState === "erro") showErrors[1] = true;
  } else {
    const saved = D.load();
    state = Object.assign(blankState(), saved || {});
    state.agenda = Object.assign(blankAgenda(), state.agenda || {});
  }

  /* ------------------------------------------------------------- elements */
  const steps = [...document.querySelectorAll(".wizard > .step")];
  const sel = { segmento: $("f-segmento"), area: $("f-area"), competencia: $("f-competencia"), habilidade: $("f-habilidade") };
  const tagsBox = $("tags"), tagsList = $("tags-list"), tagInput = $("f-marcador");

  function fillOptions(selectEl, list) {
    selectEl.insertAdjacentHTML("beforeend", list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join(""));
  }
  fillOptions(sel.segmento, D.OPTIONS.segmento);
  fillOptions(sel.area, D.OPTIONS.area.map((a) => a.label));
  fillOptions(sel.competencia, D.OPTIONS.competencia);
  fillOptions(sel.habilidade, D.OPTIONS.habilidade);
  fillOptions($("f-turma"), D.OPTIONS.turma);
  fillOptions($("f-dep-atividade"), D.OPTIONS.atividades);
  fillOptions($("f-dep-habilidade"), D.OPTIONS.habilidade);
  fillOptions($("f-dep-caderno"), D.OPTIONS.caderno);
  fillOptions($("f-tentativas"), D.OPTIONS.tentativas);
  fillOptions($("picker-tipo"), [...new Set(D.QUESTIONS.map((q) => q.tipo))]);

  /* ----------------------------------------------------------- validation */
  function configErrors() {
    const c = state.config, e = {};
    for (const k of ["segmento", "area", "competencia", "habilidade"]) if (!c[k]) e[k] = true;
    if (!c.marcadores.length) e.marcador = true;
    return e;
  }
  function agendaErrors() {
    const a = state.agenda, e = {};
    const scheduling = a.turmas.length || a.inicio || a.fim;
    if (!scheduling) return e; // agendamento é opcional
    if (a.para === "turma" && !a.turmas.length) e.turma = true;
    if (!a.inicio) e.inicio = true;
    if (a.inicio && a.fim && a.fim <= a.inicio) e.fim = true;
    return e;
  }
  const stepValid = {
    1: () => !Object.keys(configErrors()).length,
    2: () => state.questoes.length > 0,
    3: () => !Object.keys(agendaErrors()).length,
  };

  function setError(input, errEl, on) {
    errEl.hidden = !on;
    if (input) input.setAttribute("aria-invalid", on ? "true" : "false");
  }
  function renderErrors() {
    const ce = showErrors[1] ? configErrors() : {};
    for (const k of Object.keys(sel)) setError(sel[k], $("e-" + k), !!ce[k]);
    setError(tagInput, $("e-marcador"), !!ce.marcador);
    tagsBox.classList.toggle("is-invalid", !!ce.marcador);
    $("e-questoes").hidden = !(showErrors[2] && !state.questoes.length);
    const ae = showErrors[3] ? agendaErrors() : {};
    setError($("f-turma"), $("e-turma"), !!ae.turma);
    setError($("f-inicio"), $("e-inicio"), !!ae.inicio);
    setError($("f-fim"), $("e-fim"), !!ae.fim);
  }

  /* -------------------------------------------------------------- render */
  const item = (label, valueHtml, cls = "") => `<div class="${cls}"><dt>${esc(label)}</dt><dd>${valueHtml}</dd></div>`;
  const total = () => state.questoes.reduce((s, q) => s + (Number(q.pontos) || 0), 0);
  const fmt = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
  const pts = (n) => `${fmt(n)} ${n === 1 ? "ponto" : "pontos"}`;
  const brDate = (v) => (v ? v.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}).*$/, "$3/$2/$1, $4") : "");

  function compBadges(area, comp, habs) {
    return `<span class="bdg-row">${area ? `<span class="bdg bdg--strong">${esc(area)}</span>` : ""}<span class="bdg-group">${
      comp ? `<span class="bdg bdg--strong">${esc(comp)}</span>` : ""}${habs.map((h) => `<span class="bdg bdg--soft">${esc(h)}</span>`).join("")}</span></span>`;
  }

  function renderSummaries() {
    const c = state.config;
    $("step-1-summary").innerHTML =
      item("Segmento / Etapa", esc(c.segmento || "—")) +
      item("Competência e Habilidades", compBadges(D.areaCode(c.area), D.code(c.competencia), c.habilidade ? [D.code(c.habilidade)] : []), "has-badges") +
      item("Marcadores", c.marcadores.map((m) => `<span class="chip">${esc(m)}</span>`).join("") || "—", "has-badges");
    $("step-2-summary").innerHTML = item("Questões", String(state.questoes.length)) + item("Pontuação máxima", pts(total()));
    const a = state.agenda;
    $("step-3-summary").innerHTML = a.turmas.length
      ? item("Turmas", esc(a.turmas.join(", "))) + item("Inícia em", esc(brDate(a.inicio) || "—"))
      : item("Agendamento", "Não agendada");
  }

  function renderSteps() {
    steps.forEach((section) => {
      const n = Number(section.dataset.step);
      const isCurrent = n === state.etapa;
      const isDone = n < state.etapa && stepValid[n]();
      section.classList.toggle("is-current", isCurrent);
      section.classList.toggle("is-done", isDone);
      const body = $(`step-${n}-body`), summary = $(`step-${n}-summary`), toggle = section.querySelector(".step__toggle");
      const open = isCurrent && !collapsed;
      body.hidden = !open;
      summary.hidden = !isDone;
      toggle.setAttribute("aria-expanded", String(open));
      if (isCurrent) toggle.setAttribute("aria-current", "step"); else toggle.removeAttribute("aria-current");
    });
    renderSummaries();
  }

  function renderConfig() {
    for (const k of Object.keys(sel)) sel[k].value = state.config[k] || "";
    tagsList.innerHTML = state.config.marcadores
      .map((m, i) => `<li><button class="chip" type="button" data-tag="${i}" aria-label="Remover marcador ${esc(m)}">${esc(m)}</button></li>`)
      .join("");
    tagsBox.classList.toggle("has-tags", state.config.marcadores.length > 0);
    tagInput.placeholder = state.config.marcadores.length ? "" : "Exemplo: Atividade de teste";
    tagInput.disabled = state.config.marcadores.length >= MAX_TAGS;
  }

  function renderQuestions() {
    const has = state.questoes.length > 0;
    $("q-selected").hidden = !has;
    $("q-empty").hidden = has;
    $("q-total").textContent = `Pontuação máxima: ${pts(total())}`;
    $("q-list").innerHTML = state.questoes.map((it, i) => {
      const q = D.byId(it.id);
      const warn = q.semCorreta ? `<p class="q-warn">Questão sem alternativa correta</p>` : "";
      return `
<li class="q-row" data-index="${i}">
  <button class="q-drag" type="button" draggable="true" data-drag="${i}" aria-label="Reordenar questão ${i + 1}: use as setas para cima e para baixo">
    <img src="assets/prof-ativ/drag-indicator.svg" width="20" height="20" alt="" />
  </button>
  <div class="q-main">
    <div class="q-info">
      <p class="q-title" title="${esc(q.title)}"><span class="visually-hidden">${i + 1}. </span>${esc(q.title)}</p>
      ${warn}
    </div>
    <div class="q-points">
      <label for="pts-${i}">Pontos</label>
      <input class="input" id="pts-${i}" type="number" min="0" step="0.5" inputmode="decimal" placeholder="1" value="${esc(it.pontos)}" data-points="${i}" />
    </div>
  </div>
  <div class="q-tools">
    <a class="icon-action" href="#" aria-label="Editar questão ${i + 1}"><img src="assets/prof-ativ/edit.svg" width="20" height="20" alt="" /></a>
    <button class="icon-action" type="button" data-remove="${i}" aria-label="Remover questão ${i + 1}"><img src="assets/prof-ativ/delete.svg" width="20" height="20" alt="" /></button>
  </div>
</li>`;
    }).join("");
    const n = state.questoes.length;
    $("random-total").textContent = `${n} ${n === 1 ? "questão" : "questões"}`;
    const qtd = $("f-random-qtd");
    qtd.innerHTML = `<option value="">00</option>` + Array.from({ length: n }, (_, k) => String(k + 1).padStart(2, "0")).map((v) => `<option>${v}</option>`).join("");
    qtd.value = state.agenda.randomQtd || "";
  }

  function renderAgenda() {
    const a = state.agenda;
    document.querySelectorAll("#step-3-body .panel").forEach((panel) => {
      const key = panel.dataset.panel;
      const t = panel.querySelector(".panel__toggle");
      if (t) {
        t.setAttribute("aria-expanded", String(!!a.open[key]));
        $("panel-" + key).hidden = !a.open[key];
      }
      const sw = panel.querySelector("[data-switch]");
      if (sw) {
        sw.checked = !!a[key + "On"];
        const fs = panel.querySelector(`[data-for="${key}"]`);
        if (fs) fs.disabled = !sw.checked;
      }
    });
    document.querySelectorAll('input[name="para"]').forEach((r) => (r.checked = r.value === a.para));
    document.querySelectorAll('input[name="dep"]').forEach((r) => (r.checked = r.value === a.dep));
    $("f-turma").value = "";
    $("turmas-count").hidden = !a.turmas.length;
    $("turmas-count").textContent = `${a.turmas.length} ${a.turmas.length === 1 ? "Selecionado" : "Selecionados"}:`;
    $("turma-chips").innerHTML = a.turmas.map((t, i) =>
      `<li class="turma-chip"><span>${esc(t)}</span><button type="button" data-turma="${i}" aria-label="Remover turma ${esc(t)}"><img src="assets/prof-ativ/chip-close.svg" width="24" height="24" alt="" /></button></li>`).join("");
    $("f-inicio").value = a.inicio;
    $("f-fim").value = a.fim;
    $("f-tempo").value = a.tempo;
    $("f-dep-atividade").value = a.depAtividade;
    $("f-dep-nota").value = a.depNota;
    $("f-dep-habilidade").value = a.depHabilidade;
    $("f-dep-caderno").value = a.depCaderno;
    $("f-correcao").checked = !!a.correcao;
    $("f-tentativas").value = a.tentativas;
    $("f-random-qtd").value = a.randomQtd;
    $("f-random-pts").value = a.randomPts;
  }

  function renderActions() {
    const ok1 = stepValid[1]();
    $("btn-draft").disabled = !ok1;
    $("btn-create").disabled = !(ok1 && stepValid[2]());
  }

  function render() {
    renderConfig();
    renderQuestions();
    renderAgenda();
    renderSteps();
    renderErrors();
    renderActions();
  }
  function renderLight() { // after typing: avoid rebuilding inputs that have focus
    renderSteps();
    renderErrors();
    renderActions();
  }

  /* -------------------------------------------------------- persistence */
  function touch() {
    D.save(state);
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    $("autosave-text").textContent = `Salvo automaticamente às ${p(d.getHours())}:${p(d.getMinutes())} em ${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} por Alice Souza`;
  }
  function syncUrl() {
    const u = new URL(location.href);
    u.searchParams.set("etapa", state.etapa);
    u.searchParams.delete("state");
    history.replaceState(null, "", u);
  }

  /* --------------------------------------------------------- navigation */
  function goTo(target, { focus = true } = {}) {
    let n = target;
    for (let s = 1; s < target; s++) {
      if (!stepValid[s]()) { showErrors[s] = true; n = s; break; }
    }
    const blocked = n < target;
    state.etapa = n;
    collapsed = false;
    render();
    syncUrl();
    D.save(state);
    if (focus) {
      const section = steps[n - 1];
      section.scrollIntoView({ block: "start", behavior: "smooth" });
      const firstInvalid = section.querySelector('[aria-invalid="true"]');
      (blocked && firstInvalid ? firstInvalid : section.querySelector(".step__toggle")).focus({ preventScroll: true });
    }
  }

  steps.forEach((section) => {
    section.querySelector(".step__toggle").addEventListener("click", () => {
      const n = Number(section.dataset.step);
      if (n === state.etapa) { collapsed = !collapsed; renderSteps(); } else goTo(n);
    });
  });
  $("btn-back").addEventListener("click", () => {
    if (state.etapa > 1) goTo(state.etapa - 1);
    else location.href = "turma-atividades.html";
  });

  /* ------------------------------------------------------------- etapa 1 */
  for (const k of Object.keys(sel)) {
    sel[k].addEventListener("change", () => { state.config[k] = sel[k].value; touch(); renderLight(); });
  }
  function addTag(raw) {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    const list = state.config.marcadores;
    if (list.length >= MAX_TAGS || list.some((m) => m.toLowerCase() === v.toLowerCase())) return;
    list.push(v.toUpperCase());
    tagInput.value = "";
    renderConfig(); touch(); renderLight();
    if (!tagInput.disabled) tagInput.focus();
  }
  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput.value); }
    else if (e.key === "Backspace" && !tagInput.value && state.config.marcadores.length) {
      state.config.marcadores.pop(); renderConfig(); touch(); renderLight();
    }
  });
  tagInput.addEventListener("blur", () => addTag(tagInput.value));
  tagsBox.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-tag]");
    if (chip) {
      state.config.marcadores.splice(Number(chip.dataset.tag), 1);
      renderConfig(); touch(); renderLight(); tagInput.focus();
    } else if (!tagInput.disabled) tagInput.focus();
  });

  /* ------------------------------------------------------------- etapa 2 */
  const qList = $("q-list");
  function moveQuestion(from, to) {
    if (to < 0 || to >= state.questoes.length || from === to) return;
    const [it] = state.questoes.splice(from, 1);
    state.questoes.splice(to, 0, it);
    renderQuestions(); renderSummaries(); touch();
    announce(`Questão movida para a posição ${to + 1}.`);
  }
  qList.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const i = Number(rm.dataset.remove);
      state.questoes.splice(i, 1);
      render(); touch();
      announce("Questão removida da atividade.");
      const next = qList.querySelector(`[data-remove="${Math.min(i, state.questoes.length - 1)}"]`);
      (next || $("open-picker")).focus();
    }
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
  qList.addEventListener("keydown", (e) => {
    const h = e.target.closest("[data-drag]");
    if (!h || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const from = Number(h.dataset.drag), to = from + (e.key === "ArrowUp" ? -1 : 1);
    moveQuestion(from, to);
    const moved = qList.querySelector(`[data-drag="${Math.max(0, Math.min(to, state.questoes.length - 1))}"]`);
    if (moved) moved.focus();
  });
  qList.addEventListener("input", (e) => {
    const inp = e.target.closest("[data-points]");
    if (!inp) return;
    state.questoes[Number(inp.dataset.points)].pontos = inp.value === "" ? "" : Math.max(0, Number(inp.value) || 0);
    $("q-total").textContent = `Pontuação máxima: ${pts(total())}`;
    renderSummaries(); touch();
  });
  let dragFrom = null;
  qList.addEventListener("dragstart", (e) => {
    const h = e.target.closest("[data-drag]");
    if (!h) return;
    dragFrom = Number(h.dataset.drag);
    const row = h.closest(".q-row");
    row.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragFrom));
    e.dataTransfer.setDragImage(row, 20, 20);
  });
  qList.addEventListener("dragover", (e) => {
    const row = e.target.closest(".q-row");
    if (dragFrom === null || !row) return;
    e.preventDefault();
    qList.querySelectorAll(".is-drop-target").forEach((r) => r.classList.remove("is-drop-target"));
    row.classList.add("is-drop-target");
  });
  qList.addEventListener("drop", (e) => {
    const row = e.target.closest(".q-row");
    if (dragFrom === null || !row) return;
    e.preventDefault();
    moveQuestion(dragFrom, Number(row.dataset.index));
    dragFrom = null;
  });
  qList.addEventListener("dragend", () => {
    dragFrom = null;
    qList.querySelectorAll(".is-dragging, .is-drop-target").forEach((r) => r.classList.remove("is-dragging", "is-drop-target"));
  });
  document.querySelector(".q-create").addEventListener("click", (e) => e.preventDefault());

  /* -------------------------------------------------------------- picker */
  const picker = $("picker"), pickerList = $("picker-list");
  let picked = new Set();
  let sortDir = 0; // 0 none, 1 asc, -1 desc

  function renderPicker() {
    const term = $("picker-search").value.trim().toLowerCase();
    const tipo = $("picker-tipo").value, dif = $("picker-dif").value;
    const added = new Set(state.questoes.map((q) => q.id));
    let list = D.QUESTIONS.filter((q) =>
      (!tipo || q.tipo === tipo) && (!dif || q.dificuldade === dif) &&
      (!term || `${q.title} ${q.tipo} ${q.meta}`.toLowerCase().includes(term)));
    if (sortDir) list = [...list].sort((a, b) => sortDir * a.title.localeCompare(b.title, "pt-BR"));
    $("picker-count").textContent = `${list.length} ${list.length === 1 ? "questão" : "questões"}`;
    pickerList.innerHTML = list.length ? list.map((q) => {
      const isAdded = added.has(q.id);
      const metaIcon = q.draft ? `<img src="../shared/assets/stylus.svg" width="24" height="24" alt="" />` : "";
      return `
<li class="pk-row${isAdded ? " is-added" : ""}">
  <input class="pk-check" type="checkbox" value="${q.id}" aria-label="Selecionar questão: ${esc(q.title)}" ${isAdded || picked.has(q.id) ? "checked" : ""} ${isAdded ? "disabled" : ""} />
  <button class="pk-fav" type="button" data-fav="${q.id}" aria-pressed="${q.favorita ? "true" : "false"}" aria-label="Favoritar questão"><img src="assets/prof-ativ/${q.favorita ? "favorite-filled" : "favorite"}.svg" width="24" height="24" alt="" /></button>
  <div class="pk-main">
    <div class="pk-info">
      <p class="pk-title">${esc(q.title)}</p>
      <p class="pk-meta">${metaIcon}${esc(q.meta)}</p>
      <p class="pk-type"><img src="assets/prof-ativ/rule.svg" width="24" height="24" alt="" />${esc(q.tipo)}</p>
    </div>
    <div class="pk-badges">${compBadges(q.area, q.competencia, q.habilidades)}</div>
    <div class="pk-dif"><span class="chip">${esc(q.dificuldade)}</span></div>
  </div>
  <button class="pk-more" type="button" aria-label="Mais opções"><img src="assets/prof-ativ/more-vert.svg" width="20" height="20" alt="" /></button>
</li>`;
    }).join("") : `<li class="picker__empty">Nenhuma questão encontrada.</li>`;
    const n = picked.size;
    $("picker-add").textContent = n ? `ESCOLHER QUESTÕES (${n})` : "ESCOLHER QUESTÕES";
  }

  function openPicker(preselect = []) {
    picked = new Set(preselect);
    $("picker-search").value = "";
    $("picker-tipo").value = "";
    $("picker-dif").value = "";
    renderPicker();
    picker.showModal();
    $("picker-search").focus();
  }
  const closePicker = () => picker.close();

  $("open-picker").addEventListener("click", () => openPicker());
  $("picker-close").addEventListener("click", closePicker);
  $("picker-cancel").addEventListener("click", closePicker);
  picker.addEventListener("close", () => $("open-picker").focus());
  picker.addEventListener("click", (e) => { if (e.target === picker) closePicker(); });
  ["picker-search", "picker-tipo", "picker-dif"].forEach((id) => $(id).addEventListener("input", renderPicker));
  $("picker-filter-btn").addEventListener("click", (e) => {
    const open = e.currentTarget.getAttribute("aria-expanded") !== "true";
    e.currentTarget.setAttribute("aria-expanded", String(open));
    $("picker-filters").hidden = !open;
  });
  $("picker-sort").addEventListener("click", (e) => {
    sortDir = sortDir === 1 ? -1 : 1;
    e.currentTarget.setAttribute("aria-sort", sortDir === 1 ? "ascending" : "descending");
    renderPicker();
  });
  pickerList.addEventListener("change", (e) => {
    const cb = e.target;
    if (cb.type !== "checkbox") return;
    cb.checked ? picked.add(cb.value) : picked.delete(cb.value);
    const n = picked.size;
    $("picker-add").textContent = n ? `ESCOLHER QUESTÕES (${n})` : "ESCOLHER QUESTÕES";
  });
  pickerList.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (!fav) return;
    const q = D.byId(fav.dataset.fav);
    q.favorita = !q.favorita;
    fav.setAttribute("aria-pressed", String(q.favorita));
    fav.querySelector("img").src = `assets/prof-ativ/${q.favorita ? "favorite-filled" : "favorite"}.svg`;
  });
  $("picker-add").addEventListener("click", () => {
    const n = picked.size;
    picked.forEach((id) => state.questoes.push({ id, pontos: 1 }));
    picked.clear();
    closePicker();
    if (!n) return;
    render(); touch();
    announce(`${n} ${n === 1 ? "questão adicionada" : "questões adicionadas"} à atividade.`);
  });

  /* ------------------------------------------------------------- etapa 3 */
  const step3 = $("step-3-body");
  step3.addEventListener("click", (e) => {
    const t = e.target.closest(".panel__toggle");
    if (t) {
      const key = t.closest(".panel").dataset.panel;
      state.agenda.open[key] = !state.agenda.open[key];
      renderAgenda(); touch();
      return;
    }
    const rmTurma = e.target.closest("[data-turma]");
    if (rmTurma) {
      state.agenda.turmas.splice(Number(rmTurma.dataset.turma), 1);
      renderAgenda(); renderLight(); touch();
      $("f-turma").focus();
    }
  });
  step3.addEventListener("change", (e) => {
    const a = state.agenda, el = e.target;
    if (el.dataset.switch) {
      const key = el.dataset.switch;
      a[key + "On"] = el.checked;
      if (el.checked) a.open[key] = true;
      renderAgenda();
    } else if (el.name === "para") a.para = el.value;
    else if (el.name === "dep") a.dep = el.value;
    else if (el.id === "f-turma") {
      if (el.value && !a.turmas.includes(el.value)) a.turmas.push(el.value);
      renderAgenda();
    } else {
      const map = {
        "f-inicio": "inicio", "f-fim": "fim", "f-tempo": "tempo", "f-dep-atividade": "depAtividade", "f-dep-nota": "depNota",
        "f-dep-habilidade": "depHabilidade", "f-dep-caderno": "depCaderno", "f-correcao": "correcao",
        "f-tentativas": "tentativas", "f-random-qtd": "randomQtd", "f-random-pts": "randomPts",
      };
      if (!map[el.id]) return;
      a[map[el.id]] = el.type === "checkbox" ? el.checked : el.value;
    }
    renderAgenda(); renderLight(); touch();
  });
  $("f-tempo").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
  });

  /* -------------------------------------------------------------- submit */
  function announce(msg) {
    const s = $("status");
    s.hidden = false;
    s.textContent = msg;
  }
  $("wizard").addEventListener("submit", (e) => {
    e.preventDefault();
    for (const n of [1, 2, 3]) {
      if (!stepValid[n]()) { showErrors[n] = true; goTo(n); return; }
    }
    touch();
    announce(state.agenda.turmas.length
      ? `Atividade criada e agendada para ${state.agenda.turmas.join(", ")}.`
      : "Atividade criada com sucesso. Você pode agendá-la depois na página da turma.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("btn-draft").addEventListener("click", () => { touch(); announce("Rascunho salvo."); });
  $("preview-link").addEventListener("click", () => D.save(state));

  /* ---------------------------------------------------------------- init */
  render();
  if (qEtapa || qState) D.save(state);
  if (state.etapa === 2 && (qState === "modal" || qState === "modal-selecionadas")) {
    openPicker(qState === "modal-selecionadas" ? ["q1", "q2", "q3", "q4"] : []);
  }
})();
