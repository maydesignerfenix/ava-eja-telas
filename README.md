# AVA EJA · Telas (Professor e Estudante)

Protótipo navegável em HTML, CSS e JavaScript puro das telas do Figma
**[AVA EJA] Fluxos de Usuário | Professor e Estudante**. As páginas são responsivas:
o layout desktop vale a partir de 1024px e o mobile abaixo disso.

## Como abrir

O ponto de entrada é `index.html`, um hub com todas as telas agrupadas por perfil e
fluxo, além de atalhos para cada estado do Figma.

O hub carrega a lista de telas da pasta `manifest/`, por isso precisa ser aberto por um
servidor web, e não com duplo clique no arquivo. O mais fácil é publicar no
**GitHub Pages**: no repositório, abra *Settings → Pages*, escolha *Deploy from a branch*,
selecione o branch `main` e a pasta `/ (root)`, e salve. Em alguns minutos o link
`https://<seu-usuario>.github.io/<repositorio>/` fica disponível.

As páginas individuais (`professor/*.html`, `estudante/*.html`) também abrem direto no
navegador.

## Estrutura

```
index.html            Hub com todas as telas
shared/base.css       Tokens de design e componentes compartilhados
shared/chrome.js      Cabeçalho, menu e rodapé do SESI (data-role="professor|estudante")
shared/assets/        Ícones e logos compartilhados
professor/            Telas do professor (cada uma com .html, .css e .js)
estudante/            Telas do estudante
manifest/*.json       Lista de telas e estados usada pelo hub
BRIEF.md              Convenções usadas na construção das telas
```

## Estados das telas

Telas com vários estados no Figma (vazio/preenchido, etapas, tipo de questão etc.)
são uma única página interativa. Cada estado também abre direto pela URL, por exemplo
`professor/atividade-criar.html?etapa=3&state=aberto` ou
`professor/questao-criar-etapa-2.html?tipo=correlacao`. Os atalhos de cada tela estão no hub.

## Dados

Todos os dados são de exemplo e ficam em arquivos `.js` separados (por exemplo
`professor/atividade-dados.js` e `professor/aval-boletim-data.js`), prontos para serem
trocados pela API. Áudios e vídeos são placeholders.
