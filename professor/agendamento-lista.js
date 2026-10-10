/* Agendamentos da atividade – modal opened from "N Agendamentos" on the
   activity list (list itself is rendered by turma-atividades.js).
   ?state=fechado opens the page with the modal closed. */
(function () {
  "use strict";

  const A = "assets/prof-agenda/";
  const EDIT_URL = "agendamento-turma.html?etapa=1";

  // Mock data matching Figma 4155:61415. Replace with the API response.
  const schedules = [
    { title: "3 estudante(s) · 9º Ano A — Manhã", detail: "Alice Moreira, Caio Duarte, Helena Barros", start: "10/08/26", end: "17/08/26", status: "encerrada" },
    { title: "Turma · 9º Ano B — Manhã", detail: "EF2 · 9º ano", start: "25/08/26", end: "05/09/26", status: "encerrada" },
    { title: "4 estudante(s) · 9º Ano A — Manhã", detail: "Alice Moreira, Caio Duarte, Helena Barros, Igor Santana", start: "01/09/26", end: null, status: "andamento" },
    { title: "Turma · EJA — Módulo 3 — Noite", detail: "EF2 · 9º ano", start: "18/08/26", end: "25/08/26", status: "encerrada" },
    { title: "Turma · 9º Ano B — Manhã", detail: "EF2 · 9º ano", start: "27/07/26", end: "03/08/26", status: "encerrada" },
  ];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const modal = document.getElementById("sched-modal");
  const itemsEl = document.getElementById("sched-items");
  const nameEl = document.getElementById("sched-activity-name");
  const countEl = document.getElementById("sched-count");

  function item(s) {
    const running = s.status === "andamento";
    const badge = running
      ? `<span class="sched__badge sched__badge--running"><img src="${A}clock-3.svg" width="14" height="14" alt="" />Em andamento</span>`
      : `<span class="sched__badge"><img src="${A}circle-check.svg" width="14" height="14" alt="" />Encerrada</span>`;
    const action = running
      ? `<a class="btn btn--outline-sm sched__action" href="${EDIT_URL}">Editar</a>`
      : `<a class="btn btn--primary-sm sched__action" href="#">Corrigir</a>`;
    return `
      <li class="sched">
        <div class="sched__who">
          <p class="sched__title">${esc(s.title)}</p>
          <p class="sched__detail">${esc(s.detail)}</p>
        </div>
        <p class="sched__period">
          <img src="${A}calendar-days.svg" width="16" height="16" alt="" />
          <span><span class="visually-hidden">Período: </span>${esc(s.start)} → ${s.end ? esc(s.end) : '—<span class="visually-hidden"> sem data de término</span>'}</span>
        </p>
        <div class="sched__state">
          <div class="sched__badge-wrap">${badge}</div>
          ${action}
        </div>
      </li>`;
  }

  function render() {
    itemsEl.innerHTML = schedules.length
      ? schedules.map(item).join("")
      : `<li class="sched-list__empty">Nenhum agendamento para esta atividade.</li>`;
    countEl.textContent = `${schedules.length} ${schedules.length === 1 ? "agendamento" : "agendamentos"}`;
  }

  function open(activityName, opener) {
    if (activityName) nameEl.textContent = activityName.replace(/\s+-\s+/, " — ");
    render();
    modal._opener = opener || null;
    if (!modal.open) modal.showModal();
  }

  modal.addEventListener("close", () => {
    if (modal._opener && document.contains(modal._opener)) modal._opener.focus();
  });
  modal.querySelector("[data-close]").addEventListener("click", () => modal.close());
  // Click on the backdrop closes the dialog.
  modal.addEventListener("click", (e) => {
    if (e.target !== modal) return;
    const r = modal.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) modal.close();
  });

  // "N Agendamentos" links in the activity list open the modal for that row.
  document.getElementById("activity-list").addEventListener("click", (e) => {
    const link = e.target.closest(".activity__schedules");
    if (!link) return;
    e.preventDefault();
    const title = link.closest(".activity").querySelector(".activity__title").textContent;
    open(title, link);
  });

  const state = new URLSearchParams(location.search).get("state");
  if (state !== "fechado") open(null, null);
  else render();
})();
