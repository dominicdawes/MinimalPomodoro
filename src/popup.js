// popup.js
// this file does popup logic: controls, storage, messaging, 
// reads stored states, and updates the timer donut clock

// ────────────────────────────────────────────────────────────
//  DOM Refs
// ────────────────────────────────────────────────────────────
const timeDisplay     = document.getElementById('time-display');
const sessionLabel    = document.getElementById('session-label');
const donutProgress   = document.querySelector('#donut .progress');
const statusDiv       = document.getElementById('status-indicators');
const btnStartPause   = document.getElementById('btn-start-pause');
const btnReset        = document.getElementById('btn-reset');
const settingItems    = document.querySelectorAll('.setting-item');
const labels          = {
  focus:    document.getElementById('label-focus'),
  shortBreak: document.getElementById('label-shortBreak'),
  longBreak: document.getElementById('label-longBreak'),
  sessionsBeforeLong: document.getElementById('label-sessionsBeforeLong')
};

// ────────────────────────────────────────────────────────────
//  Initialize UI on load
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refreshUI();
  bindUIActions();
});

// Refresh everything from chrome.storage
function refreshUI() {
  chrome.storage.local.get(null, prefs => {
    const {
      focus, shortBreak, longBreak, sessionsBeforeLong,
      currentSession, remainingSec, sessionCount, timerRunning
    } = Object.assign({}, prefs);

    // time display
    timeDisplay.textContent = formatTime(remainingSec);
    sessionLabel.textContent = labelCase(currentSession);

    // donut
    const total = prefs[currentSession] * 60;
    const deg   = (remainingSec / total) * 360;
    donutProgress.style.setProperty('--deg', deg);

    // status dots
    renderStatusDots(sessionCount, sessionsBeforeLong);

    // button text
    btnStartPause.textContent = timerRunning ? 'PAUSE' : 'START';

    // labels for settings
    labels.focus.innerText           = `${focus} min`;
    labels.shortBreak.innerText      = `${shortBreak} min`;
    labels.longBreak.innerText       = `${longBreak} min`;
    labels.sessionsBeforeLong.innerText = `${sessionsBeforeLong} Sess.`;
  });
}

// Listen for background updates
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (
      changes.remainingSec ||
      changes.currentSession ||
      changes.timerRunning ||
      changes.sessionCount
    )) {
    refreshUI();
  }
});

// ────────────────────────────────────────────────────────────
//  Bind Buttons → Background Messages
// ────────────────────────────────────────────────────────────
function bindUIActions() {
  btnStartPause.addEventListener('click', () => {
    chrome.storage.local.get('timerRunning', prefs => {
      const action = prefs.timerRunning ? 'pause' : 'start';
      chrome.runtime.sendMessage({ action }, refreshUI);
    });
  });

  btnReset.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'reset' }, refreshUI);
  });

  settingItems.forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      openAdjustView(key);
    });
  });

  // (… your existing tabs & adjust view code goes here …)
  // When the user finalizes a new duration, send:
  // chrome.runtime.sendMessage({ action: 'updateDurations', durations: { focus: newFocus, … }});
}

// ────────────────────────────────────────────────────────────
//  UI Helpers
// ────────────────────────────────────────────────────────────
function formatTime(sec) {
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}

function labelCase(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .toUpperCase()
    .trim();
}

function renderStatusDots(count, cycleLen) {
  statusDiv.innerHTML = '';
  for (let i = 0; i < cycleLen; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < (count % cycleLen) ? ' completed' : '');
    statusDiv.appendChild(dot);
  }
}
