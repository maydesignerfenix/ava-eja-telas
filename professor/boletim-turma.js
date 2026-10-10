(function () {
  "use strict";

  const CX = window.CX;
  const { esc, COMPS } = CX;
  const state = CX.load();
  const params = CX.params();
  const PAGE = 4;
  const ORDER = ["ana", "bruno", "carla", "gabriela", "daniel", "eduardo", "fernanda", "helena", "isabela", "joao"];
  const $ = (id) => document.getElementById(id);
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  let expanded = params.get("estudantes") === "todos";
  let launchBuffer = {}; // sid → { presencial, participacao } raw strings

  const CHIP = { "INCOMPLETO": "", "EM PROCESSO": "cx-chip--warn", "CONCLUÍDO": "cx-chip--done" };

  function filtered() {
    if ($("f-area").value !== "Linguagens") return [];
    const q = normalize($("f-busca").value.trim());
    const sit = $("f-situacao").value;
    return ORDER.filter((sid) => {
      const s = CX.studentById(sid);
      return (!q || normalize(s.name).includes(q)) && (!sit || CX.studentSummary(state, sid).situation === sit);
    });
  }

  const cellClass = (v) => (v === "CC" ? "m-cc" : typeof v === "number" && v < 60 ? "m-low" : "");
  const show = (v) => (v === null ? "—" : String(v));
  const complText = (sum) => (sum.compl.length ? sum.compl.map((c) => `+${c.value} · ${c.key.toUpperCase()}`).join(", ") : "—");

  function rowHtml(sid) {
    const st = CX.studentById(sid);
    const sum = CX.studentSummary(state, sid);
    return `
      <tr>
        <td class="m-name"><span class="m-name__name">${esc(st.name)}</span><a class="m-name__link" href="boletim-estudante.html?estudante=${sid}">Ver boletim e registrar ›</a></td>
        ${sum.values.map((v, i) => `<td data-c="c${i + 1}" class="${cellClass(v)}">${show(v)}</td>`).join("")}
        <td>${esc(complText(sum))}</td>
        <td class="${cellClass(sum.sum)}">${show(sum.sum)}${sum.missing ? `<span class="m-sum__pend">faltam ${sum.missing}</span>` : ""}</td>
        <td><span class="cx-chip ${CHIP[sum.situation]}">${sum.situation}</span></td>
      </tr>`;
  }

  function cardHtml(sid) {
    const st = CX.studentById(sid);
    const sum = CX.studentSummary(state, sid);
    const b = state.boletim[sid];
    const ccLines = COMPS.filter((k) => b[k].cc && b[k].ccDate)
      .map((k) => `<p class="bol-card__cc">${k.toUpperCase()}: CC via RDS · ${b[k].ccDate} · Somente leitura</p>`).join("");
    return `
      <li class="bol-card">
        <h3 class="bol-card__name">${esc(st.name)}</h3>
        <span class="cx-chip ${CHIP[sum.situation]}">${sum.situation}</span>
        <dl class="bol-card__comps">
          ${sum.values.map((v, i) => `<div class="bol-card__comp"><dt>C${i + 1}</dt><dd class="${v === "CC" ? "m-cc" : ""}">${show(v)}</dd></div>`).join("")}
        </dl>
        <p class="cx-note">Somatória: ${show(sum.sum)}${sum.missing ? ` · Faltam ${sum.missing} ${sum.missing === 1 ? "competência" : "competências"}` : ""}</p>
        <p class="cx-caption">${sum.compl.length ? `Em processo · Complementação: ${esc(complText(sum))}` : "Em processo: —"}</p>
        ${ccLines}
        <a class="btn btn--outline-sm" href="boletim-estudante.html?estudante=${sid}">Ver boletim e registrar</a>
      </li>`;
  }

  function renderIndicators() {
    const linguagens = $("f-area").value === "Linguagens";
    const sums = ORDER.map((sid) => CX.studentSummary(state, sid));
    const complete = sums.filter((s) => s.sum !== null);
    $("i-media").textContent = linguagens && complete.length ? Math.round(complete.reduce((t, s) => t + s.sum, 0) / complete.length) : "—";
    $("i-media-note").textContent = `${linguagens ? complete.length : 0} de ${ORDER.length} com avaliação completa`;
    $("i-processo").textContent = linguagens ? sums.filter((s) => s.situation === "EM PROCESSO").length : "—";
    $("i-falta").textContent = linguagens ? sums.reduce((t, s) => t + s.missing, 0) : "—";
    $("i-cc").textContent = linguagens ? sums.reduce((t, s) => t + s.values.filter((v) => v === "CC").length, 0) : "—";
  }

  function renderVisao() {
    const list = filtered();
    const shown = expanded ? list : list.slice(0, PAGE);
    const comp = $("f-comp").value;
    const table = $("matrix");
    if (comp) table.dataset.comp = comp; else delete table.dataset.comp;
    $("matrix-body").innerHTML = shown.map(rowHtml).join("");
    $("cards").innerHTML = shown.map(cardHtml).join("");
    document.querySelector(".matrix").hidden = !shown.length;
    $("bol-empty").hidden = shown.length > 0;
    $("bol-empty").textContent = $("f-area").value !== "Linguagens"
      ? `Ainda não há registros de ${$("f-area").value} nesta turma.`
      : "Nenhum estudante encontrado com esses filtros.";
    $("bol-count").textContent = `${list.length} ${list.length === 1 ? "estudante" : "estudantes"} · Exibindo ${shown.length} nesta página · ${$("f-area").value}`;
    const rest = list.length - PAGE;
    const more = $("more");
    more.hidden = rest <= 0;
    more.textContent = expanded ? "Mostrar menos ‹" : `Ver mais ${rest} ${rest === 1 ? "estudante" : "estudantes"} ›`;
    more.setAttribute("aria-expanded", expanded);

    // Origem de CC
    const parts = [];
    let dates = [];
    ORDER.forEach((sid) => {
      const b = state.boletim[sid];
      const ks = COMPS.filter((k) => b[k].cc);
      if (ks.length) parts.push(`${CX.studentById(sid).first} · ${ks.map((k) => k.toUpperCase()).join(" e ")}`);
      ks.filter((k) => b[k].ccDate).forEach((k) => dates.push(`${k.toUpperCase()} de ${CX.studentById(sid).first}: RDS · ${b[k].ccDate}.`));
    });
    $("cc-origin").textContent = parts.length && $("f-area").value === "Linguagens" ? `Origem de CC: ${parts.join("; ")}. ${dates.join(" ")}` : "";
  }

  /* ----------------------------------------------------------- Lançar notas */
  let launchKey = null;
  const launchComp = () => launchKey || $("f-comp").value || "c1";

  function launchRow(sid, key) {
    const c = state.boletim[sid][key];
    const st = CX.studentById(sid);
    if (c.cc) {
      return `<div class="launch-row"><span class="launch-row__name">${esc(st.name)}</span><span class="cx-caption" style="grid-column: span 4">CC · certificada via RDS${c.ccDate ? " em " + c.ccDate : ""} · Somente leitura</span></div>`;
    }
    const b = launchBuffer[sid] || { presencial: c.presencial == null ? "" : String(c.presencial), participacao: c.participacao == null ? "" : String(c.participacao) };
    const pres = CX.parseScore(b.presencial, 40);
    const part = CX.parseScore(b.participacao, 20);
    const total = c.online != null && pres.value != null && part.value != null && !pres.error && !part.error ? c.online + pres.value + part.value : null;
    const err = pres.error || part.error;
    const field = (kind, max, raw, bad, label) => `
      <div>
        <label class="launch-row__label" for="l-${kind}-${sid}">${label}</label>
        <div class="cx-score${bad ? " is-invalid" : ""}">
          <input id="l-${kind}-${sid}" data-sid="${sid}" data-kind="${kind}" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(raw)}" aria-label="${label} de ${esc(st.name)}"${bad ? ' aria-invalid="true"' : ""} />
          <span aria-hidden="true">/ ${max}</span>
        </div>
      </div>`;
    return `
      <div class="launch-row" data-row="${sid}">
        <span class="launch-row__name">${esc(st.name)}</span>
        <div><span class="launch-row__label">Online</span><div class="cx-score cx-score--readonly">${show(c.online)} / 40</div></div>
        ${field("presencial", 40, b.presencial, !!pres.error, "Presencial")}
        ${field("participacao", 20, b.participacao, !!part.error, "Participação")}
        <span class="launch-row__total">${total === null ? "—" : total}</span>
        ${err ? `<p class="cx-field__error" role="alert">${esc(err)}</p>` : ""}
      </div>`;
  }

  function launchDirty() {
    const key = launchComp();
    return Object.keys(launchBuffer).some((sid) => {
      const c = state.boletim[sid][key];
      const b = launchBuffer[sid];
      return CX.parseScore(b.presencial, 40).value !== c.presencial || CX.parseScore(b.participacao, 20).value !== c.participacao ||
        !!CX.parseScore(b.presencial, 40).error || !!CX.parseScore(b.participacao, 20).error;
    });
  }

  function renderLaunch() {
    const key = launchComp();
    $("launch-comp").innerHTML = CX.selectHtml({
      id: "sel-launch", label: "Competência para lançar",
      options: COMPS.map((k) => ({ value: k, label: `${k.toUpperCase()} · Linguagens` })), value: key,
    });
    const list = $("f-area").value === "Linguagens" ? ORDER : [];
    $("launch-rows").innerHTML = list.length ? list.map((sid) => launchRow(sid, key)).join("") : `<p class="cx-note" style="padding:16px">Ainda não há registros de ${esc($("f-area").value)} nesta turma.</p>`;
    updateLaunchStatus();
  }

  function updateLaunchStatus() {
    const dirty = launchDirty();
    $("launch-save").disabled = !dirty;
    $("launch-status").textContent = dirty ? "Alterações não salvas" : "Nenhuma alteração";
  }

  function setTab(which) {
    const visao = which === "visao";
    $("tab-visao").setAttribute("aria-selected", visao);
    $("tab-lancar").setAttribute("aria-selected", !visao);
    $("panel-visao").hidden = !visao;
    $("panel-lancar").hidden = visao;
    if (!visao) renderLaunch(); else renderVisao();
  }

  async function guardLaunch() {
    if (!launchDirty()) return true;
    const ok = await CX.confirmDiscard("Há notas lançadas e não salvas. Deseja descartá-las e continuar?");
    if (ok) launchBuffer = {};
    return ok;
  }

  /* ---------------------------------------------------------------- events */
  ["f-area", "f-comp", "f-busca", "f-situacao"].forEach((id) =>
    $(id).addEventListener("input", async () => {
      renderIndicators();
      if (!$("panel-lancar").hidden) {
        if (id === "f-comp" && $("f-comp").value && (await guardLaunch())) launchKey = $("f-comp").value;
        renderLaunch();
      }
      renderVisao();
    }));

  $("more").addEventListener("click", () => { expanded = !expanded; renderVisao(); });
  $("tab-visao").addEventListener("click", async () => { if (await guardLaunch()) setTab("visao"); });
  $("tab-lancar").addEventListener("click", () => setTab("lancar"));
  $("open-launch").addEventListener("click", () => { setTab("lancar"); $("tab-lancar").scrollIntoView({ behavior: "smooth" }); });
  // Arrow-key navigation between the two tabs
  document.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = e.target.id === "tab-visao" ? $("tab-lancar") : $("tab-visao");
    next.focus();
    next.click();
  });

  $("launch").addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset.sid) return;
    const key = launchComp();
    const c = state.boletim[el.dataset.sid][key];
    launchBuffer[el.dataset.sid] = launchBuffer[el.dataset.sid] ||
      { presencial: c.presencial == null ? "" : String(c.presencial), participacao: c.participacao == null ? "" : String(c.participacao) };
    launchBuffer[el.dataset.sid][el.dataset.kind] = el.value;
    // re-render only this row, keeping focus
    const row = document.querySelector(`[data-row="${el.dataset.sid}"]`);
    const pos = el.selectionStart;
    row.outerHTML = launchRow(el.dataset.sid, key);
    const again = $(el.id);
    again.focus();
    try { again.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
    updateLaunchStatus();
  });

  document.addEventListener("change", async (e) => {
    if (e.target.id !== "sel-launch") return;
    const wanted = e.target.value;
    if (await guardLaunch()) launchKey = wanted;
    renderLaunch();
  });

  $("launch-cancel").addEventListener("click", () => { launchBuffer = {}; renderLaunch(); });

  $("launch").addEventListener("submit", (e) => {
    e.preventDefault();
    const key = launchComp();
    const bad = Object.keys(launchBuffer).find((sid) => CX.parseScore(launchBuffer[sid].presencial, 40).error || CX.parseScore(launchBuffer[sid].participacao, 20).error);
    if (bad) { $(`l-presencial-${bad}`).focus(); CX.toast("Corrija os valores fora do limite antes de salvar."); return; }
    const stamp = CX.nowStamp();
    let n = 0;
    Object.keys(launchBuffer).forEach((sid) => {
      const c = state.boletim[sid][key];
      const p = CX.parseScore(launchBuffer[sid].presencial, 40).value;
      const pa = CX.parseScore(launchBuffer[sid].participacao, 20).value;
      if (p === c.presencial && pa === c.participacao) return;
      c.presencial = p; c.participacao = pa;
      c.status = CX.compValue(c) == null ? "pendente" : "salva";
      (state.history[sid] = state.history[sid] || []).unshift({
        when: `${stamp.date} · ${stamp.time}`, comp: key,
        text: `Presencial ${p == null ? "—" : p} e participação ${pa == null ? "—" : pa} salvos.`,
      });
      n++;
    });
    launchBuffer = {};
    CX.save(state);
    CX.toast(`${n} ${n === 1 ? "registro salvo" : "registros salvos"} em ${key.toUpperCase()}.`);
    renderIndicators();
    renderLaunch();
  });

  $("export").addEventListener("click", () => {
    const header = ["Estudante", "C1", "C2", "C3", "C4", "C5", "C6", "Em processo", "Somatória", "Situação"];
    const lines = [header].concat(ORDER.map((sid) => {
      const s = CX.studentSummary(state, sid);
      return [CX.studentById(sid).name].concat(s.values.map(show), complText(s), show(s.sum), s.situation);
    })).map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "boletim-anos-finais-af-linguagens.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ------------------------------------------------------------------ init */
  renderIndicators();
  renderVisao();
  if (params.get("state") === "lancar") setTab("lancar");
})();
