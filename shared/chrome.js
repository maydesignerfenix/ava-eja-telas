/*
 * Shared page chrome: SESI header, main navigation and institutional footer.
 *
 * Usage (in <body>):
 *   <body data-role="professor" data-nav="turmas">
 *     <div data-chrome="header"></div>   ← header + main nav go here
 *     <main>…</main>
 *     <div data-chrome="footer"></div>   ← footer goes here
 *     <script src="../shared/chrome.js"></script>
 *
 * data-role: "professor" | "estudante" (changes account e-mail and nav items)
 * data-nav:  "none" hides the main navigation (e.g. focused flows like
 *            "realizar atividade" that use a reduced header).
 * data-header: "none" skips the header entirely (page renders its own).
 * data-footer: "none" skips the footer.
 */
(function () {
  "use strict";

  const base = new URL(".", document.currentScript.src).href; // …/shared/
  const a = (file) => base + "assets/" + file;

  const ROLES = {
    professor: {
      email: "professor001@teste.com",
      nav: [
        { label: "Turmas" },
        { label: "Conteúdos", menu: true },
        { label: "Avaliações", menu: true },
        { label: "Fóruns e Comunicados" },
        { label: "PENSE Conteúdos" },
        { label: "Relatórios" },
        { label: "Suporte" },
      ],
    },
    estudante: {
      email: "aluno001@teste.com",
      nav: [{ label: "Turmas" }, { label: "PENSE Conteúdos" }, { label: "Suporte" }],
    },
  };

  const body = document.body;
  const role = ROLES[body.dataset.role] || ROLES.professor;

  function header() {
    return `
<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="${base}../index.html" aria-label="SESI Educação – início">
      <img class="brand__logo brand__logo--desktop" src="${a("logo-sesi.svg")}" width="191.001" height="43" alt="SESI – Serviço Social da Indústria" />
      <img class="brand__logo brand__logo--mobile" src="${a("mobile-logo-sesi.svg")}" width="120" height="27.2942" alt="SESI – Serviço Social da Indústria" />
      <span class="brand__divider" aria-hidden="true">
        <img class="only-desktop" src="${a("header-divider.svg")}" width="40" height="1" alt="" />
        <img class="only-mobile" src="${a("mobile-header-divider.svg")}" width="32" height="1" alt="" />
      </span>
      <span class="brand__channel">
        <span class="brand__title">Educação</span>
        <span class="brand__subtitle">Ambiente do Gestor</span>
      </span>
    </a>
    <div class="site-header__actions">
      <button class="icon-btn" type="button" aria-label="Notificações">
        <img class="only-desktop" src="${a("header-notifications.svg")}" width="40" height="40" alt="" />
        <img class="only-mobile" src="${a("mobile-header-notifications.svg")}" width="24" height="24" alt="" />
      </button>
      <button class="account" type="button" aria-haspopup="menu" aria-label="Conta: ${role.email}">
        <img class="only-desktop" src="${a("header-account.svg")}" width="40" height="40" alt="" />
        <img class="only-mobile" src="${a("mobile-header-account.svg")}" width="32" height="32" alt="" />
        <span class="account__details only-desktop">
          <span class="account__names">
            <span class="account__name">${role.email}</span>
            <span class="account__email">${role.email}</span>
          </span>
          <img src="${a("header-arrow-drop-down.svg")}" width="24" height="24" alt="" />
        </span>
      </button>
    </div>
  </div>
</header>`;
  }

  function nav() {
    const items = role.nav
      .map((i) =>
        i.menu
          ? `<button type="button" aria-haspopup="menu">${i.label} <img src="${a("nav-arrow-drop-down.svg")}" width="24" height="24" alt="" /></button>`
          : `<a href="#">${i.label}</a>`
      )
      .join("");
    return `<nav class="main-nav container" aria-label="Principal">${items}</nav>`;
  }

  function footer() {
    return `
<footer class="site-footer">
  <div class="site-footer__main">
    <div class="site-footer__inner">
      <div class="footer-col footer-col--links"><a href="#">Suporte</a><a href="#">Tutorial</a></div>
      <div class="footer-col">
        <p class="footer-col__title">Sede CNI Brasília</p>
        <p>SBN - Quadra 1 - Bloco C Ed. Roberto Simonsen Brasília - DF CEP 70040-903</p>
      </div>
      <div class="footer-col footer-col--gap">
        <p class="footer-col__title">Sede São Paulo</p>
        <p>Rua Surubim, 504 - Brooklin Novo São Paulo - SP | CEP 04571-050</p>
        <p>CNI (11) 3040 3860</p>
        <p>IEL (11) 3040 3370</p>
      </div>
      <div class="footer-col footer-col--gap">
        <p class="footer-col__title footer-col__title--plain">SAC - Serviço de Atendimento ao Cliente</p>
        <p>(31) 3326 5000</p>
        <p>(31) 9 8345 2842</p>
      </div>
    </div>
  </div>
  <div class="site-footer__bottom">
    <div class="site-footer__inner">
      <div class="social only-desktop">
        <a href="#" aria-label="Facebook"><img src="${a("social-facebook.svg")}" width="30" height="30" alt="" /></a>
        <a href="#" aria-label="Instagram"><img src="${a("social-instagram.svg")}" width="30" height="30" alt="" /></a>
        <a href="#" aria-label="Twitter"><img src="${a("social-twitter.svg")}" width="30" height="30" alt="" /></a>
        <a href="#" aria-label="LinkedIn"><img src="${a("social-linkedin.svg")}" width="30" height="30" alt="" /></a>
        <a href="#" aria-label="YouTube"><img src="${a("social-youtube.svg")}" width="30" height="30" alt="" /></a>
        <a class="social__badge" href="#" aria-label="SESI">
          <img src="${a("social-badge-circle.svg")}" width="30" height="30" alt="" />
          <img class="social__badge-img" src="${a("footer-sesi-badge.png")}" width="24" height="24" alt="" />
        </a>
      </div>
      <img class="only-mobile" src="${a("mobile-social.svg")}" width="156" height="24" alt="Facebook, Instagram, Twitter e LinkedIn" />
      <a class="site-footer__privacy" href="#">Política de Privacidade</a>
    </div>
  </div>
</footer>`;
  }

  const headerSlot = document.querySelector('[data-chrome="header"]');
  if (headerSlot && body.dataset.header !== "none") {
    headerSlot.outerHTML = header() + (body.dataset.nav === "none" ? "" : nav());
  }
  const footerSlot = document.querySelector('[data-chrome="footer"]');
  if (footerSlot && body.dataset.footer !== "none") {
    footerSlot.outerHTML = footer();
  }
})();
