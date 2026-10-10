(function () {
  "use strict";

  // Mock report matching Figma 4166:99981. Grades are numbers (null = pending);
  // `note` is the text shown while a grade is pending. Replace with the API.
  const WEIGHTS = { online: 0.4, presencial: 0.4, participacao: 0.2 };
  const competencies = [
    {
      id: "c1", area: "Linguagens",
      online: { grade: 8.5, activity: "Textos, mídias e tecnologia digitais", corrected: "05/10/26", href: "devolutiva.html?atividade=textos-midias" },
      presencial: { grade: 8.0 }, participacao: { grade: 9.0 },
    },
    {
      id: "c2", area: "Linguagens",
      online: { grade: null, note: "Em correção", activity: "Leitura e interpretação de textos do cotidiano" },
      presencial: { grade: 7.5 }, participacao: { grade: 8.0 },
    },
    {
      id: "c3", area: "Matemática",
      online: { grade: null, note: "Não iniciada", activity: "Matemática nas situações do dia a dia" },
      presencial: { grade: 8.0 }, participacao: { grade: 8.5 },
    },
    {
      id: "c4", area: "Ciências da Natureza",
      online: { grade: 7.5, activity: "Ciência e tecnologia no cotidiano", corrected: "01/10/26", href: "devolutiva.html?atividade=ciencia-tecnologia" },
      presencial: { grade: 8.0 }, participacao: { grade: 9.0 },
    },
    {
      id: "c5", area: "Ciências Humanas",
      online: { grade: null, note: "Não disponível" },
      presencial: { grade: null, note: "Aguardando nota" }, participacao: { grade: 8.0 },
    },
    {
      id: "c6", area: "Ciências Humanas",
      online: { grade: null, note: "Não disponível" },
      presencial: { grade: 7.0 }, participacao: { grade: null, note: "Aguardando nota" },
    },
  ];

  const fmt = (n) => n.toFixed(1).replace(".", ",");
  const fmt2 = (n) => n.toFixed(2).replace(".", ",");
  const code = (c) => c.id.toUpperCase();
  const isComplete = (c) => [c.online, c.presencial, c.participacao].every((p) => p.grade !== null);
  const finalGrade = (c) =>
    isComplete(c) ? c.online.grade * WEIGHTS.online + c.presencial.grade * WEIGHTS.presencial + c.participacao.grade * WEIGHTS.participacao : null;
  const gradeText = (p) => (p.grade === null ? p.note : fmt(p.grade));
  const gradeCls = (p) => (p.grade === null ? "is-pending" : "");

  const rowsEl = document.getElementById("report-rows");
  const cardsEl = document.getElementById("report-cards");
  const compEl = document.getElementById("composition");

  function situation(c) {
    return isComplete(c)
      ? '<span class="situation situation--done">Completa</span>'
      : '<span class="situation situation--pending">Em processo</span>';
  }

  function renderTable(selected) {
    rowsEl.innerHTML = competencies
      .map((c) => {
        const f = finalGrade(c);
        const sel = c.id === selected;
        return `
        <tr class="${sel ? "is-selected" : ""}" data-id="${c.id}">
          <th scope="row">
            <button class="comp-select" type="button" data-id="${c.id}" aria-pressed="${sel}" aria-controls="composition">
              <span class="comp-select__code">${code(c)}</span>
              <span class="comp-select__area">${c.area}</span>
            </button>
          </th>
          <td class="${gradeCls(c.online)}">${gradeText(c.online)}</td>
          <td class="${gradeCls(c.presencial)}">${gradeText(c.presencial)}</td>
          <td class="${gradeCls(c.participacao)}">${gradeText(c.participacao)}</td>
          <td class="final">${f === null ? '<span aria-label="Não calculada">—</span>' : fmt(f)}</td>
          <td>${situation(c)}</td>
        </tr>`;
      })
      .join("");
  }

  function renderCards(selected) {
    const cell = (label, p, strong) =>
      `<div class="comp-card__cell"><p class="comp-card__label">${label}</p><p class="comp-card__value ${p === null || p.grade === null ? "is-pending" : ""} ${strong ? "is-final" : ""}">${p === null ? "—" : gradeText(p)}</p></div>`;
    cardsEl.innerHTML = competencies
      .map((c) => {
        const f = finalGrade(c);
        const sel = c.id === selected;
        return `
        <li class="comp-card ${sel ? "is-selected" : ""}">
          <div class="comp-card__head">
            <button class="comp-card__title" type="button" data-id="${c.id}" aria-pressed="${sel}" aria-controls="composition">${code(c)} · ${c.area}</button>
            ${situation(c)}
          </div>
          <div class="comp-card__grid">
            ${cell("Online · 40%", c.online)}
            ${cell("Presencial · 40%", c.presencial)}
            ${cell("Participação · 20%", c.participacao)}
            ${cell("Nota final / 10", f === null ? null : { grade: f }, true)}
          </div>
          ${f === null ? '<p class="est-small">Nota final ainda não calculada.</p>' : ""}
        </li>`;
      })
      .join("");
  }

  function renderComposition(id) {
    const c = competencies.find((x) => x.id === id);
    const f = finalGrade(c);
    const contrib = (p, w) => (p.grade === null ? null : p.grade * w);
    const parts = [contrib(c.online, WEIGHTS.online), contrib(c.presencial, WEIGHTS.presencial), contrib(c.participacao, WEIGHTS.participacao)];
    const calc = (p, w) => (p.grade === null ? p.note : `${fmt(p.grade)} × ${fmt2(w)} = ${fmt(p.grade * w)}`);
    const pub = (p) => (p.grade === null ? p.note : `Nota publicada: ${fmt(p.grade)} / 10`);

    const o = c.online;
    const onlineMeta = o.grade !== null ? `Corrigida em ${o.corrected} · Nota publicada: ${fmt(o.grade)} / 10` : o.note;
    const allPublished = f !== null;

    compEl.innerHTML = `
      <div class="composition__head">
        <div class="composition__titles">
          <h2 class="est-h2" id="composition-title">Composição da nota · ${code(c)}</h2>
          <p class="est-small">${c.area} · ${allPublished ? "Todas as notas publicadas" : "Há notas pendentes"}</p>
        </div>
        <p class="composition__final">Nota final: ${f === null ? "—" : fmt(f)}</p>
      </div>
      <div class="composition__parts">
        <div class="part part--online">
          <div class="part__origin">
            <p class="est-strong">ONLINE · PESO 40%</p>
            ${o.activity ? `<p class="est-strong">${o.activity}</p>` : ""}
            <p class="est-small">${onlineMeta}</p>
            ${o.href ? `<a class="btn btn--outline-sm" href="${o.href}">VER CORREÇÃO</a>` : ""}
          </div>
          <div class="part__contribution">
            <p class="est-strong">${o.grade === null ? "Aguardando nota" : calc(o, WEIGHTS.online)}</p>
            <p class="est-small">${o.grade === null ? "não entra como zero" : `pontos na nota final de ${code(c)}`}</p>
          </div>
        </div>
        <div class="composition__extra">
          <div class="part part--subtle">
            <p class="est-strong">PRESENCIAL · PESO 40%</p>
            <p class="part__origin-text">Avaliação presencial · ${code(c)}</p>
            <p class="est-small">${pub(c.presencial)}</p>
            <p class="est-strong">${calc(c.presencial, WEIGHTS.presencial)}</p>
          </div>
          <div class="part part--subtle">
            <p class="est-strong">PARTICIPAÇÃO · PESO 20%</p>
            <p class="part__origin-text">Participação nas aulas · ${code(c)}</p>
            <p class="est-small">${pub(c.participacao)}</p>
            <p class="est-strong">${calc(c.participacao, WEIGHTS.participacao)}</p>
          </div>
        </div>
      </div>
      <div class="composition__total">
        <p class="est-strong">${allPublished ? `${parts.map(fmt).join(" + ")} = ${fmt(f)} / 10` : "Nota final ainda não calculada"}</p>
        <p class="est-small">${allPublished ? `${code(c)} está completa. As demais competências seguem o mesmo modelo; notas pendentes não entram como zero.` : `${code(c)} está em processo. A nota final será calculada quando online, presencial e participação tiverem notas publicadas; notas pendentes não entram como zero.`}</p>
      </div>`;
  }

  function select(id, push) {
    renderTable(id);
    renderCards(id);
    renderComposition(id);
    if (push) {
      const params = new URLSearchParams(location.search);
      params.set("competencia", id);
      history.replaceState(null, "", `?${params}`);
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id].comp-select, [data-id].comp-card__title");
    if (btn) {
      select(btn.dataset.id, true);
      return;
    }
    const row = e.target.closest("#report-rows tr[data-id]");
    if (row && !e.target.closest("a")) select(row.dataset.id, true);
  });

  const initial = new URLSearchParams(location.search).get("competencia");
  select(competencies.some((c) => c.id === initial) ? initial : "c1", false);
})();
