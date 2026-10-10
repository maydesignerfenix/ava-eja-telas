/* Professor · Criar questão · Visualizar prévia
 * Query params:
 *   ?tipo=multipla-escolha|discursiva|resposta-curta|verdadeiro-falso|ordenacao|correlacao
 *   ?state=resumo|recursos|recursos-abertos|midias
 *     resumo           – página de resumo (prévia fechada)            Figma 4139:49846
 *     recursos         – prévia aberta, painel de acessibilidade fechado (padrão) 4139:49987
 *     recursos-abertos – painel "Recursos de acessibilidade" aberto   4139:50032
 *     midias           – painel aberto com áudios e vídeos expandidos 4139:50131
 */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const TIPOS = ["multipla-escolha", "discursiva", "resposta-curta", "verdadeiro-falso", "ordenacao", "correlacao"];
  const STATES = ["resumo", "recursos", "recursos-abertos", "midias"];
  const tipo = TIPOS.includes(params.get("tipo")) ? params.get("tipo") : "multipla-escolha";
  let state = STATES.includes(params.get("state")) ? params.get("state") : "recursos";

  const STEM = 'Placa em um petshop: "Traga seu cão para banho e tosa e leve para casa um novo gatinho!"';

  // Mock question content per type (matches the Figma frames).
  const QUESTIONS = {
    "multipla-escolha": {
      label: "Única escolha",
      text: STEM + "  Ao ler essa placa, é possível entender que, ao levar o cão para o serviço oferecido:",
      options: [
        "ele entrará cão e sairá literalmente transformado em um gato",
        "ocorrerá uma transformação física da espécie do animal",
        "seu pelo ficará com uma aparência muito bem cuidada e atraente",
        "o animal precisará passar por um processo veterinário completo",
      ],
    },
    "verdadeiro-falso": {
      label: "Verdadeiro ou Falso",
      text: STEM,
      hint: "Leia as afirmações e selecione Verdadeiro ou Falso para cada uma.",
      statements: [
        "A placa anuncia serviços de banho e tosa para cães.",
        "O anúncio promete transformar um cão em um gato.",
        "A expressão “novo gatinho” pode ter sentido figurado.",
        "A placa apresenta o preço do serviço oferecido.",
      ],
    },
    correlacao: {
      label: "Correlação",
      text: STEM + "\nRelacione cada conceito ao seu significado.",
      hint: "Selecione a letra correspondente a cada conceito. Use cada significado uma vez.",
      concepts: ["Sentido literal", "Sentido figurado", "Finalidade do anúncio"],
      meanings: [
        "Uso de uma expressão com significado diferente do habitual.",
        "Intenção de convencer o cliente a contratar o serviço.",
        "Significado direto de uma palavra ou expressão.",
      ],
    },
    ordenacao: {
      label: "Ordenação",
      text: "Um cliente leu a placa “Traga seu cão para banho e tosa e leve para casa um novo gatinho!” e decidiu usar o serviço. Organize as ações na sequência em que devem acontecer.",
      hint: "Arraste os itens ou use as setas para mudar a ordem.",
      items: [
        "Buscar o cão após a conclusão do serviço.",
        "Realizar o banho e a tosa do cão.",
        "Ler o anúncio e decidir contratar o serviço.",
        "Levar o cão ao petshop no horário combinado.",
      ],
    },
    "resposta-curta": {
      label: "Resposta curta",
      text: STEM + "\nQual serviço o petshop oferece para os cães?",
      hint: "Responda em poucas palavras.",
      placeholder: "Digite sua resposta aqui.",
      max: 100,
    },
    discursiva: {
      label: "Discursiva",
      text: STEM + "\nExplique o sentido da expressão “novo gatinho” nesse anúncio e como ela ajuda a atrair os clientes.",
      hint: "Escreva sua interpretação em um ou mais parágrafos.",
      placeholder: "Digite sua resposta aqui.",
    },
  };

  const q = QUESTIONS[tipo];
  const LETTERS = "ABCDEFGH";
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ---------- Links back to the editor keep ?tipo= ---------- */
  document.querySelectorAll(".js-edit-link").forEach((a) => {
    const url = new URL(a.getAttribute("href"), location.href);
    url.searchParams.set("tipo", tipo);
    a.href = url.pathname.split("/").pop() + url.search;
  });
  document.getElementById("sum-tipo").textContent = q.label;

  /* ---------- Question rendering ---------- */
  const form = document.getElementById("question");

  function header(extraHint) {
    return `<div class="qp-question__group">
      <p class="qp-question__text" id="q-text">${esc(q.text)}</p>
      ${q.hint || extraHint ? `<p class="qp-hint" id="q-hint">${esc(q.hint || extraHint)}</p>` : ""}
    </div>`;
  }

  const renderers = {
    "multipla-escolha"() {
      return `${header()}
      <fieldset class="qp-options" aria-labelledby="q-text">
        ${q.options.map((o, i) => `
          <label class="qp-option">
            <input type="radio" name="alternativa" value="${LETTERS[i]}" />
            <span class="qp-option__letter" aria-hidden="true">${LETTERS[i]}</span>
            <span class="qp-option__text"><span class="visually-hidden">Alternativa ${LETTERS[i]}: </span>${esc(o)}</span>
          </label>`).join("")}
      </fieldset>`;
    },
    "verdadeiro-falso"() {
      return `${header()}
      <div class="qp-tf">
        ${q.statements.map((s, i) => `
          <fieldset class="qp-tf__row">
            <legend class="visually-hidden">Afirmação ${i + 1}</legend>
            <p class="qp-tf__statement" id="vf-${i}">${esc(s)}</p>
            <div class="qp-tf__choices" role="radiogroup" aria-labelledby="vf-${i}">
              <label class="qp-radio"><input type="radio" name="vf-${i}" value="V" /><span class="qp-radio__mark" aria-hidden="true"></span>Verdadeiro</label>
              <label class="qp-radio"><input type="radio" name="vf-${i}" value="F" /><span class="qp-radio__mark" aria-hidden="true"></span>Falso</label>
            </div>
          </fieldset>`).join("")}
      </div>`;
    },
    correlacao() {
      const opts = q.meanings.map((_, i) => `<option value="${LETTERS[i]}">${LETTERS[i]}</option>`).join("");
      const rows = q.concepts.map((c, i) => `
        <div class="qp-match__concept" style="grid-row:${i + 2};grid-column:1">
          <label for="corr-${i}">${esc(c)}</label>
          <span class="qp-match__select"><select id="corr-${i}" data-concept="${i}"><option value="">Selecione</option>${opts}</select></span>
        </div>
        <div class="qp-match__card" style="grid-row:${i + 2};grid-column:2" data-letter="${LETTERS[i]}">
          <b>${LETTERS[i]}</b><span>${esc(q.meanings[i])}</span>
        </div>`).join("");
      return `${header()}
      <div class="qp-match">
        <p class="qp-match__heading" style="grid-row:1;grid-column:1">Conceitos</p>
        <p class="qp-match__heading qp-match__heading--right" style="grid-row:1;grid-column:2">Significados</p>
        ${rows}
      </div>`;
    },
    ordenacao() {
      return `${header()}
      <ol class="qp-order" id="order-list" aria-describedby="q-hint">
        ${q.items.map((t, i) => `
          <li class="qp-order__item" draggable="true" tabindex="0" data-id="${i}">
            <span class="qp-order__handle" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
            <span class="qp-order__pos" aria-hidden="true"></span>
            <span class="qp-order__text">${esc(t)}</span>
            <span class="qp-order__moves">
              <button type="button" data-move="-1" aria-label="Mover para cima"><span aria-hidden="true">↑</span></button>
              <button type="button" data-move="1" aria-label="Mover para baixo"><span aria-hidden="true">↓</span></button>
            </span>
          </li>`).join("")}
      </ol>
      <p class="visually-hidden" aria-live="polite" id="order-live"></p>`;
    },
    "resposta-curta"() {
      return `${header()}
      <div class="qp-answer">
        <label class="qp-answer__label" for="answer">Sua resposta</label>
        <input class="input" id="answer" type="text" maxlength="${q.max}" placeholder="${q.placeholder}" aria-describedby="answer-count" />
        <span class="qp-answer__count" id="answer-count">0/${q.max}</span>
      </div>`;
    },
    discursiva() {
      return `${header()}
      <div class="qp-answer">
        <label class="qp-answer__label" for="answer">Sua resposta</label>
        <textarea class="textarea" id="answer" placeholder="${q.placeholder}" aria-describedby="q-hint"></textarea>
      </div>`;
    },
  };

  form.dataset.tipo = tipo;
  form.innerHTML = renderers[tipo]();
  form.addEventListener("submit", (e) => e.preventDefault());

  /* ---------- Type-specific interactions ---------- */
  if (tipo === "correlacao") {
    const selects = [...form.querySelectorAll("select")];
    const sync = () => {
      const used = selects.map((s) => s.value).filter(Boolean);
      selects.forEach((s) => {
        s.parentElement.classList.toggle("is-filled", !!s.value);
        [...s.options].forEach((o) => {
          if (o.value) o.disabled = used.includes(o.value) && s.value !== o.value;
        });
      });
      form.querySelectorAll(".qp-match__card").forEach((c) => c.classList.toggle("is-used", used.includes(c.dataset.letter)));
    };
    selects.forEach((s) => s.addEventListener("change", sync));
  }

  if (tipo === "resposta-curta") {
    const input = document.getElementById("answer");
    const count = document.getElementById("answer-count");
    input.addEventListener("input", () => (count.textContent = `${input.value.length}/${q.max}`));
  }

  if (tipo === "ordenacao") {
    const list = document.getElementById("order-list");
    const live = document.getElementById("order-live");
    const refresh = () => {
      const items = [...list.children];
      items.forEach((li, i) => {
        li.querySelector(".qp-order__pos").textContent = i + 1;
        li.querySelector('[data-move="-1"]').disabled = i === 0;
        li.querySelector('[data-move="1"]').disabled = i === items.length - 1;
        li.setAttribute("aria-label", `Posição ${i + 1} de ${items.length}: ${li.querySelector(".qp-order__text").textContent}. Use Alt + setas para mover.`);
      });
    };
    const move = (li, dir, focusSel) => {
      const sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib) return;
      dir < 0 ? list.insertBefore(li, sib) : list.insertBefore(sib, li);
      refresh();
      const pos = [...list.children].indexOf(li) + 1;
      live.textContent = `Item movido para a posição ${pos}.`;
      const target = focusSel && li.querySelector(focusSel);
      (target && !target.disabled ? target : li).focus();
    };
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-move]");
      if (btn) move(btn.closest("li"), Number(btn.dataset.move), `[data-move="${btn.dataset.move}"]`);
    });
    list.addEventListener("keydown", (e) => {
      const li = e.target.closest("li");
      if (!li || e.target !== li) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dir = e.key === "ArrowUp" ? -1 : 1;
        if (e.altKey) move(li, dir);
        else (dir < 0 ? li.previousElementSibling : li.nextElementSibling)?.focus();
      }
    });
    let dragged = null;
    list.addEventListener("dragstart", (e) => {
      dragged = e.target.closest("li");
      dragged.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", dragged.dataset.id);
    });
    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const over = e.target.closest("li");
      list.querySelectorAll(".is-over").forEach((el) => el !== over && el.classList.remove("is-over"));
      if (over && over !== dragged) over.classList.add("is-over");
    });
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      const over = e.target.closest("li");
      if (over && dragged && over !== dragged) {
        const items = [...list.children];
        items.indexOf(dragged) < items.indexOf(over) ? over.after(dragged) : list.insertBefore(dragged, over);
        refresh();
        live.textContent = `Item movido para a posição ${[...list.children].indexOf(dragged) + 1}.`;
      }
    });
    list.addEventListener("dragend", () => {
      dragged?.classList.remove("is-dragging");
      list.querySelectorAll(".is-over").forEach((el) => el.classList.remove("is-over"));
      dragged = null;
    });
    refresh();
  }

  /* ---------- Audio players (custom UI from Figma, driving <audio>) ---------- */
  // Waveform bar heights exactly as drawn in Figma (4139:50203).
  const BARS = [13,13,13,13,13,13,13,13,17,17,17,17,17,17,17,17,19,19,19,19,19,19,19,19,13,13,15,15,25,25,25,25,27,27,15,15,27,23,15,27,13,7,5,18,18,18,18,18,18,18];
  const fmt = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const media = [];

  document.querySelectorAll(".qp-audio").forEach((box) => {
    const label = box.dataset.label;
    box.innerHTML = `
      <button class="qp-audio__play" type="button" aria-label="Reproduzir ${label}">
        <img src="assets/prof-qprev/play-arrow.svg" width="20" height="20" alt="" /><span class="is-pause" aria-hidden="true"></span>
      </button>
      <div class="qp-audio__track">
        <div class="qp-wave" role="slider" tabindex="0" aria-label="Progresso: ${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="00:00">
          ${BARS.map((h) => `<i style="height:${h}px"></i>`).join("")}
        </div>
        <div class="qp-audio__times"><span class="js-cur">00:00</span><span class="js-dur">05:30</span></div>
      </div>
      <audio preload="metadata" src="${box.dataset.src}"></audio>`;
    const audio = box.querySelector("audio");
    const btn = box.querySelector(".qp-audio__play");
    const wave = box.querySelector(".qp-wave");
    const bars = [...wave.children];
    const cur = box.querySelector(".js-cur");
    const dur = box.querySelector(".js-dur");
    media.push(audio);

    const paint = () => {
      const d = audio.duration || 0;
      const p = d ? audio.currentTime / d : 0;
      const n = Math.round(p * bars.length);
      bars.forEach((b, i) => b.classList.toggle("is-played", i < n));
      cur.textContent = fmt(audio.currentTime);
      wave.setAttribute("aria-valuenow", Math.round(p * 100));
      wave.setAttribute("aria-valuetext", `${fmt(audio.currentTime)} de ${fmt(d)}`);
    };
    audio.addEventListener("loadedmetadata", () => { dur.textContent = fmt(audio.duration); paint(); });
    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("play", () => { box.classList.add("is-playing"); btn.setAttribute("aria-label", `Pausar ${label}`); });
    const stop = () => { box.classList.remove("is-playing"); btn.setAttribute("aria-label", `Reproduzir ${label}`); };
    audio.addEventListener("pause", stop);
    audio.addEventListener("ended", stop);
    btn.addEventListener("click", () => (audio.paused ? playOnly(audio) : audio.pause()));
    const seek = (ratio) => { if (audio.duration) { audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration; paint(); } };
    wave.addEventListener("click", (e) => {
      const r = wave.getBoundingClientRect();
      seek((e.clientX - r.left) / r.width);
    });
    wave.addEventListener("keydown", (e) => {
      if (!audio.duration) return;
      const step = 5 / audio.duration;
      const p = audio.currentTime / audio.duration;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); seek(p + step); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); seek(p - step); }
      if (e.key === "Home") { e.preventDefault(); seek(0); }
      if (e.key === "End") { e.preventDefault(); seek(1); }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); btn.click(); }
    });
  });

  document.querySelectorAll(".qp-video video").forEach((v) => {
    media.push(v);
    v.addEventListener("play", () => pauseOthers(v));
  });
  document.querySelectorAll(".qp-video__play").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = btn.closest(".qp-video");
      const v = wrap.querySelector("video");
      wrap.classList.add("is-started");
      v.controls = true;
      const p = v.play(); if (p) p.catch(() => {});
      v.focus();
    });
  });

  function pauseOthers(except) { media.forEach((m) => m !== except && !m.paused && m.pause()); }
  function playOnly(m) { pauseOthers(m); const p = m.play(); if (p) p.catch(() => {}); }
  function stopAll() { media.forEach((m) => !m.paused && m.pause()); }

  /* ---------- Accessibility panel ---------- */
  const modal = document.getElementById("preview");
  const panel = document.getElementById("a11y-panel");
  const tab = document.getElementById("a11y-open");

  function setPanel(open, focus) {
    panel.hidden = !open;
    modal.classList.toggle("is-panel-open", open);
    tab.setAttribute("aria-expanded", String(open));
    if (!open) stopAll();
    if (focus) (open ? panel.querySelector(".qp-res__toggle") : tab).focus();
  }

  function setResource(li, open) {
    const btn = li.querySelector(".qp-res__toggle");
    const body = li.querySelector(".qp-res__panel");
    btn.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
    const lbl = li.querySelector("[data-long]");
    if (lbl) lbl.textContent = open ? lbl.dataset.long : lbl.dataset.short;
    if (!open) body.querySelectorAll("audio, video").forEach((m) => !m.paused && m.pause());
  }

  panel.querySelectorAll(".qp-res").forEach((li) => {
    li.querySelector(".qp-res__toggle").addEventListener("click", (e) => {
      setResource(li, e.currentTarget.getAttribute("aria-expanded") !== "true");
    });
  });

  tab.addEventListener("click", () => { setPanel(true, true); updateUrl("recursos-abertos"); });
  document.getElementById("a11y-close").addEventListener("click", () => { setPanel(false, true); updateUrl("recursos"); });

  /* ---------- Modal open / close ---------- */
  function updateUrl(s) {
    state = s;
    const p = new URLSearchParams(location.search);
    p.set("tipo", tipo);
    p.set("state", s);
    history.replaceState(null, "", "?" + p.toString());
  }

  function openPreview() {
    if (!modal.open) modal.showModal();
    document.getElementById("preview-body").scrollTop = 0;
  }

  document.getElementById("open-preview").addEventListener("click", () => {
    setPanel(false);
    openPreview();
    updateUrl("recursos");
    document.getElementById("close-preview").focus();
  });
  document.getElementById("close-preview").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => {
    stopAll();
    updateUrl("resumo");
    document.getElementById("open-preview").focus();
  });
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  /* ---------- Initial state ---------- */
  if (state !== "resumo") {
    const open = state === "recursos-abertos" || state === "midias";
    setPanel(open);
    if (state === "midias") panel.querySelectorAll(".qp-res").forEach((li) => setResource(li, true));
    openPreview();
  }
})();
