// RNG.EXE user interface: wiring, keyboard shortcuts, boot screen.
(function () {
  "use strict";

  var NATIONS = window.RNG_DATA;
  var COUNTS = [1, 5, 10, 25];
  var MAX_HISTORY = 200;

  var $ = function (id) { return document.getElementById(id); };
  var originsEl = $("origins");
  var outputEl = $("output");
  var emptyEl = $("empty");
  var statusEl = $("status");
  var infoEl = $("info");
  var helpEl = $("help");
  var westernEl = $("western-order");

  var state = {
    origin: "random",
    gender: "any",
    count: 5,
    westernOrder: false,
    crt: true
  };
  var history = []; // array of batches, newest first

  // ---------- Preferences (per-device convenience only) ----------

  function loadPrefs() {
    try {
      var saved = JSON.parse(localStorage.getItem("rng.prefs") || "{}");
      Object.keys(state).forEach(function (k) {
        if (k in saved) state[k] = saved[k];
      });
    } catch (e) { /* storage unavailable: use defaults */ }
    if (state.origin !== "random" && !findNation(state.origin)) state.origin = "random";
    if (COUNTS.indexOf(state.count) < 0) state.count = 5;
  }

  function savePrefs() {
    try { localStorage.setItem("rng.prefs", JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function findNation(id) {
    for (var i = 0; i < NATIONS.length; i++) if (NATIONS[i].id === id) return NATIONS[i];
    return null;
  }

  // ---------- Rendering ----------

  function buildOrigins() {
    var items = NATIONS.map(function (n, i) {
      return { id: n.id, key: String(i + 1), label: n.label, meta: n.code };
    });
    items.push({ id: "random", key: "0", label: "* RANDOM *", meta: "ALL" });

    items.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "origin" + (item.id === "random" ? " random" : "");
      b.setAttribute("role", "radio");
      b.dataset.id = item.id;
      b.innerHTML =
        '<span class="key">' + item.key + '</span>' +
        '<span class="name">' + item.label.toUpperCase() + '</span>' +
        '<span class="meta">' + item.meta + '</span>';
      b.addEventListener("click", function () { setOrigin(item.id); });
      originsEl.appendChild(b);
    });
  }

  function renderOrigins() {
    Array.prototype.forEach.call(originsEl.children, function (b) {
      var on = b.dataset.id === state.origin;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    var n = findNation(state.origin);
    infoEl.innerHTML = n
      ? "SCRIPT: <b>" + n.script + "</b> &middot; ROMANIZATION: <b>" + n.romanization + "</b>"
      : "SOURCE: <b>all " + NATIONS.length + " nationalities</b>";
  }

  function renderOptions() {
    document.querySelectorAll('input[name="gender"]').forEach(function (r) {
      r.checked = r.value === state.gender;
    });
    document.querySelectorAll('input[name="count"]').forEach(function (r) {
      r.checked = Number(r.value) === state.count;
    });
    westernEl.checked = state.westernOrder;
    document.body.classList.toggle("crt", state.crt);
  }

  function renderOutput() {
    outputEl.innerHTML = "";
    emptyEl.hidden = history.length > 0;
    var num = 0;
    history.forEach(function (batch, bi) {
      if (bi > 0) {
        var sep = document.createElement("li");
        sep.className = "batch-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "-- previous " + "-".repeat(200);
        outputEl.appendChild(sep);
      }
      batch.names.forEach(function (name, i) {
        num++;
        var li = document.createElement("li");
        if (bi > 0) li.className = "old";
        var b = document.createElement("button");
        b.type = "button";
        b.className = "name-row" + (bi === 0 && batch.fresh ? " new" : "");
        if (bi === 0 && batch.fresh) b.style.animationDelay = (i * 0.04) + "s";
        b.title = "Copy " + name.full;
        b.innerHTML =
          '<span class="num">' + String(num).padStart(2, "0") + '</span>' +
          '<span class="full"></span>' +
          '<span class="tag">' + findNation(name.nationality).code + " " + (name.gender === "male" ? "M" : "F") + '</span>';
        b.querySelector(".full").textContent = name.full;
        b.addEventListener("click", function () { copy(name.full, b); });
        li.appendChild(b);
        outputEl.appendChild(li);
      });
      batch.fresh = false;
    });
    outputEl.scrollTop = 0;
  }

  // ---------- Actions ----------

  function setOrigin(id) {
    state.origin = id;
    savePrefs();
    renderOrigins();
    status(id === "random" ? "ORIGIN: RANDOM" : "ORIGIN: " + findNation(id).label.toUpperCase());
  }

  function moveOrigin(delta) {
    var ids = NATIONS.map(function (n) { return n.id; }).concat("random");
    var i = ids.indexOf(state.origin);
    setOrigin(ids[(i + delta + ids.length) % ids.length]);
    var active = originsEl.querySelector('[aria-checked="true"]');
    if (active && originsEl.contains(document.activeElement)) active.focus();
  }

  // Number keys pick a nationality. Items 10+ take two digits typed in quick
  // succession: "1" selects #1 at once, and a second digit within the
  // window upgrades it to #10-#19.
  var lastDigit = null;
  var lastDigitAt = 0;
  function pickByDigit(d) {
    var now = Date.now();
    var idx = d;
    if (lastDigit !== null && now - lastDigitAt < 800 && NATIONS[lastDigit * 10 + d - 1]) {
      idx = lastDigit * 10 + d;
      lastDigit = null;
    } else {
      lastDigit = d;
      lastDigitAt = now;
    }
    if (idx === 0) setOrigin("random");
    else if (NATIONS[idx - 1]) setOrigin(NATIONS[idx - 1].id);
  }

  function setGender(g) {
    state.gender = g;
    savePrefs();
    renderOptions();
    status("GENDER: " + g.toUpperCase());
  }

  function stepCount(delta) {
    var i = COUNTS.indexOf(state.count) + delta;
    state.count = COUNTS[Math.max(0, Math.min(COUNTS.length - 1, i))];
    savePrefs();
    renderOptions();
    status("COUNT: " + state.count);
  }

  function generate() {
    var pool = state.origin === "random" ? NATIONS : [findNation(state.origin)];
    var names = RNG.generate(pool, state.count, {
      gender: state.gender,
      westernOrder: state.westernOrder
    });
    history.unshift({ names: names, fresh: true });
    // Trim old batches so the list stays manageable.
    var total = 0;
    history = history.filter(function (b) { total += b.names.length; return total <= MAX_HISTORY || b === history[0]; });
    renderOutput();
    press($("generate"));
    status(names.length + (names.length === 1 ? " NAME" : " NAMES") + " GENERATED");
  }

  function clearOutput() {
    history = [];
    renderOutput();
    status("OUTPUT CLEARED");
  }

  function copyAll() {
    if (!history.length) { status("NOTHING TO COPY"); return; }
    copy(history[0].names.map(function (n) { return n.full; }).join("\n"), null, "BATCH COPIED");
  }

  function copy(text, el, message) {
    var done = function () {
      status(message || "COPIED: " + text.toUpperCase());
      if (el) {
        el.classList.add("copied");
        setTimeout(function () { el.classList.remove("copied"); }, 600);
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) && done(); });
    } else if (fallbackCopy(text)) {
      done();
    } else {
      status("COPY FAILED");
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function toggleCrt() {
    state.crt = !state.crt;
    savePrefs();
    renderOptions();
    status("CRT EFFECT " + (state.crt ? "ON" : "OFF"));
  }

  function toggleWestern() {
    state.westernOrder = !state.westernOrder;
    savePrefs();
    renderOptions();
    status(state.westernOrder ? "CHINESE/KOREAN: GIVEN NAME FIRST" : "CHINESE/KOREAN: FAMILY NAME FIRST");
  }

  var lastFocus = null;
  function openHelp() {
    lastFocus = document.activeElement;
    helpEl.hidden = false;
    helpEl.querySelector("button").focus();
  }
  function closeHelp() {
    helpEl.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var statusTimer = null;
  function status(msg) {
    statusEl.textContent = msg;
    statusEl.classList.add("flash");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      statusEl.classList.remove("flash");
      statusEl.textContent = "READY";
    }, 1800);
  }

  function press(btn) {
    btn.classList.add("pressed");
    setTimeout(function () { btn.classList.remove("pressed"); }, 120);
  }

  var ACTIONS = {
    help: openHelp,
    "close-help": closeHelp,
    generate: generate,
    copyall: copyAll,
    clear: clearOutput,
    crt: toggleCrt
  };

  // ---------- Events ----------

  function bindEvents() {
    document.querySelectorAll("[data-action]").forEach(function (el) {
      el.addEventListener("click", function () { ACTIONS[el.dataset.action](); });
    });
    $("generate").addEventListener("click", generate);
    $("clear").addEventListener("click", clearOutput);

    document.querySelectorAll('input[name="gender"]').forEach(function (r) {
      r.addEventListener("change", function () { setGender(r.value); });
    });
    document.querySelectorAll('input[name="count"]').forEach(function (r) {
      r.addEventListener("change", function () {
        state.count = Number(r.value);
        savePrefs();
        status("COUNT: " + state.count);
      });
    });
    westernEl.addEventListener("change", function () {
      if (westernEl.checked !== state.westernOrder) toggleWestern();
    });

    helpEl.addEventListener("click", function (e) { if (e.target === helpEl) closeHelp(); });

    document.addEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (!helpEl.hidden) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === "F1") {
        e.preventDefault();
        closeHelp();
      }
      return;
    }

    var k = e.key;
    var lower = k.length === 1 ? k.toLowerCase() : k;
    var onButton = document.activeElement && document.activeElement.tagName === "BUTTON";

    // Function keys
    var fkeys = { F1: openHelp, F5: generate, F6: copyAll, F8: clearOutput, F9: toggleCrt };
    if (fkeys[k]) { e.preventDefault(); fkeys[k](); return; }

    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      pickByDigit(Number(k));
      return;
    }

    switch (lower) {
      case "Enter":
        // Let Enter activate a focused button (e.g. copy a name).
        if (onButton) return;
        e.preventDefault(); generate(); return;
      case "g": e.preventDefault(); generate(); return;
      case "ArrowUp": e.preventDefault(); moveOrigin(-1); return;
      case "ArrowDown": e.preventDefault(); moveOrigin(1); return;
      case "m": setGender("male"); return;
      case "f": setGender("female"); return;
      case "a": setGender("any"); return;
      case "+": case "=": stepCount(1); return;
      case "-": case "_": stepCount(-1); return;
      case "w": toggleWestern(); return;
      case "c": clearOutput(); return;
      case "r": toggleCrt(); return;
      case "h": case "?": e.preventDefault(); openHelp(); return;
    }
  }

  // ---------- Clock ----------

  function tick() {
    var d = new Date();
    $("clock").textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function (n) { return String(n).padStart(2, "0"); }).join(":");
  }

  // ---------- Boot screen ----------

  function boot(done) {
    var bootEl = $("boot");
    var seen = false;
    try { seen = sessionStorage.getItem("rng.booted") === "1"; } catch (e) { /* ignore */ }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) { bootEl.hidden = true; done(); return; }

    var total = NATIONS.reduce(function (sum, n) {
      return sum + n.male.length + n.female.length + n.surnames.length;
    }, 0);
    var lines = [
      '<span class="hi">BISCUIT BIOS v1.91</span>  (C) 1991 Biscuit Systems Inc.',
      "",
      "CPU: 80486DX2-66        Coprocessor: Installed",
      "Memory Test: @MEM",
      "",
      "Detecting name databases ... " + NATIONS.length + ' found <span class="ok">OK</span>',
      "Indexing " + total + " name records ...... " + '<span class="ok">OK</span>',
      "Romanization tables ............. " + '<span class="ok">OK</span>',
      "",
      "C:\\&gt; RNG.EXE"
    ];
    var pre = $("boot-text");
    var finished = false;
    var timers = [];

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      bootEl.hidden = true;
      document.removeEventListener("keydown", skip, true);
      try { sessionStorage.setItem("rng.booted", "1"); } catch (e) { /* ignore */ }
      done();
    }
    function skip(e) { e.preventDefault(); e.stopPropagation(); finish(); }

    document.addEventListener("keydown", skip, true);
    bootEl.addEventListener("click", finish);

    var shown = [];
    lines.forEach(function (line, i) {
      timers.push(setTimeout(function () {
        if (line.indexOf("@MEM") >= 0) {
          var kb = 0;
          var idx = shown.length;
          shown.push("");
          var memTimer = setInterval(function () {
            kb = Math.min(640, kb + 64);
            shown[idx] = "Memory Test: " + kb + "K" + (kb === 640 ? ' <span class="ok">OK</span>' : "");
            pre.innerHTML = shown.join("\n");
            if (kb === 640) clearInterval(memTimer);
          }, 30);
          timers.push(memTimer);
        } else {
          shown.push(line);
          pre.innerHTML = shown.join("\n");
        }
      }, i * 140));
    });
    timers.push(setTimeout(finish, lines.length * 140 + 700));
  }

  // ---------- Start ----------

  loadPrefs();
  buildOrigins();
  renderOrigins();
  renderOptions();
  renderOutput();
  bindEvents();
  tick();
  setInterval(tick, 1000);
  boot(function () { $("generate").focus({ preventScroll: true }); });

  if ("serviceWorker" in navigator && window.isSecureContext) {
    // When an updated service worker takes over an already-open page, reload
    // once so the page runs the new code. Skipped on the very first install.
    var hadController = !!navigator.serviceWorker.controller;
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .catch(function () { /* offline support is optional */ });
  }
})();
