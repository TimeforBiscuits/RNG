# RNG.EXE: random name generator

Generates random first and last names by country of origin, styled like an
early-90s DOS program.

Nationalities: American, Russian, Serbian, Greek, Ukrainian, Chinese,
Turkish, Arabic, Indian, Japanese, Korean, German, French, Norwegian,
Latvian, Bulgarian.

All names are shown in the Latin alphabet as **plain ASCII**. There are no
accents, so every name can be typed on any keyboard.

## Running it

It's a static web page with no build step and no dependencies.

- **Locally:** open `index.html` in a browser, or run `npm start` and go to
  http://localhost:8080.
- **Hosted:** publish the repo root on any static host, such as GitHub Pages,
  Cloudflare Pages or Netlify.

Once it's hosted over HTTPS, it works offline and can be installed as an app:

- **iPad:** in Safari, tap Share, then *Add to Home Screen*.
- **Mac:** in Safari, choose File, then *Add to Dock*.

## Controls

| Key | Action |
|---|---|
| `1`-`16` | Pick a nationality. For 10-16, type both digits quickly. |
| `Up` / `Down` | Move through nationalities |
| `Enter` / `G` | Generate |
| `M` / `F` / `A` | Male / Female / Any |
| `+` / `-` | More / fewer names (1, 5, 10, 25) |
| `W` | Chinese/Korean name order (family name first by default) |
| `C` | Clear output |
| `R` | CRT effect on/off |
| `H` / `?` | Help |

The function keys F1, F5, F6, F8 and F9 also work, and the bar at the bottom
of the screen can be tapped. Click a name to copy it.

## How the names work

Each nationality is in `data/<nationality>.js` and has lists of male first
names, female first names and surnames.

| Nationality | Romanization |
|---|---|
| Russian | Passport-style (Dmitry, Sergey) |
| Ukrainian | Ukrainian national system (Oleksandr, Mykola) |
| Serbian | Serbian Latin simplified to ASCII (Djordjevic, Milos) |
| Greek | ELOT 743 / UN standard, no accent marks |
| Chinese | Hanyu Pinyin without tone marks |
| Japanese | Hepburn without long-vowel marks (Sato, Ito) |
| Korean | Revised Romanization for given names (Min-jun); customary surname spellings (Kim, Lee, Park) |
| German | Umlauts as ae/oe/ue, eszett as ss (Mueller, Gross) |
| French | Accents dropped (Helene, Francois) |
| Norwegian | Simplified to ASCII (Bjorn, Hakon, Saether) |
| Latvian | Diacritics dropped (Berzins, Janis) |
| Bulgarian | Official Streamlined System, 2009 (Petar, Zhivko, Tsvetan) |
| Turkish | Turkish Latin simplified to ASCII (Yilmaz, Celik) |
| Arabic, Indian | Common English spellings |

**Gendered surnames:** surnames are stored in their masculine form.
`js/generator.js` derives the feminine form where the language requires it:

- **Russian:** Ivanov becomes Ivanova, Pokrovsky becomes Pokrovskaya.
- **Ukrainian:** Kovalskyi becomes Kovalska. Shevchenko is unchanged.
- **Greek:** Papadopoulos becomes Papadopoulou, Papadakis becomes Papadaki.
  Georgiou is unchanged.
- **Latvian:** Berzins becomes Berzina, Balodis becomes Balode, Jansons
  becomes Jansone, Dombrovskis becomes Dombrovska. Liepa is unchanged.
- **Bulgarian:** Ivanov becomes Ivanova, Georgiev becomes Georgieva,
  Zagorski becomes Zagorska.

**List sizes:** every first-name and surname list has at least 200 names,
about 11,000 in total. The one exception is Korean surnames. Korea has
relatively few surnames, and a handful (Kim, Lee, Park) cover nearly half the
population, so that list has about 100.

**Weighted surnames:** Korean and Chinese surname lists are ordered most
common first, and `surnameBias` makes picks lean toward the top. Kim comes up
about 20% of the time, as in real life, while rarer surnames still appear.

**Name order:** Chinese and Korean names are shown family name first by
default. All others, including Japanese, are shown given name first.

**Adding a nationality:**

1. Copy one of the data files and give it a unique `id` and three-letter `code`.
2. Add a `<script>` tag for it in `index.html` and an entry in `sw.js`.
   Bump `VERSION` in `sw.js` so installed copies update.
3. Update the expected count in `test/check.js`, then run `npm test`.

## Tests

```
npm test
```

The tests check that:

- every name is plain ASCII
- no list contains duplicates
- the feminine surname rules give the right forms
- the generator returns the requested number of names

## Credits

The VT323 font is by Peter Hull and is licensed under the SIL Open Font
License (`fonts/OFL.txt`).
