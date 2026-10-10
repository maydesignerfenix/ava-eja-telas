/* Professor · Criar atividade – mock data + wizard state storage (atividade-criar.js).
   Copy follows Figma (file IqB0fuv75EtC1NbJK4HKUh). Replace with the API. */
(function () {
  "use strict";

  const OPTIONS = {
    segmento: ["EJA Regular", "EJA Regular - Ensino Médio", "EJA Profissionalizante"],
    area: [
      { label: "Linguagens, códigos e suas tecnologias", code: "LC" },
      { label: "Matemática e suas tecnologias", code: "MT" },
      { label: "Ciências da natureza e suas tecnologias", code: "CN" },
      { label: "Ciências humanas e sociais aplicadas", code: "CH" },
    ],
    competencia: [
      "C1 - Compreender o funcionamento das diferentes linguagens e práticas culturais",
      "C2 - Organizar as várias formas de recepção e compreensão das práticas sociais de linguagem e de multiletramento para construir sentidos",
      "C3 - Utilizar diferentes linguagens para defender pontos de vista que respeitem o outro",
    ],
    habilidade: [
      "H1 - Identificar as diferentes linguagens e seus recursos expressivos como elementos de caracterização dos sistemas de comunicação",
      "H4 - Reconhecer posições críticas aos usos sociais que são feitos das linguagens e dos sistemas de comunicação",
      "H6 - Relacionar as tecnologias de comunicação e informação ao desenvolvimento das sociedades",
      "H8 - Empregar relações de sentido implícito nos atos comunicativos, não expressos formalmente ou apenas sugeridos por marcas linguísticas",
    ],
    turma: ["Anos Finais - AF", "Anos Iniciais - AI", "EJA - Webinar", "Ensino Médio - EM"],
    tentativas: ["02", "03", "04", "05", "06", "07", "08", "09", "10"],
    atividades: ["Leitura e interpretação de textos do cotidiano", "Matemática nas situações do dia a dia", "Corpo, saúde e qualidade de vida"],
    caderno: ["Caderno 1", "Caderno 2", "Caderno 3"],
  };

  const CRIADO = "Criado em 28/08/26 por Marina Alves";
  const RASCUNHO = "Rascunho salvo em 11/09/2026 por Mariana Alves";
  const LASER = "O laser é um tipo especial de luz, obtido...";

  // Banco de questões (modal "Selecione as questões para a atividade").
  const QUESTIONS = [
    { id: "q1", title: LASER, meta: CRIADO, tipo: "Verdadeiro ou Falso", dificuldade: "Fácil", favorita: true, semCorreta: true },
    { id: "q2", title: LASER, meta: RASCUNHO, draft: true, tipo: "Verdadeiro ou Falso", dificuldade: "Difícil" },
    { id: "q3", title: LASER, meta: CRIADO, tipo: "Verdadeiro ou Falso", dificuldade: "Médio" },
    { id: "q4", title: LASER, meta: CRIADO, tipo: "Verdadeiro ou Falso", dificuldade: "Médio" },
    { id: "q5", title: "Placa em um petshop: \"Traga seu cão para banho e tosa...", meta: CRIADO, tipo: "Múltipla escolha", dificuldade: "Médio", favorita: true },
    { id: "q6", title: "Explique o sentido da expressão “novo gatinho”...", meta: CRIADO, tipo: "Discursiva", dificuldade: "Médio" },
    { id: "q7", title: "Qual palavra da placa é usada para sugerir...", meta: CRIADO, tipo: "Resposta curta", dificuldade: "Fácil" },
    { id: "q8", title: "Relacione cada conceito ao seu significado.", meta: CRIADO, tipo: "Correlação", dificuldade: "Médio" },
    { id: "q9", title: "Organize as ações na sequência em que devem acontecer.", meta: RASCUNHO, draft: true, tipo: "Ordenação", dificuldade: "Difícil" },
  ].map((q) => ({ area: "CN", competencia: "C2", habilidades: ["H1", "H4", "H6"], ...q }));

  // Etapa 1 · preenchido (Figma 4148:56803)
  const FILLED_STEP1 = {
    segmento: "EJA Regular",
    area: OPTIONS.area[0].label,
    competencia: OPTIONS.competencia[1],
    habilidade: OPTIONS.habilidade[3],
    marcadores: ["TESTE"],
  };
  // Configurações já concluídas nas etapas 2 e 3 (Figma 4148:56026)
  const FILLED_DONE = {
    segmento: "EJA Regular - Ensino Médio",
    area: OPTIONS.area[2].label,
    competencia: OPTIONS.competencia[1],
    habilidade: OPTIONS.habilidade[0],
    marcadores: ["TESTE", "PARA OUTUBRO"],
  };
  const DEFAULT_QUESTIONS = [
    { id: "q1", pontos: 1 }, { id: "q2", pontos: 1 }, { id: "q3", pontos: 2 }, { id: "q4", pontos: 2 },
  ];

  const KEY = "prof-ativ:wizard";
  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save(state) {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.AtividadeDados = {
    OPTIONS, QUESTIONS, FILLED_STEP1, FILLED_DONE, DEFAULT_QUESTIONS, load, save, escapeHtml,
    byId: (id) => QUESTIONS.find((q) => q.id === id),
    areaCode: (label) => (OPTIONS.area.find((a) => a.label === label) || {}).code || "",
    code: (s) => String(s || "").split(" - ")[0],
  };
})();
