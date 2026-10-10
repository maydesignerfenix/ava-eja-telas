(function () {
  "use strict";

  const { esc, AGENDAMENTOS, ACTIVITIES, stats, ASSETS } = window.CX;
  const state = window.CX.load();

  const listEl = document.getElementById("schedule-list");
  const emptyEl = document.getElementById("empty");
  const countEl = document.getElementById("list-count");
  const searchEl = document.getElementById("busca");
  const statusEl = document.getElementById("situacao");
  const orderEl = document.getElementById("ordem");

  const ORDER_LABEL = { pendencias: "Pendências primeiro", prazo: "Prazo mais recente primeiro", atividade: "Ordem alfabética" };
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const deadlineKey = (d) => d.split("/").reverse().join("");

  function chip(status, extraClass) {
    const cls = status === "Em correção" ? "cx-chip--warn" : "";
    return `<span class="cx-chip ${cls} ${extraClass}">${esc(status)}</span>`;
  }

  function card(s) {
    const ag = s.ag;
    const act = ACTIVITIES[ag.activity];
    const pct = s.manualTotal ? Math.round((s.corrected / s.manualTotal) * 100) : 0;

    let pendStrong, pendNote, progressLabel, action;
    if (!s.delivered.length) {
      pendStrong = "Nenhuma resposta recebida";
      pendNote = "Sem tempo de espera";
      progressLabel = "Aguardando a primeira entrega";
      action = `<a class="btn btn--outline-sm" href="turma-atividades.html">Ver agendamento</a>`;
    } else {
      pendStrong = `${s.pending} ${s.pending === 1 ? "resposta" : "respostas"} · ${s.pendingStudents.length} ${s.pendingStudents.length === 1 ? "estudante" : "estudantes"}`;
      if (s.published) pendNote = `Notas publicadas em ${s.published.split(" ")[0]}`;
      else if (s.pending) pendNote = `Maior espera: ${ag.waitDays} dias`;
      else pendNote = "Pronto para publicar";
      progressLabel = `${s.corrected} de ${s.manualTotal} respostas manuais corrigidas`;
      const href = `correcao-estudante.html?agendamento=${ag.id}`;
      action = s.published || !s.pending
        ? `<a class="btn btn--outline-sm" href="${href}">Ver correção</a>`
        : `<a class="btn btn--primary-sm" href="${href}">Corrigir</a>`;
    }

    return `
      <li class="schedule" data-id="${ag.id}">
        <div class="schedule__head">
          <span class="schedule__icon"><img src="${ASSETS}overview.svg" width="20" height="20" alt="" /></span>
          <div class="schedule__id">
            <h2 class="schedule__title">${esc(act.title)}</h2>
            <p class="schedule__meta">Agendamento ${ag.number} · ${esc(ag.scope)} · Tentativa ${ag.attempt}</p>
          </div>
          ${chip(s.status, "schedule__chip--desktop")}
        </div>
        ${chip(s.status, "schedule__chip--mobile")}
        <div class="schedule__details">
          <div class="schedule__col">
            <p class="cx-overline">PRAZO E ENTREGAS</p>
            <p class="schedule__strong">${ag.deadline} · ${esc(ag.deadlineStatus)}</p>
            <p class="schedule__text">${s.delivered.length} de ${s.totalStudents} entregaram</p>
          </div>
          <div class="schedule__col">
            <p class="cx-overline">PENDENTE DE NOTA MANUAL</p>
            <p class="schedule__strong">${pendStrong}</p>
            <p class="cx-caption">${esc(pendNote)}</p>
          </div>
          <div class="schedule__col schedule__col--progress">
            <div class="cx-progress">
              <p class="cx-progress__label">${progressLabel}</p>
              <div class="cx-track" role="progressbar" aria-label="Respostas manuais corrigidas" aria-valuemin="0" aria-valuemax="${s.manualTotal}" aria-valuenow="${s.corrected}">
                <div class="cx-track__fill" style="width:${pct}%"></div>
              </div>
            </div>
            ${action}
          </div>
        </div>
      </li>`;
  }

  function render() {
    const all = AGENDAMENTOS.map((a) => stats(state, a.id));

    // Summary indicators (whole class, independent from filters)
    const withPending = all.filter((s) => s.pending > 0);
    document.getElementById("stat-ag").textContent = withPending.length;
    document.getElementById("stat-resp").textContent = withPending.reduce((t, s) => t + s.pending, 0);
    const studentsPending = withPending.reduce((t, s) => t + s.pendingStudents.length, 0);
    document.getElementById("stat-resp-note").textContent =
      `${studentsPending} ${studentsPending === 1 ? "estudante" : "estudantes"} nos ${withPending.length} agendamentos`;
    const longest = withPending.slice().sort((a, b) => b.ag.waitDays - a.ag.waitDays)[0];
    document.getElementById("stat-wait").textContent = longest ? `${longest.ag.waitDays} dias` : "—";
    document.getElementById("stat-wait-note").textContent = longest
      ? `${ACTIVITIES[longest.ag.activity].short} · Agendamento ${longest.ag.number}`
      : "Nenhuma resposta aguardando correção";

    // Filters
    const q = normalize(searchEl.value.trim());
    let items = all.filter((s) => {
      const text = normalize(`${ACTIVITIES[s.ag.activity].title} agendamento ${s.ag.number} ${s.ag.scope}`);
      return (!q || text.includes(q)) && (!statusEl.value || s.status === statusEl.value);
    });
    const order = orderEl.value;
    items.sort((a, b) => {
      if (order === "atividade") return ACTIVITIES[a.ag.activity].title.localeCompare(ACTIVITIES[b.ag.activity].title, "pt-BR") || a.ag.number.localeCompare(b.ag.number);
      if (order === "prazo") return deadlineKey(b.ag.deadline).localeCompare(deadlineKey(a.ag.deadline));
      return (b.pending > 0) - (a.pending > 0) || b.ag.waitDays - a.ag.waitDays || !!a.published - !!b.published;
    });

    listEl.innerHTML = items.map(card).join("");
    emptyEl.hidden = items.length > 0;
    const activities = new Set(items.map((s) => s.ag.activity)).size;
    countEl.textContent = `${items.length} ${items.length === 1 ? "agendamento" : "agendamentos"} · ${activities} ${activities === 1 ? "atividade" : "atividades"} · ${ORDER_LABEL[order]}`;
  }

  // ?state=filtrado opens the list already filtered by "Em correção".
  if (window.CX.params().get("state") === "em-correcao") statusEl.value = "Em correção";

  [searchEl, statusEl, orderEl].forEach((el) => el.addEventListener("input", render));
  render();
})();
