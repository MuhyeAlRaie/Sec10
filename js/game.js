/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/game.js — main game controller / state machine
   -------------------------------------------------------------
   Game phases:  welcome → ready → running → result → resetting → welcome
   Input modes:  "camera" (MediaPipe hand gestures) | "keyboard" (Space)

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
  var HandTracker = window.HandTracker;

  var MODE = CFG.GAME_MODE;            /* "genuine" | "demo" */
  var IS_DEMO = MODE === "demo";
  var HOLD_MS = CFG.FIST_HOLD_SECONDS * 1000;
  var RING_C = 2 * Math.PI * 52;       /* SVG ring circumference (r = 52) */
  var ARM_MS = CFG.OPEN_STOP_ARM_MS;

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
    stopInstruction: $("stop-instruction"),
    handLost: $("hand-lost"),
    readyInstruction: $("ready-instruction"),
    handChip: $("hand-chip"),
    ringWrap: $("hold-ring-wrap"),
    ringFg: $("ring-fg"),
    holdCount: $("hold-count"),
    kbReady: $("kb-ready"),
    readyKbHint: $("ready-kb-hint"),
    cameraStatus: $("camera-status"),
    btnStart: $("btn-start"),
    btnKb: $("btn-kb"),
    btnCamera: $("btn-camera"),
    btnLangAr: $("btn-lang-ar"),
    btnLangEn: $("btn-lang-en"),
    previewWrap: $("preview-wrap"),
    previewVideo: $("preview-video"),
    previewCanvas: $("preview-canvas"),
    modeBadge: $("mode-badge"),
    staffCamera: $("btn-staff-camera"),
    staffPreview: $("btn-staff-preview"),
    staffSound: $("btn-staff-sound"),
    staffFullscreen: $("btn-staff-fullscreen"),
    staffRestart: $("btn-staff-restart"),
    staffActual: $("staff-actual"),
    resultHeadline: $("result-headline"),
    resultMsg: $("result-msg"),
    prizeNote: $("prize-note"),
    resetCountdown: $("reset-countdown"),
    toast: $("toast")
  };

  var pctx = el.previewCanvas.getContext("2d");

  /* Standard 21-point hand connections (for the preview overlay) */
  var HAND_CONN = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8], [5, 9],
    [9, 10], [10, 11], [11, 12], [9, 13],
    [13, 14], [14, 15], [15, 16], [13, 17],
    [17, 18], [18, 19], [19, 20], [0, 17]
  ];

  /* ---------- state ---------- */
  var S = {
    phase: "welcome",        /* welcome | ready | running | result | resetting */
    inputMode: null,         /* "camera" | "keyboard" */
    gesture: "NO_HAND",      /* NO_HAND | OPEN | FIST | UNSURE (smoothed) */
    prevGesture: "NO_HAND",
    gestureChangedAt: 0,
    lastHandSeen: 0,
    chipGesture: "",
    holdStart: 0,
    lastFistFrame: 0,
    holdTicks: 0,
    startTime: 0,
    elapsed: 0,
    actualElapsed: 0,
    lastOutcome: null,       /* { win: boolean, display: string } */
    resultUntil: 0,
    resetTimeout: 0,
    cameraActive: false,
    camBusy: false,
    camState: "off",
    previewOn: true,
    previewVisible: false,
    soundOn: true,
    goFlashUntil: 0,
    instructionKey: "",
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
    updatePreviewVisibility();
  }

  function showToast(msg, ms) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.toast.classList.remove("show");
    }, ms || 3000);
  }

  function setChip(node, text, state) {
    var sig = text + "|" + state;
    if (node._sig === sig) return;
    node._sig = sig;
    node.textContent = text;
    node.setAttribute("data-state", state);
  }

  function setInstruction(key) {
    if (S.instructionKey === key) return;
    S.instructionKey = key;
    el.readyInstruction.textContent = I18N.t(key);
  }

  function bindButton(btn, fn) {
    btn.addEventListener("click", function () {
      fn();
      btn.blur(); /* keep Space reserved for the game, not the button */
    });
  }

  /* ---------- camera management ---------- */

  function camStateColor(code) {
    if (code === "ready") return "ok";
    if (code === "requesting" || code === "loading") return "busy";
    if (code === "off") return "idle";
    return "err";
  }

  function setCamState(code) {
    S.camState = code;
    setChip(el.cameraStatus, I18N.t("camStatus_" + code), camStateColor(code));
    updateCameraButtons();
  }

  function updateCameraButtons() {
    var labelKey = S.cameraActive ? "disableCamera" : "enableCamera";
    el.btnCamera.textContent = I18N.t(labelKey);
    el.staffCamera.textContent = I18N.t(labelKey);
    el.btnCamera.disabled = S.camBusy;
    el.staffCamera.disabled = S.camBusy;
  }

  function startCamera() {
    if (S.cameraActive || S.camBusy) return;
    S.camBusy = true;
    updateCameraButtons();
    setCamState("requesting");
    SoundFX.unlock();
    HandTracker.start(el.previewVideo, {
      onStatus: function (code) { setCamState(code); },
      onGesture: handleGesture
    }).then(function () {
      S.cameraActive = true;
      setCamState("ready");
      showToast(I18N.t("camStatus_ready"));
    }).catch(function (err) {
      var code = (err && err.code) ? err.code : "error";
      S.cameraActive = false;
      setCamState(code);
      showToast(I18N.t("camStatus_" + code), 4500);
    }).then(function () {
      S.camBusy = false;
      updateCameraButtons();
      updatePreviewVisibility();
    });
  }

  function stopCamera(silent) {
    HandTracker.stop();
    S.cameraActive = false;
    setCamState("off");
    updatePreviewVisibility();
    if (!silent) showToast(I18N.t("camStatus_off"));

    /* If a round was in progress in camera mode, hand control to the
       keyboard so the participant can always finish. */
    if (S.inputMode === "camera") {
      S.inputMode = "keyboard";
      if (S.phase === "ready") renderReadyStatic();
      if (S.phase === "running") {
        el.stopInstruction.textContent = I18N.t("kbPressSpaceStop");
        showToast(I18N.t("cameraStoppedNotice"), 4000);
      }
    }
  }

  function toggleCamera() {
    if (S.camBusy) return;
    if (S.cameraActive) stopCamera();
    else startCamera();
  }

  /* ---------- preview ---------- */

  function updatePreviewVisibility() {
    var show = S.previewOn && S.cameraActive &&
               S.phase === "ready" && S.inputMode === "camera";
    S.previewVisible = show;
    el.previewWrap.classList.toggle("hidden", !show);
    if (!show) clearPreview();
  }

  function drawPreview(lm) {
    if (!S.previewVisible || !lm) return;
    var cw = el.previewCanvas.width;
    var ch = el.previewCanvas.height;
    pctx.clearRect(0, 0, cw, ch);
    pctx.strokeStyle = "rgba(255,255,255,0.85)";
    pctx.lineWidth = 2;
    for (var i = 0; i < HAND_CONN.length; i++) {
      var a = lm[HAND_CONN[i][0]];
      var b = lm[HAND_CONN[i][1]];
      pctx.beginPath();
      pctx.moveTo(a.x * cw, a.y * ch);
      pctx.lineTo(b.x * cw, b.y * ch);
      pctx.stroke();
    }
    pctx.fillStyle = "#ff2e44";
    for (var j = 0; j < lm.length; j++) {
      pctx.beginPath();
      pctx.arc(lm[j].x * cw, lm[j].y * ch, 3.2, 0, Math.PI * 2);
      pctx.fill();
    }
  }

  function clearPreview() {
    pctx.clearRect(0, 0, el.previewCanvas.width, el.previewCanvas.height);
  }

  /* ---------- gesture intake ---------- */

  function handleGesture(g, landmarks, tNow) {
    S.gesture = g;
    if (g !== S.prevGesture) {
      S.gestureChangedAt = tNow;
      S.prevGesture = g;
    }
    if (g !== "NO_HAND") S.lastHandSeen = tNow;

    /* Subtle sound on the NO_HAND → OPEN transition while waiting */
    if (S.phase === "ready" && S.inputMode === "camera") {
      if (g === "OPEN" && S.chipGesture !== "OPEN") SoundFX.play("detect");
      S.chipGesture = g;
    }

    drawPreview(landmarks);
  }

  /* ---------- phase: ready ---------- */

  function renderReadyStatic() {
    var kb = S.inputMode === "keyboard";
    el.kbReady.hidden = !kb;
    el.ringWrap.hidden = kb;
    el.handChip.hidden = kb;
    el.readyKbHint.hidden = kb;
    el.ringWrap.classList.remove("holding", "is-fist");
    el.ringFg.style.strokeDashoffset = String(RING_C);
    el.holdCount.textContent = "";
    setInstruction(kb ? "kbPressSpaceStart" : "readyRaiseHand");
    S.instructionKey = kb ? "kbPressSpaceStart" : "readyRaiseHand";
  }

  function renderReady(tNow) {
    if (S.inputMode !== "camera") return;
    var g = S.gesture;

    if (g === "NO_HAND") setChip(el.handChip, I18N.t("noHand"), "idle");
    else setChip(el.handChip, I18N.t("handDetected"), "ok");

    if (g === "FIST") setInstruction("holdFist");
    else if (g === "OPEN" || g === "UNSURE") setInstruction("nowMakeFist");
    else setInstruction("readyRaiseHand");

    el.ringWrap.classList.toggle("is-fist", g === "FIST");

    if (g === "FIST") {
      /* Continuous-fist tracking with a short gap tolerance so one
         dropped frame does not punish the participant. */
      if (S.lastFistFrame === 0 ||
          tNow - S.lastFistFrame > CFG.FIST_GAP_TOLERANCE_MS) {
        S.holdStart = tNow;
        S.holdTicks = 0;
      }
      S.lastFistFrame = tNow;

      var held = tNow - S.holdStart;
      var p = Math.min(1, held / HOLD_MS);
      el.ringFg.style.strokeDashoffset = String(RING_C * (1 - p));

      var sec = Math.floor(held / 1000);
      el.holdCount.textContent = String(Math.max(0, CFG.FIST_HOLD_SECONDS - sec));
      if (sec > S.holdTicks) {
        S.holdTicks = sec;
        if (sec < CFG.FIST_HOLD_SECONDS) SoundFX.play("hold");
      }
      el.ringWrap.classList.add("holding");

      if (held >= HOLD_MS) goStart(tNow);
    } else if (S.lastFistFrame !== 0 &&
               tNow - S.lastFistFrame > CFG.FIST_GAP_TOLERANCE_MS) {
      /* fist lost for longer than the tolerance → reset the hold */
      S.lastFistFrame = 0;
      S.holdStart = 0;
      S.holdTicks = 0;
      el.ringFg.style.strokeDashoffset = String(RING_C);
      el.holdCount.textContent = "";
      el.ringWrap.classList.remove("holding");
    }
  }

  /* ---------- phase transitions ---------- */

  function enterReady() {
    clearTimeout(S.resetTimeout);
    S.holdStart = 0;
    S.lastFistFrame = 0;
    S.holdTicks = 0;
    S.gesture = "NO_HAND";
    S.prevGesture = "NO_HAND";
    S.gestureChangedAt = 0;
    S.chipGesture = "";
    S.lastHandSeen = performance.now();
    el.timer.textContent = "00.00";
    el.handLost.hidden = true;
    S.phase = "ready";
    renderReadyStatic();
    if (S.cameraActive) HandTracker.resume();
    showScreen("ready");
  }

  function goStart(tNow) {
    if (S.phase !== "ready") return;   /* one-shot guard */
    S.phase = "running";
    S.startTime = tNow || performance.now();
    S.lastHandSeen = S.startTime;
    S.holdStart = 0;
    S.lastFistFrame = 0;
    S.holdTicks = 0;
    el.ringWrap.classList.remove("holding", "is-fist");
    el.ringFg.style.strokeDashoffset = String(RING_C);
    el.stopInstruction.textContent = I18N.t(
      S.inputMode === "keyboard" ? "kbPressSpaceStop" : "openHandToStop");
    el.handLost.hidden = true;
    showScreen("running");
    el.goFlash.classList.remove("show");
    void el.goFlash.offsetWidth;      /* restart the CSS animation */
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
    S.resultUntil = performance.now() + CFG.RESULT_DISPLAY_SECONDS * 1000;
    renderResult();
    HandTracker.pause();
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

  function renderResultTick(tNow) {
    var remain = Math.max(0, Math.ceil((S.resultUntil - tNow) / 1000));
    var txt = I18N.t("resetIn", { s: remain });
    if (el.resetCountdown.textContent !== txt) el.resetCountdown.textContent = txt;
    if (tNow >= S.resultUntil) resetGame();
  }

  /* ---------- reset ---------- */

  function resetGame() {
    if (S.phase === "resetting") return;
    S.phase = "resetting";
    Confetti.stopNow();
    clearTimeout(S.resetTimeout);

    S.holdStart = 0;
    S.lastFistFrame = 0;
    S.holdTicks = 0;
    S.gesture = "NO_HAND";
    S.prevGesture = "NO_HAND";
    S.gestureChangedAt = 0;
    S.lastOutcome = null;
    el.timer.textContent = "00.00";
    el.staffActual.textContent = "";
    el.handLost.hidden = true;
    HandTracker.pause();

    S.resetTimeout = setTimeout(function () {
      S.phase = "welcome";
      S.inputMode = null;
      showScreen("welcome");
    }, CFG.RESET_TRANSITION_MS);
  }

  /* ---------- entry points ---------- */

  function startChallenge(forceKeyboard) {
    if (S.phase !== "welcome") return;   /* guard against double triggers */
    SoundFX.unlock();
    SoundFX.play("click");
    if (!forceKeyboard && S.cameraActive && HandTracker.ready) {
      S.inputMode = "camera";
    } else {
      if (!forceKeyboard) showToast(I18N.t("kbFallbackNotice"), 4500);
      S.inputMode = "keyboard";
    }
    enterReady();
  }

  /* Space: welcome → start · ready → start timer · running → stop timer */
  function handleSpace() {
    if (S.phase === "welcome") { startChallenge(false); return; }
    if (S.phase === "ready") { goStart(performance.now()); return; }
    if (S.phase === "running") { doStop(performance.now()); return; }
    /* result / resetting: ignored — the automatic reset manages the flow */
  }

  /* ---------- staff labels / language ---------- */

  function updateStaffLabels() {
    el.staffPreview.textContent = I18N.t(S.previewOn ? "previewHide" : "previewShow");
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
    updateCameraButtons();
    updateLangButtons();
    setCamState(S.camState);
    S.instructionKey = "";
    if (S.phase === "ready") renderReadyStatic();
    if (S.phase === "running") {
      el.stopInstruction.textContent = I18N.t(
        S.inputMode === "keyboard" ? "kbPressSpaceStop" : "openHandToStop");
    }
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

    switch (S.phase) {
      case "ready":
        renderReady(tNow);
        break;
      case "running":
        el.timer.textContent = fmtTime((tNow - S.startTime) / 1000);
        if (S.inputMode === "camera") {
          var lost = (tNow - S.lastHandSeen) > CFG.HAND_LOST_GRACE_MS;
          if (lost === el.handLost.hidden) el.handLost.hidden = !lost;
          /* Stop on a stable open hand — but only after the round has
             been running long enough to ignore leftover classifications. */
          if (S.gesture === "OPEN" && S.gestureChangedAt > S.startTime &&
              tNow - S.startTime >= ARM_MS &&
              tNow - S.gestureChangedAt >= CFG.OPEN_DEBOUNCE_MS) {
            doStop(tNow);
          }
        }
        break;
      case "result":
        renderResultTick(tNow);
        break;
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
    /* Enter keeps native button activation for accessibility. */
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

    el.ringFg.style.strokeDashoffset = String(RING_C);
    updateLangButtons();
    updateStaffLabels();
    setCamState("off");
    setInstruction("readyRaiseHand");
    showScreen("welcome");
    I18N.onChange(refreshTexts);

    bindButton(el.btnStart, function () { startChallenge(false); });
    bindButton(el.btnKb, function () { startChallenge(true); });
    bindButton(el.btnCamera, toggleCamera);
    bindButton(el.staffCamera, toggleCamera);
    bindButton(el.staffPreview, function () {
      S.previewOn = !S.previewOn;
      updateStaffLabels();
      updatePreviewVisibility();
      SoundFX.play("click");
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
