(function () {
  "use strict";

  const CX = window.CX;
  const { esc, ASSETS } = CX;
  let state = CX.load();
  const params = CX.params();

  let agId = CX.agById(params.get("agendamento")) && Object.keys(CX.SUBMISSIONS[params.get("agendamento")] || {}).length
    ? params.get("agendamento") : "a1";
  let ag, act, subs, delivered, sid;
  let buffer = {};          // { qid: { raw, feedback } } — unsaved edits for the current student
  let queueExpanded = false;

  const $ = (id) => document.getElementById(id);

  function setAgendamento(id) {
    agId = id;
    ag = CX.agById(agId);
    act = CX.ACTIVITIES[ag.activity];
    subs = CX.SUBMISSIONS[agId];
    delivered = ag.students.filter((s) => subs[s]).sort((a, b) =>
      CX.studentById(a).name.localeCompare(CX.studentById(b).name, "pt-BR"));
  }

  /* ------------------------------------------------------------- helpers */
  const answersOf = (s) => state.ag[agId].answers[s];
  const manual = () => CX.manualQuestions(ag);

  function savedBuffer(s) {
    const b = {};
    manual().forEach((q) => {
      const a = answersOf(s)[q.id];
      b[q.id] = { raw: a.score == null ? "" : String(a.score).replace(".", ","), feedback: a.feedback };
    });
    return b;
  }
  function isDirty() {
    const saved = savedBuffer(sid);
    return manual().some((q) => {
      const cur = buffer[q.id];
      const sc = CX.parseScore(cur.raw, q.max);
      const savedScore = answersOf(sid)[q.id].score;
      return cur.feedback !== saved[q.id].feedback || sc.error || sc.value !== savedScore;
    });
  }
  function studentStatus(s) {
    if (s === sid && isDirty()) return "Em revisão · alterações";
    const a = manual().map((q) => answersOf(s)[q.id]);
    const pend = a.filter((x) => x.status !== "corrigida").length;
    if (!pend) return "Corrigida · salva";
    if (a.some((x) => x.status === "rascunho")) return `Rascunho salvo · ${pend} ${pend === 1 ? "pendente" : "pendentes"}`;
    return `${pend} ${pend === 1 ? "resposta pendente" : "respostas pendentes"}`;
  }
  const isCorrected = (s) => manual().every((q) => answersOf(s)[q.id].status === "corrigida");
  function nextPendingAfter(s) {
    const i = delivered.indexOf(s);
    for (let k = 1; k <= delivered.length; k++) {
      const c = delivered[(i + k) % delivered.length];
      if (c !== s && !isCorrected(c)) return c;
    }
    return null;
  }

  /* -------------------------------------------------------------- render */
  function renderContext() {
    $("corr-selects").innerHTML = CX.contextSelectsHtml(agId);
    $("corr-meta").textContent = CX.contextMeta(state, agId);
    $("mode-estudante").href = `correcao-estudante.html?agendamento=${agId}&estudante=${sid}`;
    $("mode-questao").href = `correcao-questao.html?agendamento=${agId}`;
  }

  function renderQueue() {
    const st = CX.stats(state, agId);
    const missing = ag.students.filter((s) => !subs[s]).map((s) => CX.studentById(s).first);
    const pending = delivered.filter((s) => !isCorrected(s));
    const done = delivered.filter(isCorrected);
    let shown = delivered;
    if (!queueExpanded) {
      shown = pending.slice(0, 3).concat(done.slice(0, 1));
      if (!shown.includes(sid)) shown = [sid].concat(shown.slice(0, 3));
      shown = delivered.filter((s) => shown.includes(s));
    }
    const pct = delivered.length ? Math.round((st.correctedStudents / delivered.length) * 100) : 0;
    const joinNames = (n) => (n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0]);

    $("queue").innerHTML = `
      <h2 class="cx-panel__title">Estudantes</h2>
      ${CX.selectHtml({
        id: "sel-estudante", label: "Selecionar estudante",
        options: delivered.map((s) => ({ value: s, label: CX.studentById(s).name })), value: sid,
      })}
      <p class="cx-caption">${delivered.length} entregas · ${missing.length} sem entrega</p>
      <div class="cx-progress">
        <p class="cx-progress__label">${st.correctedStudents} de ${delivered.length} estudantes corrigidos</p>
        <div class="cx-track" role="progressbar" aria-label="Estudantes corrigidos" aria-valuemin="0" aria-valuemax="${delivered.length}" aria-valuenow="${st.correctedStudents}"><div class="cx-track__fill" style="width:${pct}%"></div></div>
      </div>
      <div class="queue-list" id="queue-list">
        ${shown.map((s) => `
          <button class="queue-item" type="button" data-student="${s}" ${s === sid ? 'aria-current="true"' : ""}>
            <span class="queue-item__name">${esc(CX.studentById(s).name)}</span>
            <span class="queue-item__status">${esc(studentStatus(s))}</span>
          </button>`).join("")}
      </div>
      <button class="queue-toggle" type="button" id="queue-toggle" aria-expanded="${queueExpanded}" aria-controls="queue-list">${queueExpanded ? "Recolher fila" : `Ver fila · ${pending.length} ${pending.length === 1 ? "pendente" : "pendentes"} e ${done.length} ${done.length === 1 ? "corrigido" : "corrigidos"}`}</button>
      <p class="cx-caption">${missing.length ? `Sem entrega: ${esc(joinNames(missing))}. Sem nota atribuída.` : "Todos os estudantes entregaram."}</p>`;
  }

  function refHtml(q, idx) {
    return `
      <div class="q-ref">
        <button class="q-toggle" type="button" aria-expanded="true" aria-controls="ref-${idx}"><span class="q-toggle__icon" aria-hidden="true">⌄</span> ${esc(q.refTitle)}</button>
        <p class="q-ref__text" id="ref-${idx}">${esc(q.ref)}</p>
      </div>`;
  }

  function renderQuestions() {
    const sub = subs[sid];
    const first = CX.studentById(sid).first.toUpperCase();
    $("questions").innerHTML = CX.questionsOf(ag).map((q, i) => {
      const head = `
        <div class="q-head">
          <span class="q-icon"><img src="${ASSETS}${q.icon}" width="20" height="20" alt="" /></span>
          <div class="q-head__text">
            <h3 class="q-head__title">Questão ${q.n} · ${esc(q.title)}</h3>
            <p class="cx-caption">${q.type === "auto" ? `Correção automática · Somente leitura · Máximo ${q.max} pontos` : `Correção manual · Máximo ${q.max} pontos`}</p>
          </div>
        </div>
        <p class="q-label">Enunciado</p>
        <p class="q-text">${esc(q.statement)}</p>
        ${refHtml(q, i)}
        <p class="q-label q-label--sm">RESPOSTA DE ${esc(first)}</p>`;
      if (q.type === "auto") {
        const opt = sub[q.id];
        const score = CX.autoScore(q, opt);
        const ok = score === q.max;
        return `
          <section class="cx-panel" aria-label="Questão ${q.n}">
            ${head}
            <div class="q-answer">${esc(opt)} · ${esc(q.options[opt])}</div>
            <p class="cx-orientation${ok ? "" : " q-result--wrong"}">${ok ? "✓" : "✗"} ${score}/${q.max} pontos atribuídos automaticamente · ${esc(ok ? q.okFeedback : q.wrongFeedback)}</p>
          </section>`;
      }
      const b = buffer[q.id];
      const parsed = CX.parseScore(b.raw, q.max);
      return `
        <section class="cx-panel" aria-label="Questão ${q.n}">
          ${head}
          <div class="q-answer">${esc(sub[q.id])}</div>
          <div class="q-grade">
            <div class="cx-field">
              <label class="cx-field__label" for="score-${q.id}">Nota · 0 a ${q.max} pontos</label>
              <div class="cx-score${parsed.error ? " is-invalid" : ""}">
                <input id="score-${q.id}" data-q="${q.id}" data-kind="score" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(b.raw)}" aria-describedby="hint-${q.id}"${parsed.error ? ' aria-invalid="true"' : ""} />
                <span aria-hidden="true">/ ${q.max}</span>
              </div>
              <p class="${parsed.error ? "cx-field__error" : "cx-field__hint"}" id="hint-${q.id}">${parsed.error ? esc(parsed.error) : `Limite: ${q.max} pontos. Não é a nota agregada de ${ag.comp}.`}</p>
            </div>
            <div class="cx-field">
              <label class="cx-field__label" for="fb-${q.id}">Feedback para o estudante</label>
              <textarea class="cx-textarea" id="fb-${q.id}" data-q="${q.id}" data-kind="feedback" rows="2" placeholder="Adicionar feedback para o estudante">${esc(b.feedback)}</textarea>
            </div>
            <p class="cx-caption">Visível para o estudante somente após publicar a correção.</p>
          </div>
        </section>`;
    }).join("");
  }

  function overrideFromBuffer() {
    const o = {};
    manual().forEach((q) => {
      const p = CX.parseScore(buffer[q.id].raw, q.max);
      o[q.id] = p.error ? null : p.value;
    });
    return o;
  }

  function renderHeadAndSummary() {
    const s = CX.studentById(sid);
    const sub = subs[sid];
    const dirty = isDirty();
    $("student-name").textContent = s.name;
    $("student-meta").textContent = `Tentativa ${ag.attempt} · Enviada em ${CX.formatSent(sub.sentAt)} · ${CX.questionsOf(ag).length} respostas`;
    const chip = $("student-chip");
    const answers = manual().map((q) => answersOf(sid)[q.id]);
    if (dirty) { chip.className = "cx-chip cx-chip--warn"; chip.textContent = "Alterações não salvas"; }
    else if (answers.every((a) => a.status === "corrigida")) { chip.className = "cx-chip cx-chip--done"; chip.textContent = "Correção salva"; }
    else if (answers.some((a) => a.status === "rascunho")) { chip.className = "cx-chip"; chip.textContent = "Rascunho salvo"; }
    else { chip.className = "cx-chip cx-chip--warn"; chip.textContent = "Pendente de nota"; }

    const t = CX.attemptTotal(state, agId, sid, overrideFromBuffer());
    const parts = t.parts.map((p) => `Q${p.q.n}: ${CX.fmtNum(p.score)}/${p.q.max} ${p.auto ? "automática" : "manual"}`).join(" + ");
    const online = Math.round((t.sum / t.max) * 40);
    const preview = t.complete
      ? `Prévia: ${CX.fmtNum(t.sum)}/${t.max} → ${online}/40 no componente online de ${ag.comp}. Presencial e participação não são alterados por esta correção.`
      : `Prévia indisponível: atribua todas as notas manuais para calcular o componente online de ${ag.comp}.`;

    let pubLine = "a nota publicada não muda";
    const comp = ag.area === "Linguagens" && state.boletim[sid] && state.boletim[sid][ag.comp.toLowerCase()];
    if (comp && CX.compValue(comp) != null && !comp.cc) {
      pubLine = `${CX.compValue(comp)} (${comp.online} + ${comp.presencial} + ${comp.participacao})`;
    }
    const note = dirty
      ? `<p class="cx-orientation cx-orientation--warn">Alterações não salvas. ${comp && CX.compValue(comp) != null && !comp.cc ? `A nota publicada de ${ag.comp} permanece ${pubLine}` : "A nota publicada não muda"} até uma nova publicação.</p>`
      : `<p class="cx-orientation">Nenhuma alteração pendente. A nota publicada só muda após publicar as correções do agendamento.</p>`;

    $("summary").innerHTML = `
      <h2 class="cx-panel__title" id="summary-title">Resumo desta tentativa</h2>
      <p class="summary__total">${t.complete ? CX.fmtNum(t.sum) : "—"} / ${t.max} pontos</p>
      <p class="q-text">${esc(parts)}</p>
      <p class="cx-note">${esc(preview)}</p>
      ${note}`;

    const next = nextPendingAfter(sid);
    $("next-note").textContent = next
      ? `Salvar e próximo guarda a nota e o feedback antes de abrir ${CX.studentById(next).first}. Rascunhos não são visíveis ao estudante.`
      : "Salvar e próximo guarda a nota e o feedback. Não há outro estudante pendente. Rascunhos não são visíveis ao estudante.";
    $("save-next").textContent = next ? "Salvar e próximo" : "Salvar correção";
  }

  function renderPublish() {
    $("publish").innerHTML = CX.publishPanelHtml(state, agId, "estudante");
  }

  function renderAll() {
    renderContext();
    renderQueue();
    renderQuestions();
    renderHeadAndSummary();
    renderPublish();
  }

  /* ------------------------------------------------------------- actions */
  function loadStudent(s, seedDraft) {
    sid = s;
    buffer = savedBuffer(s);
    if (seedDraft) Object.assign(buffer, seedDraft);
    const url = new URL(location.href);
    url.searchParams.set("agendamento", agId);
    url.searchParams.set("estudante", sid);
    history.replaceState(null, "", url);
    renderAll();
  }

  async function guard() {
    if (!isDirty()) return true;
    return CX.confirmDiscard(`${CX.studentById(sid).name} tem alterações não salvas. Deseja descartá-las e continuar?`);
  }

  function validate(requireAll) {
    let firstBad = null;
    manual().forEach((q) => {
      const p = CX.parseScore(buffer[q.id].raw, q.max);
      if (p.error || (requireAll && p.value == null)) {
        const input = $("score-" + q.id);
        const hint = $("hint-" + q.id);
        input.setAttribute("aria-invalid", "true");
        input.parentElement.classList.add("is-invalid");
        hint.className = "cx-field__error";
        hint.textContent = p.error || `Atribua uma nota de 0 a ${q.max} para concluir a correção.`;
        firstBad = firstBad || input;
      }
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function commit(status) {
    const answers = answersOf(sid);
    manual().forEach((q) => {
      const p = CX.parseScore(buffer[q.id].raw, q.max);
      answers[q.id] = {
        score: p.value,
        feedback: buffer[q.id].feedback,
        status: status === "corrigida" ? "corrigida" : (p.value != null || buffer[q.id].feedback ? "rascunho" : "pendente"),
      };
    });
    state.ag[agId].published = null; // a new change requires a new publication
    CX.save(state);
  }

  $("save-draft").addEventListener("click", () => {
    if (!validate(false)) return;
    commit("rascunho");
    CX.toast(`Rascunho de ${CX.studentById(sid).first} salvo.`);
    loadStudent(sid);
  });

  $("save-next").addEventListener("click", () => {
    if (!validate(true)) return;
    commit("corrigida");
    const name = CX.studentById(sid).first;
    const next = nextPendingAfter(sid);
    CX.toast(next ? `Correção de ${name} salva. Abrindo ${CX.studentById(next).first}.` : `Correção de ${name} salva.`);
    loadStudent(next || sid);
    $("attempt").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.q) return;
    const q = manual().find((x) => x.id === el.dataset.q);
    if (el.dataset.kind === "score") {
      buffer[q.id].raw = el.value;
      const p = CX.parseScore(el.value, q.max);
      const hint = $("hint-" + q.id);
      el.parentElement.classList.toggle("is-invalid", !!p.error);
      if (p.error) { el.setAttribute("aria-invalid", "true"); hint.className = "cx-field__error"; hint.textContent = p.error; }
      else { el.removeAttribute("aria-invalid"); hint.className = "cx-field__hint"; hint.textContent = `Limite: ${q.max} pontos. Não é a nota agregada de ${ag.comp}.`; }
    } else buffer[q.id].feedback = el.value;
    renderHeadAndSummary();
    renderQueue();
  });

  document.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-student]");
    if (item) {
      if (item.dataset.student !== sid && (await guard())) loadStudent(item.dataset.student);
      return;
    }
    if (e.target.closest("#queue-toggle")) { queueExpanded = !queueExpanded; renderQueue(); return; }
    const tog = e.target.closest(".q-toggle");
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
    if (link && isDirty()) {
      e.preventDefault();
      if (await guard()) location.href = link.href;
    }
  });

  document.addEventListener("change", async (e) => {
    const el = e.target;
    if (el.id === "sel-estudante") {
      if (await guard()) loadStudent(el.value); else el.value = sid;
    } else if (el.id === "sel-atividade" || el.id === "sel-agendamento") {
      const target = el.id === "sel-atividade" ? CX.firstAgendamentoOf(el.value) : el.value;
      if (target && (await guard())) { setAgendamento(target); loadStudent(delivered[0]); }
      else renderContext();
    }
  });


  /* ---------------------------------------------------------------- init */
  setAgendamento(agId);
  const wanted = params.get("estudante");
  const start = delivered.includes(wanted) ? wanted : delivered[0];
  // Figma 4.2 shows Ana with notes typed but not saved; reproduce it (?state=salvo opens without the draft).
  const anaPending = agId === "a1" && start === "ana" && manual().every((q) => answersOf("ana")[q.id].status === "pendente");
  const seed = anaPending && params.get("state") !== "salvo" ? {
    q2: { raw: "20", feedback: "Você relacionou a data ao planejamento do leitor. Para completar, explique também por que o horário de retorno é necessário." },
    q3: { raw: "10", feedback: "A data de fechamento está correta. Para obter os pontos do retorno completo, inclua também o horário de atendimento." },
  } : null;
  loadStudent(start, seed);
})();
