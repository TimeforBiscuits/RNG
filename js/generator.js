// Name generator core. Data files push nationality records into RNG_DATA.
// Works in the browser (globals) and in Node (module.exports) for tests.
(function (root) {
  "use strict";

  root.RNG_DATA = root.RNG_DATA || [];

  // Surnames are stored in masculine form. These rules derive the
  // feminine form for languages whose surnames change with gender.
  var FEMININE_RULES = {
    russian: function (s) {
      if (/(sky|skiy)$/.test(s)) return s.replace(/(sky|skiy)$/, "skaya");
      if (/oy$/.test(s)) return s.replace(/oy$/, "aya"); // Tolstoy > Tolstaya
      if (/(ov|ev|yov|in|yn)$/.test(s)) return s + "a"; // Ivanov > Ivanova
      return s; // -ykh, -ikh, -ko etc. do not change
    },
    ukrainian: function (s) {
      if (/yi$/.test(s)) return s.replace(/yi$/, "a"); // Kovalskyi > Kovalska
      if (/(ov|ev|in)$/.test(s)) return s + "a";
      return s; // -enko, -uk, -chuk, -iv etc. do not change
    },
    greek: function (s) {
      if (/ou$/.test(s)) return s; // Georgiou stays Georgiou
      if (/os$/.test(s)) return s.replace(/os$/, "ou"); // Papadopoulos > Papadopoulou
      if (/is$/.test(s)) return s.replace(/is$/, "i"); // Papadakis > Papadaki
      if (/as$/.test(s)) return s.replace(/as$/, "a"); // Pappas > Pappa
      return s;
    },
    bulgarian: function (s) {
      if (/ski$/.test(s)) return s.replace(/ski$/, "ska"); // Petrovski > Petrovska
      if (/(ov|ev|in)$/.test(s)) return s + "a"; // Ivanov > Ivanova
      return s; // others do not change
    },
    latvian: function (s) {
      if (/skis$/.test(s)) return s.replace(/skis$/, "ska"); // Dombrovskis > Dombrovska
      if (/ons$/.test(s)) return s.replace(/ons$/, "one"); // Jansons > Jansone
      if (/is$/.test(s)) return s.replace(/is$/, "e"); // Balodis > Balode
      if (/s$/.test(s)) return s.replace(/s$/, "a"); // Berzins > Berzina
      return s; // Liepa, Skuja do not change
    }
  };

  function randomInt(max) {
    var c = root.crypto || (typeof require === "function" ? require("crypto").webcrypto : null);
    if (c && c.getRandomValues) {
      var buf = new Uint32Array(1);
      // Rejection sampling avoids modulo bias.
      var limit = Math.floor(0x100000000 / max) * max;
      do { c.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function pick(list) {
    return list[randomInt(list.length)];
  }

  // Picks from a list ordered most-common-first, favouring the top.
  // bias 1 is uniform; higher values lean harder toward the start, so a few
  // very common surnames (Kim, Wang) come up about as often as in real life.
  function pickWeighted(list, bias) {
    if (!bias || bias <= 1) return pick(list);
    var u = randomInt(0x40000000) / 0x40000000;
    return list[Math.floor(list.length * Math.pow(u, bias))];
  }

  function surnameFor(nat, surname, gender) {
    var rule = FEMININE_RULES[nat.id];
    return gender === "female" && rule ? rule(surname) : surname;
  }

  // options: { gender: "male"|"female"|"any", westernOrder: bool }
  function generateOne(nat, options) {
    options = options || {};
    var gender = options.gender;
    if (gender !== "male" && gender !== "female") {
      gender = randomInt(2) === 0 ? "male" : "female";
    }
    var first = pick(nat[gender]);
    var last = surnameFor(nat, pickWeighted(nat.surnames, nat.surnameBias), gender);
    var familyFirst = nat.familyFirst && !options.westernOrder;
    return {
      first: first,
      last: last,
      gender: gender,
      nationality: nat.id,
      label: nat.label,
      full: familyFirst ? last + " " + first : first + " " + last
    };
  }

  // Generates `count` names, avoiding repeats within the batch where possible.
  function generate(natList, count, options) {
    var out = [];
    var seen = {};
    var attempts = 0;
    while (out.length < count && attempts < count * 20) {
      attempts++;
      var name = generateOne(pick(natList), options);
      if (seen[name.full]) continue;
      seen[name.full] = true;
      out.push(name);
    }
    return out;
  }

  var api = {
    generate: generate,
    generateOne: generateOne,
    surnameFor: surnameFor,
    FEMININE_RULES: FEMININE_RULES
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RNG = api;
})(typeof window !== "undefined" ? window : globalThis);
