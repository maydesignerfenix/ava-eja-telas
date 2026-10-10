(function () {
  "use strict";

  const PAGE_SIZE = 5;
  const A = "assets/prof-aval/";

  const GROUPS = [
    { key: "encerrado", name: "ENCERRADO", total: 27, hint: "já é possível finalizar a correção" },
    { key: "andamento", name: "EM ANDAMENTO", total: 54, hint: "ainda recebendo respostas" },
    { key: "indeterminado", name: "PRAZO INDETERMINADO", total: 27, hint: "priorize pelo tempo de espera" },
  ];

  // Mock data matching the Figma frame (page 1 of each group) + a few extra rows for page 2.
  // pct = share of answers already corrected (progress bar).
  const r = (group, title, turma, unidade, deliveries, deadline, date, students, pct, wait, since) =>
    ({ group, title, turma, unidade, deliveries, deadline, date, students, pct, wait, since });
  const rows = [
    r("encerrado", "Gêneros jornalísticos — notícia e reportagem", "EJA — Módulo 3 — Noite", "SESI Vila Leopoldina", "5/5", 33, "09/08", 2, 60, 40, "02/08"),
    r("encerrado", "Brasil República — linha do tempo", "7º Ano B — Tarde", "SESI Vila Leopoldina", "6/11", 24, "18/08", 2, 67, 38, "04/08"),
    r("encerrado", "Brasil República — linha do tempo", "8º Ano B — Tarde", "SESI Vila Leopoldina", "5/8", 19, "23/08", 3, 40, 33, "09/08"),
    r("encerrado", "Leitura e interpretação — crônicas", "1ª Série EM — Noite", "SESI Vila Leopoldina", "9/10", 27, "15/08", 6, 33, 32, "10/08"),
    r("encerrado", "Gêneros jornalísticos — notícia e reportagem", "9º Ano B — Manhã", "SESI Ipiranga", "9/10", 24, "18/08", 9, 0, 31, "11/08"),
    r("encerrado", "Frações e porcentagens no cotidiano", "6º Ano A — Manhã", "SESI Ipiranga", "8/9", 15, "27/08", 3, 50, 28, "14/08"),
    r("encerrado", "Ecossistemas brasileiros", "7º Ano A — Manhã", "SESI Ipiranga", "7/8", 12, "30/08", 4, 25, 22, "20/08"),
    r("andamento", "Brasil República — linha do tempo", "6º Ano A — Manhã", "SESI Ipiranga", "5/8", 1, "12/09", 4, 20, 13, "29/08"),
    r("andamento", "Brasil República — linha do tempo", "EJA — Módulo 3 — Noite", "SESI Vila Leopoldina", "5/5", 3, "14/09", 4, 20, 11, "31/08"),
    r("andamento", "Produção de texto — carta de opinião", "9º Ano B — Manhã", "SESI Ipiranga", "9/10", 7, "18/09", 9, 0, 7, "04/09"),
    r("andamento", "Produção de texto — carta de opinião", "7º Ano A — Manhã", "SESI Ipiranga", "8/10", 7, "18/09", 7, 12.5, 7, "04/09"),
    r("andamento", "Transformações químicas no cotidiano", "7º Ano B — Tarde", "SESI Vila Leopoldina", "6/11", 7, "18/09", 5, 16.7, 7, "04/09"),
    r("andamento", "Geometria nas construções", "8º Ano A — Manhã", "SESI Ipiranga", "4/9", 10, "21/09", 2, 0, 5, "06/09"),
    r("indeterminado", "Energia e circuitos simples", "6º Ano B — Manhã", "SESI Ipiranga", "7/9", null, "03/08", 4, 43, 39, "03/08"),
    r("indeterminado", "Energia e circuitos simples", "7º Ano A — Manhã", "SESI Ipiranga", "8/10", null, "08/08", 5, 37.5, 34, "08/08"),
    r("indeterminado", "Energia e circuitos simples", "8º Ano A — Manhã", "SESI Ipiranga", "5/8", null, "17/08", 1, 80, 25, "17/08"),
    r("indeterminado", "Energia e circuitos simples", "8º Ano B — Tarde", "SESI Ipiranga", "5/8", null, "22/08", 5, 0, 20, "22/08"),
    r("indeterminado", "Energia e circuitos simples", "6º Ano A — Manhã", "SESI Ipiranga", "6/6", null, "24/08", 5, 16.7, 18, "24/08"),
    r("indeterminado", "Leitura e interpretação — contos", "9º Ano B — Manhã", "SESI Ipiranga", "3/10", null, "30/08", 2, 0, 12, "30/08"),
  ];
  const done = [
    { title: "Sistema solar e estações do ano", turma: "6º Ano A — Manhã", unidade: "SESI Ipiranga", deliveries: "9/9", since: "corrigida em 05/09" },
    { title: "Leitura e interpretação — crônicas", turma: "8º Ano B — Tarde", unidade: "SESI Vila Leopoldina", deliveries: "8/8", since: "corrigida em 02/09" },
    { title: "Porcentagem e juros simples", turma: "EJA — Módulo 3 — Noite", unidade: "SESI Vila Leopoldina", deliveries: "5/5", since: "corrigida em 28/08" },
  ];

  const groupsEl = document.getElementById("groups");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("count");
  const searchEl = document.getElementById("search");
  const filterToggle = document.getElementById("filter-toggle");
  const filtersEl = document.getElementById("filters");
  const unidadeEl = document.getElementById("filter-unidade");
  const turmaEl = document.getElementById("filter-turma");

  const state = { query: "", unidade: "", turma: "", pages: { encerrado: 0, andamento: 0, indeterminado: 0 } };

  [...new Set(rows.map((x) => x.turma))].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach((t) => turmaEl.add(new Option(t, t)));

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function deadline(x) {
    if (x.group === "encerrado") return { text: `há ${x.deadline} dias`, sub: `encerrou ${x.date}` };
    if (x.group === "andamento") return { text: x.deadline === 1 ? "falta 1 dia" : `faltam ${x.deadline} dias`, sub: `até ${x.date}` };
    return { text: "Sem prazo", sub: `desde ${x.date}` };
  }
  const waitClass = (d) => (d >= 30 ? "wait--long" : d >= 10 ? "wait--mid" : "");

  function rowTemplate(x) {
    const d = deadline(x);
    return `
      <li class="row cols">
        <div class="row__activity">
          <h4 class="row__title" title="${esc(x.title)}">${esc(x.title)}</h4>
          <p class="row__turma">${esc(x.turma)}</p>
          <p class="row__unidade">${esc(x.unidade)}</p>
        </div>
        <div><span class="row__label">ENTREGAS</span><p class="row__deliveries"><span class="visually-hidden">Entregas: </span>${x.deliveries}</p></div>
        <div>
          <span class="row__label">PRAZO</span>
          <div class="row__stack">
            <p class="deadline deadline--${x.group}"><img src="${A}dot-${x.group}-7.svg" width="7" height="7" alt="" /><span class="visually-hidden">Prazo: </span>${d.text}</p>
            <p class="row__sub">${d.sub}</p>
          </div>
        </div>
        <div>
          <span class="row__label">A CORRIGIR</span>
          <div class="to-correct">
            <p class="to-correct__count"><strong>${x.students}</strong><span>estudantes</span></p>
            <div class="to-correct__bar" role="progressbar" aria-label="Respostas corrigidas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(x.pct)}"><span style="width:${x.pct}%"></span></div>
          </div>
        </div>
        <div>
          <span class="row__label">TEMPO DE ESPERA</span>
          <div class="row__stack">
            <p class="wait ${waitClass(x.wait)}"><span class="visually-hidden">Tempo de espera: </span>${x.wait} dias</p>
            <p class="row__sub">desde ${x.since}</p>
          </div>
        </div>
        <div class="row__cell-action"><a class="btn-correct" href="#" aria-label="Corrigir ${esc(x.title)} – ${esc(x.turma)}">Corrigir</a></div>
      </li>`;
  }

  function filtered() {
    const q = normalize(state.query.trim());
    return rows.filter((x) =>
      (!q || normalize(`${x.title} ${x.turma} ${x.unidade}`).includes(q)) &&
      (!state.unidade || x.unidade === state.unidade) &&
      (!state.turma || x.turma === state.turma)
    );
  }

  function render() {
    const items = filtered();
    const filtering = state.query.trim() || state.unidade || state.turma;
    let html = "";
    GROUPS.forEach((g) => {
      const list = items.filter((x) => x.group === g.key);
      if (!list.length) return;
      const pages = Math.ceil(list.length / PAGE_SIZE);
      const page = Math.min(state.pages[g.key], pages - 1);
      state.pages[g.key] = page;
      const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
      const prevDis = page === 0, nextDis = page >= pages - 1;
      html += `
        <section class="group group--${g.key}" aria-labelledby="g-${g.key}">
          <div class="group__head">
            <div class="group__state">
              <span class="group__state-main"><img src="${A}dot-${g.key}-9.svg" width="9" height="9" alt="" /><h4 class="group__name" id="g-${g.key}">${g.name}</h4></span>
              <span class="group__count">${filtering ? list.length : g.total} agendamento(s)</span>
              <span class="group__hint">${g.hint}</span>
            </div>
            <div class="group__pager">
              <button class="pager-btn pager-btn--prev" type="button" data-group="${g.key}" data-dir="-1" aria-label="Página anterior de ${g.name.toLowerCase()}" ${prevDis ? "disabled" : ""}>
                <img src="${A}${prevDis ? "group-page-prev" : "group-page-next"}.svg" width="32" height="32" alt="" />
              </button>
              <button class="pager-btn pager-btn--next" type="button" data-group="${g.key}" data-dir="1" aria-label="Próxima página de ${g.name.toLowerCase()}" ${nextDis ? "disabled" : ""}>
                <img src="${A}${nextDis ? "group-page-prev" : "group-page-next"}.svg" width="32" height="32" alt="" ${nextDis ? 'style="transform:scaleX(-1)"' : ""} />
              </button>
            </div>
          </div>
          <div class="group__cols cols" aria-hidden="true">
            <span>AGENDAMENTO</span><span>ENTREGAS</span><span>PRAZO</span><span>A CORRIGIR</span><span>TEMPO DE ESPERA</span><span></span>
          </div>
          <ul>${slice.map(rowTemplate).join("")}</ul>
        </section>`;
    });
    groupsEl.innerHTML = html;
    emptyEl.hidden = items.length > 0;
    countEl.textContent = filtering
      ? `${items.length} ${items.length === 1 ? "agendamento encontrado" : "agendamentos encontrados"}`
      : "108 agendamentos a corrigir";
  }

  groupsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".pager-btn");
    if (!btn || btn.disabled) return;
    state.pages[btn.dataset.group] += Number(btn.dataset.dir);
    render();
    const again = groupsEl.querySelector(`.pager-btn[data-group="${btn.dataset.group}"][data-dir="${btn.dataset.dir}"]`);
    (again && !again.disabled ? again : groupsEl.querySelector(`#g-${btn.dataset.group}`)).focus?.();
  });

  const resetPages = () => Object.keys(state.pages).forEach((k) => (state.pages[k] = 0));
  searchEl.addEventListener("input", () => { state.query = searchEl.value; resetPages(); render(); });
  unidadeEl.addEventListener("change", () => { state.unidade = unidadeEl.value; resetPages(); render(); });
  turmaEl.addEventListener("change", () => { state.turma = turmaEl.value; resetPages(); render(); });
  document.getElementById("filter-clear").addEventListener("click", () => {
    unidadeEl.value = ""; turmaEl.value = ""; state.unidade = ""; state.turma = ""; resetPages(); render();
  });
  filterToggle.addEventListener("click", () => {
    const open = filtersEl.hidden;
    filtersEl.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
  });

  // Concluídas (collapsed group)
  const doneToggle = document.getElementById("done-toggle");
  const doneList = document.getElementById("done-list");
  doneList.innerHTML = done.map((x) => `
    <li class="row row--done cols">
      <div class="row__activity">
        <h4 class="row__title">${esc(x.title)}</h4>
        <p class="row__turma">${esc(x.turma)}</p>
        <p class="row__unidade">${esc(x.unidade)}</p>
      </div>
      <div><span class="row__label">ENTREGAS</span><p class="row__deliveries">${x.deliveries}</p></div>
      <div><span class="row__label">SITUAÇÃO</span><p class="row__sub">${x.since}</p></div>
      <div></div><div></div>
      <div class="row__cell-action"><a class="btn-correct" href="#" aria-label="Revisar ${esc(x.title)}">Revisar</a></div>
    </li>`).join("");
  function setDone(open) {
    doneToggle.setAttribute("aria-expanded", String(open));
    doneList.hidden = !open;
  }
  doneToggle.addEventListener("click", () => setDone(doneList.hidden));

  const params = new URLSearchParams(location.search);
  if (params.get("state") === "concluidas") setDone(true);

  render();
})();
