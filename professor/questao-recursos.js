/* Professor · Criar questão · Etapa 2 – recursos de acessibilidade, fonte e referência
 * States (?state=): vazio | enem | referencia-preenchida
 *  - vazio: fonte sem seleção
 *  - enem: fonte "ENEM" + link "Adicionar referência"
 *  - referencia-preenchida: fonte "ENEM" + editor de referência preenchido
 */
(function () {
  "use strict";

  const A = "assets/prof-qrec/";
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------------------------------------------------------------- Toggles */
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.classList.toggle("is-open", open && btn.dataset.toggle === "content");
      target.hidden = !open;
    });
  });

  /* ------------------------------------------------------- Tipo de questão */
  const typeBtn = $("#type-button");
  const typeList = $("#type-list");
  function closeTypes() { typeList.hidden = true; typeBtn.setAttribute("aria-expanded", "false"); }
  typeBtn.addEventListener("click", () => {
    const open = typeList.hidden;
    typeList.hidden = !open;
    typeBtn.setAttribute("aria-expanded", String(open));
    if (open) (typeList.querySelector('[aria-selected="true"]') || typeList.firstElementChild).focus();
  });
  function chooseType(li) {
    typeList.querySelectorAll("li").forEach((o) => o.setAttribute("aria-selected", String(o === li)));
    $("#type-name").textContent = li.textContent;
    $("#type-desc").textContent = li.dataset.desc;
    closeTypes();
    typeBtn.focus();
  }
  typeList.addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) chooseType(li); });
  typeList.addEventListener("keydown", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    if (e.key === "ArrowDown") { e.preventDefault(); (li.nextElementSibling || li).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (li.previousElementSibling || li).focus(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chooseType(li); }
    else if (e.key === "Escape") { closeTypes(); typeBtn.focus(); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".type-select")) closeTypes(); });

  /* ------------------------------------------------------------- Editors */
  const TOOLS = [
    [["ed-bold", "Negrito", "bold"], ["ed-italic", "Itálico", "italic"], ["ed-underline", "Sublinhado", "underline"], ["ed-text-more", "Mais opções de texto"]],
    [["ed-paragraph", "Alinhar à esquerda", "justifyLeft"], ["ed-align-center", "Centralizar", "justifyCenter"], ["ed-ordered-list", "Lista numerada", "insertOrderedList"], ["ed-paragraph-more", "Mais opções de parágrafo"]],
    [["ed-link", "Inserir link"], ["ed-image", "Inserir imagem"], ["ed-smile", "Inserir emoji"], ["ed-insert-more", "Mais inserções"]],
  ];
  const MORE = [["ed-undo", "Desfazer", "undo"], ["ed-redo", "Refazer", "redo"], ["ed-more", "Mais ações"]];
  const toolBtn = ([icon, label, cmd]) =>
    `<button class="editor__btn" type="button" aria-label="${label}"${cmd ? ` data-cmd="${cmd}"` : ""}${cmd === "undo" || cmd === "redo" ? " disabled" : ""}><img src="${A}${icon}.svg" width="24" height="24" alt="" /></button>`;

  document.querySelectorAll("[data-editor]").forEach((ed) => {
    const bar = $(".editor__toolbar", ed);
    const content = $(".editor__content", ed);
    bar.innerHTML =
      `<div class="editor__groups">${TOOLS.map((g) => `<div class="editor__group">${g.map(toolBtn).join("")}</div>`).join("")}</div>` +
      `<div class="editor__group">${MORE.map(toolBtn).join("")}</div>`;
    bar.addEventListener("mousedown", (e) => { if (e.target.closest("[data-cmd]")) e.preventDefault(); });
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cmd]");
      if (!b || b.disabled) return;
      content.focus();
      document.execCommand(b.dataset.cmd, false, null);
      update();
    });
    function update() {
      bar.querySelector('[data-cmd="undo"]').disabled = !content.textContent.trim();
      ["bold", "italic", "underline"].forEach((c) => {
        const b = bar.querySelector(`[data-cmd="${c}"]`);
        try { b.setAttribute("aria-pressed", String(document.activeElement === content && document.queryCommandState(c))); } catch (_) { /* noop */ }
      });
    }
    content.addEventListener("input", () => {
      if (!content.textContent.trim() && !content.querySelector("img")) content.innerHTML = "";
      update();
      validate();
      touch();
    });
    content.addEventListener("keyup", update);
    content.addEventListener("mouseup", update);
    ed.update = update;
  });

  /* -------------------------------------------------- Accessibility media */
  const WAVE = [16, 16, 16, 16, 16, 16, 16, 16, 31, 31, 31, 31, 11, 15, 29, 29, 33, 33, 33, 33, 19, 19, 19, 19,
    12, 12, 12, 12, 18, 18, 18, 18, 22, 22, 22, 22, 11, 15, 29, 29, 33, 33, 33, 33, 19, 19, 19];

  const AUDIO_HINT = "Formatos de arquivo aceitos: <strong>MP3</strong>, <strong>WAV</strong>, <strong>AAC</strong>, <strong>M4A</strong>, <strong>OGG</strong> e <strong>FLAC</strong> com até 600MB.";
  const VIDEO_HINT = "Formatos de arquivo aceitos: <strong>MP4</strong>, <strong>MOV</strong> e <strong>WEBM</strong> com até 600MB.";

  const RESOURCES = [
    { id: "audiodescricao", icon: "audio-description", title: "Audiodescrição",
      desc: "Áudio que descreve imagens, cenas ou elementos visuais para compreender a questão.",
      kind: "audio", initial: { type: "file", name: "audio-questao2354.mp4", size: "1.2MB" } },
    { id: "leitura", icon: "select-to-speak", title: "Leitura em áudio",
      desc: "Áudio com a leitura do texto da questão em voz alta.", kind: "audio", initial: null },
    { id: "audiodescricao-gravada", icon: "audio-description", title: "Audiodescrição",
      desc: "Áudio que descreve imagens, cenas ou elementos visuais para compreender a questão.",
      kind: "audio", initial: { type: "recorded", duration: 330 } },
    { id: "video", icon: "slideshow", title: "Apresentação em vídeo",
      desc: "Vídeo que apresenta ou explica o conteúdo da questão em formato audiovisual.",
      kind: "video", initial: { type: "video", poster: "apresentacao" } },
    { id: "libras", icon: "sign-language", title: "Vídeo Libras / Linguagem de Sinais",
      desc: "Vídeo com a tradução ou interpretação do conteúdo da questão em Libras.",
      kind: "video", initial: { type: "video", poster: "libras" } },
  ];

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(b / 1024)) + "KB");

  const list = $("#resources");

  function panelHTML(r) {
    const noun = r.kind === "audio" ? "áudio" : "vídeo";
    return `
      <div class="upload-group">
        <p class="upload-group__label">Grave um ${noun}</p>
        <button class="btn qrec-btn-soft" type="button" data-action="record">
          <img src="${A}mic.svg" width="20" height="20" alt="" /> <span>GRAVAR ${noun.toUpperCase()}</span>
        </button>
        <p class="upload-group__hint">Ao escolher gravar ${noun}, utilizaremos seu ${r.kind === "audio" ? "microfone para captar o som" : "microfone e sua câmera para captar o som e a imagem"}</p>
      </div>
      <div class="upload-group">
        <p class="upload-group__label">Envie um arquivo de ${noun}</p>
        <label class="btn qrec-btn-soft">
          <input class="visually-hidden" type="file" accept="${r.kind}/*" data-action="upload" />
          <img src="${A}upload.svg" width="20" height="20" alt="" /> ADICIONAR ARQUIVO
        </label>
        <p class="upload-group__hint">${r.kind === "audio" ? AUDIO_HINT : VIDEO_HINT}</p>
      </div>`;
  }

  const delBtn = (label) =>
    `<button class="icon-del" type="button" data-action="delete" aria-label="${label}"><img src="${A}delete.svg" width="20" height="20" alt="" /></button>`;

  function mediaHTML(r, m) {
    if (m.type === "file") {
      return `<div class="media media--file">
        <div class="media-card"><p class="media-card__name">${m.name}</p><p class="media-card__size">${m.size}</p></div>
        ${delBtn("Excluir arquivo " + m.name)}</div>`;
    }
    if (m.type === "recorded") {
      return `<div class="media media--audio">
        <div class="media-card">
          <p class="media-card__label">Áudio gravado</p>
          <div class="player">
            <button class="player__play" type="button" data-action="play" aria-pressed="false" aria-label="Reproduzir áudio"><img src="${A}play.svg" width="20" height="20" alt="" /></button>
            <div class="player__track">
              <div class="wave" aria-hidden="true">${WAVE.map((h) => `<span style="height:${h}px"></span>`).join("")}</div>
              <p class="player__time"><span data-pos>00:00</span><span>${fmt(m.duration)}</span></p>
            </div>
          </div>
        </div>
        ${delBtn("Excluir áudio gravado")}</div>`;
    }
    const inner = m.src
      ? `<video src="${m.src}" preload="metadata" playsinline></video>`
      : m.poster === "libras"
        ? `<img class="video-frame__img" src="${A}libras.png" width="383" height="240" alt="Prévia do vídeo em Libras: intérprete sinalizando" />`
        : `<span class="video-frame__poster" aria-hidden="true"></span>`;
    return `<div class="media media--video">
      <div class="media-card">
        <p class="media-card__label">Vídeo gravado</p>
        <div class="video-frame">${inner}
          <button class="video-frame__play" type="button" data-action="play-video" aria-label="Reproduzir vídeo"><img src="${A}play.svg" width="20" height="20" alt="" /></button>
        </div>
      </div>
      ${delBtn("Excluir vídeo")}</div>`;
  }

  const state = {};

  function render(r) {
    const el = document.getElementById("res-" + r.id);
    const s = state[r.id];
    const head = $(".resource__head", el);
    const panel = $(".upload-panel", el);
    const slot = $(".resource__media", el);
    head.setAttribute("aria-expanded", String(s.open));
    panel.hidden = !s.open;
    slot.innerHTML = s.media ? mediaHTML(r, s.media) : "";
    slot.hidden = !s.media;
  }

  list.innerHTML = RESOURCES.map((r, i) => `
    ${i ? '<hr class="resources__rule" />' : ""}
    <div class="resource" id="res-${r.id}">
      <button class="resource__head" type="button" aria-expanded="false" aria-controls="panel-${r.id}">
        <span class="resource__icon"><img src="${A}${r.icon}.svg" width="24" height="24" alt="" /></span>
        <span class="resource__text"><span class="resource__title">${r.title}</span><span class="resource__desc">${r.desc}</span></span>
        <img class="resource__chev" src="../shared/assets/mobile-select-arrow.svg" width="24" height="24" alt="" />
      </button>
      <div class="upload-panel" id="panel-${r.id}">${panelHTML(r)}</div>
      <div class="resource__media" aria-live="polite"></div>
    </div>`).join("");

  RESOURCES.forEach((r) => {
    state[r.id] = { open: !r.initial, media: r.initial ? { ...r.initial } : null, timer: null };
    render(r);
    const el = document.getElementById("res-" + r.id);

    el.addEventListener("click", (e) => {
      const s = state[r.id];
      const act = e.target.closest("[data-action], .resource__head");
      if (!act) return;
      if (act.classList.contains("resource__head")) { s.open = !s.open; render(r); return; }
      const a = act.dataset.action;
      if (a === "delete") {
        stop(s);
        if (s.media && s.media.src) URL.revokeObjectURL(s.media.src);
        s.media = null; s.open = true; render(r); touch();
        $(".resource__head", el).focus();
      } else if (a === "record") {
        record(r, s, act);
      } else if (a === "play") {
        togglePlay(s, el, act);
      } else if (a === "play-video") {
        const v = $("video", el);
        const frame = $(".video-frame", el);
        if (!v) return;
        if (v.paused) { v.play(); frame.classList.add("is-playing"); act.setAttribute("aria-label", "Pausar vídeo"); }
        else { v.pause(); frame.classList.remove("is-playing"); act.setAttribute("aria-label", "Reproduzir vídeo"); }
      }
    });

    el.addEventListener("change", (e) => {
      const input = e.target.closest('[data-action="upload"]');
      if (!input || !input.files.length) return;
      const f = input.files[0];
      const s = state[r.id];
      s.media = r.kind === "audio"
        ? { type: "file", name: f.name, size: fmtSize(f.size) }
        : { type: "video", src: URL.createObjectURL(f) };
      s.open = false;
      input.value = "";
      render(r); touch();
    });
  });

  /* Mock recording: no device access – simulates a timer, then shows the player. */
  function record(r, s, btn) {
    const label = $("span", btn);
    if (s.recording) {
      clearInterval(s.recording.id);
      const secs = Math.max(1, s.recording.secs);
      s.recording = null;
      btn.classList.remove("is-recording");
      s.media = r.kind === "audio" ? { type: "recorded", duration: secs } : { type: "video", poster: r.id === "libras" ? "libras" : "apresentacao" };
      s.open = false;
      render(r); touch();
      return;
    }
    s.recording = { secs: 0, id: setInterval(() => { s.recording.secs++; label.textContent = "PARAR GRAVAÇÃO · " + fmt(s.recording.secs); }, 1000) };
    btn.classList.add("is-recording");
    label.textContent = "PARAR GRAVAÇÃO · 00:00";
  }

  function stop(s) { if (s.timer) { clearInterval(s.timer); s.timer = null; } if (s.recording) { clearInterval(s.recording.id); s.recording = null; } }

  /* Mock playback: walks the waveform and the clock. */
  function togglePlay(s, el, btn) {
    const bars = el.querySelectorAll(".wave span");
    const pos = $("[data-pos]", el);
    if (s.timer) { clearInterval(s.timer); s.timer = null; btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Reproduzir áudio"); return; }
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "Pausar áudio");
    if (s.elapsed == null || s.elapsed >= s.media.duration) s.elapsed = 0;
    const step = Math.max(1, s.media.duration / 40);
    s.timer = setInterval(() => {
      s.elapsed = Math.min(s.media.duration, s.elapsed + step);
      const ratio = s.elapsed / s.media.duration;
      bars.forEach((b, i) => b.classList.toggle("is-played", i / bars.length < ratio));
      pos.textContent = fmt(s.elapsed);
      if (ratio >= 1) { clearInterval(s.timer); s.timer = null; btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Reproduzir áudio"); }
    }, 250);
  }

  /* -------------------------------------------------- Fonte / referência */
  const fonte = $("#fonte");
  const refAdd = $("#ref-add");
  const ref = $("#ref");
  const refText = $("#ref-text");
  const REF_SAMPLE = "GOLDEMBERG, José. S.O.S. Planeta Terra: o efeito estufa. São Paulo: Brasiliense, 1990.";

  function syncFonte() {
    const has = !!fonte.value;
    if (!has) { ref.hidden = true; refAdd.hidden = true; return; }
    refAdd.hidden = !ref.hidden;
  }
  fonte.addEventListener("change", () => { syncFonte(); touch(); });
  refAdd.addEventListener("click", () => {
    ref.hidden = false; refAdd.hidden = true; refText.focus();
  });
  $("#ref-remove").addEventListener("click", () => {
    refText.innerHTML = ""; ref.hidden = true; refAdd.hidden = false; refAdd.focus(); touch();
  });

  /* ------------------------------------------------- Autosave / actions */
  const createBtn = $("#create");
  function validate() { createBtn.disabled = !$("#enunciado").textContent.trim(); }
  let saveT;
  function touch() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      $("#autosave-text").textContent = `Salvo automaticamente às ${p(d.getHours())}:${p(d.getMinutes())} em ${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} por Alice Souza`;
    }, 800);
  }
  $("#save-draft").addEventListener("click", touch);

  /* ----------------------------------------------------------- ?state= */
  const initial = new URLSearchParams(location.search).get("state") || "vazio";
  if (initial === "enem" || initial === "referencia-preenchida") {
    fonte.value = "enem";
    if (initial === "referencia-preenchida") { ref.hidden = false; refText.textContent = REF_SAMPLE; }
  }
  syncFonte();
  document.querySelectorAll("[data-editor]").forEach((ed) => ed.update());
  validate();
})();
