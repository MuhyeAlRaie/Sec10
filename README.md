# Stream Mobile — Stop at 10 Challenge

A production-ready, dependency-free browser game for Stream Mobile marketing
events. The participant tries to stop the timer at exactly **10.00 seconds** —
using only the **Space** key. No camera, no hand tracking.

Built with HTML5 + CSS3 + vanilla JavaScript + Bootstrap 5.3 + Web Audio API.
**No backend, no database, no build step, no npm.**
Deploy the files as-is to GitHub Pages.

---

## 1. Packages & game modes

| Package | Entry page | Mode | Behaviour |
|---|---|---|---|
| `Stream-Mobile-Genuine-Game.zip` | `index.html` | **Genuine** | Real elapsed time. The participant wins **only** if the displayed time is within `WIN_TOLERANCE_SECONDS` of 10.00 (default `0.00` = the display must read exactly `10.00`). |
| `Stream-Mobile-Demo-Game.zip` | `demo.html` (`index.html` redirects to it) | **Demo** | Identical game, but the displayed result is **always `10.00`** and the winning celebration always plays. The real elapsed time is kept internally (console log + tiny staff-bar readout) for testing only. |
| `Stream-Mobile-Stop-at-10-Complete.zip` | `genuine/index.html` + `demo/demo.html` | Both | One archive with the two versions in clearly separated folders. |

### How the mode switching works (no duplicated logic)

Both entry pages load the **same** `css/` and `js/` codebase. The only
difference is one line in each entry page:

```html
<!-- index.html -->
<script>window.STREAM_GAME_MODE = "genuine";</script>

<!-- demo.html -->
<script>window.STREAM_GAME_MODE = "demo";</script>
```

`js/config.js` reads it into `GAME_MODE` (`"genuine"` is the safe default if
the marker is missing), and every forced-result branch in `js/game.js` is
wrapped in `if (IS_DEMO)`. The genuine page can **never** inherit the forced
result: there is no URL parameter, no toggle, and no fallback path that turns
genuine into demo. The active mode is always visible in the staff bar
(`GENUINE MODE` / `DEMO MODE`) and demo mode prints a console warning.

**To switch a deployment between modes:** deploy the folder that contains the
entry page you want (or copy `demo.html` out of / into the folder). Do not
change `GAME_MODE` inside `js/config.js` — it is derived from the entry page.

> ⚠️ The demo version exists for controlled demonstrations and rehearsals.
> Do not use it to determine real prize eligibility.

---

## 2. Project structure

```
index.html            ← genuine game (real timing)
demo.html             ← demo game (forced 10.00)  [demo package only]
css/style.css         ← brand styling (navy / royal blue / red / white)
js/config.js          ← GAME_MODE + all organizer-adjustable constants
js/localization.js    ← Arabic (RTL, default) + English (LTR) dictionaries
js/audio.js           ← Web Audio API sound effects (no audio files)
js/confetti.js        ← celebration particles (respects reduced motion)
js/game.js            ← state machine: welcome → ready → running → result → ready…
assets/stream-mobile-logo.jpg
assets/favicon.png
.nojekyll             ← tells GitHub Pages to skip Jekyll processing
README.md
```

---

## 3. Deploy to GitHub Pages (step by step)

1. Sign in at <https://github.com> and click **New repository**.
2. Name it (e.g. `stream-mobile-game`), keep it **Public**, and create it.
3. On the repo page click **uploading an existing file**, then drag **the
   contents of this package** (all files and folders — `index.html`,
   `css/`, `js/`, `assets/`, `README.md`, `.nojekyll`) into the upload area.
   Keep the folder structure exactly as extracted.
4. Write a commit message (e.g. `Deploy Stream Mobile game`) and click
   **Commit changes**.
5. Go to **Settings → Pages**.
6. Under **Build and deployment** set **Source: Deploy from a branch**, pick
   branch **`main`** and folder **`/ (root)`**, then click **Save**.
7. Wait 1–3 minutes, then open
   `https://YOUR-USERNAME.github.io/stream-mobile-game/`.
8. For the demo version deploy the contents of the demo folder the same way
   (its `index.html` redirects to `demo.html` automatically).

### Testing locally before the event

The game also runs straight from disk, but for the closest match to the
live site you can serve it locally:

