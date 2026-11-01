# Stream Mobile — Stop at 10 Challenge

A production-ready, dependency-free browser game for Stream Mobile marketing
events. The participant tries to stop the timer at exactly **10.00 seconds** —
by opening their hand in front of the camera (real-time hand tracking) or by
pressing the **Space** key.

Built with HTML5 + CSS3 + vanilla JavaScript + Bootstrap 5.3 + MediaPipe Hand
Landmarker + Web Audio API. **No backend, no database, no build step, no npm.**
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
js/hand-tracking.js   ← MediaPipe Hand Landmarker + gesture classifier
js/game.js            ← state machine: welcome → ready → running → result
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

Camera access requires a **secure context**. Opening `index.html` directly
from disk (`file://`) will block the camera *and* the MediaPipe module, so use
one of these instead:

```bash
# Python (preinstalled on macOS/Linux)
cd your-folder
python3 -m http.server 8000
# then open http://localhost:8000
```

…or use the **Live Server** extension in VS Code. `http://localhost` counts as
a secure context, so the camera works there.

---

## 4. Camera, permissions & privacy

- The camera **never** activates before a human clicks **Enable camera**.
- Supported browsers: Chrome / Edge / Firefox / Safari 16.4+ (recommended:
  Chrome or Edge on the event laptop).
- The page must be served over **HTTPS** (GitHub Pages) or `http://localhost`.
- If the browser previously blocked the camera: click the padlock/tune icon in
  the address bar → *Site settings* → allow *Camera* → reload.
- **Privacy:** every video frame is processed locally by WebAssembly inside
  the browser. Nothing is uploaded, recorded, or stored — no photos of
  participants exist anywhere.

### Network assets loaded from CDNs (require internet on the event machine)

| Asset | URL | Used for |
|---|---|---|
| MediaPipe tasks-vision module | `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs` | hand tracking JS |
| MediaPipe WASM runtime | `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm` | hand tracking engine |
| Hand landmark model | `storage.googleapis.com/mediapipe-models/…/hand_landmarker.task` | the ML model |
| Bootstrap 5.3.3 (LTR + RTL) | `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/...` | responsive layout utilities |
| Cairo font | `fonts.googleapis.com` | Arabic + Latin typography |

If the venue has no internet, download those files, place them in the project
(e.g. `vendor/`), and update the URLs at the top of `js/config.js` plus the
`<link>` tags in `index.html`/`demo.html`. Everything else is offline-ready,
and if a CDN fails the game automatically stays playable with the keyboard.

---

## 5. How to play

**Camera mode** (default flow)
1. Welcome screen → enable the camera → **Start Challenge**.
2. Show an **open hand** to the camera — the “hand detected ✓” chip lights up.
3. **Close it into a fist** and hold — a 3-2-1 ring counts down.
4. At zero the timer starts automatically.
5. **Open the hand** to stop the timer as close to 10.00 as possible.
6. Result shows for exactly 10 seconds with a visible countdown, then the game
   resets itself for the next participant.

**Keyboard mode** (camera denied / unavailable / ModelPipe failure)
- Click **Play with keyboard (Space)** or just press **Space** on the welcome
  screen — the game tells you it switched to keyboard mode.
- **Space** starts the timer, **Space** again stops it. Holding Space is
  ignored, and the page can never scroll.
- **Esc** = instant staff reset back to the welcome screen.
- After start, the game never requires a mouse again.

**Staff bar (bottom of the screen):** camera on/off · camera preview show/hide ·
sound on/off · fullscreen · restart · mode badge. If the hand disappears while
the timer is running, a warning appears and the timer keeps running honestly
until the hand returns or Space stops it — a lost hand is never treated as a
win and never silently resets the game.

---

## 6. Organizer configuration (`js/config.js`)

