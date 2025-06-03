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
const btnSkipFwd      = document.getElementById('btn-skip-fwd');

// Views
const viewTimer       = document.getElementById('view-timer');
const viewSettings    = document.getElementById('view-settings');
const viewAdjust      = document.getElementById('view-adjust');
const viewCompleted   = document.getElementById('view-completed');

// Buttons for navigation and settings
const btnSettings       = document.getElementById('btn-settings'); // In Timer view footer
const btnCloseSettings  = document.getElementById('btn-close-settings'); // In Settings view header
const btnBackSettings     = document.getElementById('btn-back-settings');   // In Settings view header (typo? btnBackAdjust is also used)
const btnBackAdjust     = document.getElementById('btn-back-adjust');   // In Adjust view header
const settingItems    = document.querySelectorAll('.setting-item');

// Buttons for view-completed
const btnResetCompleted       = document.getElementById('btn-reset-completed');
const btnStartPauseCompleted  = document.getElementById('btn-start-pause-completed');
const btnSettingsCompleted    = document.getElementById('btn-settings-completed');
const btnSkipFwdCompleted     = document.getElementById('btn-skip-fwd-completed');
const completedTextLabel      = document.getElementById('completed-text-label');


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

// specific icons
const eyeIcon = document.querySelector('.icon-btn.eye');
const coffeeIcon = document.querySelector('.icon-btn.coffee');
const finishFlagIcon = document.querySelector('.icon-btn.finish-flag');

let currentAdjustKey = null; // To store which setting is being adjusted

// ────────────────────────────────────────────────────────────
//  Initialize UI on load
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['pomodoroCompleted', 'timerRunning'], prefs => {
    refreshUI(); // Always update UI elements first

    // Determine initial view based on current state
    if (prefs.pomodoroCompleted) {
      // If pomodoro was completed, initiate reset and then show timer view
      chrome.runtime.sendMessage({ action: 'resetCompleted' }, () => {
        refreshUI(); // Re-update UI with reset values
        switchToView('view-timer'); // Show the timer view after reset
      });
    } else {
      // Otherwise, always start on the timer view
      switchToView('view-timer');
    }
  });
  bindUIActions();
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
        titleText = 'Number of Sessions';
        unitText = 'Sess.';
        break;
    }
    adjustTitle.textContent = titleText;
    adjustUnit.textContent = unitText;
    adjustInput.min = (key === 'sessionsBeforeLong' ? 1 : 1); // Min value for input
    switchToView('view-adjust');
  });
}

// Refresh everything from chrome.storage (now only updates elements, not views)
function refreshUI() {
  try {
    chrome.storage.local.get(null, prefs => {
      const defaults = { // Define defaults here in case some prefs are not set
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsBeforeLong: 4,
        currentSession: 'focus',
        remainingSec: 25 * 60,
        timerRunning: false,
        pomodoroCompleted: false
      };
      const currentPrefs = { ...defaults, ...prefs };

      const {
        focus, shortBreak, longBreak, sessionsBeforeLong,
        currentSession, remainingSec, sessionCount, timerRunning,
        pomodoroCompleted // Keep pomodoroCompleted for other UI logic if needed, but not for view switching in this func
      } = currentPrefs;

      // REMOVED: View switching logic from here. It is now handled explicitly
      // in DOMContentLoaded and chrome.storage.onChanged listener.

      // Update eye/coffee icon based on current session
      if (eyeIcon) {
        if (currentSession === 'focus') {
          eyeIcon.classList.remove('coffee');
          eyeIcon.classList.add('eye');
        } else { // This will apply for 'shortBreak' and 'longBreak'
          eyeIcon.classList.remove('eye');
          eyeIcon.classList.add('coffee');
        }
      }

      // time display (only for view-timer)
      if (timeDisplay) timeDisplay.textContent = formatTime(remainingSec);
      if (sessionLabel) sessionLabel.textContent = labelCase(currentSession);
      if (completedTextLabel) completedTextLabel.textContent = "COMPLETED";

      // Donut progress calculation (ENHANCED WITH ROUNDED EDGE)
      const totalDurationForCurrentSession = currentPrefs[currentSession] * 60;
      let deg;
      let percent_of_donut;

      if (totalDurationForCurrentSession > 0) {
          const elapsedSec = totalDurationForCurrentSession - remainingSec;
          percent_of_donut = (elapsedSec / totalDurationForCurrentSession) * 100;
          deg = (elapsedSec / totalDurationForCurrentSession) * 360;
      } else {
          percent_of_donut = 0;
          deg = 0;
      }

      deg = Math.max(0, Math.min(360, deg));

      // Set the CSS variables for the timer view's donut
      if (donutProgress) {
        donutProgress.style.setProperty('--deg', `${deg}deg`);
        donutProgress.setAttribute('data-deg', `${deg.toFixed(1)}°`);

        // Control rounded edge visibility - hide when progress is very small
        const showRoundedEdge = deg > 5; // Only show after 5 degrees of progress
        donutProgress.style.setProperty('--progress-opacity', showRoundedEdge ? '1' : '0');
      }

      // status dots
      renderStatusDots(sessionCount, sessionsBeforeLong);

      // button text for timer view
      if (btnStartPause) btnStartPause.textContent = timerRunning ? 'PAUSE' : 'START';

      // Disable skip button if current session is 'longBreak' or pomodoro is completed
      if (btnSkipFwd) {
        btnSkipFwd.disabled = (currentSession === 'longBreak' || pomodoroCompleted);
      }
      // Ensure buttons in completed view are disabled
      if (btnStartPauseCompleted) btnStartPauseCompleted.disabled = true;
      if (btnSkipFwdCompleted) btnSkipFwdCompleted.disabled = true;


      // labels for settings
      if (labels.focus) labels.focus.innerText = `${focus} min`;
      if (labels.shortBreak) labels.shortBreak.innerText = `${shortBreak} min`;
      if (labels.longBreak) labels.longBreak.innerText = `${longBreak} min`;
      if (labels.sessionsBeforeLong) labels.sessionsBeforeLong.innerText = `${sessionsBeforeLong} Sess.`;
    });
  } catch (e) {
    console.error("Error in refreshUI:", e);
  }
}



