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

check(NATIONS.length === 9, "expected 9 nationalities, got " + NATIONS.length);
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

var ASCII_NAME = /^[A-Za-z][A-Za-z' -]*[a-z]$/;
NATIONS.forEach(function (n) {
  ["male", "female", "surnames"].forEach(function (list) {
    check(Array.isArray(n[list]) && n[list].length >= 40, n.id + "." + list + " should have at least 40 names");
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
  ["serbian", "Jovanovic", "Jovanovic"], ["turkish", "Yilmaz", "Yilmaz"]
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
var zh = nat("chinese");
var a = RNG.generateOne(zh, {});
check(a.full === a.last + " " + a.first, "Chinese should default to family name first");
var b = RNG.generateOne(zh, { westernOrder: true });
check(b.full === b.first + " " + b.last, "Chinese western order should put given name first");

// Print a sample for eyeballing.
NATIONS.forEach(function (n) {
  var s = RNG.generate([n], 4, { gender: "any" }).map(function (x) { return x.full; });
  console.log(n.code + "  " + s.join(", "));
});

if (failures) { console.error("\n" + failures + " check(s) failed"); process.exit(1); }
console.log("\nAll checks passed.");
