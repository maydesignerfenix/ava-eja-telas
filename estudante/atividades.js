(function () {
  "use strict";

  const STATUS = {
    corrigido: { label: "Corrigido", className: "badge--corrigido", plural: ["corrigida", "corrigidas"] },
    "em-correcao": { label: "Em correção", className: "badge--em-correcao", plural: ["em correção", "em correção"] },
    "nao-iniciada": { label: "Não iniciada", className: "badge--nao-iniciada", plural: ["não iniciada", "não iniciadas"] },
  };

  // Mock data matching the Figma frames (4166:99560). Replace with the API response.
  const activities = [
    { id: "textos-midias", title: "Textos, mídias e tecnologia digitais", area: "Linguagens", comp: "C1", status: "corrigido", date: "02/10/26 · 19:42", grade: "8,5 / 10" },
    { id: "leitura-interpretacao", title: "Leitura e interpretação de textos do cotidiano", area: "Linguagens", comp: "C2", status: "em-correcao", date: "07/10/26 · 20:15", grade: "Aguardando correção" },
    { id: "matematica-dia-a-dia", title: "Matemática nas situações do dia a dia", area: "Matemática", comp: "C3", status: "nao-iniciada", date: "Até 16/10/26 · 23:59", grade: "Ainda não enviada" },
    { id: "ciencia-tecnologia", title: "Ciência e tecnologia no cotidiano", area: "Ciências da Natureza", comp: "C4", status: "corrigido", date: "01/10/26 · 18:30", grade: "7,5 / 10" },
  ];

  const $ = (id) => document.getElementById(id);
  const listEl = $("activity-list");
  const emptyEl = $("empty-state");
  const countEl = $("activities-count");
  const breakdownEl = $("activities-breakdown");
  const showingEl = $("showing");
  const areaEl = $("filter-area");
  const statusEl = $("filter-status");
  const searchEl = $("search");

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function actionTemplate(a) {
    if (a.status === "corrigido") {
      return `<a class="btn btn--outline-sm" href="devolutiva.html?atividade=${a.id}">VER CORREÇÃO<span class="visually-hidden">: ${escapeHtml(a.title)}</span></a>`;
    }
    if (a.status === "nao-iniciada") {
      return `<a class="btn btn--outline-sm" href="realizar-atividade.html?atividade=${a.id}">INICIAR ATIVIDADE<span class="visually-hidden">: ${escapeHtml(a.title)}</span></a>`;
    }
    return `<p class="student-activity__waiting">
        <span class="student-activity__waiting-icon" aria-hidden="true"><img src="assets/est-acomp/aguardando.svg" width="17.6" height="17.6" alt="" /></span>
        Correção em andamento
      </p>`;
  }

  function rowTemplate(a) {
    const s = STATUS[a.status];
    return `
      <li class="student-activity" data-id="${a.id}">
        <div class="student-activity__id">
          <h3 class="student-activity__title">${escapeHtml(a.title)}</h3>
          <p class="est-small">${escapeHtml(a.area)} · ${a.comp}</p>
        </div>
        <div class="student-activity__status">
          <span class="badge badge--sm ${s.className}">${s.label}</span>
          <p class="student-activity__date">${a.status === "nao-iniciada" ? "" : '<span class="visually-hidden">Enviada em </span>'}${escapeHtml(a.date)}</p>
        </div>
        <div class="student-activity__result">
          <p class="est-small">Nota da atividade</p>
          <p class="est-strong">${escapeHtml(a.grade)}</p>
        </div>
        <div class="student-activity__action">${actionTemplate(a)}</div>
      </li>`;
  }

  function breakdown(items) {
    return Object.keys(STATUS)
      .map((key) => {
        const n = items.filter((a) => a.status === key).length;
        return n ? `${n} ${STATUS[key].plural[n === 1 ? 0 : 1]}` : null;
      })
      .filter(Boolean)
      .join(" · ");
  }

  function render() {
    const q = normalize(searchEl.value.trim());
    const area = areaEl.value;
    const status = statusEl.value;
    const items = activities.filter(
      (a) => (!area || a.area === area) && (!status || a.status === status) && (!q || normalize(`${a.title} ${a.area} ${a.comp}`).includes(q))
    );

    listEl.innerHTML = items.map(rowTemplate).join("");
    emptyEl.hidden = items.length > 0;
    countEl.textContent = `${items.length} ${items.length === 1 ? "atividade" : "atividades"}`;
    breakdownEl.textContent = items.length ? breakdown(items) : "Nenhuma atividade para os filtros selecionados";
    showingEl.textContent = `Mostrando ${items.length} de ${activities.length} atividades · Dados demonstrativos`;

    const params = new URLSearchParams(location.search);
    [["area", area], ["status", status], ["busca", searchEl.value.trim()]].forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  // Deep links: ?area=Linguagens&status=corrigido&busca=texto
  const params = new URLSearchParams(location.search);
  if (params.has("area")) areaEl.value = params.get("area");
  if (params.has("status")) statusEl.value = params.get("status");
  if (params.has("busca")) searchEl.value = params.get("busca");

  [areaEl, statusEl].forEach((el) => el.addEventListener("change", render));
  searchEl.addEventListener("input", render);

  render();
})();
