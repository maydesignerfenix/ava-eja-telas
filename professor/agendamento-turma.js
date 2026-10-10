/* Agendar atividade dentro da turma – fluxo em 3 etapas.
   ?etapa=1..7 abre diretamente cada estado do Figma:
   1/2 etapa 1 vazia (online) · 3 etapa 2 sem atividade · 4 formato impresso
   5 etapa 2 com atividade · 6 etapa 3 (regras recolhidas) · 7 etapa 3 (regras abertas) */
(function () {
  "use strict";

  const A = "assets/prof-agenda/";
  const ARROW = "../shared/assets/mobile-select-arrow.svg";

  // ---- Mock data (replace with API) -------------------------------------
  const ACTIVITIES = [
    "Eletricidade e astronomia - Diagnóstica",
    "Leitura e interpretação de textos do cotidiano",
    "Matemática nas situações do dia a dia",
    "Corpo, saúde e qualidade de vida",
    "Sociedade, cidadania e direitos",
    "Comunicação e linguagens no dia a dia",
    "Números, gráficos e tomada de decisão",
    "Meio ambiente e sustentabilidade",
  ].map((title, i) => ({ id: String(i + 1), title, createdBy: "Criado em 28/08/26 por Marina Alves", questions: 40 - i * 2 }));
  const STUDENTS = ["Alice Moreira", "Caio Duarte", "Helena Barros", "Igor Santana", "Juliana Prado", "Marcos Lima"];
  const COMPETENCIAS = ["C1 - Matemática e suas tecnologias", "C2 - Linguagens e suas tecnologias", "C3 - Ciências da natureza", "C4 - Ciências humanas"];
  const TURMAS = ["Anos Finais - AF", "Anos Iniciais - AI", "EJA - Webinar", "EJA - Módulo 3 - Noite", "9º Ano B - Manhã"];
  const PARA_LABEL = { turma: "Toda turma", estudantes: "Estudantes selecionados", competencia: "Por competência" };

  // ---- State --------------------------------------------------------------
  const blank = () => ({
    titulo: "", categoria: "Atividade", formato: "online",
    para: "turma", estudantes: [], competencia: "", turmas: ["Anos Finais - AF"],
    inicio: "", termino: "", atividade: null,
    open: 1, reached: 1, showErrors: {},
    rules: {
      tempo: { on: false, val: "00:00" },
      dependencia: { on: false, tipo: "", atividade: "", nota: "", habilidade: "", caderno: "" },
      correcao: { on: false },
      tentativas: { on: false, val: "" },
      random: { on: false, qtd: "", pont: "" },
    },
    expanded: [],
  });
  const filled = (s) => Object.assign(s, { titulo: "Diagnóstica de ciências – 2º bimestre", inicio: "2026-04-28T16:14", termino: "2026-04-28T16:14" });

  function preset(etapa) {
    const s = blank();
    switch (etapa) {
      case 3: filled(s); s.open = 2; s.reached = 2; break;
      case 4: s.formato = "impresso"; break;
      case 5: filled(s); s.atividade = "1"; s.open = 2; s.reached = 2; break;
      case 6: filled(s); s.atividade = "1"; s.open = 3; s.reached = 3; break;
      case 7:
        filled(s); s.atividade = "1"; s.open = 3; s.reached = 3;
        s.turmas = ["Anos Iniciais - AI", "EJA - Webinar"];
        s.inicio = "2026-11-23T16:00"; s.termino = "2026-11-29T19:00";
        s.expanded = ["para", "duracao", "tempo", "dependencia", "tentativas", "random"];
        break;
    }
    return s;
  }

  const params = new URLSearchParams(location.search);
  let etapa = parseInt(params.get("etapa"), 10);
  if (!(etapa >= 1 && etapa <= 7)) etapa = 1;
  const state = preset(etapa);
  let dirty = false;

  // ---- Helpers ------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return "—";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const online = () => state.formato === "online";
  const lastStep = () => (online() ? 3 : 1);
  const activity = () => ACTIVITIES.find((a) => a.id === state.atividade) || null;
  const status = $("#ag-status");
  const announce = (msg) => { status.textContent = ""; setTimeout(() => (status.textContent = msg), 30); };

  // ---- Validation -----------------------------------------------------------
  function errorsFor(step) {
    const e = {};
    if (step === 1 || step === 3) {
      if (step === 1 && !state.titulo.trim()) e.titulo = "Informe o título do agendamento.";
      if (step === 1 && state.titulo.trim() && state.titulo.trim().length < 3) e.titulo = "O título deve ter pelo menos 3 caracteres.";
      if (online()) {
        if (state.para === "estudantes" && !state.estudantes.length) e[`para-estudantes-${step}`] = "Selecione pelo menos um estudante.";
        if (state.para === "competencia" && !state.competencia) e[`para-competencia-${step}`] = "Selecione uma competência.";
        if (step === 3 && state.para === "turma" && !state.turmas.length) e["para-turmas-3"] = "Selecione pelo menos uma turma.";
      }
      const ini = state.inicio ? new Date(state.inicio) : null;
      if (!state.inicio) e[`inicio-${step}`] = "Informe a data de início.";
      else if (isNaN(ini)) e[`inicio-${step}`] = "Data de início inválida.";
      if (state.termino && ini && !isNaN(ini) && new Date(state.termino) < ini) e[`termino-${step}`] = "O término não pode ser antes do início.";
    }
    if (step === 2 && !state.atividade) e.atividade = "Adicione uma atividade para continuar.";
    if (step === 3) {
      const r = state.rules;
      if (r.tempo.on && (!r.tempo.val || r.tempo.val === "00:00")) e.tempo = "Informe um tempo maior que 00:00.";
      if (r.dependencia.on) {
        const d = r.dependencia;
        if (!d.tipo) e.dep = "Escolha um tipo de dependência.";
        if (d.tipo === "atividade" && !d.atividade) e["dep-atividade"] = "Selecione a atividade.";
        if (d.tipo === "nota" && !(Number(d.nota) >= 1 && Number(d.nota) <= 10)) e["dep-nota"] = "Entre 1 e 10.";
        if (d.tipo === "caderno") {
          if (!d.habilidade) e["dep-habilidade"] = "Selecione a habilidade.";
          if (!d.caderno) e["dep-caderno"] = "Selecione o caderno.";
        }
      }
      if (r.tentativas.on && !(Number(r.tentativas.val) >= 2 && Number(r.tentativas.val) <= 10)) e.tentativas = "Informe de 2 a 10 tentativas.";
      if (r.random.on) {
        const total = activity() ? 10 : 0;
        const q = Number(r.random.qtd);
        if (!(q >= 1 && q <= total)) e["rand-qtd"] = `Informe de 1 a ${total} questões.`;
        const p = Number(r.random.pont);
        if (!(p > 0 && p <= 10)) e["rand-pont"] = "Informe uma pontuação de até 10.";
      }
    }
    return e;
  }
  const valid = (step) => Object.keys(errorsFor(step)).length === 0;
  const validThrough = (step) => { for (let i = 1; i <= step; i++) if (!valid(i)) return i; return 0; };

  // Map error keys → input + message element ids
  const FIELD_IDS = {
    titulo: ["f-titulo", "f-titulo-err"],
    "inicio-1": ["f-inicio-1", "f-inicio-1-err"], "termino-1": ["f-termino-1", "f-termino-1-err"],
    "inicio-3": ["f-inicio-3", "f-inicio-3-err"], "termino-3": ["f-termino-3", "f-termino-3-err"],
    "para-estudantes-1": [null, "para-estudantes-1-err"], "para-estudantes-3": [null, "para-estudantes-3-err"],
    "para-competencia-1": ["f-comp-1", "para-competencia-1-err"], "para-competencia-3": ["f-comp-3", "para-competencia-3-err"],
    "para-turmas-3": ["f-turmas-3", "para-turmas-3-err"],
    atividade: [null, "activity-err"],
    tempo: ["f-tempo", "f-tempo-err"], dep: [null, "f-dep-err"],
    "dep-atividade": ["f-dep-atividade", "f-dep-atividade-err"], "dep-nota": ["f-dep-nota", "f-dep-nota-err"],
    "dep-habilidade": ["f-dep-habilidade", "f-dep-habilidade-err"], "dep-caderno": ["f-dep-caderno", "f-dep-caderno-err"],
    tentativas: ["f-tentativas", "f-tentativas-err"], "rand-qtd": ["f-rand-qtd", "f-rand-qtd-err"], "rand-pont": ["f-rand-pont", "f-rand-pont-err"],
  };
  const STEP_OF = (key) => (/^(titulo|inicio-1|termino-1|para-.*-1)$/.test(key) ? 1 : key === "atividade" ? 2 : 3);

  function paintErrors() {
    const all = {};
    [1, 2, 3].forEach((s) => { if (state.showErrors[s]) Object.assign(all, errorsFor(s)); });
    Object.entries(FIELD_IDS).forEach(([key, [inputId, errId]]) => {
      const msg = all[key];
      const err = document.getElementById(errId);
      if (err) { err.textContent = msg || ""; err.hidden = !msg; }
      const input = inputId && document.getElementById(inputId);
      if (input) {
        input.toggleAttribute("aria-invalid", !!msg);
        (input.closest(".select, .input--icon") || input).classList.toggle("is-invalid", !!msg);
      }
    });
    return all;
  }

  function focusFirstError(step) {
    const keys = Object.keys(errorsFor(step));
    for (const k of keys) {
      const [inputId, errId] = FIELD_IDS[k] || [];
      const rule = document.getElementById(inputId || errId)?.closest(".rule");
      if (rule) expandRule(rule.dataset.rule, true);
      const el = (inputId && document.getElementById(inputId)) || document.getElementById(errId)?.closest(".step__body, .rule__body")?.querySelector("input, select, button");
      if (el) { el.focus({ preventScroll: false }); el.scrollIntoView({ block: "center" }); return; }
    }
  }

  // ---- Rendering: Agendar para ------------------------------------------------
  function paraTemplate(ctx) {
    const opt = (value, desc, extra) => {
      const checked = state.para === value;
      return `
        <div class="opt opt--block">
          <label class="opt__line"><input class="radio" type="radio" name="para-${ctx}" value="${value}" ${checked ? "checked" : ""} aria-describedby="para-${value}-${ctx}-desc" /><span class="opt__label">${PARA_LABEL[value]}</span></label>
          <div class="opt__extra">
            <p class="opt__desc" id="para-${value}-${ctx}-desc">${desc}</p>
            ${checked && extra ? extra : ""}
          </div>
        </div>`;
    };

    const turmaExtra = ctx === 3 ? `
      <div class="field">
        <label class="field__label" for="f-turmas-3">Turmas <span class="req" aria-hidden="true">*</span></label>
        <span class="select">
          <select id="f-turmas-3" data-action="add-turma" aria-describedby="para-turmas-3-err">
            <option value="">Selecione</option>
            ${TURMAS.filter((t) => !state.turmas.includes(t)).map((t) => `<option>${esc(t)}</option>`).join("")}
          </select>
          <img src="${ARROW}" width="24" height="24" alt="" />
        </span>
        <p class="field__error" id="para-turmas-3-err" hidden></p>
      </div>
      ${state.turmas.length ? `<p class="opt__desc">${state.turmas.length} ${state.turmas.length === 1 ? "Selecionado" : "Selecionados"}:</p>
      <ul class="chips" aria-label="Turmas selecionadas">${state.turmas.map((t) => `
        <li class="chip"><span class="chip__text" title="${esc(t)}">${esc(t)}</span>
          <button class="chip__remove" type="button" data-action="remove-turma" data-value="${esc(t)}" aria-label="Remover ${esc(t)}"><img src="${A}chip-x.svg" width="24" height="24" alt="" /></button></li>`).join("")}
      </ul>` : ""}` : "";

    const studentsExtra = `
      <fieldset>
        <legend class="visually-hidden">Estudantes</legend>
        <div class="students">${STUDENTS.map((n, i) => `
          <label class="check"><input type="checkbox" data-action="student" value="${esc(n)}" id="st-${ctx}-${i}" ${state.estudantes.includes(n) ? "checked" : ""} />${esc(n)}</label>`).join("")}
        </div>
      </fieldset>
      <p class="field__error" id="para-estudantes-${ctx}-err" hidden></p>`;

    const compExtra = `
      <div class="field">
        <label class="field__label" for="f-comp-${ctx}">Competência <span class="req" aria-hidden="true">*</span></label>
        <span class="select">
          <select id="f-comp-${ctx}" data-action="competencia" aria-describedby="para-competencia-${ctx}-err">
            <option value="">Selecione</option>
            ${COMPETENCIAS.map((c) => `<option ${state.competencia === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
          </select>
          <img src="${ARROW}" width="24" height="24" alt="" />
        </span>
        <p class="field__error" id="para-competencia-${ctx}-err" hidden></p>
      </div>`;

    return (
      opt("turma", ctx === 3 ? "Selecione para quais turmas a atividade será agendada." : "Todos estudantes matriculados na turma deverão realizar esta atividade.", turmaExtra) +
      opt("estudantes", "Selecione estudantes da turma deverão realizar esta atividade.", studentsExtra) +
      opt("competencia", "Somente estudantes da competência selecionada deverão realizar esta atividade.", compExtra)
    );
  }

  function datesTemplate(ctx) {
    return `
      <div class="field">
        <label class="field__label" for="f-inicio-${ctx}">Inícia em <span class="req" aria-hidden="true">*</span></label>
        <input class="input" id="f-inicio-${ctx}" type="datetime-local" data-bind="inicio" value="${esc(state.inicio)}" aria-describedby="f-inicio-${ctx}-err" required />
        <p class="field__error" id="f-inicio-${ctx}-err" hidden></p>
      </div>
      <div class="field">
        <label class="field__label" for="f-termino-${ctx}">Termina em</label>
        <input class="input" id="f-termino-${ctx}" type="datetime-local" data-bind="termino" value="${esc(state.termino)}" aria-describedby="f-termino-${ctx}-hint f-termino-${ctx}-err" />
        <p class="field__error" id="f-termino-${ctx}-err" hidden></p>
        <p class="ag-hint" id="f-termino-${ctx}-hint">A data de término não é obrigatória para o agendamento</p>
      </div>`;
  }

  function renderPara() {
    const active = document.activeElement && document.activeElement.id;
    $$("[data-para]").forEach((el) => (el.innerHTML = paraTemplate(Number(el.dataset.para))));
    if (active && document.getElementById(active)) document.getElementById(active).focus();
    else if (active === "" && document.activeElement === document.body) { /* no-op */ }
  }

  // ---- Rendering: activity -------------------------------------------------------
  function renderActivity() {
    const a = activity();
    $("#activity-empty").hidden = !!a;
    $("#activity-empty-box").hidden = !!a;
    $("#activity-selected").hidden = !a;
    if (a) {
      $("#act-card").innerHTML = `
        <div class="act-card__main">
          <div class="act-card__info">
            <p class="act-card__title" title="${esc(a.title)}">${esc(a.title)}</p>
            <p class="act-card__meta">${esc(a.createdBy)}</p>
            <p class="act-card__count"><img src="${A}ballot.svg" width="24" height="24" alt="" />${a.questions} questões</p>
          </div>
          <div class="act-card__tags" aria-label="Área, competência e habilidades">
            <span class="tag">CN</span>
            <span class="tag-group"><span class="tag">C2</span><span class="tag tag--light">h1</span><span class="tag tag--light">h4</span><span class="tag tag--light">h6</span></span>
          </div>
          <div class="act-card__codes" aria-label="Códigos das questões">
            ${Array.from({ length: 4 }, () => `<span class="code" title="893289429984">893289429984</span>`).join("")}
          </div>
        </div>
        <button class="act-card__remove" type="button" id="btn-remove-activity" aria-label="Remover atividade ${esc(a.title)}">
          <img src="${A}delete.svg" width="20" height="20" alt="" />
        </button>`;
    }
    $("#rand-total").textContent = "10 questões";
    // Dependência por atividade: other activities
    const depSel = $("#f-dep-atividade");
    const cur = state.rules.dependencia.atividade;
    depSel.innerHTML = `<option value="">Placeholder</option>` +
      ACTIVITIES.filter((x) => x.id !== state.atividade).map((x) => `<option value="${x.id}" ${cur === x.id ? "selected" : ""}>${esc(x.title)}</option>`).join("");
  }

  // ---- Rendering: steps ------------------------------------------------------------
  function summaryItem(label, value, cls = "", icon = "") {
    return `<span class="sum-item ${cls}"><span class="sum-item__inner"><span class="sum-item__label">${label}</span><span class="sum-item__value ${cls === "sum-item--cat" || cls === "sum-item--act" ? "sum-item__value--small" : ""}">${icon}${esc(value)}</span></span></span>`;
  }
  function paraSummary() {
    if (state.para === "estudantes") return `${state.estudantes.length} estudante(s)`;
    if (state.para === "competencia") return state.competencia ? state.competencia.split(" - ")[0] : "Por competência";
    return "Toda turma";
  }

  function renderSteps() {
    $$("[data-online-only]").forEach((el) => (el.hidden = !online()));
    [1, 2, 3].forEach((n) => {
      const sec = $(`#step-${n}`);
      const isOpen = state.open === n;
      const done = !isOpen && n <= state.reached && valid(n) && (n === 1 || validThrough(n - 1) === 0);
      sec.classList.toggle("is-done", done);
      sec.classList.toggle("is-idle", !isOpen && !done);
      $(".step__head", sec).setAttribute("aria-expanded", String(isOpen));
      $(`#step-${n}-body`).hidden = !isOpen;
      const sum = $(`#step-${n}-summary`);
      if (n === 1) {
        sum.innerHTML = done ? [
          summaryItem("Categoria", state.categoria, "sum-item--cat"),
          summaryItem("Formato", online() ? "Online" : "Impresso", "", `<img src="${A}${online() ? "computer" : "print"}.svg" width="20" height="20" alt="" />`),
          online() ? summaryItem("Para", paraSummary()) : "",
          summaryItem("Inicia em", fmtDate(state.inicio)),
          summaryItem("Termina em", fmtDate(state.termino)),
        ].join("") : "";
      } else if (n === 2) {
        sum.innerHTML = done && activity() ? summaryItem("Atividade", activity().title, "sum-item--act") : "";
      }
    });
    // "Continuar" only where a next step exists
    $('[data-next="1"]').closest(".step__next").hidden = !online();

    // Footer buttons
    const ready = validThrough(lastStep()) === 0 && (!online() || state.reached >= 3);
    $("#btn-submit").setAttribute("aria-disabled", String(!ready));
    $("#btn-draft").setAttribute("aria-disabled", String(!dirty));
    paintErrors();
    syncUrl();
  }

  function syncUrl() {
    let e = 1;
    if (!online()) e = 4;
    else if (state.open === 2) e = state.atividade ? 5 : 3;
    else if (state.open === 3) e = state.expanded.length ? 7 : 6;
    else if (state.open === 1) e = etapa === 2 ? 2 : 1;
    else e = state.reached >= 3 ? 6 : state.reached === 2 ? (state.atividade ? 5 : 3) : 1;
    const url = new URL(location.href);
    url.searchParams.set("etapa", e);
    history.replaceState(null, "", url);
  }

  // ---- Rules (etapa 3) ------------------------------------------------------------------
  function expandRule(name, open) {
    const rule = $(`.rule[data-rule="${name}"]`);
    const toggle = $(".rule__toggle", rule);
    if (!toggle) return;
    const body = document.getElementById(toggle.getAttribute("aria-controls"));
    toggle.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
    state.expanded = state.expanded.filter((x) => x !== name).concat(open ? [name] : []);
  }

  function renderRules() {
    const r = state.rules;
    $$(".rule").forEach((rule) => {
      const name = rule.dataset.rule;
      if ($(".rule__toggle", rule)) expandRule(name, state.expanded.includes(name));
    });
    $$("[data-switch]").forEach((sw) => {
      const on = r[sw.dataset.switch].on;
      sw.setAttribute("aria-checked", String(on));
      const body = $(`[data-switch-body="${sw.dataset.switch}"]`);
      if (body) body.disabled = !on;
    });
    $("#f-tempo").value = r.tempo.val;
    $$('input[name="dep"]').forEach((i) => (i.checked = i.value === r.dependencia.tipo));
    $("#f-dep-nota").value = r.dependencia.nota;
    $("#f-dep-habilidade").value = r.dependencia.habilidade;
    $("#f-dep-caderno").value = r.dependencia.caderno;
    $("#f-tentativas").value = r.tentativas.val;
    $("#f-rand-qtd").value = r.random.qtd;
    $("#f-rand-pont").value = r.random.pont;
  }

  // ---- Navigation --------------------------------------------------------------------------
  function openStep(n, { focus = true } = {}) {
    if (n > 1) {
      const bad = validThrough(n - 1);
      if (bad) {
        state.showErrors[bad] = true;
        state.open = bad;
        renderSteps();
        announce("Corrija os campos destacados antes de continuar.");
        focusFirstError(bad);
        return false;
      }
    }
    state.open = n;
    state.reached = Math.max(state.reached, n);
    renderSteps();
    if (focus) {
      const sec = $(`#step-${n}`);
      sec.scrollIntoView({ block: "start", behavior: "smooth" });
      $(".step__head", sec).focus({ preventScroll: true });
    }
    return true;
  }

  $$(".step__head").forEach((btn) =>
    btn.addEventListener("click", () => {
      const n = Number(btn.closest(".step").dataset.step);
      if (state.open === n) { state.open = 0; renderSteps(); return; }
      openStep(n, { focus: false });
    })
  );

  $$("[data-next]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.next);
      state.showErrors[n] = true;
      if (!valid(n)) { renderSteps(); announce("Corrija os campos destacados antes de continuar."); focusFirstError(n); return; }
      openStep(n + 1);
    })
  );

  $("#btn-back").addEventListener("click", () => {
    if (state.open > 1) openStep(state.open - 1);
    else location.href = "turma-atividades.html";
  });

  $("#ag-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const steps = online() ? [1, 2, 3] : [1];
    steps.forEach((s) => (state.showErrors[s] = true));
    const bad = validThrough(lastStep());
    if (bad) {
      state.open = bad; state.reached = Math.max(state.reached, bad);
      renderSteps();
      announce("Há campos obrigatórios pendentes.");
      focusFirstError(bad);
      return;
    }
    if (online() && state.reached < 3) { openStep(3); announce("Revise as regras do agendamento e clique em Criar atividade."); return; }
    try { localStorage.removeItem("ag-turma-draft"); } catch (_) {}
    location.href = "agendamento-lista.html";
  });

  $("#btn-draft").addEventListener("click", () => {
    if (!dirty) return;
    try { localStorage.setItem("ag-turma-draft", JSON.stringify(state)); } catch (_) {}
    dirty = false;
    stamp("Rascunho salvo");
    renderSteps();
    announce("Rascunho salvo.");
  });

  // ---- Autosave text -------------------------------------------------------------------------
  let saveTimer;
  function stamp(prefix = "Salvo automaticamente") {
    const d = new Date();
    $("#autosave-text").textContent = `${prefix} às ${pad(d.getHours())}:${pad(d.getMinutes())} em ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} por Alice Souza`;
  }
  function changed() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => stamp(), 800);
  }

  // ---- Input handling --------------------------------------------------------------------------
  const form = $("#ag-form");
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "f-titulo") state.titulo = t.value;
    else if (t.dataset.bind) {
      state[t.dataset.bind] = t.value;
      $$(`[data-bind="${t.dataset.bind}"]`).forEach((o) => { if (o !== t) o.value = t.value; });
    } else if (t.id === "f-tempo") state.rules.tempo.val = t.value;
    else if (t.id === "f-dep-nota") state.rules.dependencia.nota = t.value;
    else if (t.id === "f-tentativas") state.rules.tentativas.val = t.value;
    else if (t.id === "f-rand-qtd") state.rules.random.qtd = t.value;
    else if (t.id === "f-rand-pont") state.rules.random.pont = t.value;
    else return;
    changed();
    renderStepsLight();
  });

  // Re-render status without touching inputs (keeps caret position)
  function renderStepsLight() {
    const ready = validThrough(lastStep()) === 0 && (!online() || state.reached >= 3);
    $("#btn-submit").setAttribute("aria-disabled", String(!ready));
    $("#btn-draft").setAttribute("aria-disabled", String(!dirty));
    paintErrors();
  }

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "categoria") state.categoria = t.value;
    else if (t.name === "formato") {
      state.formato = t.value;
      if (!online() && state.open > 1) state.open = 1;
      renderSteps(); changed(); return;
    } else if (t.name && t.name.startsWith("para-")) { state.para = t.value; renderPara(); }
    else if (t.dataset.action === "student") {
      state.estudantes = t.checked ? state.estudantes.concat(t.value) : state.estudantes.filter((n) => n !== t.value);
      renderPara();
    } else if (t.dataset.action === "competencia") { state.competencia = t.value; renderPara(); }
    else if (t.dataset.action === "add-turma") {
      if (t.value && !state.turmas.includes(t.value)) state.turmas.push(t.value);
      renderPara();
      $("#f-turmas-3") && $("#f-turmas-3").focus();
    } else if (t.name === "dep") state.rules.dependencia.tipo = t.value;
    else if (t.id === "f-dep-atividade") state.rules.dependencia.atividade = t.value;
    else if (t.id === "f-dep-habilidade") state.rules.dependencia.habilidade = t.value;
    else if (t.id === "f-dep-caderno") state.rules.dependencia.caderno = t.value;
    else if (t.dataset.bind || t.id === "f-titulo") { /* handled on input */ }
    else return;
    changed();
    renderSteps();
  });

  form.addEventListener("click", (e) => {
    const rm = e.target.closest('[data-action="remove-turma"]');
    if (rm) {
      state.turmas = state.turmas.filter((t) => t !== rm.dataset.value);
      renderPara(); changed(); renderSteps();
      $("#f-turmas-3") && $("#f-turmas-3").focus();
      return;
    }
    const sw = e.target.closest("[data-switch]");
    if (sw) {
      const r = state.rules[sw.dataset.switch];
      r.on = !r.on;
      if (r.on && sw.dataset.switch !== "correcao") expandRule(sw.dataset.switch, true);
      renderRules(); changed(); renderSteps();
      return;
    }
    const tg = e.target.closest(".rule__toggle");
    if (tg) {
      const name = tg.closest(".rule").dataset.rule;
      expandRule(name, tg.getAttribute("aria-expanded") !== "true");
      syncUrl();
      return;
    }
    if (e.target.closest("#btn-remove-activity")) {
      state.atividade = null;
      renderActivity(); changed(); renderSteps();
      $("#btn-add-activity").focus();
      announce("Atividade removida.");
    }
  });

  // ---- Activity picker ----------------------------------------------------------------------------
  const picker = $("#picker");
  const pickerList = $("#picker-list");
  const pickerSearch = $("#picker-search");
  function renderPicker() {
    const q = pickerSearch.value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const items = ACTIVITIES.filter((a) => a.title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(q));
    pickerList.innerHTML = items.length ? items.map((a) => `
      <li><label class="picker__item"><input class="radio" type="radio" name="picker" value="${a.id}" ${state.atividade === a.id ? "checked" : ""} />
        <span class="picker__item-text"><span class="picker__item-title">${esc(a.title)}</span><span class="picker__item-meta">${esc(a.createdBy)} · ${a.questions} questões</span></span></label></li>`).join("")
      : `<li class="picker__empty">Nenhuma atividade encontrada.</li>`;
  }
  $("#btn-add-activity").addEventListener("click", () => {
    pickerSearch.value = "";
    renderPicker();
    picker.showModal();
  });
  pickerSearch.addEventListener("input", renderPicker);
  $("#picker-form").addEventListener("submit", (e) => {
    const sel = $('input[name="picker"]:checked', picker);
    if (!sel) { e.preventDefault(); pickerSearch.focus(); return; }
    state.atividade = sel.value;
    renderActivity(); changed(); renderSteps();
    announce("Atividade adicionada.");
  });
  picker.addEventListener("close", () => { if (!activity()) $("#btn-add-activity").focus(); });

  // ---- Preview ---------------------------------------------------------------------------------------
  const preview = $("#preview");
  $("#btn-preview").addEventListener("click", () => {
    const rows = [
      ["Título", state.titulo || "—"], ["Categoria", state.categoria], ["Formato", online() ? "Online" : "Impresso"],
      ...(online() ? [["Para", state.para === "turma" ? `Toda turma${state.turmas.length ? ` (${state.turmas.join(", ")})` : ""}` : state.para === "estudantes" ? (state.estudantes.join(", ") || "—") : (state.competencia || "—")]] : []),
      ["Inicia em", fmtDate(state.inicio)], ["Termina em", fmtDate(state.termino)],
      ...(online() ? [["Atividade", activity() ? activity().title : "—"]] : []),
    ];
    $("#preview-list").innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
    preview.showModal();
  });

  [picker, preview].forEach((d) => {
    $$("[data-close]", d).forEach((b) => b.addEventListener("click", () => d.close()));
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  });

  // ---- Init ----------------------------------------------------------------------------------------------
  $("#f-titulo").value = state.titulo;
  $$('input[name="categoria"]').forEach((i) => (i.checked = i.value === state.categoria));
  $$('input[name="formato"]').forEach((i) => (i.checked = i.value === state.formato));
  $$("[data-dates]").forEach((el) => (el.innerHTML = datesTemplate(Number(el.dataset.dates))));
  renderPara();
  renderActivity();
  renderRules();
  renderSteps();
})();
