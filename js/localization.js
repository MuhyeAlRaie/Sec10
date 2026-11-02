/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/localization.js — Arabic (RTL, default) + English (LTR)
   -------------------------------------------------------------
   - Instant language switching without a page reload
   - Persists the choice for the current browser session
   - Swaps Bootstrap LTR/RTL stylesheets automatically
   ============================================================= */
window.I18N = (function () {
  "use strict";

  var CFG = window.STREAM_CONFIG || {};

  var DICT = {
    ar: {
      docTitle: "ستريم موبايل — تحدّي التوقف عند 10",
      headline: "تحدّي العشر ثواني من ستريم موبايل",
      tagline: "أوقف المؤقت عند 10.00 بالضبط واربح جائزة!",
      step1: "اضغط مسطرة المسافة (Space) للاستعداد",
      step2: "اضغط Space مرة أخرى لبدء المؤقت",
      step3: "اضغط Space لإيقاف المؤقت عند 10.00 بالضبط",
      start: "اضغط Space لبدء التحدي",
      keyboardHint: "كل شيء يتم بزر واحد: مسطرة المسافة (Space).",
      readyTitle: "استعد!",
      kbPressSpaceStart: "اضغط مسطرة المسافة لبدء المؤقت",
      running: "المؤقت يعمل",
      kbPressSpaceStop: "اضغط مسطرة المسافة لإيقاف المؤقت",
      go: "انطلق!",
      finalTime: "الزمن النهائي",
      winHeadline: "مبروك! ربحت جائزة من ستريم موبايل!",
      loseHeadline: "حظاً أوفر! جرّب مرة ثانية.",
      winMsg: "توقف مثالي — استمتع بجائزتك!",
      loseMsg: "كان عليك التوقف عند 10.00 بالضبط — حاول مرة أخرى!",
      tryAgain: "اضغط مسطرة المسافة للمحاولة مرة أخرى",
      prizeNote: "يرجى التواصل مع ممثل حملة ستريم موبايل لاستلام جائزتك.",
      staffTitle: "أدوات المشرف",
      soundOn: "الصوت: مفعّل",
      soundOff: "الصوت: مكتوم",
      fullscreen: "ملء الشاشة",
      restart: "إعادة تعيين",
      demoStaffNote: "عرض توضيحي: النتيجة 10.00 مفروضة — الزمن الفعلي",
    },
    en: {
      docTitle: "Stream Mobile — Stop at 10 Challenge",
      headline: "Stream Mobile — Stop at 10 Challenge",
      tagline: "Stop the timer at exactly 10.00 and win a prize!",
      step1: "Press Space to get ready",
      step2: "Press Space again to start the timer",
      step3: "Press Space to stop the timer at exactly 10.00",
      start: "Press Space to Start",
      keyboardHint: "One button does it all: the Space bar.",
      readyTitle: "Get Ready!",
      kbPressSpaceStart: "Press Space to start the timer",
      running: "TIMER RUNNING",
      kbPressSpaceStop: "Press Space to stop the timer",
      go: "GO!",
      finalTime: "Final Time",
      winHeadline: "Congratulations! You won a prize from Stream Mobile!",
      loseHeadline: "Better luck next time! Try again.",
      winMsg: "A perfect stop — enjoy your prize!",
      loseMsg: "You must stop at exactly 10.00 to win — try again!",
      tryAgain: "Press Space to try again",
      prizeNote: "Please contact a Stream Mobile campaign representative to claim your prize.",
      staffTitle: "Staff",
      soundOn: "Sound: on",
      soundOff: "Sound: off",
      fullscreen: "Fullscreen",
      restart: "Restart",
      demoStaffNote: "Demo: result forced to 10.00 — actual",
    }
  };

  var lang = "ar";
  var hadSaved = false;
  try {
    var saved = sessionStorage.getItem("sm_lang");
    if (saved && DICT[saved]) { lang = saved; hadSaved = true; }
  } catch (e) { /* storage unavailable — ignore */ }
  if (!hadSaved && CFG.DEFAULT_LANG && DICT[CFG.DEFAULT_LANG]) lang = CFG.DEFAULT_LANG;

  var listeners = [];

  function t(key, params) {
    var d = DICT[lang] || DICT.ar;
    var s = Object.prototype.hasOwnProperty.call(d, key) ? d[key] : (DICT.en[key] || key);
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(params[k]));
      });
    }
    return s;
  }

  function apply() {
    var isAr = lang === "ar";
    var html = document.documentElement;
    html.lang = lang;
    html.dir = isAr ? "rtl" : "ltr";

    /* Swap Bootstrap LTR/RTL stylesheets */
    var rtl = document.getElementById("bs-rtl");
    var ltr = document.getElementById("bs-ltr");
    if (rtl && ltr) {
      try { rtl.disabled = !isAr; ltr.disabled = isAr; } catch (e) { /* older browsers */ }
    }

    /* Static translated nodes */
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }
    var arias = document.querySelectorAll("[data-i18n-aria]");
    for (var j = 0; j < arias.length; j++) {
      arias[j].setAttribute("aria-label", t(arias[j].getAttribute("data-i18n-aria")));
    }

    document.title = t("docTitle") + (CFG.GAME_MODE === "demo" ? " — DEMO MODE" : "");
  }

  function set(newLang) {
    if (!DICT[newLang] || newLang === lang) return;
    lang = newLang;
    try { sessionStorage.setItem("sm_lang", lang); } catch (e) { /* ignore */ }
    apply();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (e) { /* keep going */ }
    }
  }

  function get() { return lang; }
  function onChange(fn) { if (typeof fn === "function") listeners.push(fn); }

  apply();

  return { t: t, set: set, get: get, onChange: onChange, apply: apply };
})();
