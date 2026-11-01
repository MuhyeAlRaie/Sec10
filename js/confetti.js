/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/confetti.js — lightweight celebratory particle system
   -------------------------------------------------------------
   - Brand-colored particles (red / white / gold / royal blue)
   - Self-terminating animation loop (no leaked rAF timers)
   - Respects prefers-reduced-motion (does nothing)
   ============================================================= */
window.Confetti = (function () {
  "use strict";

  var COLORS = ["#ff2e44", "#ffffff", "#ffd166", "#2b56d9", "#ff8fa0"];
  var canvas = null;
  var ctx = null;
  var parts = [];
  var rafId = 0;
  var running = false;
  var safety = 0;
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    if (!canvas || !ctx) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    canvas = document.getElementById("confetti");
    if (!canvas) return false;
    if (!canvas.getContext) return false;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    return true;
  }

  function spawn(n) {
    for (var i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.35,
        w: 6 + Math.random() * 7,
        h: 8 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2.2 + Math.random() * 3.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        sway: Math.random() * Math.PI * 2
      });
    }
  }

  function loop() {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.055;
      p.vx *= 0.995;
      p.sway += 0.045;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > window.innerHeight + 40) {
        parts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (parts.length === 0) stopNow();
  }

  function launch() {
    if (reduced) return;
    if (!canvas && !init()) return;
    stopNow();
    spawn(190);
    running = true;
    safety = setTimeout(stopNow, 6000);
    loop();
  }

  function stopNow() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    clearTimeout(safety);
    parts = [];
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  return { launch: launch, stopNow: stopNow };
})();
