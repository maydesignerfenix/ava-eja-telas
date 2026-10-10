(function () {
  "use strict";

  const TOTAL_IN_CLASS = 340;

  const STATUS = {
    corrigido: { label: "Corrigido", className: "badge--corrigido" },
    "em-correcao": { label: "Em correção", className: "badge--em-correcao" },
    "nao-iniciada": { label: "Não iniciada", className: "badge--nao-iniciada" },
  };

  // Mock data matching the Figma frames. Replace with the API response.
  const activities = [
    { title: "Leitura e interpretação de textos do cotidiano", status: "corrigido", corrected: 60 },
    { title: "Matemática nas situações do dia a dia", status: "nao-iniciada", corrected: 0, draft: "Rascunho salvo em 11/09/2026 por Mariana Alves" },
    { title: "Corpo, saúde e qualidade de vida", status: "em-correcao", corrected: 20 },
    { title: "Sociedade, cidadania e direitos", status: "corrigido", corrected: 60 },
    { title: "Comunicação e linguagens no dia a dia", status: "em-correcao", corrected: 20 },
    { title: "Números, gráficos e tomada de decisão", status: "em-correcao", corrected: 20 },
    { title: "Meio ambiente e sustentabilidade", status: "em-correcao", corrected: 20 },
    { title: "Textos, mídias e tecnologia digitais", status: "em-correcao", corrected: 20 },
    { title: "Raciocínio lógico e resolução de problemas", status: "em-correcao", corrected: 20 },
    { title: "Ciência e tecnologia no cotidiano", status: "em-correcao", corrected: 20 },
    { title: "Geografia, espaço e cidadania", status: "em-correcao", corrected: 20 },
    { title: "Eletricidade e astronomia - Diagnóstica", status: "em-correcao", corrected: 20 },
  ].map((a, i) => ({
    id: i + 1,
    createdBy: "Criado em 28/08/26 por Marina Alves",
    schedules: 6,
    start: "2026-04-28T16:14",
    end: "2026-04-28T16:14",
    total: 60,
    ...a,
  }));

  const listEl = document.getElementById("activity-list");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("activities-count");
  const searchEl = document.getElementById("search");
  const sortSelectEl = document.getElementById("sort-select");
  const sortHeaders = document.querySelectorAll(".th[data-sort]");

  const state = { query: "", sortKey: null, sortDir: "asc" };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function formatDate(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function rowTemplate(a) {
    const status = STATUS[a.status];
    const pct = a.total ? Math.round((a.corrected / a.total) * 100) : 0;
    const meta = a.draft
      ? `<p class="activity__meta activity__meta--draft"><img src="../shared/assets/stylus.svg" width="24" height="24" alt="" />${escapeHtml(a.draft)}</p>`
      : `<p class="activity__meta">${escapeHtml(a.createdBy)}</p>`;

    return `
      <li class="activity" data-id="${a.id}">
        <button class="icon-action" type="button" aria-label="Favoritar ${escapeHtml(a.title)}">
          <img src="../shared/assets/favorite.svg" width="24" height="24" alt="" />
        </button>
        <div class="activity__main">
          <div class="activity__info">
            <h3 class="activity__title" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</h3>
            ${meta}
            <div class="activity__links">
              <a class="activity__schedules" href="#">
                <img src="../shared/assets/calendar-clock.svg" width="24" height="24" alt="" />
                ${a.schedules} Agendamentos
              </a>
              <span class="activity__tool" title="Atividade impressa"><img src="../shared/assets/print.svg" width="20" height="20" alt="Atividade impressa" /></span>
              <span class="activity__tool" title="Atividade com duração"><img src="../shared/assets/alarm.svg" width="20" height="20" alt="Atividade com duração" /></span>
            </div>
          </div>
          <div class="activity__dates">
            <p class="activity__date"><span class="visually-hidden">Inicia em </span>${formatDate(a.start)}</p>
            <p class="activity__date"><span class="visually-hidden">Termina em </span>${formatDate(a.end)}</p>
          </div>
          <div class="activity__status">
            <span class="badge ${status.className}">${status.label}</span>
          </div>
          <div class="activity__progress">
            <p class="activity__progress-label"><span class="visually-hidden">Corrigidas: </span>${a.corrected} / ${a.total}</p>
            <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${a.total}" aria-valuenow="${a.corrected}" aria-label="Progresso de correção">
              <div class="progress__fill" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="activity__actions">
          <button class="icon-action" type="button" aria-haspopup="menu" aria-label="Mais opções">
            <img src="../shared/assets/more-vert.svg" width="20" height="20" alt="" />
          </button>
        </div>
      </li>`;
  }

  function getVisible() {
    const q = normalize(state.query.trim());
    let items = q ? activities.filter((a) => normalize(a.title).includes(q)) : activities.slice();

    if (state.sortKey) {
      const dir = state.sortDir === "asc" ? 1 : -1;
      const key = state.sortKey;
      items.sort((x, y) =>
        key === "title" ? x.title.localeCompare(y.title, "pt-BR") * dir : (new Date(x[key]) - new Date(y[key])) * dir
      );
    }
    return items;
  }

  function render() {
    const items = getVisible();
    listEl.innerHTML = items.map(rowTemplate).join("");
    emptyEl.hidden = items.length > 0;

    countEl.textContent = state.query.trim()
      ? `${items.length} ${items.length === 1 ? "Atividade encontrada" : "Atividades encontradas"}`
      : `${TOTAL_IN_CLASS} Atividades agendadas na turma`;

    sortHeaders.forEach((th) => {
      if (th.dataset.sort === state.sortKey) {
        th.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      } else {
        th.removeAttribute("aria-sort");
      }
    });
    sortSelectEl.value = state.sortKey ? `${state.sortKey}:${state.sortDir}` : "";
  }

  searchEl.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

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

  // Pagination: visual state only until wired to the API.
  const pageButtons = Array.from(document.querySelectorAll(".page-btn[data-page]"));
  const numbered = pageButtons.filter((b) => /^\d+$/.test(b.dataset.page));
  pageButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const current = numbered.findIndex((b) => b.classList.contains("is-active"));
      let next = current;
      if (btn.dataset.page === "prev") next = Math.max(0, current - 1);
      else if (btn.dataset.page === "next") next = Math.min(numbered.length - 1, current + 1);
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