// ────────────────────────────────────────────────────────────
//  Bind Buttons & UI Actions
// ────────────────────────────────────────────────────────────
function bindUIActions() {
  // Event listener for Start/Stop Timer controls (Timer View)
  if (btnStartPause) {
    btnStartPause.addEventListener('click', () => {
      chrome.storage.local.get('timerRunning', prefs => {
        const action = prefs.timerRunning ? 'pause' : 'start';
        chrome.runtime.sendMessage({ action }, refreshUI);
      });
    });
  }


  // Event listener for reset button (Timer View)
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'reset' }, () => {
        // This callback executes AFTER the background script has processed the 'reset' action
        refreshUI();
      });
    });
  }

  // Skip Fwd button action (Timer View)
  if (btnSkipFwd) {
    btnSkipFwd.addEventListener('click', () => {
      // Send a message to the background script to advance the session
      chrome.runtime.sendMessage({ action: 'skipSession' }, () => {
        refreshUI(); // Refresh UI after the session has been skipped
      });
    });
  }

  // Event listener for reset button (Completed View)
  if (btnResetCompleted) {
    btnResetCompleted.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'resetCompleted' }, () => {
        refreshUI(); // Refresh UI after the reset
      });
    });
  }

  // Navigation
  if (btnSettings) {
    btnSettings.addEventListener('click', () => switchToView('view-settings'));
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => switchToView('view-timer'));
  }
  // Check for btnBackSettings vs btnBackAdjust: btnBackAdjust is used in the Adjust view header.
  // btnBackSettings seems to be for the Settings view header, going back to timer.
  if (btnBackSettings) {
    btnBackSettings.addEventListener('click', () => switchToView('view-timer'));
  }
  if (btnBackAdjust) {
    btnBackAdjust.addEventListener('click', () => switchToView('view-settings'));
  }
  // Navigation from completed view to settings
  if (btnSettingsCompleted) {
    btnSettingsCompleted.addEventListener('click', () => switchToView('view-settings'));
  }


  // Setting items in the list
  settingItems.forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      if (key) openAdjustView(key);
    });
  });

  // Adjustment view controls (+ / - / input change)
  if (decreaseBtn) decreaseBtn.addEventListener('click', () => updateAdjustInput(-1));
  if (increaseBtn) increaseBtn.addEventListener('click', () => updateAdjustInput(1));

  if (adjustInput) {
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
          // This callback no longer calls refreshUI() to prevent jumping back to timer view.
          // The chrome.storage.onChanged listener will handle overall UI refresh
          // when data changes, but we want to stay on the settings view for immediate feedback.
          if (labels[currentAdjustKey]) {
            labels[currentAdjustKey].innerText = `${value} ${currentAdjustKey === 'sessionsBeforeLong' ? 'Sess.' : 'min'}`;
          }
        });
      }
    });
  }


  // Tab button logic (visual switching)
  // Ensure 'tabNotifications' is indeed the ID for the "tab-preferences" element
  if (tabDuration && tabNotifications) {
    tabDuration.addEventListener('click', () => {
      tabDuration.classList.add('active');
      tabNotifications.classList.remove('active');
      // Show relevant settings for DURATION
      document.querySelector('.settings-list').style.display = ''; // Show duration settings
      // Potentially hide PREFERENCES specific settings if they exist in a different list
    });
    tabNotifications.addEventListener('click', () => {
      tabNotifications.classList.add('active');
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
  if (typeof count !== 'number' || typeof cycleLen !== 'number') {
    return;
  }

  for (let i = 0; i < cycleLen; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i < count) {
      dot.classList.add('filled');
    }
    statusDiv.appendChild(dot);
  }
}

// Listener for storage changes from background script
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    refreshUI(); // Update all current UI elements

    // NEW: Explicitly handle view switching based on state changes
    if (changes.pomodoroCompleted && changes.pomodoroCompleted.newValue === true) {
      switchToView('view-completed');
    } else if (changes.pomodoroCompleted && changes.pomodoroCompleted.newValue === false && changes.pomodoroCompleted.oldValue === true) {
      // If pomodoro was completed and now reset, switch to timer view
      switchToView('view-timer');
    }
    // Add more conditions here if other state changes should trigger view switches
    // For example, if currentSession changes (e.g., focus to shortBreak) and you want to ensure timer view,
    // but current logic already keeps it there.
  }
});