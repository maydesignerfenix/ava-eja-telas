(function () {
  "use strict";

  const CX = window.CX;
  const { esc, COMPS } = CX;
  const state = CX.load();
  const params = CX.params();
  const ORDER = ["ana", "bruno", "carla", "gabriela", "daniel", "eduardo", "fernanda", "helena", "isabela", "joao"];
  const FEMALE = ["ana", "carla", "fernanda", "gabriela", "helena", "isabela"];
  const SITUATION = { "INCOMPLETO": "Incompleto", "EM PROCESSO": "Em processo", "CONCLUÍDO": "Concluído" };
  const CHIP = { "INCOMPLETO": "", "EM PROCESSO": "cx-chip--warn", "CONCLUÍDO": "cx-chip--done" };
  const $ = (id) => document.getElementById(id);

  const sid = ORDER.includes(params.get("estudante")) ? params.get("estudante") : "ana";
  let key = COMPS.includes(params.get("competencia")) ? params.get("competencia") : "c1";
  const student = CX.studentById(sid);
  const the = FEMALE.includes(sid) ? "A estudante" : "O estudante";
  let buffer;

  const comp = (k) => state.boletim[sid][k || key];
  const K = (k) => (k || key).toUpperCase();
  const raw = (v) => (v == null ? "" : String(v).replace(".", ","));
  const joinList = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0] || "");

  function resetBuffer() {
    const c = comp();
    buffer = { presencial: raw(c.presencial), participacao: raw(c.participacao), compl: raw(c.compl) };
  }
  function parsed() {
    return {
      presencial: CX.parseScore(buffer.presencial, 40),
      participacao: CX.parseScore(buffer.participacao, 20),
      compl: CX.parseScore(buffer.compl, 20),
    };
  }
  function isDirty() {
    const c = comp();
    if (c.cc) return false;
    const p = parsed();
    return p.presencial.error || p.participacao.error || p.compl.error ||
      p.presencial.value !== c.presencial || p.participacao.value !== c.participacao || (complEligible() && p.compl.value !== c.compl);
  }
  function complEligible() {
    const v = CX.compValue(comp());
    return typeof v === "number" && v < 60;
  }
  const statusLabel = (c) => (c.cc ? "CC · RDS" : c.status === "publicada" ? "Publicada" : c.status === "salva" ? "Salva · não publicada" : "Pendente");

  /* ---------------------------------------------------------------- render */
  function renderStudent() {
    const s = CX.studentSummary(state, sid);
    const pend = COMPS.filter((k, i) => s.values[i] === null).map((k) => k.toUpperCase());
    const withGrade = 6 - s.missing;
    $("path-name").textContent = student.name;
    $("student").innerHTML = `
      <div class="be-student">
        <div class="be-student__id">
          <p class="be-student__name">${esc(student.name)}</p>
          <p class="be-student__meta">Anos Finais - AF · EJA · SESI Ipiranga</p>
        </div>
        <span class="cx-chip ${CHIP[s.situation]}">${s.situation}</span>
      </div>
      <p class="q-text">Somatória final: ${s.sum == null ? "—" : s.sum}${pend.length ? ` · ${joinList(pend)} ${pend.length === 1 ? "pendente" : "pendentes"}` : ""}</p>
      <p class="cx-caption">${withGrade} de 6 competências com nota. Nenhuma pendência é convertida em zero.</p>`;
  }

  function renderComps() {
    $("comps").innerHTML = COMPS.map((k) => {
      const c = comp(k);
      const v = CX.compValue(c);
      return `
        <button class="be-comp" type="button" data-comp="${k}" aria-pressed="${k === key}">
          <span class="be-comp__top"><span class="be-comp__key">${K(k)}</span><span class="be-comp__value">${v == null ? "—" : v}</span></span>
          <span class="be-comp__status">${statusLabel(c)}</span>
        </button>`;
    }).join("");
    $("comp-select").innerHTML = CX.selectHtml({
      id: "sel-comp", label: "Competência para consultar ou registrar",
      options: COMPS.map((k) => {
        const v = CX.compValue(comp(k));
        return { value: k, label: `${K(k)} · Linguagens · ${v === "CC" ? "CC" : v == null ? "Pendente" : "Nota " + v}` };
      }),
      value: key,
    });
  }

  function scoreField(kind, label, max, savedValue) {
    const p = parsed()[kind];
    const hint = p.error ? p.error : savedValue == null ? `Sem valor salvo · Máximo permitido: ${max}` : `Valor salvo: ${raw(savedValue)} · Máximo permitido: ${max}`;
    return `
      <div class="cx-field">
        <label class="cx-field__label" for="f-${kind}">${label}</label>
        <div class="cx-score${p.error ? " is-invalid" : ""}">
          <input id="f-${kind}" data-kind="${kind}" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(buffer[kind])}" aria-describedby="h-${kind}"${p.error ? ' aria-invalid="true"' : ""} />
          <span aria-hidden="true">/ ${max}</span>
        </div>
        <p class="${p.error ? "cx-field__error" : "cx-field__hint"}" id="h-${kind}">${esc(hint)}</p>
      </div>`;
  }

  function sumLine() {
    const c = comp();
    const p = parsed();
    const pres = p.presencial.error ? null : p.presencial.value;
    const part = p.participacao.error ? null : p.participacao.value;
    const parts = [c.online, pres, part].map((v) => (v == null ? "—" : raw(v)));
    const complete = c.online != null && pres != null && part != null;
    return `${parts.join(" + ")} = ${complete ? raw(Math.round((c.online + pres + part) * 10) / 10) + " pontos" : "pendente"}`;
  }

  function renderComposition() {
    const c = comp();
    if (c.cc) {
      $("composition").innerHTML = `
        <h3 class="cx-panel__title" id="composition-title">${K()} · Competência certificada (CC)</h3>
        <p class="cx-note">Certificada via RDS${c.ccDate ? " em " + c.ccDate : ""}. Sem campos de edição: não substitua CC por nota manual.</p>
        <div class="cx-readonly">CC · Somente leitura</div>`;
      return;
    }
    const v = CX.compValue(c);
    const pct = c.online == null ? null : Math.round((c.online / 40) * 100);
    $("composition").innerHTML = `
      <h3 class="cx-panel__title" id="composition-title">Composição de ${K()} · ${v == null ? "pendente" : v + "/100"}</h3>
      <p class="cx-note">Pontos já ponderados. Some os componentes; não aplique 40% novamente.</p>
      <div class="cx-field">
        <p class="cx-field__label" id="l-online">Online · até 40 pontos</p>
        <div class="cx-readonly" aria-labelledby="l-online">${c.online == null ? "—" : c.online} / 40</div>
        <p class="cx-field__hint">${c.online == null ? "Automático · aguardando atividades publicadas" : `Automático · Atividade ${pct}/100 convertida em ${c.online}/40`}</p>
      </div>
      ${scoreField("presencial", "Presencial · 0 a 40 pontos", 40, c.presencial)}
      ${scoreField("participacao", "Participação · 0 a 20 pontos", 20, c.participacao)}
      <p class="be-sum" id="sum-line" aria-live="polite">${esc(sumLine())}</p>
      <p class="cx-orientation">Online é somente leitura. Para revisar sua origem, acesse a correção da atividade; o lançamento manual não a sobrescreve.</p>
      <a class="btn btn--outline-sm" href="${key === "c1" ? `correcao-estudante.html?agendamento=a1&estudante=${sid}` : "correcao-atividades.html"}" data-guard>Ver atividade e correção</a>`;
  }

  function renderComplement() {
    const c = comp();
    const v = CX.compValue(c);
    let body;
    if (complEligible()) {
      body = `<p class="be-origin__text">Até 20 pontos quando elegível, conforme o boletim. ${K()} de ${esc(student.first)} está com ${v} pontos: complementação disponível.</p>
        ${scoreField("compl", "Complementação · 0 a 20 pontos", 20, c.compl)}`;
    } else {
      const why = c.cc ? `${K()} é CC: complementação não se aplica.`
        : v == null ? `${K()} de ${esc(student.first)} ainda não tem nota completa: complementação indisponível.`
        : `${K()} de ${esc(student.first)} está com ${v} pontos: complementação não disponível nesta competência.`;
      body = `<p class="be-origin__text">Até 20 pontos quando elegível, conforme o boletim. ${why}</p>
        <div class="cx-field"><p class="cx-field__label" id="l-compl">Complementação</p><div class="cx-readonly" aria-labelledby="l-compl">Não se aplica a ${K()}</div></div>`;
    }
    $("complement").innerHTML = `<h3 class="cx-panel__title" id="complement-title">Em processo · Complementação</h3>${body}`;
  }

  function renderSide() {
    const c = comp();
    if (c.cc) {
      $("origin").innerHTML = `<h3 class="cx-panel__title" id="origin-title">Origem dos pontos</h3>
        <p class="be-origin__label">${K()} · CC</p><p class="be-origin__muted">Certificação via RDS${c.ccDate ? " · " + c.ccDate : ""}.</p>`;
    } else {
      const pct = c.online == null ? null : Math.round((c.online / 40) * 100);
      const actLine = key === "c1"
        ? "Leitura e interpretação de textos do cotidiano · Agendamento 01 · Tentativa 1."
        : `Atividades online de ${K()} · Linguagens.`;
      let calc = pct == null ? "Nenhuma atividade publicada nesta competência." : `Conversão: ${pct} ÷ 100 × 40 = ${c.online}.`;
      if (key === "c1" && CX.SUBMISSIONS.a1[sid] && pct != null) {
        const t = CX.attemptTotal(state, "a1", sid);
        if (t.complete && Math.round((t.sum / t.max) * 40) === c.online) {
          calc = `Atividade: ${t.parts.map((p) => `Q${p.q.n} ${raw(p.score)}`).join(" + ")} = ${raw(t.sum)}/100. ${calc}`;
        }
      }
      $("origin").innerHTML = `
        <h3 class="cx-panel__title" id="origin-title">Origem dos pontos</h3>
        <p class="be-origin__label">Online · ${c.online == null ? "—" : c.online}/40</p>
        <p class="be-origin__text">${esc(actLine)}</p>
        <p class="be-origin__muted">${esc(calc)}</p>
        <p class="be-origin__label">Presencial · ${c.presencial == null ? "—" : raw(c.presencial)}/40</p>
        <p class="be-origin__muted">Registro do professor · Avaliação presencial ${K()}.</p>
        <p class="be-origin__label">Participação · ${c.participacao == null ? "—" : raw(c.participacao)}/20</p>
        <p class="be-origin__muted">Registro do professor · Participação nas aulas de ${K()}.</p>`;
    }

    const hist = (state.history[sid] || []).filter((h) => h.comp === key).slice(0, 3);
    const v = CX.compValue(c);
    let chip, text;
    if (c.cc) { chip = `${K()} certificada`; text = `${the} vê CC em ${K()}.`; }
    else if (c.status === "publicada") {
      chip = `${K()} publicada`;
      const pub = hist.find((h) => h.text.startsWith("Publicação"));
      text = `${pub ? `Publicada em ${pub.when.replace(" · ", " às ")}. ` : "Publicada. "}${the} vê ${v} pontos em ${K()}.`;
    } else if (c.status === "salva") { chip = `${K()} · alteração salva`; text = `Alteração salva e ainda não publicada. ${the} continua vendo a última nota publicada.`; }
    else { chip = `${K()} pendente`; text = `${K()} ainda sem nota completa. Nada foi publicado para ${FEMALE.includes(sid) ? "a estudante" : "o estudante"}.`; }
    $("publication").innerHTML = `
      <h3 class="cx-panel__title" id="publication-title">Publicação e histórico</h3>
      <span class="cx-chip">${esc(chip)}</span>
      <p class="be-origin__text">${esc(text)}</p>
      ${hist.length ? `<ul class="be-history">${hist.map((h) => `<li>${esc(h.when)}<br />${esc(h.text)}</li>`).join("")}</ul>` : `<p class="cx-caption">Sem registros em ${K()}.</p>`}
      <p class="cx-orientation">Salvar guarda o registro. Uma alteração salva permanece em rascunho até a publicação.</p>`;

    const ccs = COMPS.filter((k) => comp(k).cc);
    $("certs").innerHTML = `
      <h3 class="cx-panel__title" id="certs-title">Certificações via RDS</h3>
      <p class="be-origin__text">${ccs.length ? `${esc(student.first)} possui CC em ${joinList(ccs.map((k) => k.toUpperCase()))}.` : `${esc(student.first)} não possui CC em C1–C6.`}</p>
      <p class="cx-caption">Quando houver CC, o boletim exibe a origem RDS e a data da certificação, sem campos de edição. Não substitua CC por nota manual.</p>`;
  }

  function renderFooter() {
    const s = CX.studentSummary(state, sid);
    const pend = COMPS.filter((k, i) => s.values[i] === null).map((k) => k.toUpperCase());
    const note = $("pending-note");
    note.classList.toggle("cx-orientation--warn", pend.length > 0);
    note.textContent = pend.length
      ? `${joinList(pend)} ainda sem nota completa. Selecione a competência para conferir o online e registrar os componentes pendentes. A somatória final permanece indisponível.`
      : `Todas as competências têm nota. Somatória final: ${s.sum}.`;

    const dirty = isDirty();
    $("save").disabled = !dirty;
    $("save-title").textContent = dirty ? "Alterações não salvas" : "✓ Tudo salvo";
    $("save-title").classList.toggle("is-dirty", !!dirty);
    $("save-sub").textContent = dirty ? `${K()} · Salve antes de trocar de competência ou estudante` : "Nenhuma alteração · Troca de estudante segura";

    const next = ORDER[(ORDER.indexOf(sid) + 1) % ORDER.length];
    $("next").href = `boletim-estudante.html?estudante=${next}`;
    $("next-note").textContent = `Próximo: ${CX.studentById(next).name} · ${SITUATION[CX.studentSummary(state, next).situation]}. Ao editar, salve antes de trocar; a publicação exige os componentes completos da competência.`;
  }

  function renderAll() {
    resetBuffer();
    renderStudent();
    renderComps();
    renderComposition();
    renderComplement();
    renderSide();
    renderFooter();
    const url = new URL(location.href);
    url.searchParams.set("estudante", sid);
    url.searchParams.set("competencia", key);
    history.replaceState(null, "", url);
  }

  /* ---------------------------------------------------------------- events */
  async function guard() {
    if (!isDirty()) return true;
    return CX.confirmDiscard(`${K()} de ${student.name} tem alterações não salvas. Deseja descartá-las e continuar?`);
  }

  async function selectComp(k) {
    if (k === key) return;
    if (await guard()) { key = k; renderAll(); } else renderComps();
  }

  document.addEventListener("input", (e) => {
    const kind = e.target.dataset && e.target.dataset.kind;
    if (!kind) return;
    buffer[kind] = e.target.value;
    const max = kind === "presencial" ? 40 : 20;
    const p = CX.parseScore(e.target.value, max);
    const hint = $("h-" + kind);
    const saved = comp()[kind === "compl" ? "compl" : kind];
    e.target.parentElement.classList.toggle("is-invalid", !!p.error);
    if (p.error) { e.target.setAttribute("aria-invalid", "true"); hint.className = "cx-field__error"; hint.textContent = p.error; }
    else {
      e.target.removeAttribute("aria-invalid");
      hint.className = "cx-field__hint";
      hint.textContent = saved == null ? `Sem valor salvo · Máximo permitido: ${max}` : `Valor salvo: ${raw(saved)} · Máximo permitido: ${max}`;
    }
    const sum = $("sum-line");
    if (sum) sum.textContent = sumLine();
    renderFooter();
  });

  document.addEventListener("click", async (e) => {
    const card = e.target.closest("[data-comp]");
    if (card) { selectComp(card.dataset.comp); return; }
    const link = e.target.closest("a[data-guard]");
    if (link && isDirty()) {
      e.preventDefault();
      if (await guard()) location.href = link.href;
    }
  });

  document.addEventListener("change", (e) => { if (e.target.id === "sel-comp") selectComp(e.target.value); });
  $("composition").addEventListener("submit", (e) => { e.preventDefault(); $("save").click(); });

  $("save").addEventListener("click", () => {
    const p = parsed();
    const bad = ["presencial", "participacao", "compl"].find((k) => p[k].error && $("f-" + k));
    if (bad) { $("f-" + bad).focus(); return; }
    const c = comp();
    const stamp = CX.nowStamp();
    const changes = [];
    if (p.presencial.value !== c.presencial) changes.push(`Presencial ${p.presencial.value == null ? "—" : raw(p.presencial.value)}`);
    if (p.participacao.value !== c.participacao) changes.push(`participação ${p.participacao.value == null ? "—" : raw(p.participacao.value)}`);
    c.presencial = p.presencial.value;
    c.participacao = p.participacao.value;
    if (complEligible() && p.compl.value !== c.compl) { c.compl = p.compl.value; changes.push(`complementação ${p.compl.value == null ? "—" : "+" + raw(p.compl.value)}`); }
    c.status = CX.compValue(c) == null ? "pendente" : "salva";
    if (changes.length) {
      const text = changes.join(" e ");
      (state.history[sid] = state.history[sid] || []).unshift({
        when: `${stamp.date} · ${stamp.time}`, comp: key,
        text: text.charAt(0).toUpperCase() + text.slice(1) + (changes.length > 1 ? " salvos." : " salvo."),
      });
    }
    CX.save(state);
    CX.toast(`${K()} de ${student.first} salva.`);
    renderAll();
  });

  renderAll();
})();
