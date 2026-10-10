(function () {
  "use strict";

  // Mock activity matching the Figma frames. Replace with the API response.
  const QUESTIONS = [
    {
      stem: 'Placa em um petshop: "Traga seu cão para banho e tosa e leve para casa um novo gatinho!"  Ao ler essa placa, é possível entender que, ao levar o cão para o serviço oferecido:',
      options: [
        "ele entrará cão e sairá literalmente transformado em um gato",
        "ocorrerá uma transformação física da espécie do animal",
        "seu pelo ficará com uma aparência muito bem cuidada e atraente",
        "o animal precisará passar por um processo veterinário completo",
      ],
    },
    {
      stem: 'Texto: "Mãe, o lanche já está pronto? Estou morrendo de fome!" / "Está quase, filha! Estou morrendo de calor com o forno ligado!"\n\nConsiderando o contexto da conversa, a linguagem empregada é:',
      options: [
        "formal, mas inadequada para a situação",
        "informal e inadequada para o contexto familiar",
        "formal e adequada, seguindo a norma-padrão",
        "informal e expressiva, adequada à situação",
      ],
    },
    {
      stem: 'Tirinha com expressão idiomática\nUma tirinha em que um personagem chama outro de "pé de chinelo" ao recusar convidá-lo para uma festa.\n\nNo contexto da tirinha, a expressão "pé de chinelo" quer dizer que a pessoa é vista como:',
      options: [
        "alguém muito divertido e alegre",
        "alguém pobre e insignificante socialmente",
        "alguém sensível e emotivo",
        "alguém solitário, sem amigos",
      ],
    },
  ];
  const LETTERS = ["A", "B", "C", "D"];
  // Answers shown in the Figma "Revisar respostas" frame.
  const FIGMA_ANSWERS = [1, 3, 0];

  const root = document.getElementById("ra");
  const stemEl = document.getElementById("question-stem");
  const optionsEl = document.getElementById("question-options");
  const countEl = document.getElementById("question-count");
  const nav = root.querySelector(".ra-nav");
  const nextBtn = nav.querySelector('[data-action="next"]');
  const finishBtn = nav.querySelector('[data-action="finish"]');
  const toggleBtn = root.querySelector(".ra-a11y-toggle");
  const panel = document.getElementById("a11y-panel");
  const dialog = document.getElementById("review-dialog");
  const reviewList = document.getElementById("review-list");

  const state = { screen: "inicio", index: 0, answers: QUESTIONS.map(() => null), a11yOpen: false };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Rendering ------------------------------------------------------------ */
  function renderQuestion() {
    const q = QUESTIONS[state.index];
    const n = state.index + 1;
    stemEl.textContent = q.stem;
    optionsEl.innerHTML = q.options
      .map(
        (text, i) => `
        <label class="ra-option">
          <input type="radio" name="q${n}" value="${i}" ${state.answers[state.index] === i ? "checked" : ""} />
          <span class="ra-option__letter" aria-hidden="true">${LETTERS[i]}</span>
          <span class="ra-option__text"><span class="visually-hidden">Alternativa ${LETTERS[i]}: </span>${escapeHtml(text)}</span>
        </label>`
      )
      .join("");
    countEl.textContent = `Questão ${n}/${QUESTIONS.length}`;
    nav.dataset.step = state.index === 0 ? "first" : state.index === QUESTIONS.length - 1 ? "last" : "middle";
    updateNavButtons();
  }

  function updateNavButtons() {
    const answered = state.answers[state.index] !== null;
    nextBtn.disabled = !answered;
    finishBtn.disabled = state.answers.some((a) => a === null);
  }

  function render() {
    root.dataset.screen = state.screen;
    root.querySelectorAll("[data-view]").forEach((el) => {
      el.hidden = el.dataset.view !== state.screen;
    });
    const showPanel = state.screen === "question" && state.a11yOpen;
    panel.hidden = !showPanel;
    root.classList.toggle("is-a11y-open", showPanel);
    toggleBtn.setAttribute("aria-expanded", String(showPanel));
    if (!showPanel) pauseMedia();
    if (state.screen === "question") renderQuestion();
  }

  function renderReview() {
    reviewList.innerHTML = QUESTIONS.map((q, i) => {
      const a = state.answers[i];
      const choice =
        a === null
          ? `<p class="ra-review__choice ra-review__choice--empty">Sem resposta</p>`
          : `<p class="ra-review__choice"><b>${LETTERS[a]}</b><span>${escapeHtml(q.options[a])}</span></p>`;
      return `
        <li class="ra-review__item">
          <h3 class="ra-review__q">Questão ${i + 1}:</h3>
          <p class="ra-review__excerpt">${escapeHtml(q.stem.split("\n\n")[0])}</p>
          <div class="ra-review__answer">
            <p class="ra-review__label">RESPOSTA SELECIONADA:</p>
            ${choice}
            <button class="ra-review__edit" type="button" data-edit="${i}" aria-label="Editar resposta da questão ${i + 1}">
              <img src="assets/est-realizar/edit.svg" width="14" height="14" alt="" /><span>Editar</span>
            </button>
          </div>
        </li>`;
    }).join("");
  }

  /* Actions -------------------------------------------------------------- */
  function goTo(index, focusStem = true) {
    state.screen = "question";
    state.index = Math.max(0, Math.min(QUESTIONS.length - 1, index));
    render();
    if (focusStem) stemEl.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  function openReview() {
    renderReview();
    if (!dialog.open) dialog.showModal();
  }

  function finish() {
    if (state.answers.some((a) => a === null)) return;
    if (dialog.open) dialog.close();
    state.screen = "finalizada";
    state.a11yOpen = false;
    render();
    document.getElementById("done-title").focus();
    window.scrollTo({ top: 0 });
  }

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      dialog.close();
      goTo(Number(editBtn.dataset.edit));
      return;
    }
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    switch (btn.dataset.action) {
      case "start": goTo(0); break;
      case "prev": goTo(state.index - 1); break;
      case "next": if (state.answers[state.index] !== null) goTo(state.index + 1); break;
      case "review": openReview(); break;
      case "review-close": dialog.close(); break;
      case "finish": finish(); break;
      case "a11y-close":
        state.a11yOpen = false;
        render();
        toggleBtn.focus();
        break;
    }
  });

  toggleBtn.addEventListener("click", () => {
    state.a11yOpen = true;
    render();
    panel.querySelector(".ra-a11y__close").focus();
  });

  optionsEl.addEventListener("change", (e) => {
    if (e.target.name) {
      state.answers[state.index] = Number(e.target.value);
      updateNavButtons();
    }
  });
  document.getElementById("question-form").addEventListener("submit", (e) => e.preventDefault());

  // Click on the backdrop closes the review.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  /* Accessibility media -------------------------------------------------- */
  const WAVE = [13,13,13,13,13,13,13,13,17,17,17,17,17,17,17,17,19,19,19,19,19,19,19,19,13,13,15,15,25,25,25,25,27,27,15,15,27,23,15,27,13,7,5,18,18,18,18,18,18,18];
  const fmt = (t) => {
    const s = Math.floor(t || 0);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  panel.querySelectorAll("[data-audio]").forEach((box) => {
    const audio = box.querySelector("audio");
    const btn = box.querySelector(".ra-play");
    const wave = box.querySelector(".ra-wave");
    const current = box.querySelector("[data-current]");
    wave.innerHTML = WAVE.map((h) => `<span style="height:${h}px"></span>`).join("");
    const bars = wave.children;
    const label = btn.getAttribute("aria-label");

    btn.addEventListener("click", () => {
      if (audio.paused) {
        pauseMedia();
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });
    audio.addEventListener("play", () => {
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", label.replace("Reproduzir", "Pausar"));
    });
    const stop = () => {
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", label);
    };
    audio.addEventListener("pause", stop);
    audio.addEventListener("ended", stop);
    audio.addEventListener("timeupdate", () => {
      current.textContent = fmt(audio.currentTime);
      const played = audio.duration ? Math.round((audio.currentTime / audio.duration) * bars.length) : 0;
      Array.from(bars).forEach((b, i) => b.classList.toggle("is-played", i < played));
    });
  });

  panel.querySelectorAll("[data-video]").forEach((box) => {
    const video = box.querySelector("video");
    box.querySelector(".ra-video__play").addEventListener("click", () => {
      pauseMedia();
      box.classList.add("is-playing");
      video.controls = true;
      video.play().catch(() => {}); // placeholder: no Libras video file in Figma yet
      video.focus();
    });
  });

  function pauseMedia() {
    panel.querySelectorAll("audio, video").forEach((m) => {
      if (!m.paused) m.pause();
    });
  }

  /* Deep links: ?state=inicio|q1|q2|q3|revisar|finalizada|acessibilidade[&resposta=A-D] */
  const params = new URLSearchParams(location.search);
  const requested = params.get("state") || "inicio";
  const answer = LETTERS.indexOf((params.get("resposta") || "").toUpperCase());
  const qMatch = /^q([1-3])$/.exec(requested);

  if (qMatch) {
    const i = Number(qMatch[1]) - 1;
    for (let k = 0; k < i; k++) state.answers[k] = FIGMA_ANSWERS[k];
    if (answer >= 0) state.answers[i] = answer;
    goTo(i, false);
  } else if (requested === "revisar") {
    FIGMA_ANSWERS.forEach((a, i) => (state.answers[i] = a));
    goTo(QUESTIONS.length - 1, false);
    openReview();
  } else if (requested === "finalizada") {
    FIGMA_ANSWERS.forEach((a, i) => (state.answers[i] = a));
    state.screen = "finalizada";
    render();
  } else if (requested === "acessibilidade") {
    state.a11yOpen = true;
    goTo(0, false);
  } else {
    render();
  }
})();
