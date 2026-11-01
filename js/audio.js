/* =============================================================
   Stream Mobile — Stop at 10 Challenge
   js/audio.js — Web Audio API sound effects (no audio files)
   -------------------------------------------------------------
   - The AudioContext is created lazily on the first user gesture
     (SoundFX.unlock) so browser autoplay policies never break
     the game.
   - Every call is guarded: if audio is unavailable the game
     continues silently.
   ============================================================= */
window.SoundFX = (function () {
  "use strict";

  var ctx = null;
  var master = null;
  var enabled = true;

  function ensure() {
    if (!enabled) return null;
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") {
        var p = ctx.resume();
        if (p && p.catch) p.catch(function () {});
      }
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, type, vol, delay, glideTo) {
    var c = ctx;
    if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(Math.max(1, freq), t0);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.15), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.03, dur));
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.08);
  }

  function play(name) {
    if (!enabled) return;
    if (!ensure()) return;
    try {
      switch (name) {
        case "detect":                      /* hand detected — subtle blip */
          tone(720, 0.10, "sine", 0.10);
          break;
        case "hold":                        /* fist-hold tick (1s, 2s) */
          tone(540, 0.09, "sine", 0.12);
          break;
        case "go":                          /* timer start */
          tone(880, 0.12, "square", 0.13);
          tone(1174.66, 0.20, "square", 0.13, 0.10);
          break;
        case "stop":                        /* timer stop */
          tone(330, 0.10, "square", 0.15);
          tone(196, 0.22, "square", 0.17, 0.08);
          break;
        case "win":                         /* winning fanfare */
          tone(523.25, 0.16, "triangle", 0.16, 0);
          tone(659.25, 0.16, "triangle", 0.16, 0.13);
          tone(783.99, 0.16, "triangle", 0.16, 0.26);
          tone(1046.50, 0.42, "triangle", 0.18, 0.39);
          tone(1318.51, 0.50, "sine", 0.09, 0.44);
          break;
        case "lose":                        /* friendly lose tone */
          tone(392, 0.22, "sine", 0.15, 0, 311);
          tone(262, 0.40, "sine", 0.15, 0.22, 196);
          break;
        case "click":                       /* UI feedback */
          tone(440, 0.05, "sine", 0.08);
          break;
      }
    } catch (e) { /* never let audio break gameplay */ }
  }

  function unlock() { ensure(); }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return enabled; }

  return { play: play, unlock: unlock, setEnabled: setEnabled, isEnabled: isEnabled };
})();
