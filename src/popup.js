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

// Views
const viewTimer       = document.getElementById('view-timer');
const viewSettings    = document.getElementById('view-settings');
const viewAdjust      = document.getElementById('view-adjust');

// Buttons for navigation and settings
const btnSettings       = document.getElementById('btn-settings'); // In Timer view footer
const btnCloseSettings  = document.getElementById('btn-close-settings'); // In Settings view header
const btnBackAdjust     = document.getElementById('btn-back-adjust');   // In Adjust view header
const settingItems    = document.querySelectorAll('.setting-item');

// Labels for settings values in the list
const labels          = {
  focus:    document.getElementById('label-focus'),
  shortBreak: document.getElementById('label-shortBreak'),
  longBreak: document.getElementById('label-longBreak'),
  sessionsBeforeLong: document.getElementById('label-sessionsBeforeLong')
};

// Adjustment view elements
const adjustTitle     = document.getElementById('adjust-title');
const adjustInput     = document.getElementById('adjust-input');
const adjustUnit      = document.getElementById('adjust-unit');
const decreaseBtn     = document.getElementById('decrease');
const increaseBtn     = document.getElementById('increase');

// Tabs in Settings view
const tabDuration     = document.getElementById('tab-duration');
const tabNotifications = document.getElementById('tab-preferences');

let currentAdjustKey = null; // To store which setting is being adjusted

// ────────────────────────────────────────────────────────────
//  Initialize UI on load
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refreshUI();
  bindUIActions();
  switchToView('view-timer'); // Ensure timer view is active on load
});

// Function to switch between views
function switchToView(viewIdToShow) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  const viewToShow = document.getElementById(viewIdToShow);
  if (viewToShow) {
    viewToShow.classList.add('active');
  } else {
    console.error(`View with ID ${viewIdToShow} not found.`);
  }
}

// Open the adjustment view for a specific setting
function openAdjustView(key) {
  currentAdjustKey = key;
  chrome.storage.local.get(key, prefs => {
    adjustInput.value = prefs[key] || (key === 'sessionsBeforeLong' ? 4 : 25); // Default if not set
    
    let unitText = 'min';
    let titleText = 'Setting';

    switch(key) {
      case 'focus': titleText = 'Focus Session'; break;
      case 'shortBreak': titleText = 'Short Break'; break;
      case 'longBreak': titleText = 'Long Break'; break;
      case 'sessionsBeforeLong': 
        titleText = 'Sessions Before Long Break';
        unitText = 'Sess.';
        break;
    }
    adjustTitle.textContent = titleText;
    adjustUnit.textContent = unitText;
    adjustInput.min = (key === 'sessionsBeforeLong' ? 1 : 1); // Min value for input
    switchToView('view-adjust');
  });
}

// Refresh everything from chrome.storage
function refreshUI() {
  chrome.storage.local.get(null, prefs => {
    const defaults = { // Define defaults here in case some prefs are not set
      focus: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLong: 4,
      currentSession: 'focus',
      remainingSec: 25 * 60,
      sessionCount: 0,
      timerRunning: false
    };
    const currentPrefs = { ...defaults, ...prefs };

    const {
      focus, shortBreak, longBreak, sessionsBeforeLong,
      currentSession, remainingSec, sessionCount, timerRunning
    } = currentPrefs;

    // time display
    timeDisplay.textContent = formatTime(remainingSec);
    sessionLabel.textContent = labelCase(currentSession);

    // donut
    const totalDurationForCurrentSession = currentPrefs[currentSession] * 60;
    const deg = totalDurationForCurrentSession > 0 ? (360 - (remainingSec / totalDurationForCurrentSession) * 360) : 0;
    donutProgress.style.setProperty('--deg', `${deg}deg`);


    // status dots
    renderStatusDots(sessionCount, sessionsBeforeLong);

    // button text
    btnStartPause.textContent = timerRunning ? 'PAUSE' : 'START';

    // labels for settings
    if (labels.focus) labels.focus.innerText = `${focus} min`;
    if (labels.shortBreak) labels.shortBreak.innerText = `${shortBreak} min`;
    if (labels.longBreak) labels.longBreak.innerText = `${longBreak} min`;
    if (labels.sessionsBeforeLong) labels.sessionsBeforeLong.innerText = `${sessionsBeforeLong} Sess.`;
  });
}