```bash
# Python (preinstalled on macOS/Linux)
cd your-folder
python3 -m http.server 8000
# then open http://localhost:8000
```

…or use the **Live Server** extension in VS Code.

---

## 4. Privacy & network assets

- The game uses **no camera and no microphone** and collects no data.
  Nothing is uploaded, recorded, or stored.
- It works from any static host (GitHub Pages) and even from `file://`.

### Network assets loaded from CDNs

| Asset | URL | Used for |
|---|---|---|
| Bootstrap 5.3.3 (LTR + RTL) | `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/...` | responsive layout utilities |
| Cairo font | `fonts.googleapis.com` | Arabic + Latin typography |

If the venue has no internet, download those files, place them in the project
(e.g. `vendor/`) and update the `<link>` tags in `index.html`. The game logic
itself needs no network at all.

## 5. How to play (Space only)

1. **Welcome screen** → press **Space** to get ready.
2. **Ready screen** → press **Space** to start the timer.
3. **Timer running** → press **Space** to stop it as close to **10.00** as possible.
4. **Result screen** → press **Space** to **try again** — it goes straight back to
   the ready screen. There is no waiting time or auto-reset countdown.

Notes
- Holding Space is ignored, and the page can never scroll.
- A tiny `RESULT_LOCK_MS` guard (default 0.5 s) stops an accidental double-tap
  from skipping the result; set it to `0` to remove it.
- **Esc** = instant staff reset back to the welcome screen.
- **Staff bar (bottom):** sound on/off · fullscreen · restart · mode badge.
  These are optional mouse utilities for the operator; the game itself never
  needs the mouse.

## 6. Organizer configuration (`js/config.js`)

| Constant | Default | Meaning |
|---|---|---|
| `WIN_TOLERANCE_SECONDS` | `0.00` | Win margin around 10.00. Judged on the **displayed** 2-decimal value, so the screen and the verdict always agree. `0.00` = display must read exactly `10.00`. Use e.g. `0.10` for a friendlier event. |
| `TARGET_SECONDS` | `10` | The target time. |
| `DEMO_FORCED_TIME` | `"10.00"` | Displayed result in demo mode. |
| `RESULT_LOCK_MS` | `500` | Anti-double-tap guard on the result screen before Space can start a new try (`0` = none). |
| `PRIZE_CLAIM_MESSAGE` | ar/en text | Winner note; set to `null` to hide. |
| `DEFAULT_LANG` | `"ar"` | First-load language (the choice then persists per browser session). |

---

## 7. Testing checklist for the event

- [ ] Open the site in Chrome/Edge (any browser works).
- [ ] Welcome screen appears in **Arabic** with the Stream Mobile logo.
- [ ] Toggle **English** → layout flips to LTR instantly, no reload.
- [ ] Press Space ×3 (get ready / start timer / stop timer) → result.
- [ ] On the result screen press Space → returns to the ready screen at once.
- [ ] Holding Space does nothing extra.
- [ ] **Genuine version:** a random stop gives a lose message and the *actual*
      measured time — never 10.00 unless truly achieved.
- [ ] **Demo version:** every stop shows `10.00` + confetti + win message, the
      staff bar shows the real internal time, and the badge reads DEMO MODE.
- [ ] **Restart** and **Esc** return to the welcome screen instantly.
- [ ] Sound toggle works; audio starts only after the first keypress.
- [ ] Fullscreen works on the event display.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Sound is silent | Browsers allow audio only after a tap/keypress — interact once with the page; also check the staff-bar sound toggle and system volume. |
| Page scrolls when pressing Space | Doesn't happen in this game; if you embed it elsewhere, ensure the Space handler (js/game.js) is active. |
| 404 on GitHub Pages | File names are case-sensitive — `index.html` must be exactly that; check that you uploaded the folder *contents*, not the parent folder. |
| Old version still visible after upload | Hard-refresh with Ctrl+F5 / Cmd+Shift+R; GitHub Pages caches for ~10 minutes. |

---

## 9. Accessibility & performance notes

- High-contrast white-on-navy text; giant timer readable from several meters.
- Full keyboard control (Space = everything in the game, Esc = staff reset,
  visible focus outlines).
- `prefers-reduced-motion` disables confetti, pulses and background drift.
- One shared `requestAnimationFrame` loop — no duplicate timers, listeners, or
  leaked animation frames.
