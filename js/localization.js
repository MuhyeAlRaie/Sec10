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
      step1: "ارفع يدك مفتوحة نحو الكاميرا",
      step2: "اقبض يدك وثبّتها لمدة 3 ثوانٍ لبدء المؤقت",
      step3: "افتح يدك لإيقاف المؤقت عند 10.00 بالضبط",
      start: "ابدأ التحدي",
      startKeyboard: "اللعب بلوحة المفاتيح (مسطرة المسافة)",
      keyboardHint: "بديل للكاميرا: اضغط مسطرة المسافة لبدء المؤقت، واضغطها مجددًا لإيقافه.",
      privacyNote: "يتم تحليل حركة اليد محليًا داخل متصفحك فقط — لا يتم رفع أو حفظ أي صور أو بيانات.",
      enableCamera: "تشغيل الكاميرا",
      disableCamera: "إيقاف الكاميرا",
      camStatus_off: "الكاميرا غير مفعّلة",
      camStatus_requesting: "جارٍ طلب إذن الكاميرا…",
      camStatus_loading: "جارٍ تحميل نموذج تتبّع اليد…",
      camStatus_ready: "الكاميرا جاهزة ✓",
      camStatus_denied: "تم رفض إذن الكاميرا — يمكنك اللعب بلوحة المفاتيح",
      camStatus_nocamera: "لا توجد كاميرا متاحة (أو أنها قيد الاستخدام) — يمكنك اللعب بلوحة المفاتيح",
      camStatus_unsupported: "المتصفح لا يدعم الوصول إلى الكاميرا — يلزم HTTPS ومتصفح حديث، أو العب بلوحة المفاتيح",
      camStatus_error: "تعذّر تحميل نموذج تتبّع اليد (تحقق من الاتصال بالإنترنت) — يمكنك اللعب بلوحة المفاتيح",
      readyTitle: "استعد!",
      readyRaiseHand: "ارفع يدك مفتوحة نحو الكاميرا",
      handDetected: "تم رصد اليد ✓",
      noHand: "لا توجد يد أمام الكاميرا",
      nowMakeFist: "رائع! الآن اقبض يدك لبدء المؤقت",
      holdFist: "ثبّت قبضتك…",
      kbPressSpaceStart: "اضغط مسطرة المسافة لبدء المؤقت",
      running: "المؤقت يعمل",
      openHandToStop: "افتح يدك لإيقاف المؤقت",
      kbPressSpaceStop: "اضغط مسطرة المسافة لإيقاف المؤقت",
      handLost: "لا نرى يدك!",
      handLostHint: "أعد رفع يدك أمام الكاميرا، أو اضغط مسطرة المسافة لإيقاف المؤقت",
      go: "انطلق!",
      finalTime: "الزمن النهائي",
      winHeadline: "مبروك! ربحت جائزة من ستريم موبايل!",
      loseHeadline: "حظاً أوفر! جرّب مرة ثانية.",
      winMsg: "توقف مثالي — استمتع بجائزتك!",
      loseMsg: "كان عليك التوقف عند 10.00 بالضبط — حاول مرة أخرى!",
      prizeNote: "يرجى التواصل مع ممثل حملة ستريم موبايل لاستلام جائزتك.",
      resetIn: "المشارك التالي بعد {s} ثانية",
      staffTitle: "أدوات المشرف",
      soundOn: "الصوت: مفعّل",
      soundOff: "الصوت: مكتوم",
      previewShow: "إظهار معاينة الكاميرا",
      previewHide: "إخفاء معاينة الكاميرا",
      fullscreen: "ملء الشاشة",
      restart: "إعادة تعيين",
      demoStaffNote: "عرض توضيحي: النتيجة 10.00 مفروضة — الزمن الفعلي",
      kbFallbackNotice: "الكاميرا غير مفعّلة — وضع لوحة المفاتيح: مسطرة المسافة للبدء والإيقاف.",
      cameraStoppedNotice: "تم إيقاف الكاميرا — أكمل الجولة بلوحة المفاتيح."
    },
    en: {
      docTitle: "Stream Mobile — Stop at 10 Challenge",
      headline: "Stream Mobile — Stop at 10 Challenge",
      tagline: "Stop the timer at exactly 10.00 and win a prize!",
      step1: "Raise your open hand toward the camera",
      step2: "Close your hand into a fist and hold it for 3 seconds to start the timer",
      step3: "Open your hand to stop the timer at exactly 10.00",
      start: "Start Challenge",
      startKeyboard: "Play with keyboard (Space)",
      keyboardHint: "Camera alternative: press Space to start the timer, press again to stop it.",
      privacyNote: "Hand tracking runs locally in your browser — no images or data are uploaded or stored.",
      enableCamera: "Enable camera",
      disableCamera: "Disable camera",
      camStatus_off: "Camera is off",
      camStatus_requesting: "Requesting camera permission…",
      camStatus_loading: "Loading hand-tracking model…",
      camStatus_ready: "Camera is ready ✓",
      camStatus_denied: "Camera permission denied — you can play with the keyboard",
      camStatus_nocamera: "No camera available (or it is in use) — you can play with the keyboard",
      camStatus_unsupported: "This browser does not support camera access — HTTPS and a modern browser are required, or play with the keyboard",
      camStatus_error: "Failed to load the hand-tracking model (check your connection) — you can play with the keyboard",
      readyTitle: "Get Ready!",
      readyRaiseHand: "Show your open hand to the camera",
      handDetected: "Hand detected ✓",
      noHand: "No hand in view",
      nowMakeFist: "Great! Now close your hand into a fist to start",
      holdFist: "Hold your fist…",
      kbPressSpaceStart: "Press Space to start the timer",
      running: "TIMER RUNNING",
      openHandToStop: "Open your hand to stop the timer",
      kbPressSpaceStop: "Press Space to stop the timer",
      handLost: "We can't see your hand!",
      handLostHint: "Show your hand to the camera again, or press Space to stop the timer",
      go: "GO!",
      finalTime: "Final Time",
      winHeadline: "Congratulations! You won a prize from Stream Mobile!",
      loseHeadline: "Better luck next time! Try again.",
      winMsg: "A perfect stop — enjoy your prize!",
      loseMsg: "You must stop at exactly 10.00 to win — try again!",
      prizeNote: "Please contact a Stream Mobile campaign representative to claim your prize.",
      resetIn: "Next participant in {s}s",
      staffTitle: "Staff",
      soundOn: "Sound: on",
      soundOff: "Sound: off",
      previewShow: "Show camera preview",
      previewHide: "Hide camera preview",
      fullscreen: "Fullscreen",
      restart: "Restart",
      demoStaffNote: "Demo: result forced to 10.00 — actual",
      kbFallbackNotice: "Camera is not active — keyboard mode: press Space to start and stop the timer.",
      cameraStoppedNotice: "Camera stopped — finish this round with the keyboard."
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