| Constant | Default | Meaning |
|---|---|---|
| `WIN_TOLERANCE_SECONDS` | `0.00` | Win margin around 10.00. Judged on the **displayed** 2-decimal value, so the screen and the verdict always agree. `0.00` = display must read exactly `10.00`. Use e.g. `0.10` for a friendlier event. |
| `TARGET_SECONDS` | `10` | The target time. |
| `DEMO_FORCED_TIME` | `"10.00"` | Displayed result in demo mode. |
| `RESULT_DISPLAY_SECONDS` | `10` | How long the result stays before auto reset. |
| `FIST_HOLD_SECONDS` | `3` | Continuous fist hold needed to start. |
| `FIST_GAP_TOLERANCE_MS` | `250` | Detection dropouts that don't cancel the hold. |
| `OPEN_DEBOUNCE_MS` | `180` | How long the open hand must be stable before the stop counts. |
| `CAMERA.WIDTH / HEIGHT` | `1280 / 720` | Requested camera resolution (lower it on weak laptops). |
| `CAMERA.PROCESS_INTERVAL_MS` | `33` | Hand-processing rate (~30 fps). Raise to `50` to save CPU. |
| `PRIZE_CLAIM_MESSAGE` | ar/en text | Winner note; set to `null` to hide. |
| `DEFAULT_LANG` | `"ar"` | First-load language (the choice then persists per browser session). |

---

## 7. Testing checklist for the event

- [ ] Open the site over HTTPS (or localhost) in Chrome/Edge.
- [ ] Welcome screen appears in **Arabic** with the Stream Mobile logo.
- [ ] Toggle **English** → layout flips to LTR instantly, no reload.
- [ ] Click **Enable camera** → browser asks permission → allow → status chip
      turns “camera is ready ✓” and the preview appears.
- [ ] **Camera flow:** open hand → chip lights up → fist 3 s (ring fills,
      3-2-1) → timer starts → open hand stops it → result + auto reset.
- [ ] **Keyboard flow:** press Space ×3 (start round / start timer / stop
      timer) → result; holding Space does nothing extra.
- [ ] **Genuine version:** a random stop gives a lose message and the *actual*
      measured time — never 10.00 unless truly achieved.
- [ ] **Demo version:** every stop shows `10.00` + confetti + win message, the
      staff bar shows the real internal time, and the badge reads DEMO MODE.
- [ ] Result screen auto-returns to welcome after 10 s; **Restart** and **Esc**
      also reset instantly.
- [ ] Sound toggle works; audio starts only after the first interaction.
- [ ] Fullscreen works on the event display.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| “This browser does not support camera access” | You opened the page via `file://` or plain HTTP — use GitHub Pages (HTTPS) or `http://localhost`. |
| Camera permission was denied by accident | Padlock icon in the address bar → Site settings → allow Camera → reload. |
| “No camera available (or it is in use)” | Close Zoom/Teams/other tabs using the webcam, or switch USB ports; the keyboard game stays available meanwhile. |
| “Failed to load the hand-tracking model” | The venue blocks the CDN — check the internet, or vendor the files locally (section 4). The keyboard game keeps working. |
| Hand detection is jumpy | Improve lighting, keep the hand ~0.5–1 m from the camera, avoid a bright window behind the participant. Lower `CAMERA.HEIGHT` if the CPU is weak. |
| Sound is silent | Browsers allow audio only after a tap/keypress — interact once with the page; also check the staff-bar sound toggle and system volume. |
| Page scrolls when pressing Space | Doesn't happen in this game; if you embed it elsewhere, ensure the Space handler (js/game.js) is active. |
| 404 on GitHub Pages | File names are case-sensitive — `index.html` must be exactly that; check that you uploaded the folder *contents*, not the parent folder. |
| Old version still visible after upload | Hard-refresh with Ctrl+F5 / Cmd+Shift+R; GitHub Pages caches for ~10 minutes. |

---

## 9. Accessibility & performance notes

- High-contrast white-on-navy text; giant timer readable from several meters.
- Full keyboard support (Space = game, Enter = buttons, Esc = staff reset,
  visible focus outlines).
- `prefers-reduced-motion` disables confetti, pulses and background drift.
- One shared `requestAnimationFrame` loop + one camera loop, both cleaned up
  on reset — no duplicate timers, listeners, or leaked animation frames.
- Camera tracks are fully stopped when camera mode is disabled.
