/* Professor · Avaliações 2.1 · Listagem de questões / atividades
   States (query): ?tab=questoes|atividades  ?state=filtros|vazio  ?page=N */
(function () {
  "use strict";

  const AREAS = {
    CN: "Ciências da Natureza",
    MT: "Matemática",
    LC: "Linguagens e Códigos",
    CH: "Ciências Humanas",
  };
  const LEVELS = ["Fácil", "Médio", "Difícil"];

  // ---------------------------------------------------------------- mock data
  const LASER = "O laser é um tipo especial de luz, obtido por emissão estimulada de radiação";
  const figmaQuestions = [
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C4", skills: ["H1"], level: "Médio" },
    { comp: "C2", skills: ["H3", "H5", "H8"], level: "Fácil", title: "Os lasers são utilizados em diversas áreas da medicina e da indústria", draft: "Rascunho salvo em 13/09/2026 por Ana Costa" },
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C4", skills: ["H1"], level: "Fácil" },
    { comp: "C4", skills: ["H1"], level: "Fácil" },
    { comp: "C2", skills: ["H1", "H4", "H6"], level: "Fácil" },
    { comp: "C4", skills: ["H1"], level: "Fácil" },
    { comp: "C4", skills: ["H1"], level: "Fácil" },
  ];
  const extraTitles = [
    ["CN", "A fotossíntese transforma energia luminosa em energia química"],
    ["MT", "Uma loja oferece desconto de 15% no pagamento à vista"],
    ["LC", "Leia o trecho da notícia e identifique a ideia principal"],
    ["CH", "A Revolução Industrial alterou as relações de trabalho"],
    ["CN", "O ciclo da água envolve evaporação, condensação e precipitação"],
    ["MT", "O gráfico mostra o consumo de energia de uma residência"],
    ["LC", "Os anúncios publicitários utilizam recursos de persuasão"],
    ["CH", "O Estatuto do Idoso garante direitos à população idosa"],
  ];
  const authors = ["Marina Alves", "Ana Costa", "Carlos Souza", "Mariana Alves"];

  function pad(n) { return String(n).padStart(2, "0"); }

  const questions = [];
  for (let i = 0; i < 1000; i++) {
    let q;
    if (i < figmaQuestions.length) {
      const f = figmaQuestions[i];
      q = { area: "CN", title: f.title || LASER, comp: f.comp, skills: f.skills, level: f.level, draft: f.draft, author: "Marina Alves", day: 28 };
    } else {
      const [area, title] = extraTitles[i % extraTitles.length];
      const c = (i % 5) + 1;
      const s1 = (i % 6) + 1;
      q = {
        area, title, comp: "C" + c,
        skills: i % 3 === 0 ? ["H" + s1] : ["H" + s1, "H" + (s1 + 2), "H" + (s1 + 3)].slice(0, (i % 3) + 1),
        level: LEVELS[i % 3], author: authors[i % authors.length], day: (i % 27) + 1,
        draft: i % 17 === 0 ? `Rascunho salvo em ${pad((i % 27) + 1)}/09/2026 por ${authors[i % authors.length]}` : null,
      };
    }
    q.id = i + 1;
    q.created = `2026-08-${pad(q.day)}`;
    q.meta = `Criado em ${pad(q.day)}/08/26 por ${q.author}`;
    q.type = "Verdadeiro ou Falso";
    q.fav = false;
    questions.push(q);
  }

  const TAG = "893289429984";
  const activities = [];
  const actTitles = [
    "Eletricidade e astronomia - Diagnóstica",
    "Matemática financeira no cotidiano - Formativa",
    "Leitura e produção de textos - Somativa",
    "Cidadania e direitos sociais - Diagnóstica",
  ];
  for (let i = 0; i < 89; i++) {
    const isFigma = i < 12;
    const a = {
      id: i + 1,
      area: isFigma ? "CN" : Object.keys(AREAS)[i % 4],
      title: isFigma ? actTitles[0] : actTitles[i % actTitles.length],
      comp: "C2", skills: ["H1", "H4", "H6"],
      day: isFigma ? 28 : (i % 27) + 1,
      author: "Marina Alves",
      count: 40,
      tags: [TAG, TAG, TAG, TAG],
      fav: false,
    };
    if (i === 11) {
      a.draft = "Rascunho salvo em 11/09/2026 por Mariana Alves";
      a.count = 3;
      a.tags = [TAG];
    } else if (!isFigma) {
      a.count = 10 + (i % 31);
      a.tags = a.tags.slice(0, (i % 4) + 1);
      a.level = LEVELS[i % 3];
    }
    a.level = a.level || "Fácil";
    a.created = `2026-08-${pad(a.day)}`;
    a.meta = `Criado em ${pad(a.day)}/08/26 por ${a.author}`;
    activities.push(a);
  }

  // ---------------------------------------------------------------- tab config
  const TABS = {
    questoes: {
      data: questions, title: "Questões", noun: ["questão", "questões"],
      create: { label: "CRIAR QUESTÃO", href: "questoes-criar-etapa-1.html" },
      thTitle: "QUESTÃO", thThird: "NÍVEL DE DIFICULDADE", search: "Buscar questões",
    },
    atividades: {
      data: activities, title: "Atividades", noun: ["atividade", "atividades"],
      create: { label: "CRIAR ATIVIDADE", href: "atividade-criar.html" },
      thTitle: "ATIVIDADES", thThird: "MARCADORES", search: "Buscar atividades",
    },
  };

  // ---------------------------------------------------------------- elements
  const $ = (id) => document.getElementById(id);
  const rowsEl = $("rows"), emptyEl = $("empty"), countEl = $("count");
  const searchEl = $("search"), sortSelectEl = $("sort-select"), pageSizeEl = $("page-size");
  const pagesEl = $("pages"), paginationEl = $("pagination");
  const tabButtons = document.querySelectorAll("[data-tab]");
  const sortHeader = document.querySelector(".qth[data-sort]");
  const dialog = $("filter-dialog"), filterForm = $("filter-form");
  const fArea = $("f-area"), fComp = $("f-comp"), fSkill = $("f-skill"), fLevel = $("f-level"), fFav = $("f-fav"), fDraft = $("f-draft");

  const params = new URLSearchParams(location.search);
  const state = {
    tab: params.get("tab") === "atividades" ? "atividades" : "questoes",
    query: "", sortKey: null, sortDir: "asc",
    page: Math.max(1, parseInt(params.get("page"), 10) || 1),
    pageSize: 12,
    filters: { area: "", comp: "", skill: "", level: "", fav: false, draft: false },
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // ---------------------------------------------------------------- templates
  function skillsTpl(item) {
    return `
      <div class="qrow__skills" aria-label="Área ${esc(AREAS[item.area])}, competência ${item.comp}, habilidades ${item.skills.join(", ")}">
        <span class="qbadge qbadge--area" title="${esc(AREAS[item.area])}">${item.area}</span>
        <span class="qbadge-group">
          <span class="qbadge qbadge--comp">${item.comp}</span>${item.skills.map((s) => `<span class="qbadge qbadge--skill">${s}</span>`).join("")}
        </span>
      </div>`;
  }

  function metaTpl(item) {
    return item.draft
      ? `<p class="qrow__meta qrow__meta--draft"><img src="../shared/assets/stylus.svg" width="24" height="24" alt="" />${esc(item.draft)}</p>`
      : `<p class="qrow__meta">${esc(item.meta)}</p>`;
  }

  function rowTpl(item) {
    const isQ = state.tab === "questoes";
    const info = isQ
      ? `<p class="qrow__type"><img src="assets/prof-qlist/rule.svg" width="24" height="24" alt="" />${esc(item.type)}</p>`
      : `<p class="qrow__type"><img src="assets/prof-qlist/ballot.svg" width="24" height="24" alt="" />${item.count} questões</p>`;
    const third = isQ
      ? `<div class="qrow__third"><span class="qbadge qbadge--level"><span class="visually-hidden">Nível de dificuldade: </span>${esc(item.level)}</span></div>`
      : `<div class="qrow__third qrow__third--tags${item.tags.length === 1 ? " is-single" : ""}" aria-label="Marcadores">${item.tags.map((t) => `<span class="qbadge qbadge--tag" title="${t}">${t}</span>`).join("")}</div>`;
    return `
      <li class="qrow qrow--${isQ ? "questao" : "atividade"}" data-id="${item.id}">
        <div class="qrow__col">
          <button class="icon-action fav-btn" type="button" aria-pressed="${item.fav}" aria-label="Favoritar ${esc(item.title)}">
            <img src="../shared/assets/favorite.svg" width="24" height="24" alt="" />
          </button>
        </div>
        <div class="qrow__main">
          <div class="qrow__info">
            <h3 class="qrow__title" title="${esc(item.title)}">${esc(item.title)}</h3>
            ${metaTpl(item)}
            ${info}
          </div>
          ${skillsTpl(item)}
          ${third}
        </div>
        <div class="qrow__col">
          <button class="icon-action" type="button" aria-haspopup="menu" aria-label="Mais opções para ${esc(item.title)}">
            <img src="../shared/assets/more-vert.svg" width="20" height="20" alt="" />
          </button>
        </div>
      </li>`;
  }

  // ---------------------------------------------------------------- data
  function visible() {
    const cfg = TABS[state.tab];
    const q = norm(state.query.trim());
    const f = state.filters;
    let items = cfg.data.filter((it) =>
      (!q || norm(it.title).includes(q) || norm(it.meta).includes(q)) &&
      (!f.area || it.area === f.area) &&
      (!f.comp || it.comp === f.comp) &&
      (!f.skill || it.skills.includes(f.skill)) &&
      (!f.level || it.level === f.level) &&
      (!f.fav || it.fav) &&
      (!f.draft || !!it.draft)
    );
    if (state.sortKey) {
      const dir = state.sortDir === "asc" ? 1 : -1;
      items = items.slice().sort((a, b) =>
        state.sortKey === "title" ? a.title.localeCompare(b.title, "pt-BR") * dir : a.created.localeCompare(b.created) * dir
      );
    }
    return items;
  }

  function activeFilterCount() {
    const f = state.filters;
    return ["area", "comp", "skill", "level"].filter((k) => f[k]).length + (f.fav ? 1 : 0) + (f.draft ? 1 : 0);
  }

  // ---------------------------------------------------------------- render
  function renderPages(totalPages) {
    const p = state.page;
    let start = Math.max(1, Math.min(p - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);
    let html = `<button class="page-btn page-btn--icon" type="button" data-page="prev" aria-label="Página anterior"${p <= 1 ? " disabled" : ""}><img src="../shared/assets/chevron-left.svg" width="16" height="16" alt="" /></button>`;
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn${i === p ? " is-active" : ""}" type="button" data-page="${i}"${i === p ? ' aria-current="page"' : ""} aria-label="Página ${i}">${i}</button>`;
    }
    html += `<button class="page-btn page-btn--icon" type="button" data-page="next" aria-label="Próxima página"${p >= totalPages ? " disabled" : ""}><img src="../shared/assets/chevron-right.svg" width="16" height="16" alt="" /></button>`;
    pagesEl.innerHTML = html;
  }

  function render() {
    const cfg = TABS[state.tab];
    const items = visible();
    const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const pageItems = items.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    rowsEl.innerHTML = pageItems.map(rowTpl).join("");
    emptyEl.hidden = items.length > 0;
    paginationEl.hidden = items.length === 0;
    countEl.textContent = `${items.length} ${items.length === 1 ? cfg.noun[0] : cfg.noun[1]}`;
    renderPages(totalPages);

    if (state.sortKey === "title") sortHeader.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
    else sortHeader.removeAttribute("aria-sort");
    sortSelectEl.value = state.sortKey ? `${state.sortKey}:${state.sortDir}` : "";

    const n = activeFilterCount();
    const badge = $("filter-count");
    badge.hidden = n === 0;
    badge.textContent = n;
    $("filter-btn").setAttribute("aria-label", n ? `Filtrar (${n} filtros ativos)` : "Filtrar");
  }

  function renderTab() {
    const cfg = TABS[state.tab];
    tabButtons.forEach((b) => {
      const on = b.dataset.tab === state.tab;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle("is-active", on);
    });
    $("panel").setAttribute("aria-labelledby", "tab-" + state.tab);
    $("section-title").textContent = cfg.title;
    const create = $("create-btn");
    create.textContent = cfg.create.label;
    create.href = cfg.create.href;
    $("th-title").textContent = cfg.thTitle;
    $("th-third").textContent = cfg.thThird;
    $("search-label").textContent = cfg.search;
    $("f-level-field").hidden = state.tab === "atividades";
    render();
  }

  // ---------------------------------------------------------------- filters UI
  function fillSelect(sel, values, allLabel, labelFn) {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${allLabel}</option>` + values.map((v) => `<option value="${v}">${labelFn ? labelFn(v) : v}</option>`).join("");
    sel.value = values.includes(cur) ? cur : "";
  }
  function syncFilterSelects() {
    const data = TABS[state.tab].data.filter((it) => !fArea.value || it.area === fArea.value);
    const comps = [...new Set(data.map((d) => d.comp))].sort();
    fillSelect(fComp, comps, "Todas");
    const skillsData = data.filter((d) => !fComp.value || d.comp === fComp.value);
    const skills = [...new Set(skillsData.flatMap((d) => d.skills))].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
    fillSelect(fSkill, skills, "Todas");
  }
  fillSelect(fArea, Object.keys(AREAS), "Todas", (k) => `${k} – ${AREAS[k]}`);
  fillSelect(fLevel, LEVELS, "Todos");
  fArea.addEventListener("change", syncFilterSelects);
  fComp.addEventListener("change", syncFilterSelects);

  function openFilters() {
    const f = state.filters;
    fArea.value = f.area;
    syncFilterSelects();
    fComp.value = f.comp;
    syncFilterSelects();
    fSkill.value = f.skill;
    fLevel.value = f.level;
    fFav.checked = f.fav;
    fDraft.checked = f.draft;
    dialog.showModal();
  }
  $("filter-btn").addEventListener("click", openFilters);
  $("filter-close").addEventListener("click", () => dialog.close("cancel"));
  $("filter-clear").addEventListener("click", () => {
    filterForm.reset();
    syncFilterSelects();
  });
  filterForm.addEventListener("submit", () => {
    state.filters = { area: fArea.value, comp: fComp.value, skill: fSkill.value, level: fLevel.value, fav: fFav.checked, draft: fDraft.checked };
    state.page = 1;
    render();
  });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close("cancel"); });

  // ---------------------------------------------------------------- events
  tabButtons.forEach((b) =>
    b.addEventListener("click", () => {
      if (state.tab === b.dataset.tab) return;
      state.tab = b.dataset.tab;
      state.page = 1;
      state.filters = { area: "", comp: "", skill: "", level: "", fav: false, draft: false };
      const url = new URL(location.href);
      url.searchParams.set("tab", state.tab);
      url.searchParams.delete("page");
      history.replaceState(null, "", url);
      renderTab();
    })
  );
  document.querySelector("[role=tablist]").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = [...tabButtons].find((b) => b.dataset.tab !== state.tab);
    next.focus();
    next.click();
  });

  searchEl.addEventListener("input", () => { state.query = searchEl.value; state.page = 1; render(); });

  sortHeader.addEventListener("click", () => {
    state.sortDir = state.sortKey === "title" && state.sortDir === "asc" ? "desc" : "asc";
    state.sortKey = "title";
    render();
  });
  sortSelectEl.addEventListener("change", () => {
    const [k, d] = sortSelectEl.value.split(":");
    state.sortKey = k || null;
    state.sortDir = d || "asc";
    render();
  });

  pageSizeEl.addEventListener("change", () => { state.pageSize = parseInt(pageSizeEl.value, 10); state.page = 1; render(); });
  pagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const v = btn.dataset.page;
    state.page = v === "prev" ? state.page - 1 : v === "next" ? state.page + 1 : parseInt(v, 10);
    render();
    const focusBtn = pagesEl.querySelector(`[data-page="${v}"]:not([disabled])`) || pagesEl.querySelector(".is-active");
    focusBtn && focusBtn.focus();
  });

  rowsEl.addEventListener("click", (e) => {
    const fav = e.target.closest(".fav-btn");
    if (!fav) return;
    const id = parseInt(fav.closest("[data-id]").dataset.id, 10);
    const item = TABS[state.tab].data.find((d) => d.id === id);
    item.fav = !item.fav;
    fav.setAttribute("aria-pressed", item.fav);
  });

  $("clear-all").addEventListener("click", () => {
    state.query = "";
    searchEl.value = "";
    state.filters = { area: "", comp: "", skill: "", level: "", fav: false, draft: false };
    state.page = 1;
    render();
    searchEl.focus();
  });

  // ---------------------------------------------------------------- initial state
  const initial = params.get("state");
  if (initial === "vazio") {
    state.query = "zzz sem resultado";
    searchEl.value = state.query;
  }
  renderTab();
  if (initial === "filtros") openFilters();
})();
