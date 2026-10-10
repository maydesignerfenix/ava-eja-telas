(function () {
  "use strict";

  const CX = window.CX;
  const { esc, ASSETS } = CX;
  const state = CX.load();
  const params = CX.params();
  const PAGE_SIZE = 2;
  const $ = (id) => document.getElementById(id);

  let agId = Object.keys(CX.SUBMISSIONS[params.get("agendamento")] || {}).length ? params.get("agendamento") : "a1";
  let ag, subs, ordered, q;
  let onlyPending = params.get("filtro") !== "todas";
  let page = 0;
  let buffers = {};   // sid → { raw, feedback } (unsaved edits of the current question)
  let activeSid = null;

  function setAgendamento(id, qid) {
    agId = id;
    ag = CX.agById(agId);
    subs = CX.SUBMISSIONS[agId];
    ordered = Object.keys(subs).filter((s) => ag.students.includes(s)).sort((a, b) => subs[a].sentAt.localeCompare(subs[b].sentAt));
    const manual = CX.manualQuestions(ag);
    q = manual.find((x) => x.id === qid) || manual[0];
    page = 0;
    buffers = {};
    activeSid = null;
  }

  const answer = (s) => state.ag[agId].answers[s][q.id];
  const fmtSaved = (a) => (a.score == null ? "" : String(a.score).replace(".", ","));
  function isDirty(s) {
    const b = buffers[s];
    if (!b) return false;
    const a = answer(s);
    const p = CX.parseScore(b.raw, q.max);
    return b.feedback !== a.feedback || !!p.error || p.value !== a.score;
  }
  const dirtyList = () => Object.keys(buffers).filter(isDirty);
  const visible = () => ordered.filter((s) => !onlyPending || answer(s).status !== "corrigida" || isDirty(s));

  /* -------------------------------------------------------------- render */
  function renderContext() {
    $("corr-selects").innerHTML = CX.contextSelectsHtml(agId);
    $("corr-meta").textContent = CX.contextMeta(state, agId);
    $("mode-estudante").href = `correcao-estudante.html?agendamento=${agId}`;
    $("qsel-select").innerHTML = CX.selectHtml({
      id: "sel-questao", label: "Questão",
      options: CX.manualQuestions(ag).map((x) => ({ value: x.id, label: `Q${x.n} · ${x.title} · ${x.max} pontos` })),
      value: q.id,
    });
    const url = new URL(location.href);
    url.searchParams.set("agendamento", agId);
    url.searchParams.set("questao", q.id);
    history.replaceState(null, "", url);
  }

  function renderProgress() {
    const corrected = ordered.filter((s) => answer(s).status === "corrigida").length;
    const pending = ordered.length - corrected;
    $("q-progress-label").textContent = `${corrected} de ${ordered.length} respostas corrigidas · ${pending} ${pending === 1 ? "pendente" : "pendentes"}`;
    $("q-progress").setAttribute("aria-valuemin", "0");
    $("q-progress").setAttribute("aria-valuemax", ordered.length);
    $("q-progress").setAttribute("aria-valuenow", corrected);
    $("q-progress-fill").style.width = (ordered.length ? Math.round((corrected / ordered.length) * 100) : 0) + "%";
  }

  function renderReference() {
    $("q-ref").innerHTML = `
      <h2 class="cx-panel__title">Questão ${q.n}</h2>
      <span class="q-icon q-icon--lg"><img src="${ASSETS}${q.icon}" width="20" height="20" alt="" /></span>
      <p class="cx-caption">Manual · Máximo ${q.max} pontos</p>
      <p class="q-label">Enunciado</p>
      ${q.context ? `<p class="q-text">${esc(q.context)}</p>` : ""}
      <p class="q-text">${esc(q.statement)}</p>
      <button class="ref-toggle" type="button" aria-expanded="true" aria-controls="ref-criteria"><span class="q-toggle__icon" aria-hidden="true">⌄</span> Critérios de avaliação</button>
      <ul class="ref-list" id="ref-criteria">${q.criteria.map((c) => `<li>• ${esc(c)}</li>`).join("")}</ul>
      <button class="ref-toggle" type="button" aria-expanded="true" aria-controls="ref-expected"><span class="q-toggle__icon" aria-hidden="true">⌄</span> Resposta esperada</button>
      <p class="ref-expected" id="ref-expected">${esc(q.expected)}</p>`;
  }

  function chipFor(s) {
    if (isDirty(s)) return `<span class="cx-chip cx-chip--warn">Nota preenchida · não salva</span>`;
    const a = answer(s);
    if (a.status === "corrigida") return `<span class="cx-chip cx-chip--done">Corrigida</span>`;
    if (a.status === "rascunho") return `<span class="cx-chip">Rascunho salvo</span>`;
    return `<span class="cx-chip cx-chip--warn">Pendente de nota</span>`;
  }

  function responseHtml(s) {
    const st = CX.studentById(s);
    const a = answer(s);
    const b = buffers[s] || { raw: fmtSaved(a), feedback: a.feedback };
    const p = CX.parseScore(b.raw, q.max);
    const active = s === activeSid;
    return `
      <article class="cx-panel" data-sid="${s}" aria-labelledby="name-${s}">
        <div class="resp-head">
          <div class="resp-head__text">
            <h3 class="resp-head__name" id="name-${s}">${esc(st.name)}</h3>
            <p class="cx-caption">Tentativa ${ag.attempt} · Enviada em ${CX.formatSent(subs[s].sentAt)}</p>
          </div>
          <span data-chip>${chipFor(s)}</span>
        </div>
        <div class="q-answer">${esc(subs[s][q.id])}</div>
        <div class="resp-controls">
          <div class="cx-field resp-controls__score">
            <label class="cx-field__label" for="score-${s}">Nota · 0 a ${q.max} pontos</label>
            <div class="cx-score${p.error ? " is-invalid" : ""}">
              <input id="score-${s}" data-sid="${s}" data-kind="score" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(b.raw)}" aria-describedby="hint-${s}"${p.error ? ' aria-invalid="true"' : ""} />
              <span aria-hidden="true">/ ${q.max}</span>
            </div>
            <p class="${p.error ? "cx-field__error" : "cx-field__hint"}" id="hint-${s}">${p.error ? esc(p.error) : `Máximo: ${q.max} pontos`}</p>
          </div>
          <div class="cx-field resp-controls__feedback">
            <label class="cx-field__label" for="fb-${s}">Feedback para o estudante</label>
            <textarea class="cx-textarea" id="fb-${s}" data-sid="${s}" data-kind="feedback" rows="2" placeholder="Adicionar feedback para o estudante">${esc(b.feedback)}</textarea>
          </div>
        </div>
        <p class="cx-caption">Feedback visível somente após publicar a correção.</p>
        <div class="corr-actions" ${active ? "" : "hidden"}>
          <button class="btn btn--outline-sm" type="button" data-action="draft" data-sid="${s}">Salvar rascunho</button>
          <button class="btn btn--primary-sm" type="button" data-action="next" data-sid="${s}">Salvar e próxima resposta</button>
        </div>
      </article>`;
  }

  function renderResponses() {
    const list = visible();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    if (!slice.includes(activeSid)) activeSid = slice.find(isDirty) || slice[0] || null;

    $("compare-title").textContent = `Comparar respostas · Q${q.n}`;
    $("compare-meta").textContent = list.length
      ? `Ordem de envio · Respostas ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + slice.length} de ${list.length} ${onlyPending ? (list.length === 1 ? "pendente" : "pendentes") : "recebidas"}`
      : "Ordem de envio · Nenhuma resposta pendente";
    $("responses").innerHTML = slice.length
      ? slice.map(responseHtml).join("")
      : `<p class="resp-empty">Todas as respostas da Q${q.n} estão corrigidas e salvas.</p>`;

    const hidden = onlyPending ? ordered.filter((s) => !list.includes(s)) : [];
    $("hidden-note").textContent = hidden.length
      ? hidden.map((s) => `${CX.studentById(s).first}: ${CX.fmtNum(answer(s).score)}/${q.max} · Corrigida.`).join(" ") +
        (hidden.length === 1 ? " Oculta pelo filtro de pendentes." : " Ocultas pelo filtro de pendentes.")
      : "";
    $("hidden-note").hidden = !hidden.length;

    $("prev-page").hidden = page === 0;
    $("next-page").hidden = page >= pages - 1;
    const manual = CX.manualQuestions(ag);
    const idx = manual.indexOf(q);
    const other = manual[idx + 1] || manual[idx - 1];
    const btn = $("other-question");
    btn.hidden = !other;
    if (other) {
      btn.dataset.q = other.id;
      btn.textContent = manual[idx + 1] ? `Próxima questão: Q${other.n} ›` : `‹ Questão anterior: Q${other.n}`;
    }
    renderDirtyNote();
  }

  function renderDirtyNote() {
    const n = dirtyList().length;
    const el = $("dirty-note");
    el.classList.toggle("cx-orientation--warn", n > 0);
    el.textContent = n
      ? `${n} ${n === 1 ? "resposta" : "respostas"} com alterações não salvas. Salve ou descarte antes de trocar de questão, estudante ou modo.`
      : "Nenhuma alteração pendente nesta questão.";
  }

  function renderPublish() { $("publish").innerHTML = CX.publishPanelHtml(state, agId, "questao"); }

  function renderAll() {
    renderContext();
    renderProgress();
    renderReference();
    renderResponses();
    renderPublish();
  }

  /* ------------------------------------------------------------- actions */
  async function guard() {
    const n = dirtyList().length;
    if (!n) return true;
    const ok = await CX.confirmDiscard(`${n} ${n === 1 ? "resposta tem" : "respostas têm"} alterações não salvas. Deseja descartá-las e continuar?`);
    if (ok) buffers = {};
    return ok;
  }

  function validate(s, requireScore) {
    const b = buffers[s] || { raw: fmtSaved(answer(s)), feedback: answer(s).feedback };
    const p = CX.parseScore(b.raw, q.max);
    if (p.error || (requireScore && p.value == null)) {
      const input = $("score-" + s);
      input.setAttribute("aria-invalid", "true");
      input.parentElement.classList.add("is-invalid");
      const hint = $("hint-" + s);
      hint.className = "cx-field__error";
      hint.textContent = p.error || `Atribua uma nota de 0 a ${q.max}.`;
      input.focus();
      return null;
    }
    return { score: p.value, feedback: b.feedback };
  }

  function save(s, status) {
    const v = validate(s, status === "corrigida");
    if (!v) return false;
    state.ag[agId].answers[s][q.id] = {
      score: v.score, feedback: v.feedback,
      status: status === "corrigida" ? "corrigida" : (v.score != null || v.feedback ? "rascunho" : "pendente"),
    };
    state.ag[agId].published = null;
    delete buffers[s];
    CX.save(state);
    return true;
  }

  document.addEventListener("input", (e) => {
    const el = e.target;
    const s = el.dataset && el.dataset.sid;
    if (!s || !el.dataset.kind) return;
    const a = answer(s);
    buffers[s] = buffers[s] || { raw: fmtSaved(a), feedback: a.feedback };
    if (el.dataset.kind === "score") {
      buffers[s].raw = el.value;
      const p = CX.parseScore(el.value, q.max);
      const hint = $("hint-" + s);
      el.parentElement.classList.toggle("is-invalid", !!p.error);
      if (p.error) { el.setAttribute("aria-invalid", "true"); hint.className = "cx-field__error"; hint.textContent = p.error; }
      else { el.removeAttribute("aria-invalid"); hint.className = "cx-field__hint"; hint.textContent = `Máximo: ${q.max} pontos`; }
    } else buffers[s].feedback = el.value;
    document.querySelector(`[data-sid="${s}"] [data-chip]`).innerHTML = chipFor(s);
    renderDirtyNote();
  });

  // The panel being edited shows the save actions (Figma shows them on one panel at a time).
  document.addEventListener("focusin", (e) => {
    const panel = e.target.closest && e.target.closest("article[data-sid]");
    if (!panel || panel.dataset.sid === activeSid) return;
    activeSid = panel.dataset.sid;
    document.querySelectorAll("article[data-sid] .corr-actions").forEach((el) => {
      el.hidden = el.closest("article").dataset.sid !== activeSid;
    });
  });

  document.addEventListener("click", async (e) => {
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      const s = actionBtn.dataset.sid;
      const name = CX.studentById(s).first;
      if (actionBtn.dataset.action === "draft") {
        if (save(s, "rascunho")) { CX.toast(`Rascunho de ${name} salvo.`); renderAll(); }
      } else if (save(s, "corrigida")) {
        const list = visible();
        const after = ordered.slice(ordered.indexOf(s) + 1).find((x) => list.includes(x));
        activeSid = after || null;
        if (after) page = Math.floor(list.indexOf(after) / PAGE_SIZE);
        CX.toast(`Nota de ${name} salva.`);
        renderAll();
        const next = activeSid && $("score-" + activeSid);
        if (next) next.focus();
      }
      return;
    }
    if (e.target.closest("#next-page")) { if (await guard()) { page++; activeSid = null; renderResponses(); } return; }
    if (e.target.closest("#prev-page")) { if (await guard()) { page--; activeSid = null; renderResponses(); } return; }
    const oq = e.target.closest("#other-question");
    if (oq) { if (await guard()) { setAgendamento(agId, oq.dataset.q); renderAll(); } return; }
    const tog = e.target.closest(".ref-toggle");
    if (tog) {
      const open = tog.getAttribute("aria-expanded") !== "true";
      tog.setAttribute("aria-expanded", open);
      $(tog.getAttribute("aria-controls")).hidden = !open;
      return;
    }
    if (e.target.closest(".cx-publish")) {
      CX.publish(state, agId);
      CX.save(state);
      CX.toast("Correções publicadas. Notas e feedback liberados aos estudantes.");
      renderAll();
      return;
    }
    const link = e.target.closest("a[data-guard]");
    if (link && dirtyList().length) {
      e.preventDefault();
      if (await guard()) location.href = link.href;
    }
  });

  document.addEventListener("change", async (e) => {
    const el = e.target;
    if (el.id === "only-pending") {
      if (await guard()) { onlyPending = el.checked; page = 0; activeSid = null; renderResponses(); }
      else el.checked = onlyPending;
    } else if (el.id === "sel-questao") {
      if (await guard()) { setAgendamento(agId, el.value); renderAll(); } else el.value = q.id;
    } else if (el.id === "sel-atividade" || el.id === "sel-agendamento") {
      const target = el.id === "sel-atividade" ? CX.firstAgendamentoOf(el.value) : el.value;
      if (target && (await guard())) { setAgendamento(target); renderAll(); } else renderContext();
    }
  });


  /* ---------------------------------------------------------------- init */
  setAgendamento(agId, params.get("questao") || "q2");
  $("only-pending").checked = onlyPending;
  // Figma 4.3: Bruno's Q2 grade typed but not saved (?state=salvo opens without it).
  if (agId === "a1" && q.id === "q2" && params.get("state") !== "salvo" && answer("bruno").status === "pendente") {
    buffers.bruno = { raw: "30", feedback: "Você explicou a função da data e do horário e relacionou essas informações ao planejamento da visita." };
  }
  renderAll();
})();
