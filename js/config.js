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
    FIST_HOLD_SECONDS: 3,        /* continuous fist time needed to start */
    FIST_GAP_TOLERANCE_MS: 250,  /* brief detection gaps that do NOT reset the hold */
    OPEN_DEBOUNCE_MS: 180,       /* open hand must be stable this long before the timer stops */
    OPEN_STOP_ARM_MS: 300,       /* open-hand stops are ignored in the first N ms of a round */
    RESULT_DISPLAY_SECONDS: 10,  /* result screen duration before auto reset */
    RESET_TRANSITION_MS: 350,    /* short transition back to the welcome screen */
    HAND_LOST_GRACE_MS: 800,     /* hand may vanish this long before the "hand lost" warning */

    /* ---- Gesture stability --------------------------------------- */
    GESTURE_WINDOW_MS: 350,      /* temporal smoothing window */
    GESTURE_MIN_FRAMES: 3,       /* minimum frames required inside the window */
    GESTURE_STABLE_RATIO: 0.7,   /* 70% of frames must agree on a gesture */

    /* ---- Camera --------------------------------------------------- */
    CAMERA: {
      WIDTH: 1280,               /* requested camera width  */
      HEIGHT: 720,               /* requested camera height */
      PROCESS_INTERVAL_MS: 33    /* ~30 fps hand processing */
    },

    /* ---- MediaPipe CDN assets (the only required network assets) --- */
    MEDIAPIPE: {
      MODULE_URL: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs",
      WASM_ROOT: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
      MODEL_URL: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    },

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
