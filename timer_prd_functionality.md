# Timer View

### Purpose
Primary interface for displaying and controlling the active Pomodoro session (focus or break). The donut timer element serves as an animation to show the user the passage to time during each break or focus session

### Page Elements / Layout
- **Container**  
  - Fixed 340×340 px popup window.  
  - `<body>` background `--bg` (#0F0F0F), text color `--fg` (#E0E0E0).  
  - Inner wrapper `#app` with 30 px border-radius and overflow hidden.

- **Header (`<header class="top-bar">`)**  
  - Placeholder (32–40 px height) for potential back/close buttons (unused in Timer View).

- **Donut Timer (`<div class="donut" id="donut">`)**  
  - Size: 200×200 px, centered in `.timer-container`.  
  - Base ring: full circle, dark-gray (`#333`), via `.donut::before`, border-radius: 50%.  
  - Progress overlay: `<div class="progress">` absolutely inset 0, with a conic-gradient driven by CSS variable `--deg`.  
    - Gradient stops:  
      - `transparent` from 0°.  
      - `#FF5722` from 0° up to `var(--deg)`.  
      - `rgba(255,87,34,0.3)` for ~10° fade.  
      - `transparent` beyond `var(--deg)`.  
    - Transition: `all 0.45s ease-in`.  
    - Rotating “head” dot (`.progress::before`): 12×12 px, orange circle, positioned at center then rotated by `calc(var(--deg) – 90deg)` and translated outward ~94 px. Only visible when `var(--deg) > 5°`.

- **Inner Circle (`<div class="inner">`)**  
  - Positioned inset 12 px inside the donut, background `var(--bg)`, border-radius: 50%.  
  - Contains, stacked and centered:  
    1. **Session Icon** (`<button class="icon-btn eye">` or `class="icon-btn coffee"`)  
       - Size: 20×20 px, mask-based icon (mask-image: `var(--icon-eye)` or `var(--icon-coffee)`), `background-color: var(--fg)`, margin-bottom: 0.5 rem.  
    2. **Numeric Time Display** (`<div id="time-display">MM:SS</div>`)  
       - Font size: 2.5 rem; font-weight: 300.  
    3. **Session Label** (`<div id="session-label">FOCUS` or `SHORT BREAK`/`LONG BREAK` `</div>`)  
       - Font size: 0.9 rem; letter-spacing: 1 px; margin-top: 0.25 rem; uppercase.  
    4. **Status Indicators** (`<div id="status-indicators" class="status">`)  
       - Contains up to `sessionsBeforeLong` `<span class="dot">` elements.  
         - Each dot: 8×8 px circle; default `background-color: var(--accent-light)` (semi-transparent orange).  
         - If index < `sessionCount`, `.filled` → `background-color: #ff5722`.

- **Footer / Bottom Bar (`<footer class="bottom-bar">`)**  
  - Height: ~48–56 px; flex container, justify-content: space-between; padding: 0.75 rem top/bottom, 0.5 rem left/right.  
  - Contains three controls:  
    1. **Reset Button**  
       - Wrapper `<span class="icon-border-wrapper">` (48×48 px, 1 px border `var(--borders)`, border-radius: 50%, padding: 3 px).  
         - Hover: `border-color: #888888`, `background-color: rgba(255,255,255,0.05)`.  
       - Inner `<button id="btn-reset" class="icon-btn reset">` (40×40 px, mask `var(--icon-reset)`, `background-color: var(--fg)`).  
    2. **Start/Pause Button**  
       - `<button id="btn-start-pause" class="primary-btn">START</button>` or “PAUSE”.  
       - Styles:  
         - Background: `var(--start-btn-bg)` (#4A4A4A); text color: `var(--start-btn-fg)` (#1E1E1E).  
         - Border: 1 px solid `var(--start-btn-border)` (#4A4A4A).  
         - Padding: 0.75 rem top/bottom, 30 px left/right; border-radius: 24 px; font-size: 1 rem; font-weight: 500.  
    3. **Settings Button**  
       - Wrapper identical to Reset, inner `<button id="btn-settings" class="icon-btn settings">` (mask `var(--icon-settings)`, `background-color: var(--fg)`, 40×40 px).

- **Skip Forward Button** (`<button id="btn-skip-fwd" class="skip-fwd-btn">Skip Fwd.</button>`)  
  - Positioned below `.bottom-bar`, centered (`align-self: center`).  
  - Font size: 0.9 rem; font-weight: 500; color: `var(--fg)`; padding: 0.5 rem top/bottom, 1 rem left/right.  
  - Opacity: 0.7 when enabled; hover → 1. Disabled when `currentSession === 'longBreak'` or `pomodoroCompleted === true`.

- **Badge (Extension Icon)**  
  - Shows minutes remaining (rounded up) on the extension toolbar icon.  
  - Text: `String(Math.ceil(remainingSec/60))`.  
  - Background color: orange (`#ff5722`) during focus, green (`#4caf50`) during breaks.

### Business Logic
- **Data Model (chrome.storage.local keys)**  
  - `focus` (int minutes, default 25)  
  - `shortBreak` (int minutes, default 5)  
  - `longBreak` (int minutes, default 15)  
  - `sessionsBeforeLong` (int, default 4)  
  - `currentSession` (`'focus' | 'shortBreak' | 'longBreak'`, initial: `'focus'`)  
  - `sessionCount` (int, initial 0)  
  - `remainingSec` (int seconds, initial `focus * 60`)  
  - `timerRunning` (boolean, initial false)  
  - `pomodoroCompleted` (boolean, initial false; set true when a long break ends)

- **Startup Behavior (popup load)**  
  1. On extension install/upgrade: seed missing keys with defaults.  
  2. On popup open (`DOMContentLoaded`):  
     - Read `pomodoroCompleted` and `timerRunning`.  
     - Call `refreshUI()` to populate time, labels, icons, dots, button states.  
     - If `pomodoroCompleted === true`: send `{ action: 'resetCompleted' }` to background → resets state, then show Timer View.  
     - Else remain in Timer View with current state.

- **Start / Pause Timer**  
  - Clicking **START**: if `timerRunning === false` and `pomodoroCompleted === false`:  
    1. In background: set `timerRunning = true`.  
    2. If `remainingSec <= 0`, reset to `prefs[currentSession] * 60`.  
    3. Create an alarm `'pomodoro_tick'` with `periodInMinutes = 1/60` (fires every second).  
    4. Update UI button text → “PAUSE”.  
  - Clicking **PAUSE**: set `timerRunning = false`, clear the alarm, update button text → “START”.

- **Alarm Tick (background.js)**  
  1. On each tick (`chrome.alarms.onAlarm` for `'pomodoro_tick'`):  
     - Read `timerRunning, remainingSec, focus, shortBreak, longBreak, currentSession, sessionCount, sessionsBeforeLong, pomodoroCompleted` from storage.  
     - If `timerRunning === false`, exit.  
     - Decrement `remainingSec` by 1. Write back to storage, then call `updateBadge(remainingSec, currentSession)`.  
     - If `remainingSec <= 0`:  
       - Write `timerRunning = false`, clear alarm, `playBell()`, `notifyEndOfSession(currentSession)`.  
       - Determine next session:  
         - If `currentSession === 'focus'`:  
           - `sessionCountNew = sessionCount + 1`.  
           - If `(sessionCountNew % sessionsBeforeLong === 0)`: `nextSession = 'longBreak'`; else `nextSession = 'shortBreak'`.  
           - `pomodoroIsComplete = false`.  
         - Else if `currentSession === 'shortBreak'`:  
           - `nextSession = 'focus'`; `sessionCountNew = sessionCount`.  
         - Else if `currentSession === 'longBreak'`:  
           - `pomodoroIsComplete = true`; `nextSession = 'focus'`; `sessionCountNew = 0`.  
       - Let `nextDurMin = prefs[nextSession]`.  
       - Write to storage:  
         - `currentSession: nextSession`  
         - `sessionCount: sessionCountNew`  
         - `remainingSec: nextDurMin * 60`  
         - `pomodoroCompleted: pomodoroIsComplete`  
       - Call `updateBadge(nextDurMin * 60, nextSession)`.  
       - If `pomodoroIsComplete === false`: call `startTimer()` again (auto-start next session).

- **Skip to Next Session**  
  - On “Skip Fwd.” click (Timer View or Completed View):  
    1. Background reads `currentSession, sessionCount, sessionsBeforeLong, focus, shortBreak, longBreak, timerRunning, pomodoroCompleted`.  
    2. Clear any existing alarm. If `timerRunning === true`, write `timerRunning = false`.  
    3. Compute next session using same logic as alarm end (no bell or notification).  
    4. Let `nextDurMin = prefs[nextSession]`. Write:  
       - `currentSession: nextSession`  
       - `sessionCount: nextCount`  
       - `remainingSec: nextDurMin * 60`  
       - `timerRunning: false`  
       - `pomodoroCompleted: pomodoroIsComplete`  
    5. Call `updateBadge(nextDurMin * 60, nextSession)`.  
    6. If `timerRunning` was previously true **and** `pomodoroIsComplete === false`, call `startTimer()`.

- **Reset Timer**  
  - Clicking Reset (Timer View): send message `{ action: 'reset' }`.  
    - Background: read `focus` from storage; write:  
      - `timerRunning: false, sessionCount: 0, currentSession: 'focus', remainingSec: focus * 60, pomodoroCompleted: false`.  
      - Clear alarm, clear badge text (``), set badge color to `#ff5722`.  
  - Clicking Reset (Completed View): same behavior.

- **Notifications & Sound**  
  - `notifyEndOfSession(session)`: uses `chrome.notifications.create({ type: 'basic', iconUrl: 'icons/clock-48.png', title, message })`.  
    - If `session === 'focus'`:  
      - Title: “Focus session complete!”  
      - Message: “Time for a short/long break ☕”  
    - If `session === 'shortBreak'` or `'longBreak'`:  
      - Title: “Break is over!”  
      - Message: “Back to work! 🎯”.  
  - `playBell()`: ensures an offscreen document is created (via `setupOffscreenDocument()`), then sends `{ type: 'playAudio', src: chrome.runtime.getURL('/sounds/ding-ding-small-bell.mp3') }` to offscreen.  
    - Offscreen script (`offscreen.js`) listens for `playAudio` messages, creates `new Audio(src)` and plays.

- **Badge Updates**  
  - `updateBadge(sec, session)`:  
    - `mins = Math.ceil(sec/60).toString()`.  
    - `chrome.action.setBadgeText({ text: mins })`.  
    - `chrome.action.setBadgeBackgroundColor({ color: session === 'focus' ? '#ff5722' : '#4caf50' })`.

# Completed View

### Purpose
Celebratory screen shown immediately after a long break ends (one full Pomodoro cycle).

### Page Elements / Layout
- **Container & Background**  
  - Same 340×340 px dark background (`--bg: #0F0F0F`), inner `#app` clipped by 30 px border-radius.

- **Header (`<header class="top-bar">`)**  
  - Empty (reserved for back/title, not used here).

- **Content (`<div class="completed-content">`)**  
  - Flex container, centered horizontally/vertically, height `calc(100% – 40px)`.  
  - Inner wrapper `<div class="completed-text-container">`, flex-column, centered:  
    1. **“COMPLETE” Text** (`<div class="completed-text">COMPLETE</div>`)  
       - Font size: 2.2 rem; color: white; margin-top: 30 px; margin-bottom: 10 px.  
    2. **Clap Icons** (`<div class="clap-icons">`)  
       - Contains three `<div class="icon-btn clap">` elements.  
         - `.icon-btn.clap`: mask-image: `var(--icon-clap)`, `background-color: var(--fg)`, mask-size: 48×48 px, displayed inline with `gap: 2px`.

- **Footer / Bottom Bar**  
  - Same structure as Timer View footer: Reset, disabled Start, Settings.

- **Skip Forward Button** (`<button id="btn-skip-fwd-completed" class="skip-fwd-btn" disabled>Skip Fwd.</button>`)  
  - Disabled (cannot skip from Completed View).

### Business Logic
- Immediately after a long break ends, `pomodoroCompleted` flips to `true`.  
- `chrome.storage.onChanged` listener triggers `switchToView('view-completed')`.  
- In Completed View, only Reset and Settings controls are enabled; Start/Pause and Skip are disabled.  
- Clicking **Reset Completed**: sends `{ action: 'resetCompleted' }` to background → resets to a new focus session and switches back to Timer View.


# Settings View

### Purpose
Allow user to modify session durations and (future) preference toggles.

### Page Elements / Layout
- **Header**  
  - Back button:  
    ```html
    <span class="icon-border-wrapper">
      <button id="btn-back-settings" class="icon-btn back"></button>
    </span>
    ```  
    - Mask-image: `var(--icon-back)`, `background-color: var(--fg)`. Wrapper: 48×48 px, 1 px border, 3 px padding.  
  - Title: `<div class="title">Settings</div>` (flex: 1, text-align: center, font-weight: 500).  
  - Close button:  
    ```html
    <span class="icon-border-wrapper">
      <button id="btn-close-settings" class="icon-btn close"></button>
    </span>
    ```  
    - Mask-image: `var(--icon-close)`, `background-color: var(--fg)`.

- **Tabs (`<div class="tabs">`)**  
  - `<button id="tab-duration" class="tab active">DURATION</button>`  
  - `<button id="tab-preferences" class="tab">PREFERENCES</button>`  
  - Each `.tab`: flex:1; padding: 0.5 rem top/bottom; background: none; border: none; color: `var(--fg)`; font-weight: 500; cursor: pointer; opacity: 0.6.  
  - `.tab.active`: opacity: 1; border-bottom: 2 px solid `var(--accent)`.

- **Settings List (Durations)**  
  - `<div class="settings-list">` (scrollable, `overflow-y: auto`).  
  - Four items, each `<div class="setting-item" data-key="…">`:  
    1. Focus Session (`data-key="focus"`): `<span>Focus Session</span><span id="label-focus">25 min</span><span class="arrow"></span>`  
    2. Short Break (`data-key="shortBreak"`): `<span>Short Break</span><span id="label-shortBreak">5 min</span><span class="arrow"></span>`  
    3. Long Break (`data-key="longBreak"`): `<span>Long Break</span><span id="label-longBreak">15 min</span><span class="arrow"></span>`  
    4. Long Break After (`data-key="sessionsBeforeLong"`): `<span>Long break after</span><span id="label-sessionsBeforeLong">4 Sess.</span><span class="arrow"></span>`  
  - Each `.setting-item`: flex; align-items: center; justify-content: space-between; padding: 0.75 rem 1 rem; cursor: pointer; transition background 0.2s.  
    - On hover: background: rgba(255,255,255,0.05).  
    - Arrow `<span class="arrow">`: 16×16 px mask `var(--icon-forward)`, `background-color: var(--fg)`, opacity: 0.6.

### Business Logic & Data Binding
- On entering Settings View: `refreshUI()` reads storage and populates each `<span id="label-…">` with current values:  
  - `focus` → “25 min”; `shortBreak` → “5 min”; `longBreak` → “15 min”; `sessionsBeforeLong` → “4 Sess.”  
- Only Duration tab is implemented; Preferences tab is a placeholder.  
- Clicking a `.setting-item`: calls `openAdjustView(key)` → transition to Adjust View for that key.  
- Tabs: clicking “PREFERENCES” hides `.settings-list`; clicking “DURATION” shows it.  
- Back/Close buttons: both call `switchToView('view-timer')`.


# Adjust View

### Purpose
Let user increment/decrement a numeric value (`focus`, `shortBreak`, `longBreak`, or `sessionsBeforeLong`).

### Page Elements / Layout
- **Header**  
  ```html
  <span class="icon-border-wrapper">
    <button id="btn-back-adjust" class="icon-btn back"></button>
  </span>
