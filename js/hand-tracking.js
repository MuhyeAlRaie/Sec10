/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/hand-tracking.js — MediaPipe Tasks Vision Hand Landmarker
   -------------------------------------------------------------
   Responsibilities:
   - Start/stop the webcam (permission is requested ONLY when the
     operator explicitly enables camera mode).
   - Dynamically import the MediaPipe tasks-vision module from the
     CDN and load the hand-landmark model (GPU delegate with CPU
     fallback).
   - Classify each frame into OPEN / FIST / UNSURE using scale-
     invariant distance ratios, then apply temporal smoothing
     (majority vote over a sliding time window) before reporting
     a stable gesture.
   - All processing is local: nothing is uploaded or stored.

   Public API:
   HandTracker.start(videoEl, { onStatus, onGesture }) -> Promise
   HandTracker.pause() / resume() / stop()
   HandTracker.ready -> true when camera + model are live
   ============================================================= */
window.HandTracker = (function () {
  "use strict";

  var CFG = window.STREAM_CONFIG;

  var landmarker = null;
  var stream = null;
  var video = null;
  var rafId = 0;
  var running = false;
  var paused = false;
  var onGesture = null;
  var onStatus = function () {};
  var lastVideoTime = -1;
  var lastDetect = 0;
  var buffer = [];   /* recent per-frame classifications: { g, t } */

  /* ---------- gesture classification ---------- */

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* Scale-invariant classifier.
     For each of the 4 fingers compare wrist->tip vs wrist->PIP:
       extended  => tip clearly beyond the PIP joint (ratio >= 1.22)
       curled    => tip at or inside the PIP joint  (ratio <= 1.04)
     The palm size (wrist -> middle MCP) normalizes everything. */
  function classifyHand(lm) {
    if (!lm || lm.length < 21) return "UNSURE";
    var w = lm[0];
    var palm = dist(w, lm[9]);
    if (palm < 1e-6) return "UNSURE";
    var fingers = [[8, 6], [12, 10], [16, 14], [20, 18]];
    var ext = 0;
    var curled = 0;
    for (var i = 0; i < fingers.length; i++) {
      var dTip = dist(w, lm[fingers[i][0]]);
      var dPip = Math.max(1e-6, dist(w, lm[fingers[i][1]]));
      var r = dTip / dPip;
      if (r >= 1.22) ext++;
      else if (r <= 1.04) curled++;
    }
    if (ext >= 3) return "OPEN";
    if (curled >= 3) return "FIST";
    return "UNSURE";
  }

  /* Majority vote over the last GESTURE_WINDOW_MS of frames. */
  function stableGesture(now) {
    var win = [];
    for (var i = buffer.length - 1; i >= 0; i--) {
      if (now - buffer[i].t <= CFG.GESTURE_WINDOW_MS) win.push(buffer[i]);
      else break;
    }
    if (win.length < CFG.GESTURE_MIN_FRAMES) return "UNSURE";
    var open = 0;
    var fist = 0;
    for (var j = 0; j < win.length; j++) {
      if (win[j].g === "OPEN") open++;
      else if (win[j].g === "FIST") fist++;
    }
    if (open / win.length >= CFG.GESTURE_STABLE_RATIO) return "OPEN";
    if (fist / win.length >= CFG.GESTURE_STABLE_RATIO) return "FIST";
    return "UNSURE";
  }

  /* ---------- lifecycle ---------- */

  function fail(code) {
    var e = new Error(code);
    e.code = code;
    return e;
  }

  function cleanupStream() {
    if (stream) {
      try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      stream = null;
    }
    if (video) {
      try { video.srcObject = null; } catch (e) {}
    }
  }

  function loop() {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (paused) return;

    var now = performance.now();
    if (now - lastDetect < CFG.CAMERA.PROCESS_INTERVAL_MS) return;
    if (!landmarker || !video || video.readyState < 2 || !video.videoWidth) return;
    if (video.currentTime === lastVideoTime) return;

    lastVideoTime = video.currentTime;
    lastDetect = now;

    var res = null;
    try { res = landmarker.detectForVideo(video, now); } catch (e) { return; }

    var g = "NO_HAND";
    var lm = null;
    if (res && res.landmarks && res.landmarks.length > 0) {
      lm = res.landmarks[0];
      buffer.push({ g: classifyHand(lm), t: now });
      if (buffer.length > 60) buffer.shift();
      g = stableGesture(now);
    } else {
      buffer.length = 0;
    }

    if (onGesture) {
      try { onGesture(g, lm, now); } catch (e) { /* never crash the loop */ }
    }
  }

  async function start(videoEl, callbacks) {
    video = videoEl;
    onGesture = (callbacks && callbacks.onGesture) || function () {};
    onStatus = (callbacks && callbacks.onStatus) || function () {};

    if (!window.isSecureContext) throw fail("unsupported");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw fail("unsupported");
    }

    /* 1) Camera permission + stream (explicit user action required) */
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: CFG.CAMERA.WIDTH },
          height: { ideal: CFG.CAMERA.HEIGHT },
          facingMode: "user"
        }
      });
    } catch (err) {
      var n = err && err.name;
      if (n === "NotAllowedError" || n === "PermissionDeniedError" || n === "SecurityError") {
        throw fail("denied");
      }
      if (n === "NotFoundError" || n === "DevicesNotFoundError" ||
          n === "OverconstrainedError" || n === "NotReadableError" || n === "AbortError") {
        throw fail("nocamera");
      }
      throw fail("error");
    }

    try {
      video.srcObject = stream;
      await video.play();
    } catch (e) { /* autoplay of a muted video — ignore */ }

    /* 2) MediaPipe module + model from the CDN */
    onStatus("loading");
    try {
      var vision = await import(CFG.MEDIAPIPE.MODULE_URL);
      var fileset = await vision.FilesetResolver.forVisionTasks(CFG.MEDIAPIPE.WASM_ROOT);
      var opts = function (delegate) {
        return {
          baseOptions: { modelAssetPath: CFG.MEDIAPIPE.MODEL_URL, delegate: delegate },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        };
      };
      try {
        landmarker = await vision.HandLandmarker.createFromOptions(fileset, opts("GPU"));
      } catch (gpuErr) {
        landmarker = await vision.HandLandmarker.createFromOptions(fileset, opts("CPU"));
      }
    } catch (mErr) {
      cleanupStream();
      throw fail("error");
    }

    buffer.length = 0;
    lastVideoTime = -1;
    lastDetect = 0;
    paused = false;
    running = true;
    loop();
  }

  function pause() { paused = true; }

  function resume() {
    paused = false;
    lastVideoTime = -1;
    lastDetect = 0;
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    paused = false;
    buffer.length = 0;
    cleanupStream();
    if (landmarker) {
      try { landmarker.close(); } catch (e) {}
      landmarker = null;
    }
    if (onGesture) {
      try { onGesture("NO_HAND", null, performance.now()); } catch (e) {}
    }
  }

  return {
    start: start,
    stop: stop,
    pause: pause,
    resume: resume,
    get ready() { return !!landmarker && !!stream; }
  };
})();
