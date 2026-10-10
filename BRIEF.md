# AVA EJA – implementation brief (for every builder)

Static, dependency-free site: HTML + CSS + vanilla JS. No build tools, no frameworks,
no Tailwind, no CDNs except Google Fonts (Inter, Roboto). Node and Python are NOT installed.

Site root: `site/` (absolute path given in your task). Served at http://localhost:8770/
(a Ruby static server is already running — do NOT start servers).

Figma file key: `IqB0fuv75EtC1NbJK4HKUh`

## Read first
- `site/shared/base.css` — tokens + shared components (header, nav, breadcrumb, buttons,
  class header, divider, banner, tabs, page-title, badges, progress, form fields, search,
  select, notice, card, pagination, modal, footer). Desktop ≥ 1024px, mobile below.
- `site/shared/chrome.js` — injects header/main-nav/footer. See its header comment.
- `site/professor/turma-atividades.html|css|js` — a finished reference page. Copy its patterns.

## Page skeleton
```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>… · AVA EJA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../shared/base.css" />
  <link rel="stylesheet" href="<your-page>.css" />
</head>
<body data-role="professor|estudante">
  <div data-chrome="header"></div>
  <main class="container">…</main>
  <div data-chrome="footer"></div>
  <script src="../shared/chrome.js"></script>
  <script src="<your-page>.js"></script>
</body>
</html>
```

## Rules
1. **Ownership.** Only create/edit files you own: pages under `site/<area>/` whose names start
   with your group prefix, your assets folder `site/<area>/assets/<group>/`, and
   `site/manifest/<group>.json`. NEVER edit `site/shared/*`, `BRIEF.md`, or another group's files.
   If a shared component is wrong or missing, put the fix/extension in your own CSS and mention it
   in your final report.
2. **One responsive page per desktop+mobile pair.** Desktop frames are 1280 wide, mobile 402
   (professor) or 390 (estudante). Same breakpoint as base.css (1024px).
3. **States.** When Figma shows several states of the same screen (empty/filled, step 1..N,
   question type A/B/C, modal open/closed, answer selected…), prefer ONE page that implements the
   states as real interactions (JS), plus a `?state=` / `?tipo=` / `?etapa=` query param so each
   Figma state can be opened directly. Only split into separate files when screens are genuinely
   different pages.
4. **Figma workflow.** Load the `figma:figma-design-to-code` skill first and follow it
   (pass `skillNames: "figma-design-to-code"`). Frames are large: call `get_design_context` on
   sub-sections (children) rather than whole frames when responses are sparse/too big; use
   `get_metadata` / `get_screenshot` to orient. Responses too big get saved to a file — slice them
   with `jq`/`grep`, don't read them whole.
5. **Assets.** Download every visible icon/image from the `get_design_context` asset URLs with
   `curl` into `site/<area>/assets/<group>/` (or reuse an identical file already in
   `site/shared/assets/` — compare with `md5 -q`). Keep SVG root width/height attributes; set the
   same width/height on `<img>`. No Figma URLs may remain in code.
6. **Semantics & a11y.** Real `<button>`, `<a>`, `<input>`, `<select>`, `<label>`, `<dialog>`,
   headings in order, `aria-*` where needed, Portuguese copy exactly as in Figma.
7. **Tokens.** Use the CSS custom properties from base.css; add new colors as custom properties at
   the top of your CSS file (named by role), not as scattered hex values.
8. **Verify in the browser.** Use the Browser pane tools, but ALWAYS in your own tab:
   call `tabs_create` once and pass that `tabId` to every navigate/resize/screenshot/javascript call
   (other builders share the pane). Check desktop at 1280 and mobile at 402/390: compare key element
   y-positions/sizes (via `getBoundingClientRect`) and a screenshot against the Figma screenshot,
   no broken images (`naturalWidth === 0`), no console errors, no horizontal scroll on mobile.
   Close your tab when done.
9. **Manifest.** Write `site/manifest/<group>.json`:
   ```json
   [{ "title": "Criar questão · Etapa 1", "path": "professor/q-criar-etapa-1.html",
      "area": "Professor", "flow": "Construir a base para atividades",
      "states": [{ "label": "Vazio", "query": "?state=vazio" }],
      "figma": ["4139:42341", "4139:42427"] }]
   ```
10. **Final report** (≤ 200 words): pages built, states covered, what was verified and how,
    known deviations from Figma, anything you could not do.
