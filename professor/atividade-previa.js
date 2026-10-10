/* Professor · Prévia da atividade – example activity (Figma 4148:58505).
   Interactive: alternatives, Verdadeiro/Falso, answers, correlação and ordenação (drag or arrows). */
(function () {
  "use strict";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Close → back to the wizard (keeps its state when we came from it).
  const close = document.getElementById("previa-close");
  close.addEventListener("click", (e) => {
    if (document.referrer.includes("atividade-criar.html")) { e.preventDefault(); history.back(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close.click(); });

  // 3 · Verdadeiro ou Falso
  const AFIRMACOES = [
    "A placa anuncia serviços de banho e tosa para cães.",
    "O anúncio promete transformar um cão em um gato.",
    "A expressão “novo gatinho” pode ter sentido figurado.",
    "A placa apresenta o preço do serviço oferecido.",
  ];
  document.getElementById("pq-vf").innerHTML = AFIRMACOES.map((t, i) => `
<div class="pq-vf__row" role="radiogroup" aria-labelledby="vf-${i}">
  <p class="pq-vf__text" id="vf-${i}">${esc(t)}</p>
  <div class="pq-vf__opts">
    <label class="pq-vf__opt"><input type="radio" name="vf${i}" value="V" />Verdadeiro</label>
    <label class="pq-vf__opt"><input type="radio" name="vf${i}" value="F" />Falso</label>
  </div>
</div>`).join("");

  // 6 · Ordenação
  const items = [
    "Buscar o cão após a conclusão do serviço.",
    "Realizar o banho e a tosa do cão.",
    "Ler o anúncio e decidir contratar o serviço.",
    "Levar o cão ao petshop no horário combinado.",
  ];
  const list = document.getElementById("pq-order");
  const status = document.getElementById("pq-order-status");

  function render(focus) {
    list.innerHTML = items.map((t, i) => `
<li class="pq-item" draggable="true" data-i="${i}">
  <img src="assets/prof-ativ/alca-arraste.svg" width="20" height="20" alt="" />
  <span class="pq-item__num">${i + 1}</span>
  <span class="pq-item__text">${esc(t)}</span>
  <span class="pq-item__ctrls">
    <button type="button" data-move="-1" data-i="${i}" aria-label="Mover para cima: ${esc(t)}" ${i === 0 ? "disabled" : ""}><img src="assets/prof-ativ/seta-cima.svg" width="16" height="16" alt="" /></button>
    <button type="button" data-move="1" data-i="${i}" aria-label="Mover para baixo: ${esc(t)}" ${i === items.length - 1 ? "disabled" : ""}><img src="assets/prof-ativ/seta-baixo.svg" width="16" height="16" alt="" /></button>
  </span>
</li>`).join("");
    if (focus) {
      const btn = list.querySelector(`[data-i="${focus.i}"][data-move="${focus.dir}"]`);
      (btn && !btn.disabled ? btn : list.querySelector(`[data-i="${focus.i}"][data-move="${-focus.dir}"]`)).focus();
    }
  }
  function move(from, to, dir) {
    if (to < 0 || to >= items.length) return;
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    render(dir ? { i: to, dir } : null);
    status.textContent = `Item movido para a posição ${to + 1}.`;
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-move]");
    if (b) move(Number(b.dataset.i), Number(b.dataset.i) + Number(b.dataset.move), Number(b.dataset.move));
  });
  let from = null;
  list.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".pq-item");
    if (!li) return;
    from = Number(li.dataset.i);
    li.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(from));
  });
  list.addEventListener("dragover", (e) => {
    const li = e.target.closest(".pq-item");
    if (from === null || !li) return;
    e.preventDefault();
    list.querySelectorAll(".is-drop-target").forEach((x) => x.classList.remove("is-drop-target"));
    li.classList.add("is-drop-target");
  });
  list.addEventListener("drop", (e) => {
    const li = e.target.closest(".pq-item");
    if (from === null || !li) return;
    e.preventDefault();
    move(from, Number(li.dataset.i));
    from = null;
  });
  list.addEventListener("dragend", () => {
    from = null;
    list.querySelectorAll(".is-dragging, .is-drop-target").forEach((x) => x.classList.remove("is-dragging", "is-drop-target"));
  });
  render();
})();
