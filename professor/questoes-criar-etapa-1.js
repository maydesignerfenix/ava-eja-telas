/* Professor · Criar questão – Etapa 1
   States (query): ?state=vazio (default) | preenchido | erros | recolhido */
(function () {
  "use strict";

  const NEXT_URL = "questao-criar-etapa-2.html";

  // Mock matrix (SESI). Replace with the API response.
  const MATRIZ = {
    CN: {
      label: "Ciências da Natureza",
      comps: {
        C1: "C1 – Compreender as ciências naturais e as tecnologias a elas associadas",
        C2: "C2 – Identificar a presença e aplicar as tecnologias associadas às ciências naturais",
        C4: "C4 – Compreender interações entre organismos e ambiente",
      },
    },
    MT: {
      label: "Matemática",
      comps: {
        C1: "C1 – Construir significados para os números naturais, inteiros, racionais e reais",
        C3: "C3 – Construir noções de grandezas e medidas",
        C6: "C6 – Interpretar informações de natureza científica e social obtidas da leitura de gráficos e tabelas",
      },
    },
    LC: {
      label: "Linguagens e Códigos",
      comps: {
        C1: "C1 – Aplicar as tecnologias da comunicação e da informação",
        C6: "C6 – Compreender e usar os sistemas simbólicos das diferentes linguagens",
      },
    },
    CH: {
      label: "Ciências Humanas",
      comps: {
        C3: "C3 – Compreender a produção e o papel histórico das instituições sociais",
        C5: "C5 – Utilizar os conhecimentos históricos para compreender e valorizar os fundamentos da cidadania",
      },
    },
  };
  const SKILLS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"];

  const $ = (id) => document.getElementById(id);
  const form = $("form");
  const fields = {
    segmento: $("segmento"),
    area: $("area"),
    competencia: $("competencia"),
    habilidade: $("habilidade"),
    nivel: $("nivel"),
  };
  const LABELS = {
    segmento: "Segmento / Etapa",
    area: "Área do conhecimento",
    competencia: "Competência",
    habilidade: "Habilidade",
    nivel: "Nível de dificuldade",
  };
  const btnNext = $("btn-next"), btnDraft = $("btn-draft"), step2 = $("step-2-link");
  const autosave = $("autosave"), autosaveText = $("autosave-text"), summary = $("error-summary");
  const step1 = $("step-1"), toggle1 = $("step-1-toggle");

  let dirty = false;
  let showErrors = false;

  function setOptions(select, entries) {
    select.innerHTML = `<option value="">Selecione</option>` + entries.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  }
  setOptions(fields.area, Object.entries(MATRIZ).map(([k, v]) => [k, v.label]));

  function setEnabled(name, on) {
    const sel = fields[name];
    sel.disabled = !on;
    sel.closest(".qfield").classList.toggle("is-disabled", !on);
    if (!on) sel.value = "";
  }

  function syncDependents(changed) {
    const area = fields.area.value;
    if (changed === "area" || changed === "init") {
      setOptions(fields.competencia, area ? Object.entries(MATRIZ[area].comps) : []);
      setEnabled("competencia", !!area);
    }
    if (changed === "area" || changed === "competencia" || changed === "init") {
      setOptions(fields.habilidade, fields.competencia.value ? SKILLS.map((h) => [h, h]) : []);
      setEnabled("habilidade", !!fields.competencia.value);
    }
  }

  function missing() {
    return Object.keys(fields).filter((k) => !fields[k].value);
  }

  function renderValidation() {
    const miss = missing();
    Object.keys(fields).forEach((k) => {
      const err = showErrors && miss.includes(k);
      const field = fields[k].closest(".qfield");
      field.classList.toggle("has-error", err);
      fields[k].setAttribute("aria-invalid", err ? "true" : "false");
      let msg = "";
      if (err) {
        if (k === "competencia" && !fields.area.value) msg = "Selecione a área do conhecimento para liberar as competências.";
        else if (k === "habilidade" && !fields.competencia.value) msg = "Selecione a competência para liberar as habilidades.";
        else msg = `Selecione ${k === "segmento" ? "o segmento / etapa" : k === "nivel" ? "o nível de dificuldade" : "a " + LABELS[k].toLowerCase()}.`;
      }
      $(k + "-error").textContent = msg;
    });
    summary.hidden = !(showErrors && miss.length);
    if (!summary.hidden) summary.textContent = `Preencha os campos obrigatórios: ${miss.map((k) => LABELS[k]).join(", ")}.`;

    const valid = miss.length === 0;
    btnNext.setAttribute("aria-disabled", String(!valid));
    step2.setAttribute("aria-disabled", String(!valid));
    btnDraft.setAttribute("aria-disabled", String(!dirty));
    autosave.classList.toggle("is-idle", !dirty);
  }

  function nextUrl() {
    const url = new URL(NEXT_URL, location.href);
    Object.keys(fields).forEach((k) => url.searchParams.set(k, fields[k].value));
    return url.href;
  }

  function stamp() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function goNext(e) {
    e.preventDefault();
    if (missing().length) {
      showErrors = true;
      if (!step1.classList.contains("is-open")) setOpen(true);
      renderValidation();
      fields[missing()[0]].disabled ? fields.area.focus() : fields[missing()[0]].focus();
      return;
    }
    location.href = nextUrl();
  }

  function setOpen(open) {
    step1.classList.toggle("is-open", open);
    toggle1.setAttribute("aria-expanded", String(open));
  }

  // Events
  Object.keys(fields).forEach((k) =>
    fields[k].addEventListener("change", () => {
      syncDependents(k);
      dirty = true;
      autosaveText.textContent = "Salvo automaticamente";
      renderValidation();
    })
  );
  toggle1.addEventListener("click", () => setOpen(!step1.classList.contains("is-open")));
  form.addEventListener("submit", goNext);
  step2.addEventListener("click", goNext);
  btnDraft.addEventListener("click", () => {
    if (btnDraft.getAttribute("aria-disabled") === "true") return;
    autosaveText.textContent = `Rascunho salvo às ${stamp()}`;
  });
  $("btn-preview").addEventListener("click", (e) => e.preventDefault());

  // Initial state
  syncDependents("init");
  const state = new URLSearchParams(location.search).get("state");
  if (state === "preenchido") {
    fields.segmento.value = "eja-af";
    fields.area.value = "CN";
    syncDependents("area");
    fields.competencia.value = "C2";
    syncDependents("competencia");
    fields.habilidade.value = "H4";
    fields.nivel.value = "facil";
    dirty = true;
  } else if (state === "erros") {
    showErrors = true;
  } else if (state === "recolhido") {
    setOpen(false);
  }
  renderValidation();
})();
