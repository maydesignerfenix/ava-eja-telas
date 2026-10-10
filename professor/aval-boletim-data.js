/* Professor · Avaliações · Boletim – shared mock data + helpers used by
   aval-boletim-turma.js and aval-boletim-lancar-notas.js.
   Grades saved on "Lançar notas" are kept in localStorage so "Visão da turma"
   reflects them. Replace with the API. */
(function () {
  "use strict";

  const COMPS = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const LIMITS = { online: 40, presencial: 40, participacao: 20, complementar: 20 };
  const PASS = 60;
  const STORAGE_KEY = "aval-boletim-v1";

  // Final grade per competency as shown in Figma "Visão da turma" (null = not launched, "cc" = certified).
  const FINAL = {
    "Ana Beatriz Ramos": [64, 60, 67, 83, null, null],
    "Bruno Cardoso Lima": [42, 32, 40, 55, 37, 40],
    "Carla Menezes": [61, "cc", 67, 60, null, null],
    "Diego Ferreira": [74, 66, 77, 93, 58, null],
    "Eduarda Nunes": [85, 74, 66, null, null, 83],
    "Felipe Araújo Souza": [60, 67, 83, 73, 62, null],
    "Gabriela Costa": ["cc", 41, 49, "cc", null, null],
    "Henrique Tavares": [67, null, 50, 66, 82, 65],
    "Isabela Rocha": [56, 72, 79, 75, null, null],
    "João Pedro Martins": [67, 87, 52, 68, 75, null],
  };
  // C1 breakdown from Figma "Lançar notas" [online, presencial, participação].
  const C1 = {
    "Ana Beatriz Ramos": [28, 23, 13],
    "Bruno Cardoso Lima": [24, 13, 5],
    "Carla Menezes": [12, 34, 15],
    "Diego Ferreira": [36, 24, 14],
    "Eduarda Nunes": [28, 38, 19],
    "Felipe Araújo Souza": [12, 29, 19],
    "Henrique Tavares": [12, 37, 18],
    "Isabela Rocha": [20, 24, 12],
    "João Pedro Martins": [30, 25, 12],
  };
  const COMPLEMENTAR = { "Gabriela Costa": { C3: 0 } };

  function seed() {
    return Object.keys(FINAL).map((name, i) => {
      const grades = {};
      COMPS.forEach((c, ci) => {
        const f = FINAL[name][ci];
        if (f === "cc") { grades[c] = { cc: true, ccDate: "04/03/26" }; return; }
        let online, presencial = null, participacao = null;
        if (c === "C1" && C1[name]) [online, presencial, participacao] = C1[name];
        else if (f != null) {
          online = Math.min(LIMITS.online, Math.round(f * 0.4));
          participacao = Math.min(LIMITS.participacao, Math.round(f * 0.2));
          presencial = f - online - participacao;
        } else online = 10 + ((i * 7 + ci * 5) % 25); // online is automatic, always present
        const comp = COMPLEMENTAR[name] && COMPLEMENTAR[name][c];
        grades[c] = { online, presencial, participacao, complementar: comp == null ? null : comp };
      });
      return { id: i + 1, name, grades };
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    return seed();
  }
  function save(students) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); } catch (e) { /* ignore */ }
  }

  /** Final grade of one competency, null if not launched, "cc" if certified. */
  function finalGrade(g) {
    if (!g) return null;
    if (g.cc) return "cc";
    if (g.presencial == null || g.participacao == null || g.online == null) return null;
    const base = g.online + g.presencial + g.participacao;
    const extra = base < PASS && g.complementar != null ? g.complementar : 0;
    return Math.min(100, base + extra);
  }

  function summary(student) {
    const finals = COMPS.map((c) => finalGrade(student.grades[c]));
    const missing = finals.filter((f) => f == null).length;
    const numeric = finals.filter((f) => typeof f === "number");
    const avg = numeric.length ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length) : null;
    let status = "incompleto";
    if (!missing) status = avg != null && avg < PASS ? "em-processo" : "aprovado";
    const compl = COMPS.find((c) => student.grades[c] && student.grades[c].complementar != null);
    return { finals, missing, total: missing ? null : avg, status, complementar: compl ? { comp: compl, value: student.grades[compl].complementar } : null };
  }

  function compProgress(students, c) {
    const eligible = students.filter((s) => !s.grades[c].cc);
    const launched = eligible.filter((s) => finalGrade(s.grades[c]) != null).length;
    const cc = students.length - eligible.length;
    return { launched, total: eligible.length, missing: eligible.length - launched, cc, complete: launched === eligible.length };
  }

  function indicators(students) {
    const sums = students.map(summary);
    const complete = sums.filter((s) => s.total != null);
    const avg = complete.length ? Math.round(complete.reduce((a, s) => a + s.total, 0) / complete.length) : 0;
    return {
      media: avg,
      completos: complete.length,
      emProcesso: sums.filter((s) => s.status === "em-processo").length,
      faltaLancar: sums.reduce((a, s) => a + s.missing, 0),
      certificadas: students.reduce((a, s) => a + COMPS.filter((c) => s.grades[c].cc).length, 0),
      total: students.length,
    };
  }

  function renderIndicators(students) {
    const k = indicators(students);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("kpi-media", k.media);
    set("kpi-media-detail", `${k.completos} de ${k.total} com avaliação completa`);
    set("kpi-processo", k.emProcesso);
    set("kpi-falta", k.faltaLancar);
    set("kpi-cc", k.certificadas);
  }

  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /** Class filters (unidade/turma/área): FILTRAR applies them to the context labels. */
  function bindClassFilters(onApply) {
    const ids = ["f-unidade", "f-turma", "f-area"];
    const btn = document.getElementById("f-apply");
    const apply = () => {
      const [unidade, turma, area] = ids.map((id) => document.getElementById(id).value);
      document.querySelectorAll("[data-ctx-turma]").forEach((el) => (el.textContent = turma));
      document.querySelectorAll("[data-ctx-area]").forEach((el) => (el.textContent = area));
      onApply && onApply({ unidade, turma, area });
    };
    btn.addEventListener("click", apply);
    return apply;
  }

  window.AvalBoletim = { COMPS, LIMITS, PASS, load, save, seed, finalGrade, summary, compProgress, indicators, renderIndicators, normalize, esc, bindClassFilters };
})();
