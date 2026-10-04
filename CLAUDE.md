# RNG.EXE

A random first/last name generator by country of origin, styled like an
early-90s DOS program. It's a static site with plain HTML, CSS and JS, no
build step and no dependencies. It's published with GitHub Pages from `main`
at https://timeforbiscuits.github.io/RNG/.

The owner is new to Claude Code. Explain changes in plain language.

## Layout

- `index.html`: the page. Lists every data file in a `<script>` tag.
- `js/generator.js`: picks names and applies the feminine surname rules
  (`FEMININE_RULES`).
- `js/app.js`: UI, keyboard shortcuts, boot screen.
- `data/<nationality>.js`: one file per nationality, with `male`, `female`
  and `surnames` lists.
- `sw.js`: offline cache, which lists every file.
- `test/check.js`: run with `npm test`.

## Rules for name data

- **Plain ASCII only.** No accents or diacritics. Use the simple ASCII
  convention for each language:
  - German: ae/oe/ue/ss.
  - Serbian: dj, c, s, z.
  - Norwegian: o for o-slash, a for a-ring.
  - Japanese: no macrons.
  - Chinese: Pinyin without tones.
  - Bulgarian: the official Streamlined System (zh, ts, sht, a for the hard sign).
- Every non-Latin script is romanized with one consistent standard. Record
  that standard in the file's `romanization` field and in the README table.
- Each list holds at least 200 realistic names, with no duplicates. The one
  exception is Korean surnames, with a minimum of 100. `test/check.js`
  enforces this.
- Prefer everyday names over famous people.
- Use formal names, not nicknames: Konstantinos, not Kostas.
- Use one spelling per name, not variants: Dmitry only, not also Dmitri.
- Korean and Chinese surnames are listed most common first and weighted
  (`surnameBias`). Keep new common surnames near the top of those lists.
- Store surnames in the masculine form. Languages with gendered surnames
  (Russian, Ukrainian, Greek, Latvian, Bulgarian) get a rule in
  `FEMININE_RULES`, plus
  test cases in `test/check.js`.
- Chinese and Korean set `familyFirst: true`. Japanese is shown given name
  first, as the owner asked.
- Ukrainian: keep surnames ending in "-nko" at 50% of the list or less. If
  they go over, add more non "-nko" surnames rather than removing any.
  `test/check.js` enforces this.

## Adding a nationality

1. Add `data/<id>.js` with a unique `id` and three-letter `code`.
2. Add its `<script>` tag to `index.html`, after the existing ones. The list
   order sets the number keys.
3. Add it to `FILES` in `sw.js`, and bump `VERSION` in `sw.js`.
4. Update the expected count in `test/check.js`.
5. Add a row to the README romanization table.

## Look and feel

- Keep the 16-colour text-mode look:
  - Blue windows with double borders, a grey menu bar and key bar, and
    cyan highlights.
  - The VT323 font, which is self-hosted in `fonts/`.
- It must work on iPad and phone widths. Every keyboard action also needs a
  tappable control, because iPad keyboards have no F-keys.

## Workflow

- Run `npm test` before every commit. It must pass.
- Check UI changes in headless Chromium at desktop, iPad (1024x1366) and
  phone (390x844) sizes.
- Never push directly to `main`. Work on a branch and open a pull request.
  The live site updates when the owner merges it.
