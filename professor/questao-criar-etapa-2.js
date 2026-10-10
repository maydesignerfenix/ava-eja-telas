/* Professor · Criar questão · Etapa 2 – Conteúdo da questão
   One page, seven question types. ?tipo=<id> opens a type directly. */
(function () {
  "use strict";

  const A = "assets/prof-qtipo/";
  const TIPOS = [
    { id: "multipla-escolha", label: "Múltipla escolha", icon: "tipo-multipla-escolha.svg", iconSize: 54,
      desc: "Questão com alternativas de resposta, geralmente com uma única resposta correta ou mais de uma, conforme o comando." },
    { id: "verdadeiro-falso", label: "Verdadeiro ou Falso", icon: "tipo-verdadeiro-falso.svg", iconSize: 20,
      desc: "Questão em que o estudante deve avaliar uma afirmação e classificá-la como verdadeira ou falsa." },
    { id: "discursiva", label: "Discursiva", icon: "tipo-discursiva.svg", iconSize: 20,
      desc: "Questão que exige uma resposta elaborada pelo estudante, podendo envolver explicação, argumentação, análise ou resolução de um problema." },
    { id: "resposta-curta", label: "Resposta curta", icon: "tipo-resposta-curta.svg", iconSize: 20,
      desc: "Questão que exige uma resposta objetiva e breve, geralmente uma palavra, expressão, número ou frase curta." },
    { id: "ordenacao", label: "Ordenação", icon: "tipo-book.svg", iconSize: 20,
      desc: "Questão em que o estudante deve organizar elementos segundo uma sequência, ordem cronológica, lógica ou hierárquica." },
    { id: "correlacao", label: "Correlação", icon: "tipo-book.svg", iconSize: 20,
      desc: "Questão em que o estudante deve relacionar elementos de duas ou mais colunas ou conjuntos." },
    { id: "palavras-cruzadas", label: "Palavras cruzadas", icon: "tipo-palavras-cruzadas.svg", iconSize: 20,
      desc: "Permite completar uma grade de palavras a partir de dicas." },
  ];
  const byId = Object.fromEntries(TIPOS.map((t) => [t.id, t]));
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let uid = 0;
  const nid = () => "i" + ++uid;
  const item = (text = "") => ({ id: nid(), text });

  /* ---------------------------------------------------------------- state */
  const ord = ["Apresentar o tema e a tese que será defendida.", "Concluir o texto, retomando a tese e sintetizando os argumentos.",
    "Explicar o primeiro argumento com um exemplo pertinente.", "Desenvolver um segundo argumento que sustente a tese."].map((t) => item(t));
  const colA = ["Notícia", "Artigo de opinião", "Receita", "Anúncio publicitário"].map((t) => item(t));
  const colB = ["Orientar o preparo de um alimento.", "Convencer o público a adquirir um produto.",
    "Informar sobre um acontecimento recente.", "Defender um ponto de vista com argumentos."].map((t) => item(t));

  const state = {
    tipo: "",
    me: { items: [Object.assign(item(), { desc: "", showDesc: false })], correct: null },
    vf: { items: [Object.assign(item("Verdadeiro"), { desc: "", showDesc: false }), Object.assign(item("Falso"), { desc: "", showDesc: false })], correct: null, custom: false },
    ord: { items: ord, answer: [ord[0].id, ord[2].id, ord[3].id, ord[1].id], shuffle: "embaralhar" },
    cor: {
      a: { title: "Gênero textual", items: colA },
      b: { title: "Finalidade comunicativa", items: colB },
      pairs: { [colA[0].id]: colB[2].id, [colA[1].id]: colB[3].id, [colA[2].id]: colB[0].id, [colA[3].id]: colB[1].id },
    },
    pc: {
      words: [["AUTOR", "Pessoa que escreve ou cria uma obra."], ["TEXTO", "Conjunto de palavras organizado para transmitir uma mensagem."],
        ["LEITURA", "Ato de ler e compreender um texto."], ["LIVRO", "Obra formada por páginas reunidas, com textos ou imagens."]]
        .map(([w, c]) => ({ id: nid(), word: w, clue: c })),
      grid: null, stale: false, showAnswers: true,
    },
  };
  let submitted = false;

  /* -------------------------------------------------------------- helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const img = (f, w, h = w) => `<img src="${A}${f}" width="${w}" height="${h}" alt="" />`;
  const move = (arr, from, to) => { if (to < 0 || to >= arr.length) return false; arr.splice(to, 0, arr.splice(from, 1)[0]); return true; };

  /* Drag-and-drop + keyboard (↑/↓ on the handle) reordering for a list */
  function sortable(listEl, getArr, onChange) {
    let dragIdx = -1;
    listEl.querySelectorAll("[data-sort-item]").forEach((row, i) => {
      const handle = row.querySelector("[data-handle]");
      handle.addEventListener("mousedown", () => (row.draggable = true));
      handle.addEventListener("touchstart", () => (row.draggable = true), { passive: true });
      row.addEventListener("dragstart", (e) => { dragIdx = i; row.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); });
      row.addEventListener("dragend", () => { row.draggable = false; row.classList.remove("is-dragging"); listEl.querySelectorAll(".is-drop-target").forEach((r) => r.classList.remove("is-drop-target")); });
      row.addEventListener("dragover", (e) => { if (dragIdx < 0) return; e.preventDefault(); row.classList.add("is-drop-target"); });
      row.addEventListener("dragleave", () => row.classList.remove("is-drop-target"));
      row.addEventListener("drop", (e) => { e.preventDefault(); if (dragIdx >= 0 && dragIdx !== i) { move(getArr(), dragIdx, i); onChange(i); } dragIdx = -1; });
      handle.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
        if (!d) return;
        e.preventDefault();
        if (move(getArr(), i, i + d)) onChange(i + d, true);
      });
    });
  }
  const focusHandle = (container, idx) => { const h = container.querySelectorAll("[data-handle]")[idx]; if (h) h.focus(); };

  /* ---------------------------------------------------------- type select */
  const typeWrap = $("#qc-type"), typeBtn = $("#tipo-button"), typeList = $("#tipo-list");
  typeList.innerHTML = TIPOS.map((t) => `
    <li class="qc-type__option" role="option" id="opt-${t.id}" data-tipo="${t.id}" aria-selected="false">
      <span class="qc-type__opt-icon">${img(t.icon, t.iconSize)}</span>
      <span class="qc-type__text"><span class="qc-type__name">${t.label}</span><span class="qc-type__desc">${t.desc}</span></span>
    </li>`).join("");
  const options = [...typeList.children];
  let active = 0;

  function openList() {
    typeList.hidden = false; typeBtn.setAttribute("aria-expanded", "true");
    active = Math.max(0, TIPOS.findIndex((t) => t.id === state.tipo)); setActive(active); typeList.focus();
  }
  function closeList(focusBtn) { typeList.hidden = true; typeBtn.setAttribute("aria-expanded", "false"); if (focusBtn) typeBtn.focus(); }
  function setActive(i) {
    active = (i + options.length) % options.length;
    options.forEach((o, k) => o.classList.toggle("is-active", k === active));
    typeList.setAttribute("aria-activedescendant", options[active].id);
    options[active].scrollIntoView({ block: "nearest" });
  }
  typeBtn.addEventListener("click", () => (typeList.hidden ? openList() : closeList()));
  typeBtn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openList(); } });
  typeList.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTipo(options[active].dataset.tipo); closeList(true); }
    else if (e.key === "Escape" || e.key === "Tab") { closeList(e.key === "Escape"); }
  });
  typeList.addEventListener("click", (e) => { const o = e.target.closest("[data-tipo]"); if (o) { setTipo(o.dataset.tipo); closeList(true); } });
  document.addEventListener("click", (e) => { if (!typeWrap.contains(e.target)) closeList(); });

  function setTipo(id, fromUrl) {
    state.tipo = byId[id] ? id : "";
    const t = byId[state.tipo];
    typeWrap.classList.toggle("has-value", !!t);
    $("#tipo-icon").hidden = !t;
    $("#tipo-icon").innerHTML = t ? img(t.icon, t.iconSize) : "";
    $("#tipo-name").textContent = t ? t.label : "Escolha um tipo de questão";
    $("#tipo-desc").textContent = t ? t.desc : "Permite selecionar apenas uma alternativa como resposta correta.";
    options.forEach((o) => o.setAttribute("aria-selected", String(o.dataset.tipo === state.tipo)));
    const preview = $("#btn-preview");
    preview.setAttribute("aria-disabled", String(!t));
    preview.href = "questao-previa.html" + (t ? "?tipo=" + t.id : "");
    if (!fromUrl) {
      const url = new URL(location.href);
      t ? url.searchParams.set("tipo", t.id) : url.searchParams.delete("tipo");
      history.replaceState(null, "", url);
    }
    if (state.tipo === "palavras-cruzadas" && !state.pc.grid) generateGrid();
    renderAnswer();
    changed();
  }

  /* --------------------------------------------------------------- editor */
  const enunciado = $("#enunciado");
  $("#enunciado-editor .qc-editor__toolbar").addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
  $("#enunciado-editor .qc-editor__toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cmd]");
    if (!b) return;
    enunciado.focus();
    const cmd = b.dataset.cmd;
    if (cmd === "createLink") { const u = prompt("Endereço do link (https://…)"); if (u && /^https?:\/\//i.test(u)) document.execCommand("createLink", false, u); }
    else if (cmd === "insertImage") { const u = prompt("Endereço da imagem (https://…)"); if (u && /^https?:\/\//i.test(u)) document.execCommand("insertImage", false, u); }
    else if (cmd === "emoji") document.execCommand("insertText", false, "🙂");
    else if (cmd === "formatBlock") document.execCommand("formatBlock", false, "p");
    else document.execCommand(cmd, false, null);
    if (enunciado.innerHTML === "<br>") enunciado.innerHTML = "";
    changed();
  });
  enunciado.addEventListener("input", () => { if (enunciado.innerHTML === "<br>") enunciado.innerHTML = ""; changed(); });

  /* ------------------------------------------------------- answer render */
  const answerEl = $("#qc-answer"), extraEl = $("#qc-extra");

  function renderAnswer(focusSel) {
    answerEl.innerHTML = ""; extraEl.innerHTML = "";
    switch (state.tipo) {
      case "multipla-escolha": renderAlts(state.me, false); break;
      case "verdadeiro-falso": renderAlts(state.vf, true); break;
      case "ordenacao": renderOrdenacao(); break;
      case "correlacao": renderCorrelacao(); break;
      case "palavras-cruzadas": renderPalavras(); break;
    }
    if (focusSel) { const el = document.querySelector(focusSel); if (el) el.focus(); }
    if (submitted) validate(true);
  }

  /* Múltipla escolha / Verdadeiro ou Falso */
  function renderAlts(s, isVF) {
    const editable = !isVF || s.custom;
    answerEl.innerHTML = `
      <div class="qc-answer__head">
        <h4 class="qc-answer__title">Alternativas</h4>
        ${isVF ? `<p class="qc-answer__hint">Marque apenas uma das alternativas como correta</p>` : ""}
      </div>
      ${isVF ? `<button class="qc-link-btn" type="button" id="vf-custom" aria-pressed="${s.custom}"><span>${s.custom ? "Concluir personalização" : "Personalizar alternativas"}</span></button>` : ""}
      <ol class="qc-alts${isVF ? " qc-alts--spaced" : ""}" id="alts" aria-label="Alternativas">
        ${s.items.map((a, i) => {
          const L = LETTERS[i], ok = s.correct === a.id;
          return `
          <li class="qc-alt${ok ? " is-correct" : ""}" data-sort-item data-id="${a.id}">
            <span class="qc-alt__letter" aria-hidden="true">${L}</span>
            <div class="qc-alt__main">
              <button class="qc-alt__drag" type="button" data-handle aria-label="Reordenar alternativa ${L} (setas para cima e para baixo)">${img("drag.svg", 20)}</button>
              <div class="qc-alt__card">
                ${isVF ? `
                  <label class="visually-hidden" for="alt-${a.id}">Alternativa ${L}</label>
                  <input class="qc-alt__text" id="alt-${a.id}" data-field="text" value="${esc(a.text)}" ${editable ? "" : "readonly"} />`
                : `
                  <div class="qc-alt__card-head">
                    <label class="qc-alt__label" for="alt-${a.id}">Texto alternativa</label>
                    ${ok ? `<span class="qc-alt__badge">Correta</span>` : ""}
                    <span class="qc-alt__info" title="Texto que o estudante verá como alternativa ${L}">${img("info.svg", 20)}</span>
                  </div>
                  <textarea class="qc-alt__input" id="alt-${a.id}" data-field="text" rows="1" placeholder="Digite a alternativa">${esc(a.text)}</textarea>`}
                ${isVF && ok ? `<span class="qc-alt__badge qc-alt__badge--vf">Correta</span>` : ""}
                ${a.showDesc ? `
                  <div class="qc-alt__descriptor">
                    <label for="desc-${a.id}">Descritor / justificativa da alternativa ${L} (não exibido ao estudante)</label>
                    <input class="input" id="desc-${a.id}" data-field="desc" value="${esc(a.desc)}" placeholder="Explique por que esta alternativa está correta ou incorreta" />
                  </div>` : ""}
              </div>
            </div>
            <div class="qc-alt__tools">
              <button class="qc-icon-btn" type="button" data-act="correct" aria-pressed="${ok}" aria-label="Marcar alternativa ${L} como correta">${img("check-circle.svg", 20)}</button>
              <button class="qc-icon-btn" type="button" data-act="desc" aria-expanded="${a.showDesc}" aria-label="Adicionar descritor à alternativa ${L}">${img("add-notes.svg", 20)}</button>
              <button class="qc-icon-btn" type="button" data-act="delete" aria-label="Excluir alternativa ${L}" ${s.items.length <= 2 && (isVF || s.items.length <= 1) ? "disabled" : ""}>${img("delete.svg", 20)}</button>
            </div>
          </li>`;
        }).join("")}
      </ol>
      <p class="qc-answer__error" id="alts-error" hidden></p>
      ${editable && s.items.length < 26 ? `
      <div class="qc-answer__add">
        <button class="qc-link-btn qc-link-btn--add" type="button" id="alt-add">${img("add.svg", 20)}<span>Adicionar alternativa</span></button>
      </div>` : ""}`;

    const list = $("#alts");
    list.addEventListener("input", (e) => {
      const li = e.target.closest("[data-id]"), a = s.items.find((x) => x.id === li.dataset.id);
      a[e.target.dataset.field] = e.target.value;
      if (e.target.tagName === "TEXTAREA") autoGrow(e.target);
      changed();
    });
    list.querySelectorAll("textarea").forEach(autoGrow);
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
      const li = b.closest("[data-id]"), id = li.dataset.id, idx = s.items.findIndex((x) => x.id === id);
      if (b.dataset.act === "correct") s.correct = s.correct === id ? null : id;
      if (b.dataset.act === "desc") s.items[idx].showDesc = !s.items[idx].showDesc;
      if (b.dataset.act === "delete") { s.items.splice(idx, 1); if (s.correct === id) s.correct = null; }
      const next = s.items[Math.min(idx, s.items.length - 1)];
      renderAnswer(b.dataset.act === "delete" ? (next ? `[data-id="${next.id}"] [data-act="delete"]:not([disabled]), #alt-add` : "#alt-add")
        : b.dataset.act === "desc" && s.items[idx].showDesc ? `#desc-${id}` : `[data-id="${id}"] [data-act="${b.dataset.act}"]`);
      changed();
    });
    sortable(list, () => s.items, (to) => { renderAnswer(); focusHandle($("#alts"), to); changed(); });
    const add = $("#alt-add");
    if (add) add.addEventListener("click", () => {
      const n = Object.assign(item(), { desc: "", showDesc: false });
      s.items.push(n); renderAnswer(`#alt-${n.id}`); changed();
    });
    const cus = $("#vf-custom");
    if (cus) cus.addEventListener("click", () => { s.custom = !s.custom; renderAnswer("#vf-custom"); });
  }
  function autoGrow(t) { t.style.height = "auto"; t.style.height = Math.max(94, t.scrollHeight + 2) + "px"; }

  /* Ordenação */
  function renderOrdenacao() {
    const s = state.ord;
    extraEl.innerHTML = `
      <section class="qc-block" aria-labelledby="ord-title">
        <div class="qc-block__head">
          <h3 class="qc-block__title" id="ord-title">Elementos para ordenação</h3>
          <p class="qc-block__desc">Cadastre os elementos que o estudante deverá organizar. A sequência correta será definida no gabarito.</p>
        </div>
        <ol class="qc-els" id="ord-list">
          ${s.items.map((el, i) => `
            <li class="qc-el" data-sort-item data-id="${el.id}">
              <span class="qc-el__id" aria-hidden="true">${LETTERS[i]}</span>
              <button class="qc-alt__drag" type="button" data-handle aria-label="Reordenar elemento ${LETTERS[i]} (setas para cima e para baixo)">${img("drag.svg", 20)}</button>
              <div class="qc-el__field">
                <label class="qc-el__label" for="ord-${el.id}">Texto do elemento</label>
                <input class="qc-text" id="ord-${el.id}" value="${esc(el.text)}" placeholder="Digite o elemento ${LETTERS[i]}" />
              </div>
              <button class="qc-icon-btn" type="button" data-act="delete" aria-label="Excluir elemento ${LETTERS[i]}" ${s.items.length <= 2 ? "disabled" : ""}>${img("delete.svg", 20)}</button>
            </li>`).join("")}
        </ol>
        <p class="qc-answer__error" id="ord-error" hidden></p>
        <button class="qc-add" type="button" id="ord-add" ${s.items.length >= 26 ? "disabled" : ""}>${img("plus.svg", 20)}<span>Adicionar elemento</span></button>
      </section>
      <section class="qc-block" aria-labelledby="ordgab-title">
        <div class="qc-block__head">
          <h3 class="qc-block__title" id="ordgab-title">Gabarito — sequência correta</h3>
          <p class="qc-block__desc">Arraste os elementos para definir a ordem esperada, do primeiro ao último. Esta sequência não será exibida aos estudantes.</p>
        </div>
        <div id="ord-gabarito"></div>
        <div class="qc-field">
          <label class="qc-el__label" for="ord-shuffle">Ordem de apresentação aos estudantes</label>
          <div class="qc-select qc-select--sm">
            <select id="ord-shuffle">
              <option value="embaralhar" ${s.shuffle === "embaralhar" ? "selected" : ""}>Embaralhar os elementos para cada estudante</option>
              <option value="cadastro" ${s.shuffle === "cadastro" ? "selected" : ""}>Manter a ordem de cadastro</option>
            </select>
            ${img("chevron-down-sm.svg", 12)}
          </div>
        </div>
        <div class="qc-note">${img("info-note.svg", 20)}<p>Correção automática: a resposta será considerada correta quando todos os elementos estiverem na sequência definida no gabarito.</p></div>
      </section>`;

    const list = $("#ord-list");
    list.addEventListener("input", (e) => { s.items.find((x) => x.id === e.target.closest("[data-id]").dataset.id).text = e.target.value; renderOrdGabarito(); changed(); });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act=delete]"); if (!b || b.disabled) return;
      const id = b.closest("[data-id]").dataset.id, idx = s.items.findIndex((x) => x.id === id);
      s.items.splice(idx, 1); s.answer = s.answer.filter((x) => x !== id);
      renderAnswer("#ord-add"); changed();
    });
    sortable(list, () => s.items, (to) => { renderAnswer(); focusHandle($("#ord-list"), to); changed(); });
    $("#ord-add").addEventListener("click", () => { const n = item(); s.items.push(n); s.answer.push(n.id); renderAnswer(`#ord-${n.id}`); changed(); });
    $("#ord-shuffle").addEventListener("change", (e) => { s.shuffle = e.target.value; changed(); });
    renderOrdGabarito();
  }
  function renderOrdGabarito(focusIdx) {
    const s = state.ord, box = $("#ord-gabarito");
    const letter = (id) => LETTERS[s.items.findIndex((x) => x.id === id)];
    const textOf = (id) => (s.items.find((x) => x.id === id) || {}).text || "";
    const n = s.answer.length;
    box.innerHTML = `
      <ol class="qc-seq" id="ord-seq" aria-label="Sequência correta">
        ${s.answer.map((id, i) => `
          <li class="qc-seq__row" data-sort-item>
            <span class="qc-seq__pos">${i + 1}</span>
            <button class="qc-alt__drag" type="button" data-handle aria-label="Mover elemento ${letter(id)} da posição ${i + 1} (setas para cima e para baixo)">${img("drag.svg", 20)}</button>
            <span class="qc-tag qc-tag--marker qc-tag--plain">${letter(id)}</span>
            <span class="qc-seq__text">${esc(textOf(id)) || '<em class="qc-muted">Elemento sem texto</em>'}</span>
            <span class="qc-seq__hint">${i === 0 ? "Início" : i === n - 1 ? "Fim" : ""}</span>
          </li>`).join("")}
      </ol>
      <div class="qc-seq__summary"><span>Sequência definida:</span><strong>${s.answer.map(letter).join(" → ")}</strong></div>`;
    sortable($("#ord-seq"), () => s.answer, (to) => { renderOrdGabarito(); focusHandle($("#ord-seq"), to); changed(); });
    if (focusIdx != null) focusHandle($("#ord-seq"), focusIdx);
  }

  /* Correlação */
  function renderCorrelacao() {
    const s = state.cor;
    const col = (key, name, ids) => `
      <div class="qc-col" data-col="${key}">
        <h4 class="qc-col__title">${name}</h4>
        <div class="qc-field">
          <label class="qc-el__label" for="cor-${key}-title">Título da coluna</label>
          <input class="qc-text" id="cor-${key}-title" data-title value="${esc(s[key].title)}" placeholder="Ex.: ${key === "a" ? "Gênero textual" : "Finalidade comunicativa"}" />
        </div>
        <hr class="qc-col__divider" />
        <ol class="qc-col__list" id="cor-${key}-list">
          ${s[key].items.map((el, i) => `
            <li class="qc-col__item" data-sort-item data-id="${el.id}">
              <span class="qc-col__id" aria-hidden="true">${ids(i)}</span>
              <button class="qc-alt__drag" type="button" data-handle aria-label="Reordenar elemento ${ids(i)} (setas para cima e para baixo)">${img("drag.svg", 20)}</button>
              <label class="visually-hidden" for="cor-${el.id}">Elemento ${ids(i)} da ${name}</label>
              <input class="qc-text" id="cor-${el.id}" value="${esc(el.text)}" placeholder="Digite o elemento ${ids(i)}" />
              <button class="qc-icon-btn" type="button" data-act="delete" aria-label="Excluir elemento ${ids(i)} da ${name}" ${s[key].items.length <= 2 ? "disabled" : ""}>${img("delete.svg", 20)}</button>
            </li>`).join("")}
        </ol>
        <button class="qc-add" type="button" data-add="${key}" ${s[key].items.length >= 26 ? "disabled" : ""}>${img("plus.svg", 20)}<span>Adicionar elemento</span></button>
      </div>`;
    extraEl.innerHTML = `
      <section class="qc-block" aria-labelledby="cor-title">
        <div class="qc-block__head">
          <h3 class="qc-block__title" id="cor-title">Colunas da correlação</h3>
          <p class="qc-block__desc">Adicione os elementos de cada coluna. Os identificadores ajudam a definir os pares corretos.</p>
        </div>
        <div class="qc-cols">
          ${col("a", "Coluna A", (i) => LETTERS[i])}
          ${col("b", "Coluna B", (i) => String(i + 1))}
        </div>
        <p class="qc-answer__error" id="cor-error" hidden></p>
        <button class="qc-add" type="button" id="cor-add-col">${img("plus.svg", 20)}<span>Adicionar coluna ou conjunto</span></button>
        <p class="qc-answer__hint" id="cor-col-msg" role="status" hidden>Nesta versão a correlação é feita entre duas colunas. Para mais conjuntos, crie uma nova questão de correlação.</p>
      </section>
      <section class="qc-block" aria-labelledby="corgab-title">
        <div class="qc-block__head">
          <h3 class="qc-block__title" id="corgab-title">Gabarito — pares corretos</h3>
          <p class="qc-block__desc">Selecione o elemento correspondente da coluna B para cada elemento da coluna A. O gabarito não será exibido aos estudantes.</p>
        </div>
        <div id="cor-gabarito"></div>
      </section>`;

    ["a", "b"].forEach((key) => {
      const colEl = extraEl.querySelector(`[data-col="${key}"]`), list = $(`#cor-${key}-list`);
      colEl.addEventListener("input", (e) => {
        if (e.target.hasAttribute("data-title")) s[key].title = e.target.value;
        else s[key].items.find((x) => x.id === e.target.closest("[data-id]").dataset.id).text = e.target.value;
        renderCorGabarito(); changed();
      });
      list.addEventListener("click", (e) => {
        const b = e.target.closest("[data-act=delete]"); if (!b || b.disabled) return;
        const id = b.closest("[data-id]").dataset.id;
        s[key].items = s[key].items.filter((x) => x.id !== id);
        if (key === "a") delete s.pairs[id]; else Object.keys(s.pairs).forEach((k) => { if (s.pairs[k] === id) delete s.pairs[k]; });
        renderAnswer(`[data-add="${key}"]`); changed();
      });
      sortable(list, () => s[key].items, (to) => { renderAnswer(); focusHandle($(`#cor-${key}-list`), to); changed(); });
      colEl.querySelector("[data-add]").addEventListener("click", () => { const n = item(); s[key].items.push(n); renderAnswer(`#cor-${n.id}`); changed(); });
    });
    $("#cor-add-col").addEventListener("click", () => { $("#cor-col-msg").hidden = false; });
    renderCorGabarito();
  }
  function renderCorGabarito() {
    const s = state.cor, box = $("#cor-gabarito");
    const defined = s.a.items.filter((a) => s.pairs[a.id]).length;
    box.innerHTML = `
      <div class="qc-pairs-table" role="table" aria-label="Pares corretos">
        <div class="qc-pairs-table__head" role="row">
          <span role="columnheader">Coluna A — ${esc(s.a.title) || "sem título"}</span>
          <span role="columnheader">Coluna B — ${esc(s.b.title) || "sem título"}</span>
        </div>
        ${s.a.items.map((a, i) => `
          <div class="qc-pairs-table__row" role="row">
            <span class="qc-pairs-table__src" role="cell"><span class="qc-tag qc-tag--marker qc-tag--plain">${LETTERS[i]}</span><span id="src-${a.id}">${esc(a.text) || '<em class="qc-muted">Elemento sem texto</em>'}</span></span>
            <span class="qc-select qc-select--sm" role="cell">
              <select data-pair="${a.id}" aria-labelledby="src-${a.id}" aria-label="Correspondente de ${LETTERS[i]}">
                <option value="">Selecione o correspondente</option>
                ${s.b.items.map((b, j) => `<option value="${b.id}" ${s.pairs[a.id] === b.id ? "selected" : ""}>${j + 1} — ${esc(b.text)}</option>`).join("")}
              </select>
              ${img("chevron-down-sm.svg", 12)}
            </span>
          </div>`).join("")}
      </div>
      <div class="qc-note">${img("info-note.svg", 20)}<p>${defined} ${defined === 1 ? "par definido" : "pares definidos"}. A correção automática considera as correspondências do gabarito, independentemente da ordem em que os elementos são apresentados.</p></div>`;
    box.querySelectorAll("[data-pair]").forEach((sel) => sel.addEventListener("change", () => {
      sel.value ? (s.pairs[sel.dataset.pair] = sel.value) : delete s.pairs[sel.dataset.pair];
      renderCorGabarito(); box.querySelector(`[data-pair="${sel.dataset.pair}"]`).focus(); changed();
    }));
    if (submitted) validate(true);
  }

  /* Palavras cruzadas */
  const normWord = (w) => w.toUpperCase().replace(/\s+/g, "");
  function renderPalavras() {
    const s = state.pc;
    extraEl.innerHTML = `
      <section class="qc-block" aria-labelledby="pc-title">
        <div class="qc-block__head qc-block__head--6">
          <h3 class="qc-block__title" id="pc-title">Palavras e dicas</h3>
          <p class="qc-block__desc">Adicione as respostas e uma dica para cada palavra. A numeração será definida ao gerar a grade.</p>
        </div>
        <p class="qc-block__desc qc-pc-rule">Use palavras sem espaços, acentos ou caracteres especiais.</p>
        <div class="qc-words">
          <div class="qc-words__head" aria-hidden="true"><span>Palavra (resposta)</span><span>Dica para o estudante</span><span class="qc-words__count" id="pc-count"></span></div>
          <ol class="qc-words__list" id="pc-list">
            ${s.words.map((w, i) => `
              <li class="qc-word" data-sort-item data-id="${w.id}">
                <button class="qc-alt__drag" type="button" data-handle aria-label="Reordenar palavra ${i + 1} (setas para cima e para baixo)">${img("drag.svg", 20)}</button>
                <div class="qc-word__answer">
                  <label class="visually-hidden" for="pcw-${w.id}">Palavra ${i + 1} (resposta)</label>
                  <input class="qc-text qc-text--sm" id="pcw-${w.id}" data-field="word" value="${esc(w.word)}" placeholder="PALAVRA" autocomplete="off" spellcheck="false" aria-describedby="pcn-${w.id}" />
                  <span class="qc-word__meta" id="pcn-${w.id}"></span>
                </div>
                <div class="qc-word__clue">
                  <label class="visually-hidden" for="pcc-${w.id}">Dica da palavra ${i + 1}</label>
                  <input class="qc-text qc-text--sm" id="pcc-${w.id}" data-field="clue" value="${esc(w.clue)}" placeholder="Digite a dica" />
                  <span class="qc-word__meta">Exibida ao estudante</span>
                </div>
                <button class="qc-icon-btn" type="button" data-act="delete" aria-label="Excluir palavra ${i + 1}" ${s.words.length <= 2 ? "disabled" : ""}>${img("delete.svg", 20)}</button>
              </li>`).join("")}
          </ol>
        </div>
        <p class="qc-answer__error" id="pc-error" hidden></p>
        <button class="qc-link-btn" type="button" id="pc-add" ${s.words.length >= 20 ? "disabled" : ""}><span>+&nbsp;&nbsp;Adicionar palavra</span></button>
      </section>
      <section class="qc-block" aria-labelledby="pcg-title">
        <div class="qc-grid-head">
          <div class="qc-block__head qc-block__head--6">
            <h3 class="qc-block__title" id="pcg-title">Grade de palavras cruzadas</h3>
            <p class="qc-block__desc">Gere a grade a partir das palavras e confira os cruzamentos antes de criar a questão.</p>
          </div>
          <button class="btn qc-btn-outline" type="button" id="pc-generate">GERAR NOVA GRADE</button>
        </div>
        <div class="qc-grid-status">
          <p class="qc-grid-status__state" id="pc-status" role="status"></p>
          <label class="qc-check"><input type="checkbox" id="pc-show" ${s.showAnswers ? "checked" : ""} /><span class="qc-check__box" aria-hidden="true">${img("square-check.svg", 20)}</span>Exibir respostas</label>
        </div>
        <div class="qc-xw" id="pc-preview"></div>
        <p class="qc-block__desc">As respostas são exibidas apenas para conferência. Os estudantes visualizarão a grade vazia e as dicas numeradas.</p>
      </section>`;

    const list = $("#pc-list");
    list.addEventListener("input", (e) => {
      const w = s.words.find((x) => x.id === e.target.closest("[data-id]").dataset.id);
      if (e.target.dataset.field === "word") {
        const pos = e.target.selectionStart, v = e.target.value.toUpperCase();
        if (v !== e.target.value) { e.target.value = v; e.target.setSelectionRange(pos, pos); }
        w.word = v;
      } else w.clue = e.target.value;
      s.stale = true; updatePcMeta(); renderGrid(); changed();
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act=delete]"); if (!b || b.disabled) return;
      s.words = s.words.filter((x) => x.id !== b.closest("[data-id]").dataset.id);
      s.stale = true; renderAnswer("#pc-add"); changed();
    });
    sortable(list, () => s.words, (to) => { s.stale = true; renderAnswer(); focusHandle($("#pc-list"), to); changed(); });
    $("#pc-add").addEventListener("click", () => { const n = { id: nid(), word: "", clue: "" }; s.words.push(n); s.stale = true; renderAnswer(`#pcw-${n.id}`); changed(); });
    $("#pc-generate").addEventListener("click", () => { generateGrid(); renderGrid(); changed(); });
    $("#pc-show").addEventListener("change", (e) => { s.showAnswers = e.target.checked; renderGrid(); });
    updatePcMeta(); renderGrid();
  }
  function wordProblem(w) {
    const v = normWord(w.word);
    if (!v) return "Digite a palavra.";
    if (!/^[A-Z]+$/.test(v)) return "Use apenas letras sem acentos.";
    if (v.length < 2) return "Mínimo de 2 letras.";
    return "";
  }
  function updatePcMeta() {
    const s = state.pc;
    $("#pc-count").textContent = `${s.words.length} ${s.words.length === 1 ? "palavra" : "palavras"}`;
    s.words.forEach((w) => {
      const el = $(`#pcn-${w.id}`), p = wordProblem(w), n = normWord(w.word).length;
      el.textContent = submitted && p ? p : p && n && p !== "Mínimo de 2 letras." ? p : `${n} ${n === 1 ? "letra" : "letras"}`;
      el.classList.toggle("is-error", !!p && (submitted || /acentos/.test(p)));
    });
  }

  /* Crossword generator: greedy placement, smallest bounding box wins */
  function generateGrid() {
    const s = state.pc;
    const words = s.words.map((w) => ({ id: w.id, word: normWord(w.word), clue: w.clue })).filter((w) => !wordProblem(w));
    const cells = new Map(), key = (r, c) => r + "," + c, placed = [], unplaced = [];
    const at = (r, c) => cells.get(key(r, c));
    function fits(word, r, c, dir) {
      const dr = dir === "V" ? 1 : 0, dc = dir === "H" ? 1 : 0;
      if (at(r - dr, c - dc) || at(r + dr * word.length, c + dc * word.length)) return -1;
      let crosses = 0;
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, cur = at(rr, cc);
        if (cur) { if (cur.ch !== word[i] || cur[dir]) return -1; crosses++; }
        else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return -1;
      }
      return crosses;
    }
    function bounds(extra) {
      let r0 = Infinity, r1 = -Infinity, c0 = Infinity, c1 = -Infinity;
      const upd = (r, c) => { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); };
      cells.forEach((_, k) => { const [r, c] = k.split(",").map(Number); upd(r, c); });
      if (extra) for (let i = 0; i < extra.word.length; i++) upd(extra.r + (extra.dir === "V" ? i : 0), extra.c + (extra.dir === "H" ? i : 0));
      return { r0, r1, c0, c1 };
    }
    function put(w, r, c, dir) {
      for (let i = 0; i < w.word.length; i++) {
        const k = key(r + (dir === "V" ? i : 0), c + (dir === "H" ? i : 0));
        const cell = cells.get(k) || { ch: w.word[i] };
        cell[dir] = true; cells.set(k, cell);
      }
      placed.push(Object.assign({}, w, { r, c, dir }));
    }
    words.forEach((w, idx) => {
      if (idx === 0) return put(w, 0, 0, "H");
      let best = null;
      cells.forEach((cell, k) => {
        const [r, c] = k.split(",").map(Number);
        for (let i = 0; i < w.word.length; i++) {
          if (w.word[i] !== cell.ch) continue;
          ["H", "V"].forEach((dir) => {
            const sr = dir === "V" ? r - i : r, sc = dir === "H" ? c - i : c;
            if (fits(w.word, sr, sc, dir) < 1) return;
            const b = bounds({ word: w.word, r: sr, c: sc, dir });
            const score = (b.r1 - b.r0 + 1) * (b.c1 - b.c0 + 1) * 100 + Math.max(0, -b.r0) + Math.max(0, -b.c0);
            if (!best || score < best.score) best = { score, r: sr, c: sc, dir };
          });
        }
      });
      best ? put(w, best.r, best.c, best.dir) : unplaced.push(w);
    });
    if (!placed.length) { s.grid = { rows: 0, cols: 0, cells: [], placed: [], unplaced, total: s.words.length }; s.stale = false; return; }
    const b = bounds();
    const rows = b.r1 - b.r0 + 1, cols = b.c1 - b.c0 + 1;
    placed.forEach((p) => { p.r -= b.r0; p.c -= b.c0; });
    // numbering in reading order of start cells
    const starts = [...new Set(placed.map((p) => p.r * 1000 + p.c))].sort((x, y) => x - y);
    placed.forEach((p) => (p.num = starts.indexOf(p.r * 1000 + p.c) + 1));
    const grid = [];
    cells.forEach((cell, k) => { const [r, c] = k.split(",").map(Number); grid.push({ r: r - b.r0, c: c - b.c0, ch: cell.ch }); });
    s.grid = { rows, cols, cells: grid, placed, unplaced, total: s.words.length };
    s.stale = false;
  }
  function renderGrid() {
    const s = state.pc, g = s.grid, prev = $("#pc-preview"), status = $("#pc-status");
    if (!prev) return;
    if (!g || !g.placed.length) {
      status.className = "qc-grid-status__state is-warn";
      status.textContent = "Adicione ao menos duas palavras válidas e gere a grade.";
      prev.innerHTML = ""; prev.hidden = true; return;
    }
    prev.hidden = false;
    const ok = !s.stale && !g.unplaced.length && g.placed.length >= 2;
    status.className = "qc-grid-status__state" + (ok ? "" : " is-warn");
    status.innerHTML = s.stale
      ? `As palavras foram alteradas. Clique em “Gerar nova grade” para atualizar.`
      : g.unplaced.length
        ? `Não foi possível conectar: ${g.unplaced.map((w) => esc(w.word)).join(", ")}. Ajuste as palavras e gere novamente.`
        : `${img("circle-check.svg", 18)}Grade gerada • ${g.placed.length} palavras conectadas • ${g.cols} colunas × ${g.rows} linhas`;
    const map = {}; g.cells.forEach((c) => (map[c.r + "," + c.c] = c.ch));
    const nums = {}; g.placed.forEach((p) => (nums[p.r + "," + p.c] = p.num));
    let html = "";
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      const ch = map[r + "," + c], n = nums[r + "," + c];
      html += ch
        ? `<span class="qc-xw__cell qc-xw__cell--on">${n ? `<span class="qc-xw__num">${n}</span>` : ""}<span class="qc-xw__ch">${s.showAnswers ? ch : ""}</span></span>`
        : `<span class="qc-xw__cell"></span>`;
    }
    const clues = (dir) => g.placed.filter((p) => p.dir === dir).sort((a, b) => a.num - b.num)
      .map((p) => `<li><span class="qc-xw__clue-n">${p.num}</span><span>${esc((s.words.find((w) => w.id === p.id) || {}).clue || "")}</span></li>`).join("");
    prev.innerHTML = `
      <div class="qc-xw__area">
        <div class="qc-xw__grid" role="img" aria-label="Grade com ${g.cols} colunas e ${g.rows} linhas" style="grid-template-columns: repeat(${g.cols}, 40px)">${html}</div>
      </div>
      <div class="qc-xw__clues">
        <div class="qc-xw__group"><h4>Horizontais</h4><ol>${clues("H")}</ol></div>
        <hr />
        <div class="qc-xw__group"><h4>Verticais</h4><ol>${clues("V")}</ol></div>
      </div>`;
  }

  /* ----------------------------------------------------------- validation */
  function validate(show) {
    const errs = [];
    const flag = (el, bad) => el && el.classList.toggle("is-invalid", !!(show && bad));
    const msg = (sel, text) => { const el = $(sel); if (!el) return; el.hidden = !(show && text); el.textContent = text || ""; };

    if (!state.tipo) errs.push("tipo");
    typeWrap.classList.toggle("is-invalid", show && !state.tipo); $("#tipo-error").hidden = !(show && !state.tipo);
    const enOk = enunciado.textContent.trim().length > 0 || !!enunciado.querySelector("img");
    if (!enOk) errs.push("enunciado");
    flag($("#enunciado-editor"), !enOk); $("#enunciado-error").hidden = !(show && !enOk);

    if (state.tipo === "multipla-escolha" || state.tipo === "verdadeiro-falso") {
      const s = state.tipo === "multipla-escolha" ? state.me : state.vf;
      let m = "";
      s.items.forEach((a) => { const bad = !a.text.trim(); flag($(`#alt-${a.id}`), bad); if (bad) m = "Preencha o texto de todas as alternativas."; });
      if (s.items.length < 2) m = "Adicione ao menos duas alternativas.";
      else if (!s.correct) m = m || "Marque a alternativa correta.";
      if (m) errs.push("alternativas");
      msg("#alts-error", m);
    }
    if (state.tipo === "ordenacao") {
      let m = "";
      state.ord.items.forEach((a) => { const bad = !a.text.trim(); flag($(`#ord-${a.id}`), bad); if (bad) m = "Preencha o texto de todos os elementos."; });
      if (state.ord.items.length < 2) m = "Adicione ao menos dois elementos.";
      if (m) errs.push("ordenacao");
      msg("#ord-error", m);
    }
    if (state.tipo === "correlacao") {
      const s = state.cor; let m = "";
      ["a", "b"].forEach((k) => {
        flag($(`#cor-${k}-title`), !s[k].title.trim()); if (!s[k].title.trim()) m = "Informe o título das duas colunas.";
        s[k].items.forEach((x) => { flag($(`#cor-${x.id}`), !x.text.trim()); if (!x.text.trim()) m = m || "Preencha todos os elementos das colunas."; });
      });
      const missing = s.a.items.filter((a) => !s.pairs[a.id]);
      document.querySelectorAll("[data-pair]").forEach((sel) => flag(sel, !s.pairs[sel.dataset.pair]));
      if (!m && missing.length) m = `Defina o correspondente de ${missing.length === 1 ? "1 elemento" : missing.length + " elementos"} da coluna A no gabarito.`;
      if (m) errs.push("correlacao");
      msg("#cor-error", m);
    }
    if (state.tipo === "palavras-cruzadas") {
      const s = state.pc; let m = "";
      s.words.forEach((w) => { flag($(`#pcw-${w.id}`), !!wordProblem(w)); flag($(`#pcc-${w.id}`), !w.clue.trim()); if (wordProblem(w) || !w.clue.trim()) m = "Preencha todas as palavras (somente letras) e suas dicas."; });
      if (s.words.length < 2) m = "Adicione ao menos duas palavras.";
      else if (!m && (s.stale || !s.grid)) m = "Gere a grade novamente para incluir as alterações.";
      else if (!m && s.grid.unplaced.length) m = "Todas as palavras precisam estar conectadas na grade.";
      if (m) errs.push("palavras");
      msg("#pc-error", m);
      if ($("#pc-list")) updatePcMeta();
    }
    return errs;
  }

  /* ------------------------------------------------- autosave / actions */
  const createBtn = $("#btn-create"), formMsg = $("#form-msg");
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())} em ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
  let saveTimer;
  function snapshot() { return JSON.stringify({ tipo: state.tipo, enunciado: enunciado.innerHTML, dados: state }); }
  function save(manual) {
    try { sessionStorage.setItem("ava-eja:questao-etapa-2", snapshot()); } catch (e) { /* storage indisponível */ }
    $("#autosave-text").textContent = `${manual ? "Rascunho salvo" : "Salvo automaticamente"} às ${stamp(new Date())} por Alice Souza`;
  }
  function changed() {
    const errs = validate(submitted);
    createBtn.setAttribute("aria-disabled", String(errs.length > 0));
    if (!formMsg.hidden && !formMsg.classList.contains("is-ok")) formMsg.hidden = errs.length === 0;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => save(false), 1500);
  }

  $("#btn-preview").addEventListener("click", (e) => {
    if (!state.tipo) { e.preventDefault(); submitted = true; validate(true); typeBtn.focus(); return; }
    save(false);
  });
  $("#btn-draft").addEventListener("click", () => { save(true); showMsg("Rascunho salvo.", true); });
  $("#qc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitted = true;
    const errs = validate(true);
    if (errs.length) {
      showMsg("Revise os campos destacados antes de criar a questão.", false);
      const first = document.querySelector(".is-invalid, .qc-answer__error:not([hidden]), .field__error:not([hidden])");
      if (first) { first.scrollIntoView({ behavior: "smooth", block: "center" }); const f = first.matches("input,textarea,select,button") ? first : first.querySelector("input,textarea,select,button,[contenteditable]") || (first.id === "tipo-error" ? typeBtn : null); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    save(true);
    showMsg(`Questão de ${byId[state.tipo].label.toLowerCase()} criada com sucesso.`, true);
  });
  function showMsg(text, ok) { formMsg.textContent = text; formMsg.classList.toggle("is-ok", ok); formMsg.hidden = false; }

  $("#content-toggle").addEventListener("click", (e) => {
    const b = e.currentTarget, open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); b.classList.toggle("is-open", open);
    b.setAttribute("aria-label", open ? "Recolher conteúdo da questão" : "Expandir conteúdo da questão");
    $("#content-body").hidden = !open;
  });

  /* ------------------------------------------------------------------ init */
  const q = new URLSearchParams(location.search).get("tipo");
  setTipo(byId[q] ? q : "", true);
})();