// Listen for background updates
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') { // Check for any relevant change
    refreshUI();
  }
});

// ────────────────────────────────────────────────────────────
//  Bind Buttons & UI Actions
// ────────────────────────────────────────────────────────────
function bindUIActions() {
  // Timer controls
  btnStartPause.addEventListener('click', () => {
    chrome.storage.local.get('timerRunning', prefs => {
      const action = prefs.timerRunning ? 'pause' : 'start';
      chrome.runtime.sendMessage({ action }, refreshUI);
    });
  });

  btnReset.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'reset' }, refreshUI);
  });

  // Navigation
  if (btnSettings) {
    btnSettings.addEventListener('click', () => switchToView('view-settings'));
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => switchToView('view-timer'));
  }
  if (btnBackAdjust) {
    btnBackAdjust.addEventListener('click', () => switchToView('view-settings'));
  }

  // Setting items in the list
  settingItems.forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      if (key) openAdjustView(key);
    });
  });

  // Adjustment view controls (+ / - / input change)
  decreaseBtn.addEventListener('click', () => updateAdjustInput(-1));
  increaseBtn.addEventListener('click', () => updateAdjustInput(1));
  
  adjustInput.addEventListener('change', () => {
    let value = parseInt(adjustInput.value, 10);
    const min = parseInt(adjustInput.min, 10) || 1;
    if (isNaN(value) || value < min) {
      value = min;
      adjustInput.value = value;
    }
    if (currentAdjustKey) {
      chrome.runtime.sendMessage({
        action: 'updateDurations',
        durations: { [currentAdjustKey]: value }
      }, () => {
        refreshUI(); // Refresh main UI after update from background
        // Also update the specific label in the settings view immediately
        if (labels[currentAdjustKey]) {
          labels[currentAdjustKey].innerText = `${value} ${currentAdjustKey === 'sessionsBeforeLong' ? 'Sess.' : 'min'}`;
        }
      });
    }
  });

  // Tab button logic (visual switching)
  if (tabDuration && tabPreferences) {
    tabDuration.addEventListener('click', () => {
      tabDuration.classList.add('active');
      tabPreferences.classList.remove('active'); // Updated to tabPreferences
      // Show relevant settings for DURATION
      document.querySelector('.settings-list').style.display = ''; // Show duration settings
      // Potentially hide PREFERENCES specific settings if they exist in a different list
    });
    tabPreferences.addEventListener('click', () => {
      tabPreferences.classList.add('active');
      tabDuration.classList.remove('active');
      // Show relevant settings for PREFERENCES
      // Example: For now, we can just log or hide the current list if it's only for durations.
      // document.querySelector('.settings-list').style.display = 'none'; 
      // alert("PREFERENCES settings would be shown here.");
    });
  }
}

// Helper for +/- buttons in adjust view
function updateAdjustInput(delta) {
  let currentValue = parseInt(adjustInput.value, 10);
  const minVal = parseInt(adjustInput.min, 10) || 1;
  currentValue = isNaN(currentValue) ? minVal : currentValue + delta;
  if (currentValue < minVal) {
    currentValue = minVal;
  }
  adjustInput.value = currentValue;
  adjustInput.dispatchEvent(new Event('change')); // Trigger change to save
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
  if (!key) return 'FOCUS'; // Default if key is undefined
  return key
    .replace(/([A-Z])/g, ' $1')
    .toUpperCase()
    .trim();
}

function renderStatusDots(count, cycleLen) {
  if (!statusDiv) return;
  statusDiv.innerHTML = '';
  if (typeof count !== 'number' || typeof cycleLen !== 'number' || cycleLen <= 0) {
      return; // Avoid errors if data is not as expected
  }
  for (let i = 0; i < cycleLen; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < (count % cycleLen) ? ' completed' : '');
    statusDiv.appendChild(dot);
  }
}