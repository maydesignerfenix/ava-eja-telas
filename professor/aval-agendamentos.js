(function () {
  "use strict";

  const TOTAL = 1000;

  // Mock data matching the Figma frame (first 4 published, then drafts). Replace with the API.
  const TURMAS = ["Anos Finals - AF", "Anos Iniciais - AI", "Ensino Médio - EM"];
  const TITLES = [
    "Eletricidade e astronomia - Diagnóstica",
    "Leitura e interpretação de textos do cotidiano",
    "Matemática nas situações do dia a dia",
    "Corpo, saúde e qualidade de vida",
  ];
  const activities = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: TITLES[0],
    turma: "Anos Finals - AF",
    start: "",
    end: "",
    answered: 20,
    total: 60,
    draft: i >= 4,
    favorite: false,
  }));
  // Extra rows reached only through search/sort demos keep the Figma copy for the visible ones.
  activities.push(
    { id: 13, title: TITLES[1], turma: TURMAS[1], start: "2026-09-01", end: "2026-09-15", answered: 45, total: 60, draft: false, favorite: false, extra: true },
    { id: 14, title: TITLES[2], turma: TURMAS[2], start: "2026-08-10", end: "2026-08-30", answered: 60, total: 60, draft: false, favorite: false, extra: true },
    { id: 15, title: TITLES[3], turma: TURMAS[0], start: "2026-10-01", end: "2026-10-20", answered: 5, total: 60, draft: true, favorite: false, extra: true }
  );

  const listEl = document.getElementById("activity-list");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("count");
  const searchEl = document.getElementById("search");
  const sortSelectEl = document.getElementById("sort-select");
  const sortHeaders = document.querySelectorAll(".th[data-sort]");
  const filterToggle = document.getElementById("filter-toggle");
  const filtersEl = document.getElementById("filters");
  const kindEl = document.getElementById("filter-kind");
  const favEl = document.getElementById("filter-fav");

  const state = { query: "", sortKey: null, sortDir: "asc", kind: "", favOnly: false };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function fmt(iso) {
    if (!iso) return "00/00/0000";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function rowTemplate(a) {
    const pct = a.total ? Math.round((a.answered / a.total) * 100) : 0;
    const meta = a.draft
      ? `<p class="activity__meta activity__meta--draft"><img src="../shared/assets/stylus.svg" width="24" height="24" alt="" /><span>Rascunho salvo em 11/09/2026 por Mariana Alves</span></p>`
      : `<p class="activity__meta">Criado em 28/08/26 por Marina Alves</p>`;
    return `
      <li class="activity" data-id="${a.id}">
        <button class="icon-action" type="button" data-fav aria-pressed="${a.favorite}" aria-label="Favoritar ${esc(a.title)}">
          <img src="../shared/assets/favorite.svg" width="24" height="24" alt="" />
        </button>
        <div class="activity__main">
          <div class="activity__info">
            <h4 class="activity__title" title="${esc(a.title)}">${esc(a.title)}</h4>
            ${meta}
            <div class="activity__tools">
              <span class="activity__tool" title="Atividade impressa"><img src="../shared/assets/print.svg" width="20" height="20" alt="Atividade impressa" /></span>
              <span class="activity__tool" title="Atividade com duração"><img src="../shared/assets/alarm.svg" width="20" height="20" alt="Atividade com duração" /></span>
            </div>
          </div>
          <p class="activity__turma"><span class="visually-hidden">Turma: </span>${esc(a.turma)}</p>
          <p class="activity__period"><span class="visually-hidden">Período: </span>${fmt(a.start)} → ${fmt(a.end)}</p>
          <div class="activity__progress">
            <strong>${a.answered} / ${a.total} </strong>
            <span>respondidas</span>
            <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${a.total}" aria-valuenow="${a.answered}" aria-label="Respostas recebidas">
              <div class="progress__fill" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="activity__actions">
          <button class="icon-action" type="button" aria-haspopup="menu" aria-label="Mais opções para ${esc(a.title)}">
            <img src="../shared/assets/more-vert.svg" width="20" height="20" alt="" />
          </button>
        </div>
      </li>`;
  }

  function visible() {
    const q = normalize(state.query.trim());
    const filtering = q || state.kind || state.favOnly;
    let items = activities.filter((a) => (filtering ? true : !a.extra));
    if (q) items = items.filter((a) => normalize(a.title + " " + a.turma).includes(q));
    if (state.kind) items = items.filter((a) => (state.kind === "draft" ? a.draft : !a.draft));
    if (state.favOnly) items = items.filter((a) => a.favorite);
    if (state.sortKey) {
      const dir = state.sortDir === "asc" ? 1 : -1;
      const k = state.sortKey;
      items = items.slice().sort((x, y) => String(x[k]).localeCompare(String(y[k]), "pt-BR") * dir);
    }
    return { items, filtering };
  }

  function render() {
    const { items, filtering } = visible();
    listEl.innerHTML = items.map(rowTemplate).join("");
    emptyEl.hidden = items.length > 0;
    countEl.textContent = filtering
      ? `${items.length} ${items.length === 1 ? "atividade encontrada" : "atividades encontradas"}`
      : `${TOTAL} atividades agendadas`;
    sortHeaders.forEach((th) => {
      if (th.dataset.sort === state.sortKey) th.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    });
    sortSelectEl.value = state.sortKey ? `${state.sortKey}:${state.sortDir}` : "";
    if (sortSelectEl.selectedIndex === -1) sortSelectEl.value = "";
  }

  searchEl.addEventListener("input", (e) => { state.query = e.target.value; render(); });

  sortHeaders.forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      state.sortDir = state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc";
      state.sortKey = key;
      render();
    })
  );

  sortSelectEl.addEventListener("change", (e) => {
    const [key, dir] = e.target.value.split(":");
    state.sortKey = key || null;
    state.sortDir = dir || "asc";
    render();
  });

  filterToggle.addEventListener("click", () => {
    const open = filtersEl.hidden;
    filtersEl.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
  });
  kindEl.addEventListener("change", () => { state.kind = kindEl.value; render(); });
  favEl.addEventListener("change", () => { state.favOnly = favEl.checked; render(); });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    const a = activities.find((x) => String(x.id) === btn.closest(".activity").dataset.id);
    a.favorite = !a.favorite;
    btn.setAttribute("aria-pressed", String(a.favorite));
    if (state.favOnly) render();
  });

  // Pagination: visual state only until wired to the API.
  const numbered = Array.from(document.querySelectorAll(".page-btn[data-page]")).filter((b) => /^\d+$/.test(b.dataset.page));
  document.querySelectorAll(".page-btn[data-page]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cur = numbered.findIndex((b) => b.classList.contains("is-active"));
      let next = cur;
      if (btn.dataset.page === "prev") next = Math.max(0, cur - 1);
      else if (btn.dataset.page === "next") next = Math.min(numbered.length - 1, cur + 1);
      else next = numbered.indexOf(btn);
      numbered.forEach((b, i) => {
        b.classList.toggle("is-active", i === next);
        if (i === next) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
      });
    })
  );

  render();
})();
