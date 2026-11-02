/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/game.js — main game controller / state machine
   -------------------------------------------------------------
   Game phases:  welcome → ready → running → result → ready → …
   Input:        the Space key only.
     welcome  + Space → ready
     ready    + Space → timer starts
     running  + Space → timer stops, result shown
     result   + Space → try again (straight back to ready, no wait)
   Esc = staff reset back to the welcome screen.

   Timing uses performance.now() exclusively (monotonic) — never a
   decrementing setInterval counter.

   Modes (set by the entry page, see js/config.js):
     genuine — real elapsed time; win only if the displayed time
               (2 decimals) is within WIN_TOLERANCE_SECONDS of 10.00.
     demo    — the displayed result is ALWAYS forced to 10.00 with the
               winning celebration; the real elapsed time is kept
               internally (console + staff bar) for testing only.
   ============================================================= */
(function () {
  "use strict";

  var CFG = window.STREAM_CONFIG;
  var I18N = window.I18N;
  var SoundFX = window.SoundFX;
  var Confetti = window.Confetti;

  var MODE = CFG.GAME_MODE;            /* "genuine" | "demo" */
  var IS_DEMO = MODE === "demo";

  /* ---------- DOM ---------- */
  function $(id) { return document.getElementById(id); }

  var el = {
    screens: {
      welcome: $("screen-welcome"),
      ready: $("screen-ready"),
      running: $("screen-running"),
      result: $("screen-result")
    },
    timer: $("timer"),
    finalTimer: $("final-timer"),
    goFlash: $("go-flash"),
    btnStart: $("btn-start"),
    btnLangAr: $("btn-lang-ar"),
    btnLangEn: $("btn-lang-en"),
    modeBadge: $("mode-badge"),
    staffSound: $("btn-staff-sound"),
    staffFullscreen: $("btn-staff-fullscreen"),
    staffRestart: $("btn-staff-restart"),
    staffActual: $("staff-actual"),
    resultHeadline: $("result-headline"),
    resultMsg: $("result-msg"),
    prizeNote: $("prize-note")
  };

  /* ---------- state ---------- */
  var S = {
    phase: "welcome",        /* welcome | ready | running | result | resetting */
    startTime: 0,
    elapsed: 0,
    actualElapsed: 0,
    lastOutcome: null,       /* { win: boolean, display: string } */
    resultShownAt: 0,
    resetTimeout: 0,
    soundOn: true,
    goFlashUntil: 0,
    reducedMotion: window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  /* ---------- small helpers ---------- */

  /* Format seconds as "SS.CC" (e.g. 09.73, 10.00) using integer
     centiseconds so floating-point rounding never misleads. */
  function fmtTime(sec) {
    var cs = Math.max(0, Math.round(sec * 100));
    var s = Math.floor(cs / 100);
    var c = cs % 100;
    return (s < 10 ? "0" + s : "" + s) + "." + (c < 10 ? "0" + c : "" + c);
  }

  function showScreen(name) {
    Object.keys(el.screens).forEach(function (k) {
      el.screens[k].classList.toggle("active", k === name);
    });
  }

  function bindButton(btn, fn) {
    btn.addEventListener("click", function () {
      fn();
      btn.blur(); /* keep Space reserved for the game, not the button */
    });
  }

  /* ---------- phase transitions ---------- */

  function enterReady() {
    clearTimeout(S.resetTimeout);
    Confetti.stopNow();
    S.lastOutcome = null;
    el.timer.textContent = "00.00";
    el.staffActual.textContent = "";
    el.goFlash.classList.remove("show");
    S.goFlashUntil = 0;
    S.phase = "ready";
    showScreen("ready");
  }

  function goStart(tNow) {
    if (S.phase !== "ready") return;   /* one-shot guard */
    S.phase = "running";
    S.startTime = tNow || performance.now();
    showScreen("running");
    el.goFlash.classList.remove("show");
    void el.goFlash.offsetWidth;       /* restart the CSS animation */
    el.goFlash.classList.add("show");
    S.goFlashUntil = performance.now() + 750;
    SoundFX.play("go");
  }

  function doStop(tNow) {
    if (S.phase !== "running") return; /* one-shot guard */
    var stopTime = tNow || performance.now();
    S.elapsed = Math.max(0, (stopTime - S.startTime) / 1000);
    S.actualElapsed = S.elapsed;
    SoundFX.play("stop");
    finishRound();
  }

  /* ---------- phase: result ---------- */

  function finishRound() {
    var display;
    var win;

    if (IS_DEMO) {
      /* DEMO MODE: the displayed result is always the configured
         demonstration time and always wins. The genuine measurement
         is retained internally for testing only. */
      display = String(CFG.DEMO_FORCED_TIME);
      win = true;
      try {
        console.info(
          "[Stream Mobile][DEMO MODE] Actual elapsed (internal only): " +
          S.actualElapsed.toFixed(3) +
          "s — displayed result forced to " + display);
      } catch (e) {}
      el.staffActual.textContent =
        I18N.t("demoStaffNote") + " " + fmtTime(S.actualElapsed);
    } else {
      /* GENUINE MODE: judge on the displayed 2-decimal value vs 10.00.
         With WIN_TOLERANCE_SECONDS = 0.00 the displayed time must read
         exactly 10.00 to win. */
      display = fmtTime(S.elapsed);
      win = Math.abs(Math.round(S.elapsed * 100) - CFG.TARGET_SECONDS * 100) <=
            CFG.WIN_TOLERANCE_SECONDS * 100 + 1e-6;
      el.staffActual.textContent = "";
    }

    S.lastOutcome = { win: win, display: display };
    S.phase = "result";
    S.resultShownAt = performance.now();
    renderResult();
    showScreen("result");

    if (win) {
      if (!S.reducedMotion) Confetti.launch();
      SoundFX.play("win");
    } else {
      Confetti.stopNow();
      SoundFX.play("lose");
    }
  }

  function renderResult() {
    if (!S.lastOutcome) return;
    var win = S.lastOutcome.win;
    el.finalTimer.textContent = S.lastOutcome.display;
    el.finalTimer.classList.toggle("win", win);
    el.finalTimer.classList.toggle("lose", !win);
    el.resultHeadline.textContent = I18N.t(win ? "winHeadline" : "loseHeadline");
    el.resultHeadline.classList.toggle("win", win);
    el.resultHeadline.classList.toggle("lose", !win);
    el.resultMsg.textContent = I18N.t(win ? "winMsg" : "loseMsg");
    var note = (CFG.PRIZE_CLAIM_MESSAGE && CFG.PRIZE_CLAIM_MESSAGE[I18N.get()]) ||
               I18N.t("prizeNote");
    el.prizeNote.textContent = note;
    el.prizeNote.hidden = !win;
  }

  /* ---------- reset (staff: Esc / Restart button) ---------- */

  function resetGame() {
    if (S.phase === "resetting") return;
    S.phase = "resetting";
    Confetti.stopNow();
    clearTimeout(S.resetTimeout);
    S.lastOutcome = null;
    el.timer.textContent = "00.00";
    el.staffActual.textContent = "";

    S.resetTimeout = setTimeout(function () {
      S.phase = "welcome";
      showScreen("welcome");
    }, CFG.RESET_TRANSITION_MS);
  }

  /* ---------- the one control: Space ---------- */

  /* welcome → ready → running → result → ready (try again) → … */
  function handleSpace() {
    var now = performance.now();
    switch (S.phase) {
      case "welcome":
        SoundFX.play("click");
        enterReady();
        break;
      case "ready":
        goStart(now);
        break;
      case "running":
        doStop(now);
        break;
      case "result":
        /* Try again immediately. The tiny lock only stops a
           double-tap from skipping the result by accident. */
        if (now - S.resultShownAt < (CFG.RESULT_LOCK_MS || 0)) return;
        SoundFX.play("click");
        enterReady();
        break;
      /* resetting: ignored for the brief transition */
    }
  }

  /* ---------- staff labels / language ---------- */

  function updateStaffLabels() {
    el.staffSound.textContent = I18N.t(S.soundOn ? "soundOn" : "soundOff");
  }

  function updateLangButtons() {
    var l = I18N.get();
    el.btnLangAr.classList.toggle("active", l === "ar");
    el.btnLangEn.classList.toggle("active", l === "en");
    el.btnLangAr.setAttribute("aria-pressed", String(l === "ar"));
    el.btnLangEn.setAttribute("aria-pressed", String(l === "en"));
  }

  function refreshTexts() {
    updateStaffLabels();
    updateLangButtons();
    if (S.phase === "result") renderResult();
  }

  /* ---------- fullscreen ---------- */

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        var d = document.documentElement;
        if (d.requestFullscreen) d.requestFullscreen();
        else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen();
      }
    } catch (e) { /* fullscreen is a convenience, never critical */ }
  }

  /* ---------- master animation loop ---------- */

  function tick() {
    requestAnimationFrame(tick);
    var tNow = performance.now();

    if (S.goFlashUntil && tNow > S.goFlashUntil) {
      el.goFlash.classList.remove("show");
      S.goFlashUntil = 0;
    }

    if (S.phase === "running") {
      el.timer.textContent = fmtTime((tNow - S.startTime) / 1000);
    }
  }

  /* ---------- keyboard ---------- */

  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();          /* never scroll the page */
      if (e.repeat) return;        /* ignore held-down repeats */
      var ae = document.activeElement;
      if (ae && ae.tagName === "BUTTON") ae.blur();
      SoundFX.unlock();
      handleSpace();
    } else if (e.code === "Escape") {
      /* Staff instant reset */
      if (S.phase !== "welcome") resetGame();
    }
  });

  /* ---------- init ---------- */

  function init() {
    el.modeBadge.textContent = IS_DEMO ? "DEMO MODE" : "GENUINE MODE";
    el.modeBadge.classList.add(IS_DEMO ? "demo" : "genuine");

    if (IS_DEMO) {
      try {
        console.warn(
          "[Stream Mobile] DEMO MODE is active on this page: the displayed " +
          "result is always forced to " + CFG.DEMO_FORCED_TIME + ". " +
          "Do not use this build to determine real prize eligibility.");
      } catch (e) {}
    }

    updateLangButtons();
    updateStaffLabels();
    showScreen("welcome");
    I18N.onChange(refreshTexts);

    /* The big start button is a visual prompt; clicking it also works,
       but the intended control is Space. */
    bindButton(el.btnStart, function () {
      SoundFX.unlock();
      if (S.phase === "welcome") handleSpace();
    });
    bindButton(el.staffSound, function () {
      S.soundOn = !S.soundOn;
      SoundFX.setEnabled(S.soundOn);
      updateStaffLabels();
      if (S.soundOn) SoundFX.play("click");
    });
    bindButton(el.staffFullscreen, toggleFullscreen);
    bindButton(el.staffRestart, function () {
      SoundFX.play("click");
      resetGame();
    });

    el.btnLangAr.addEventListener("click", function () {
      I18N.set("ar");
      el.btnLangAr.blur();
    });
    el.btnLangEn.addEventListener("click", function () {
      I18N.set("en");
      el.btnLangEn.blur();
    });

    requestAnimationFrame(tick);
  }

  init();
})();
