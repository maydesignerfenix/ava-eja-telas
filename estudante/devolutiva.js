(function () {
  "use strict";

  // Mock correction matching Figma 4166:99774. Replace with the API response
  // for ?atividade=<id> (only "textos-midias" is mocked).
  const TYPES = {
    escolha: { label: "Escolha única", icon: "q-escolha.svg" },
    discursiva: { label: "Resposta discursiva", icon: "q-discursiva.svg" },
    curta: { label: "Resposta curta", icon: "q-curta.svg" },
  };

  const questions = [
    {
      title: "Verificação de informações",
      type: "escolha",
      score: "3,0 / 3,0",
      prompt: "Antes de compartilhar uma notícia nas redes sociais, qual atitude ajuda a verificar se ela é confiável?",
      answer: "B. Consultar a fonte, a data de publicação e comparar a informação com outros veículos confiáveis.",
      result: "Resposta correta",
      feedback: "Resposta correta. Verificar a origem e comparar fontes são atitudes importantes para evitar a circulação de informações falsas.",
    },
    {
      title: "Uso responsável das mídias",
      type: "discursiva",
      score: "3,5 / 4,0",
      prompt: "Explique dois cuidados que você deve ter ao compartilhar informações em aplicativos de mensagens. Use um exemplo do seu cotidiano.",
      answer: "Eu verifico quem publicou e procuro a mesma notícia em outros sites. Também não compartilho dados pessoais. Quando recebo uma mensagem com uma promoção, confiro no site oficial da loja antes de enviar para minha família.",
      result: "Resposta parcialmente correta",
      feedback: "Você apresentou dois cuidados pertinentes e um exemplo claro. Para aprofundar sua resposta, explique também por que a data e o contexto da publicação precisam ser verificados.",
    },
    {
      title: "Privacidade digital",
      type: "curta",
      score: "2,0 / 3,0",
      prompt: "Cite três ações que ajudam a proteger seus dados pessoais na internet.",
      answer: "Usar senhas fortes e não publicar meu endereço nas redes sociais.",
      result: "Resposta parcialmente correta",
      feedback: "As duas ações citadas estão corretas. Faltou uma terceira ação, como ativar a autenticação em duas etapas ou revisar as permissões dos aplicativos.",
    },
  ];

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  document.getElementById("answers-list").innerHTML = questions
    .map((q, i) => {
      const t = TYPES[q.type];
      return `
      <li class="question" aria-labelledby="q${i + 1}-title">
        <div class="question__head">
          <span class="type-tile" aria-hidden="true"><img src="assets/est-acomp/${t.icon}" width="20" height="20" alt="" /></span>
          <div class="question__id">
            <h3 class="est-strong" id="q${i + 1}-title">Questão ${i + 1} · ${escapeHtml(q.title)}</h3>
            <p class="est-small">${t.label}</p>
          </div>
          <p class="question__score"><span class="question__score-label">Pontuação: </span>${q.score}</p>
        </div>
        <p class="question__prompt">${escapeHtml(q.prompt)}</p>
        <div class="question__answers">
          <div class="answer-box">
            <p class="answer-box__title">Sua resposta enviada</p>
            <p>${escapeHtml(q.answer)}</p>
          </div>
          <div class="answer-box answer-box--feedback">
            <p class="answer-box__title">${escapeHtml(q.result)}</p>
            <p>${escapeHtml(q.feedback)}</p>
          </div>
        </div>
      </li>`;
    })
    .join("");
})();
