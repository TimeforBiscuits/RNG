# RNG.EXE: random name generator

Generates random first and last names by country of origin, styled like an
early-90s DOS program.

Nationalities: American, Russian, Serbian, Greek, Ukrainian, Chinese,
Turkish, Arabic, Indian.

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
| `1`-`9`, `0` | Pick a nationality (`0` = random) |
| `Up` / `Down` | Move through nationalities |
| `Enter` / `G` | Generate |
| `M` / `F` / `A` | Male / Female / Any |
| `+` / `-` | More / fewer names (1, 5, 10, 25) |
| `W` | Chinese name order (family name first by default) |
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
| Turkish | Turkish Latin simplified to ASCII (Yilmaz, Celik) |
| Arabic, Indian | Common English spellings |

**Gendered surnames:** surnames are stored in their masculine form.
`js/generator.js` derives the feminine form where the language requires it:

- **Russian:** Ivanov becomes Ivanova, Pokrovsky becomes Pokrovskaya.
- **Ukrainian:** Kovalskyi becomes Kovalska. Shevchenko is unchanged.
- **Greek:** Papadopoulos becomes Papadopoulou, Papadakis becomes Papadaki.
  Georgiou is unchanged.

**Adding a nationality:**

1. Copy one of the data files.
2. Add a `<script>` tag for it in `index.html` and an entry in `sw.js`.
3. Run `npm test`.

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
