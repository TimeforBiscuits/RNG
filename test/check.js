// Sanity checks: run with `node test/check.js` (or `npm test`).
// - every name is plain ASCII letters (plus hyphen/apostrophe/space)
// - no duplicate entries within a list
// - feminine surname rules produce the expected forms
// - the generator returns the requested number of well-formed names
"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assert = require("assert");

var root = path.join(__dirname, "..");
var ctx = { crypto: require("crypto").webcrypto };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/generator.js"), "utf8"), ctx);

// Load data files in the order index.html lists them.
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var dataFiles = (html.match(/data\/[a-z]+\.js/g) || []);
dataFiles.forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
});
var RNG = ctx.RNG;
var NATIONS = ctx.RNG_DATA;
var failures = 0;

function check(cond, msg) {
  if (!cond) { failures++; console.error("FAIL: " + msg); }
}

check(NATIONS.length === 15, "expected 15 nationalities, got " + NATIONS.length);
check(dataFiles.length === fs.readdirSync(path.join(root, "data")).length,
  "every file in data/ must be listed in index.html");

// Every file the service worker caches must exist, and every data file must be cached.
var swFiles = (fs.readFileSync(path.join(root, "sw.js"), "utf8").match(/"[^"]+\.[a-z0-9]+"/g) || [])
  .map(function (f) { return f.slice(1, -1); });
swFiles.forEach(function (f) {
  check(fs.existsSync(path.join(root, f)), "sw.js caches missing file " + f);
});
dataFiles.forEach(function (f) {
  check(swFiles.indexOf(f) >= 0, "sw.js does not cache " + f);
});

// Every list should offer at least 200 names. Korean has few surnames in
// real use, so its surname list has a lower floor (and is weighted).
var MIN_NAMES = 200;
var MIN_EXCEPTIONS = { "korean.surnames": 100 };

var ASCII_NAME = /^[A-Za-z][A-Za-z' -]*[a-z]$/;
NATIONS.forEach(function (n) {
  ["male", "female", "surnames"].forEach(function (list) {
    var min = MIN_EXCEPTIONS[n.id + "." + list] || MIN_NAMES;
    check(Array.isArray(n[list]) && n[list].length >= min, n.id + "." + list + " has " + n[list].length + " names, needs at least " + min);
    var seen = {};
    n[list].forEach(function (name) {
      check(ASCII_NAME.test(name), n.id + "." + list + ": not plain ASCII: " + JSON.stringify(name));
      check(!seen[name], n.id + "." + list + ": duplicate " + name);
      seen[name] = true;
    });
  });
  ["id", "code", "label", "script", "romanization"].forEach(function (k) {
    check(typeof n[k] === "string" && n[k], n.id + " missing " + k);
  });
});

// Feminine surname forms.
function nat(id) { return NATIONS.filter(function (n) { return n.id === id; })[0]; }
var cases = [
  ["russian", "Ivanov", "Ivanova"], ["russian", "Ilyin", "Ilyina"],
  ["russian", "Pokrovsky", "Pokrovskaya"], ["russian", "Tolstoy", "Tolstaya"],
  ["russian", "Chernykh", "Chernykh"],
  ["ukrainian", "Kovalskyi", "Kovalska"], ["ukrainian", "Chornyi", "Chorna"],
  ["ukrainian", "Shevchenko", "Shevchenko"], ["ukrainian", "Kovalchuk", "Kovalchuk"],
  ["greek", "Papadopoulos", "Papadopoulou"], ["greek", "Papadakis", "Papadaki"],
  ["greek", "Pappas", "Pappa"], ["greek", "Georgiou", "Georgiou"],
  ["latvian", "Berzins", "Berzina"], ["latvian", "Jansons", "Jansone"],
  ["latvian", "Balodis", "Balode"], ["latvian", "Kalejs", "Kaleja"],
  ["latvian", "Ozols", "Ozola"], ["latvian", "Liepa", "Liepa"],
  ["latvian", "Dombrovskis", "Dombrovska"],
  ["serbian", "Jovanovic", "Jovanovic"], ["turkish", "Yilmaz", "Yilmaz"],
  ["german", "Mueller", "Mueller"], ["norwegian", "Hansen", "Hansen"]
];
cases.forEach(function (c) {
  var got = RNG.surnameFor(nat(c[0]), c[1], "female");
  check(got === c[2], c[0] + " feminine of " + c[1] + ": expected " + c[2] + ", got " + got);
  check(RNG.surnameFor(nat(c[0]), c[1], "male") === c[1], c[0] + " masculine of " + c[1] + " must be unchanged");
});

// Generator output.
NATIONS.forEach(function (n) {
  ["male", "female", "any"].forEach(function (g) {
    var out = RNG.generate([n], 25, { gender: g });
    check(out.length === 25, n.id + "/" + g + ": expected 25 names, got " + out.length);
    out.forEach(function (x) {
      check(/^[A-Za-z' -]+$/.test(x.full), "non-ASCII output " + x.full);
      if (g !== "any") check(x.gender === g, n.id + ": wrong gender " + x.gender);
    });
  });
});
["chinese", "korean"].forEach(function (id) {
  var a = RNG.generateOne(nat(id), {});
  check(a.full === a.last + " " + a.first, id + " should default to family name first");
  var b = RNG.generateOne(nat(id), { westernOrder: true });
  check(b.full === b.first + " " + b.last, id + " western order should put given name first");
});
["american", "japanese"].forEach(function (id) {
  var x = RNG.generateOne(nat(id), {});
  check(x.full === x.first + " " + x.last, id + " should be given name first");
});

// Ukrainian: surnames ending in -nko must stay at 50% or less.
var ukr = nat("ukrainian").surnames;
var nko = ukr.filter(function (s) { return /nko$/.test(s); }).length;
check(nko / ukr.length <= 0.5, "ukrainian -nko surnames are " + Math.round(100 * nko / ukr.length) + "%, must be 50% or less");

// Weighted surnames: the most common one should come up far more often
// than an average one, but rare ones must still appear.
var ko = nat("korean"), counts = {};
for (var i = 0; i < 20000; i++) {
  var s = RNG.generateOne(ko, { gender: "male" }).last;
  counts[s] = (counts[s] || 0) + 1;
}
check(counts.Kim / 20000 > 0.12 && counts.Kim / 20000 < 0.3, "Kim share should be roughly 20%, got " + (counts.Kim / 200).toFixed(1) + "%");
check(Object.keys(counts).length > 80, "weighted Korean surnames should still reach most of the list");

// Print a sample for eyeballing.
NATIONS.forEach(function (n) {
  var s = RNG.generate([n], 4, { gender: "any" }).map(function (x) { return x.full; });
  console.log(n.code + "  " + s.join(", "));
});

if (failures) { console.error("\n" + failures + " check(s) failed"); process.exit(1); }
console.log("\nAll checks passed.");
