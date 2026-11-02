/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/config.js — central configuration
   -------------------------------------------------------------
   GAME_MODE is set by the entry page:
     index.html  ->  window.STREAM_GAME_MODE = "genuine"
     demo.html   ->  window.STREAM_GAME_MODE = "demo"
   Do not change GAME_MODE here — change it in the entry page.

   Event organizers: the constants below are safe to adjust.
   ============================================================= */
(function () {
  "use strict";

  var GAME_MODE = window.STREAM_GAME_MODE === "demo" ? "demo" : "genuine";

  window.STREAM_CONFIG = {
    /* ---- Game mode --------------------------------------------- */
    GAME_MODE: GAME_MODE,

    /* ---- Win rules (genuine mode only) -------------------------- */
    TARGET_SECONDS: 10,          /* the magic number                    */
    WIN_TOLERANCE_SECONDS: 0.00, /* 0.00 = the displayed time must read
                                    exactly 10.00 to win. Raise it
                                    (e.g. 0.05) for a friendlier event. */

    /* ---- Demo mode (never applied in genuine mode) -------------- */
    DEMO_FORCED_TIME: "10.00",   /* displayed result in demo mode       */

    /* ---- Flow timings ------------------------------------------- */
    RESULT_LOCK_MS: 500,         /* tiny guard so a double-tap on Space cannot skip the
                                    result instantly. Set 0 to remove it completely. */
    RESET_TRANSITION_MS: 350,    /* short transition back to the welcome screen (Esc / Restart) */

    /* ---- Localization ---------------------------------------------- */
    DEFAULT_LANG: "ar",

    /* ---- Winner message (configurable) ------------------------------ */
    /* Shown under the winning headline. Set to null to hide it.        */
    PRIZE_CLAIM_MESSAGE: {
      ar: "يرجى التواصل مع ممثل حملة ستريم موبايل لاستلام جائزتك.",
      en: "Please contact a Stream Mobile campaign representative to claim your prize."
    }
  };
})();
