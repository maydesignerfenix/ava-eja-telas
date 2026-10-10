/*
 * Shared mock data + helpers for the prof-correcao pages
 * (correcao-atividades, correcao-estudante, correcao-questao, boletim-turma, boletim-estudante).
 *
 * State (grades, feedback, publication, boletim components) is kept in
 * sessionStorage so that saving on one page updates status/progress on the
 * others. Replace CX.load/CX.save with API calls when wiring the backend.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ava-eja:prof-correcao:v1";
  const ASSETS = "assets/prof-correcao/";

  /* ---------------------------------------------------------------- Students */
  const STUDENTS = [
    { id: "ana", name: "Ana Beatriz Ramos", first: "Ana Beatriz" },
    { id: "bruno", name: "Bruno Cardoso Lima", first: "Bruno" },
    { id: "carla", name: "Carla Menezes", first: "Carla" },
    { id: "daniel", name: "Daniel Souza", first: "Daniel" },
    { id: "eduardo", name: "Eduardo Nunes", first: "Eduardo" },
    { id: "fernanda", name: "Fernanda Alves", first: "Fernanda" },
    { id: "gabriela", name: "Gabriela Costa", first: "Gabriela" },
    { id: "helena", name: "Helena Martins", first: "Helena" },
    { id: "isabela", name: "Isabela Rocha", first: "Isabela" },
    { id: "joao", name: "João Pedro Silva", first: "João Pedro" },
  ];
  const studentById = (id) => STUDENTS.find((s) => s.id === id);

  /* -------------------------------------------------------------- Activities */
  const ACTIVITIES = {
    leitura: {
      title: "Leitura e interpretação de textos do cotidiano",
      short: "Leitura e interpretação",
      questions: [
        {
          id: "q1", n: 1, type: "auto", max: 40, icon: "q-objetiva.svg",
          title: "Identificação do gênero",
          statement: "Leia o aviso: “A biblioteca do bairro estará fechada no dia 7 de setembro. O atendimento retorna no dia 8, às 9h.” Qual é a finalidade principal do texto?",
          refTitle: "Gabarito",
          ref: "Gabarito: B. O aviso informa o fechamento e a data de retorno do atendimento.",
          correct: "B",
          options: {
            A: "Convidar os moradores para um evento na biblioteca.",
            B: "Informar uma mudança no funcionamento da biblioteca.",
            C: "Pedir a devolução de livros atrasados.",
            D: "Divulgar o novo horário de empréstimos.",
          },
          okFeedback: "Resposta correta. Você identificou a finalidade informativa do aviso.",
          wrongFeedback: "Resposta incorreta. O aviso tem finalidade informativa: comunica o fechamento e o retorno do atendimento.",
        },
        {
          id: "q2", n: 2, type: "manual", max: 30, icon: "q-discursiva.svg",
          title: "Informação e contexto",
          context: "Considere o aviso: “A biblioteca do bairro estará fechada no dia 7 de setembro. O atendimento retorna no dia 8, às 9h.”",
          statement: "Por que é importante indicar o dia e o horário de retorno no aviso da biblioteca? Explique como essa informação ajuda o leitor.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: identificar a utilidade da data (10 pts), explicar a utilidade do horário (10 pts) e relacionar a informação ao planejamento do leitor (10 pts).",
          criteria: ["Utilidade da data: até 10 pontos", "Utilidade do horário: até 10 pontos", "Planejamento do leitor: até 10 pontos"],
          expected: "A data e o horário permitem planejar a visita e evitam que o leitor procure atendimento quando a biblioteca está fechada.",
        },
        {
          id: "q3", n: 3, type: "manual", max: 30, icon: "q-texto.svg",
          title: "Reescrita do aviso",
          context: "Considere o aviso: “A biblioteca do bairro estará fechada no dia 7 de setembro. O atendimento retorna no dia 8, às 9h.”",
          statement: "Reescreva o aviso de forma breve, mantendo a data de fechamento e a data e o horário de retorno.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: data de fechamento (10 pts) e retorno completo, com data e horário (20 pts). Resposta esperada: “A biblioteca fecha em 7/9 e volta a atender em 8/9, às 9h.”",
          criteria: ["Data de fechamento: até 10 pontos", "Retorno completo, com data e horário: até 20 pontos"],
          expected: "“A biblioteca fecha em 7/9 e volta a atender em 8/9, às 9h.”",
        },
      ],
    },
    corpo: {
      title: "Corpo, saúde e qualidade de vida",
      short: "Corpo, saúde e qualidade de vida",
      questions: [
        {
          id: "q1", n: 1, type: "auto", max: 40, icon: "q-objetiva.svg",
          title: "Hábitos saudáveis",
          statement: "Qual das atitudes abaixo contribui para uma boa qualidade de sono?",
          refTitle: "Gabarito",
          ref: "Gabarito: C. Manter horários regulares ajuda o corpo a regular o sono.",
          correct: "C",
          options: {
            A: "Usar o celular na cama até pegar no sono.",
            B: "Tomar café à noite para relaxar.",
            C: "Manter horários regulares para dormir e acordar.",
            D: "Dormir mais no fim de semana para compensar.",
          },
          okFeedback: "Resposta correta. Horários regulares favorecem um sono de qualidade.",
          wrongFeedback: "Resposta incorreta. Horários regulares para dormir e acordar favorecem um sono de qualidade.",
        },
        {
          id: "q2", n: 2, type: "manual", max: 30, icon: "q-discursiva.svg",
          title: "Alimentação no dia a dia",
          statement: "Cite duas mudanças simples na alimentação que podem melhorar a saúde de quem trabalha o dia todo e explique por quê.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: duas mudanças adequadas (10 pts) e justificativa de cada mudança (20 pts).",
          criteria: ["Duas mudanças adequadas: até 10 pontos", "Justificativa das mudanças: até 20 pontos"],
          expected: "Levar frutas como lanche e beber mais água, porque mantêm a energia e evitam alimentos ultraprocessados.",
        },
        {
          id: "q3", n: 3, type: "manual", max: 30, icon: "q-texto.svg",
          title: "Atividade física",
          statement: "Explique como uma caminhada de 30 minutos por dia pode influenciar a qualidade de vida.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: benefício físico (15 pts) e benefício emocional ou social (15 pts).",
          criteria: ["Benefício físico: até 15 pontos", "Benefício emocional ou social: até 15 pontos"],
          expected: "Melhora o condicionamento e a circulação, reduz o estresse e pode ser um momento de convivência.",
        },
      ],
    },
    sociedade: {
      title: "Sociedade, cidadania e direitos",
      short: "Sociedade, cidadania e direitos",
      questions: [
        {
          id: "q1", n: 1, type: "auto", max: 40, icon: "q-objetiva.svg",
          title: "Direitos fundamentais",
          statement: "Qual documento reúne os direitos e deveres fundamentais dos cidadãos brasileiros?",
          refTitle: "Gabarito",
          ref: "Gabarito: A. A Constituição Federal de 1988.",
          correct: "A",
          options: { A: "A Constituição Federal.", B: "O Código de Trânsito.", C: "O Estatuto do Idoso.", D: "A Consolidação das Leis do Trabalho." },
          okFeedback: "Resposta correta.",
          wrongFeedback: "Resposta incorreta. A Constituição Federal reúne os direitos fundamentais.",
        },
        {
          id: "q2", n: 2, type: "manual", max: 30, icon: "q-discursiva.svg",
          title: "Cidadania no bairro",
          statement: "Dê um exemplo de como um morador pode exercer a cidadania no próprio bairro.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: exemplo pertinente (15 pts) e relação com a vida coletiva (15 pts).",
          criteria: ["Exemplo pertinente: até 15 pontos", "Relação com a vida coletiva: até 15 pontos"],
          expected: "Participar da associação de moradores e cobrar melhorias junto à prefeitura.",
        },
        {
          id: "q3", n: 3, type: "manual", max: 30, icon: "q-texto.svg",
          title: "Direitos do trabalhador",
          statement: "Cite um direito do trabalhador com carteira assinada e explique sua importância.",
          refTitle: "Critérios e resposta esperada",
          ref: "Critérios: direito correto (10 pts) e explicação da importância (20 pts).",
          criteria: ["Direito correto: até 10 pontos", "Explicação da importância: até 20 pontos"],
          expected: "Férias remuneradas, que garantem descanso sem perda de renda.",
        },
      ],
    },
  };

  /* ------------------------------------------------------------ Agendamentos */
  const AGENDAMENTOS = [
    {
      id: "a1", activity: "leitura", number: "01", scope: "Turma completa", attempt: 1,
      period: "01/09 a 08/09/26", deadline: "08/09/26", deadlineStatus: "Encerrado",
      area: "Linguagens", comp: "C1", waitDays: 12,
      students: ["ana", "bruno", "carla", "daniel", "eduardo", "fernanda", "gabriela", "helena", "isabela", "joao"],
    },
    {
      id: "a2", activity: "corpo", number: "02", scope: "4 estudantes", attempt: 1,
      period: "08/09 a 15/09/26", deadline: "15/09/26", deadlineStatus: "Em andamento",
      area: "Ciências da Natureza", comp: "C2", waitDays: 5,
      students: ["bruno", "carla", "daniel", "eduardo"],
    },
    {
      id: "a3", activity: "leitura", number: "02", scope: "3 estudantes", attempt: 2,
      period: "11/09 a 18/09/26", deadline: "18/09/26", deadlineStatus: "Em andamento",
      area: "Linguagens", comp: "C1", waitDays: 0,
      students: ["daniel", "fernanda", "isabela"],
    },
    {
      id: "a4", activity: "sociedade", number: "01", scope: "Turma completa", attempt: 1,
      period: "26/08 a 02/09/26", deadline: "02/09/26", deadlineStatus: "Encerrado",
      area: "Ciências Humanas", comp: "C3", waitDays: 0,
      students: ["ana", "bruno", "carla", "daniel", "eduardo", "fernanda", "gabriela", "helena", "isabela", "joao"],
    },
  ];
  const agById = (id) => AGENDAMENTOS.find((a) => a.id === id);

  /* Submissions (what the student sent). Not persisted: read-only data. */
  const SUBMISSIONS = {
    a1: {
      bruno: { sentAt: "2026-09-07T18:10", q1: "B",
        q2: "A data mostra quando a biblioteca volta a abrir. O horário é importante para a pessoa saber a partir de que hora pode ir. Com as duas informações, ela consegue planejar a visita.",
        q3: "A biblioteca fecha dia 7/9 e volta dia 8/9 às 9h." },
      carla: { sentAt: "2026-09-08T14:25", q1: "B",
        q2: "Ajuda a pessoa a saber quando pode devolver o livro. Se ela não souber a data, pode ir no dia errado e encontrar a biblioteca fechada.",
        q3: "Fechada no dia 7. Volta no dia 8 de manhã." },
      ana: { sentAt: "2026-09-08T19:42", q1: "B",
        q2: "É importante para as pessoas saberem quando a biblioteca vai abrir de novo. Assim elas podem se organizar para devolver os livros e não ir até lá quando estiver fechada.",
        q3: "A biblioteca estará fechada em 7 de setembro e abre novamente no dia 8." },
      daniel: { sentAt: "2026-09-08T20:15", q1: "C",
        q2: "Para ninguém perder viagem.",
        q3: "Biblioteca fechada dia 7 de setembro." },
      eduardo: { sentAt: "2026-09-08T21:03", q1: "B",
        q2: "Porque as pessoas precisam saber o dia e a hora que podem voltar, assim se programam.",
        q3: "Dia 7/9 fechado. Reabre 8/9 às 9h." },
      fernanda: { sentAt: "2026-09-08T22:48", q1: "A",
        q2: "O horário mostra quando abre e a data mostra o dia. Isso ajuda a não ir à toa.",
        q3: "A biblioteca não abre em 7/9 e volta em 8/9 às 9 horas." },
      gabriela: { sentAt: "2026-09-05T16:00", q1: "B",
        q2: "Com a data a pessoa sabe o dia em que pode voltar e com o horário sabe a partir de quando. Isso evita ir com a biblioteca fechada e ajuda a organizar a rotina.",
        q3: "A biblioteca fecha em 7/9 e volta a atender em 8/9, às 9h." },
      helena: { sentAt: "2026-09-06T13:12", q1: "B",
        q2: "A data ajuda a saber quando volta a funcionar.",
        q3: "Fechada em 7 de setembro, volta no dia 8." },
    },
    a2: {
      bruno: { sentAt: "2026-09-10T19:20", q1: "C",
        q2: "Trocar refrigerante por água e levar marmita. A água hidrata e a marmita evita comer fritura na rua.",
        q3: "A caminhada melhora o coração e ajuda a dormir melhor. Também diminui o estresse do trabalho." },
      carla: { sentAt: "2026-09-11T07:45", q1: "C",
        q2: "Comer mais frutas e menos doces, porque fruta dá energia e doce cansa depois.",
        q3: "Ajuda a perder peso." },
      daniel: { sentAt: "2026-09-12T22:10", q1: "A",
        q2: "Comer salada.",
        q3: "Caminhar faz bem para o corpo e é um momento para conversar com os vizinhos." },
    },
    a4: {},
  };
  // Every student delivered "Sociedade, cidadania e direitos".
  ["ana", "bruno", "carla", "daniel", "eduardo", "fernanda", "gabriela", "helena", "isabela", "joao"].forEach((id, i) => {
    SUBMISSIONS.a4[id] = {
      sentAt: `2026-09-0${1 + (i % 2)}T${String(9 + i).padStart(2, "0")}:${String(5 * i).padStart(2, "0")}`,
      q1: i % 4 === 3 ? "B" : "A",
      q2: "Participando das reuniões da associação de moradores e ajudando a cobrar melhorias para a rua.",
      q3: "Férias remuneradas. É importante porque o trabalhador descansa sem perder o salário.",
    };
  });

  /* ------------------------------------------------------------- Seed state */
  function seedState() {
    const g = (score, feedback, status) => ({ score, feedback: feedback || "", status: status || "corrigida" });
    const pend = () => ({ score: null, feedback: "", status: "pendente" });
    const st = { ag: {}, boletim: {}, history: {} };

    // a1 — 2 de 8 estudantes corrigidos (Gabriela, Helena), 12 respostas pendentes em 6 estudantes.
    st.ag.a1 = { published: null, answers: {} };
    Object.keys(SUBMISSIONS.a1).forEach((id) => (st.ag.a1.answers[id] = { q2: pend(), q3: pend() }));
    st.ag.a1.answers.gabriela = {
      q2: g(25, "Você relacionou a data e o horário ao planejamento. Faltou detalhar como o horário ajuda o leitor."),
      q3: g(30, "Aviso completo, com fechamento e retorno."),
    };
    st.ag.a1.answers.helena = {
      q2: g(18, "Você explicou a utilidade da data. Inclua também o horário e o planejamento do leitor."),
      q3: g(20, "Faltou o horário de retorno."),
    };

    // a2 — 4 de 6 respostas manuais corrigidas; pendentes: Carla Q3 e Daniel Q2.
    st.ag.a2 = {
      published: null,
      answers: {
        bruno: { q2: g(28, "Ótimas trocas, bem justificadas."), q3: g(30, "Benefícios físico e emocional bem explicados.") },
        carla: { q2: g(20, "Justifique melhor a segunda mudança."), q3: pend() },
        daniel: { q2: pend(), q3: g(25, "Bom exemplo de benefício social.") },
      },
    };

    // a3 — sem entregas.
    st.ag.a3 = { published: null, answers: {} };

    // a4 — tudo corrigido e publicado.
    st.ag.a4 = { published: "05/09/26", answers: {} };
    Object.keys(SUBMISSIONS.a4).forEach((id, i) => {
      st.ag.a4.answers[id] = { q2: g(20 + (i % 3) * 5, "Bom exemplo."), q3: g(18 + (i % 4) * 4, "Explique melhor a importância.") };
    });

    // Boletim (Linguagens): values from Figma 5.1. Value = online + presencial + participação.
    const TABLE = {
      ana: [64, 60, 67, 83, null, null],
      bruno: [42, 32, 40, 55, 37, 40],
      carla: [61, "CC", 67, 60, null, null],
      daniel: [58, 62, 70, null, null, 66],
      eduardo: [72, 68, null, 75, 70, null],
      fernanda: [55, 63, 61, 59, 64, null],
      gabriela: ["CC", 41, 49, "CC", null, null],
      helena: [80, 77, 74, 69, null, 72],
      isabela: [null, 52, 58, 61, 57, 60],
      joao: [66, 70, 64, null, 68, 71],
    };
    const SPLIT = { ana: { c1: [28, 23, 13], c2: [24, 24, 12], c3: [27, 26, 14], c4: [34, 33, 16] } };
    Object.keys(TABLE).forEach((sid) => {
      st.boletim[sid] = {};
      TABLE[sid].forEach((v, i) => {
        const key = "c" + (i + 1);
        let comp;
        if (v === "CC") comp = { cc: true, ccDate: null, online: null, presencial: null, participacao: null, status: "cc" };
        else if (v === null) comp = { cc: false, online: 26, presencial: null, participacao: null, status: "pendente" };
        else {
          const split = (SPLIT[sid] && SPLIT[sid][key]) || autoSplit(v);
          comp = { cc: false, online: split[0], presencial: split[1], participacao: split[2], status: "publicada" };
        }
        comp.compl = null;
        st.boletim[sid][key] = comp;
      });
    });
    st.boletim.gabriela.c1.ccDate = "04/03/26";
    st.boletim.gabriela.c3.compl = 0;

    st.history.ana = [
      { when: "10/09/26 · 16h20", text: "Publicação de C1 · professor001@teste.com", comp: "c1" },
      { when: "10/09/26 · 16h15", text: "Presencial 23 e participação 13 salvos.", comp: "c1" },
      { when: "09/09/26 · 14h10", text: "Online 28 sincronizado após publicação da atividade.", comp: "c1" },
    ];
    return st;
  }

  function autoSplit(v) {
    const online = Math.min(40, Math.round(v * 0.4));
    const presencial = Math.min(40, Math.round(v * 0.4));
    return [online, presencial, Math.max(0, Math.min(20, v - online - presencial))];
  }

  /* ------------------------------------------------------------ Persistence */
  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable: fall back to seed */ }
    return seedState();
  }
  function save(state) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function reset() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /* --------------------------------------------------------------- Helpers */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const pad = (n) => String(n).padStart(2, "0");
  function formatSent(iso) {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} às ${pad(d.getHours())}h${pad(d.getMinutes())}`;
  }
  function nowStamp() {
    const d = new Date();
    return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`, time: `${pad(d.getHours())}h${pad(d.getMinutes())}` };
  }

  /** Parses a score typed by the teacher. Returns { value, error }. Empty → value null. */
  function parseScore(raw, max) {
    const txt = String(raw == null ? "" : raw).trim().replace(",", ".");
    if (txt === "" || txt === "—") return { value: null, error: null };
    if (!/^\d+(\.\d+)?$/.test(txt)) return { value: null, error: `Informe um número de 0 a ${max}.` };
    const v = Number(txt);
    if (v < 0 || v > max) return { value: null, error: `A nota deve ficar entre 0 e ${max} pontos.` };
    return { value: Math.round(v * 10) / 10, error: null };
  }
  const fmtNum = (v) => (v == null ? "—" : String(v).replace(".", ","));

  function questionsOf(ag) { return ACTIVITIES[ag.activity].questions; }
  function manualQuestions(ag) { return questionsOf(ag).filter((q) => q.type === "manual"); }
  function autoScore(q, option) { return option === q.correct ? q.max : 0; }

  /** Computed numbers for one agendamento. */
  function stats(state, agId) {
    const ag = agById(agId);
    const subs = SUBMISSIONS[agId] || {};
    const delivered = ag.students.filter((id) => subs[id]);
    const manual = manualQuestions(ag);
    let total = 0, corrected = 0;
    const pendingStudents = [];
    delivered.forEach((sid) => {
      let pend = 0;
      manual.forEach((q) => {
        total++;
        const a = state.ag[agId].answers[sid] && state.ag[agId].answers[sid][q.id];
        if (a && a.status === "corrigida") corrected++;
        else pend++;
      });
      if (pend) pendingStudents.push(sid);
    });
    const correctedStudents = delivered.length - pendingStudents.length;
    const published = state.ag[agId].published;
    let status = "Em correção";
    if (published) status = "Corrigido";
    else if (!delivered.length) status = "Sem entregas";
    return {
      ag, delivered, totalStudents: ag.students.length, manualTotal: total, corrected,
      pending: total - corrected, pendingStudents, correctedStudents, published, status,
    };
  }

  /** Total of an attempt (auto + manual), using an optional override map {q2: score}. */
  function attemptTotal(state, agId, sid, override) {
    const ag = agById(agId);
    const sub = SUBMISSIONS[agId][sid];
    const parts = questionsOf(ag).map((q) => {
      if (q.type === "auto") return { q, score: autoScore(q, sub[q.id]), auto: true };
      const o = override && Object.prototype.hasOwnProperty.call(override, q.id) ? override[q.id] : undefined;
      const a = state.ag[agId].answers[sid][q.id];
      return { q, score: o !== undefined ? o : a.score, auto: false };
    });
    const complete = parts.every((p) => p.score != null);
    const sum = parts.reduce((t, p) => t + (p.score || 0), 0);
    return { parts, complete, sum: Math.round(sum * 10) / 10, max: parts.reduce((t, p) => t + p.q.max, 0) };
  }

  /** Publishes an agendamento and syncs the online component of the boletim (Linguagens only). */
  function publish(state, agId) {
    const ag = agById(agId);
    const stamp = nowStamp();
    state.ag[agId].published = stamp.date + " às " + stamp.time;
    if (ag.area === "Linguagens") {
      const key = ag.comp.toLowerCase();
      Object.keys(SUBMISSIONS[agId]).forEach((sid) => {
        const t = attemptTotal(state, agId, sid);
        const comp = state.boletim[sid] && state.boletim[sid][key];
        if (!comp || comp.cc) return;
        comp.online = Math.round((t.sum / t.max) * 40);
        (state.history[sid] = state.history[sid] || []).unshift({
          when: `${stamp.date} · ${stamp.time}`,
          text: `Online ${comp.online} sincronizado após publicação da atividade.`,
          comp: key,
        });
      });
    }
  }

  /* -------------------------------------------------------------- Boletim */
  const COMPS = ["c1", "c2", "c3", "c4", "c5", "c6"];
  function compValue(c) {
    if (c.cc) return "CC";
    if (c.online == null || c.presencial == null || c.participacao == null) return null;
    return c.online + c.presencial + c.participacao;
  }
  function studentSummary(state, sid) {
    const b = state.boletim[sid];
    const values = COMPS.map((k) => compValue(b[k]));
    const missing = values.filter((v) => v === null).length;
    const nums = values.filter((v) => typeof v === "number");
    const sum = missing === 0 && nums.length ? Math.round(nums.reduce((a, v) => a + v, 0) / nums.length) : null;
    let situation = "INCOMPLETO";
    if (sum !== null) situation = sum < 60 ? "EM PROCESSO" : "CONCLUÍDO";
    const compl = COMPS.filter((k) => b[k].compl != null).map((k) => ({ key: k, value: b[k].compl }));
    return { values, missing, sum, situation, compl };
  }

  /* ------------------------------------------------------------ UI helpers */
  function toast(message) {
    let el = document.querySelector(".cx-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "cx-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.hidden = true), 3200);
  }

  /** Asks to discard unsaved changes. Resolves true when the teacher confirms. */
  function confirmDiscard(message) {
    return new Promise((resolve) => {
      let dlg = document.getElementById("cx-discard");
      if (!dlg) {
        dlg = document.createElement("dialog");
        dlg.id = "cx-discard";
        dlg.className = "modal cx-dialog";
        dlg.setAttribute("aria-labelledby", "cx-discard-title");
        dlg.innerHTML = `
          <form method="dialog" class="cx-dialog__body cx">
            <h2 id="cx-discard-title" class="cx-panel__title">Alterações não salvas</h2>
            <p class="cx-dialog__text"></p>
            <div class="cx-dialog__actions">
              <button class="btn btn--outline-sm" value="cancel" type="button">Continuar editando</button>
              <button class="btn btn--primary-sm" value="discard" type="button">Descartar e continuar</button>
            </div>
          </form>`;
        document.body.appendChild(dlg);
      }
      dlg.querySelector(".cx-dialog__text").textContent =
        message || "Salve ou descarte as alterações antes de continuar. Deseja descartar as alterações?";
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        dlg.removeEventListener("click", onClick);
        dlg.removeEventListener("cancel", onCancel);
        if (dlg.open) dlg.close();
        resolve(ok);
      };
      const onClick = (e) => { const b = e.target.closest("button[value]"); if (b) finish(b.value === "discard"); };
      const onCancel = (e) => { e.preventDefault(); finish(false); };
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("cancel", onCancel);
      dlg.showModal();
      dlg.querySelector("button[value=cancel]").focus();
    });
  }

  function selectHtml({ id, label, options, value, labelClass }) {
    const opts = options
      .map((o) => `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}${o.disabled ? " disabled" : ""}>${esc(o.label)}</option>`)
      .join("");
    return `
      <div class="cx-field">
        <label class="cx-field__label${labelClass ? " " + labelClass : ""}" for="${id}">${esc(label)}</label>
        <span class="cx-select">
          <select id="${id}">${opts}</select>
          <img src="${ASSETS}chevron-down.svg" width="12" height="12" alt="" />
        </span>
      </div>`;
  }

  function params() { return new URLSearchParams(location.search); }

  /* ------------------------------------------- Correction context (4.2/4.3) */
  /** Atividade + Agendamento selects. Activities/agendamentos without deliveries are disabled. */
  function contextSelectsHtml(agId) {
    const ag = agById(agId);
    const actIds = [...new Set(AGENDAMENTOS.map((a) => a.activity))];
    const actOptions = actIds.map((id) => ({
      value: id, label: ACTIVITIES[id].title,
      disabled: !AGENDAMENTOS.some((a) => a.activity === id && Object.keys(SUBMISSIONS[a.id] || {}).length),
    }));
    const agOptions = AGENDAMENTOS.filter((a) => a.activity === ag.activity).map((a) => {
      const empty = !Object.keys(SUBMISSIONS[a.id] || {}).length;
      return { value: a.id, label: `${a.number} · ${a.period} · ${a.scope}${empty ? " (sem entregas)" : ""}`, disabled: empty };
    });
    return (
      selectHtml({ id: "sel-atividade", label: "Atividade", options: actOptions, value: ag.activity }) +
      selectHtml({ id: "sel-agendamento", label: "Agendamento", options: agOptions, value: ag.id })
    );
  }
  function firstAgendamentoOf(activity) {
    const a = AGENDAMENTOS.find((x) => x.activity === activity && Object.keys(SUBMISSIONS[x.id] || {}).length);
    return a ? a.id : null;
  }
  function contextMeta(state, agId) {
    const s = stats(state, agId);
    const ag = s.ag;
    const when = ag.deadlineStatus === "Encerrado" ? `Encerrado em ${ag.deadline}` : `Prazo em ${ag.deadline}`;
    return `${ag.area} · ${ag.comp} · ${when} · ${s.delivered.length} de ${s.totalStudents} estudantes entregaram · Tentativa ${ag.attempt}`;
  }
  /** "Publicar correções" panel shared by 4.2 and 4.3. */
  function publishPanelHtml(state, agId, variant) {
    const s = stats(state, agId);
    const title = variant === "questao" ? "Concluir o agendamento" : "Publicação do agendamento";
    let text;
    if (s.published) text = `Correções publicadas em ${s.published}. Notas e feedback estão visíveis para os estudantes.`;
    else if (s.pending) {
      text = variant === "questao"
        ? `${s.pending} ${s.pending === 1 ? "resposta manual" : "respostas manuais"} sem nota no agendamento. Publique somente quando todas as respostas recebidas estiverem corrigidas e salvas.`
        : `Ainda há ${s.pending} ${s.pending === 1 ? "resposta manual" : "respostas manuais"} sem nota em ${s.pendingStudents.length} ${s.pendingStudents.length === 1 ? "estudante" : "estudantes"}. Conclua e salve todas as respostas recebidas para publicar notas e feedback.`;
    } else text = "Todas as respostas recebidas estão corrigidas e salvas. Publique para liberar notas e feedback aos estudantes.";
    const disabled = s.published || s.pending ? " disabled" : "";
    return `
      <h2 class="cx-panel__title" id="publish-title">${title}</h2>
      <p class="${variant === "questao" ? "q-text" : "cx-note cx-note--dark"}">${esc(text)}</p>
      <button class="btn btn--primary-sm cx-publish" type="button"${disabled}>Publicar correções</button>`;
  }

  window.CX = {
    ASSETS, STUDENTS, ACTIVITIES, AGENDAMENTOS, SUBMISSIONS, COMPS,
    studentById, agById, load, save, reset, esc, formatSent, nowStamp, parseScore, fmtNum,
    questionsOf, manualQuestions, autoScore, stats, attemptTotal, publish,
    compValue, studentSummary, toast, confirmDiscard, selectHtml, params,
    contextSelectsHtml, firstAgendamentoOf, contextMeta, publishPanelHtml,
  };
})();
