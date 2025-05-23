// background.js
// Service worker for alarms, badge updates, notifications, sound
// persists even whan popup is closed

const ALARM_NAME = 'pomodoro_tick';

// Default settings
const DEFAULTS = {
  focus: 25,            // minutes
  shortBreak: 5,        // minutes
  longBreak: 15,        // minutes
  sessionsBeforeLong: 4,
  currentSession: 'focus',  // 'focus' | 'shortBreak' | 'longBreak'
  sessionCount: 0,          // how many focus sessions completed
  remainingSec: 25 * 60,    // seconds left in current session
  timerRunning: false
};

// On install or upgrade, seed defaults if none exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULTS), prefs => {
    const toSet = {};
    for (let k in DEFAULTS) {
      if (prefs[k] === undefined) toSet[k] = DEFAULTS[k];
    }
    if (Object.keys(toSet).length) {
      chrome.storage.local.set(toSet);
    }
  });
  chrome.action.setBadgeText({ text: '' });
});

// Listen to messages from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'start':
      startTimer();
      break;
    case 'pause':
      pauseTimer();
      break;
    case 'reset':
      resetTimer();
      break;
    case 'updateDurations':
      // msg.durations = { focus, shortBreak, longBreak, sessionsBeforeLong }
      chrome.storage.local.set(msg.durations);
      // also reset remainingSec if timer is not running and we're on that session
      chrome.storage.local.get(['timerRunning','currentSession'], prefs => {
        if (!prefs.timerRunning) {
          chrome.storage.local.get(prefs.currentSession, d => {
            chrome.storage.local.set({ remainingSec: d[prefs.currentSession] * 60 });
            updateBadge(d[prefs.currentSession] * 60, prefs.currentSession);
          });
        }
      });
      break;
  }
  sendResponse();
  return true;
});


// ALARM tick handler
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.storage.local.get([
    'timerRunning','remainingSec',
    'focus','shortBreak','longBreak',
    'currentSession','sessionCount','sessionsBeforeLong'
  ], prefs => {
    if (!prefs.timerRunning) return;

    let { remainingSec, currentSession, sessionCount, sessionsBeforeLong } = prefs;
    remainingSec--;

    if (remainingSec > 0) {
      // update countdown
      chrome.storage.local.set({ remainingSec });
      updateBadge(remainingSec, currentSession);
    } else {
      // session ended
      chrome.storage.local.set({ timerRunning: false });
      clearAlarm();
      playBell();
      notifyEndOfSession(currentSession);

      // determine next session
      let nextSession = 'focus';
      let nextCount = sessionCount;
      if (currentSession === 'focus') {
        nextCount++;
        nextSession = (nextCount % sessionsBeforeLong === 0) ? 'longBreak' : 'shortBreak';
      }
      // reset for next
      const nextDurMin = prefs[nextSession];
      chrome.storage.local.set({
        currentSession: nextSession,
        sessionCount: nextCount,
        remainingSec: nextDurMin * 60
      });
      updateBadge(nextDurMin * 60, nextSession);
    }
  });
});


// ────────────────────────────────────────────────────────────
//  Timer Control Helpers
// ────────────────────────────────────────────────────────────
function startTimer() {
  chrome.storage.local.get(['timerRunning','remainingSec','currentSession','focus','shortBreak','longBreak'], prefs => {
    if (prefs.timerRunning) return;
    // if we just reset or never started, ensure remainingSec is set
    if (prefs.remainingSec <= 0) {
      const durMin = prefs[prefs.currentSession];
      prefs.remainingSec = durMin * 60;
      chrome.storage.local.set({ remainingSec: prefs.remainingSec });
    }
    chrome.storage.local.set({ timerRunning: true });
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1/60 });
  });
}

function pauseTimer() {
  chrome.storage.local.set({ timerRunning: false });
  clearAlarm();
}

function resetTimer() {
  // Always reset to the default focus session values
  chrome.storage.local.get(['focus'], prefs => { // Only need to get 'focus' here
    chrome.storage.local.set({
      timerRunning: false,
      sessionCount: 0,
      currentSession: 'focus', // Explicitly set to focus
      remainingSec: prefs.focus * 60 // Reset to focus duration in seconds
    }, () => { // Callback after storage is set
      clearAlarm();
      // Clear the badge text directly
      chrome.action.setBadgeText({ text: '' });
      // Set badge background color to focus color
      chrome.action.setBadgeBackgroundColor({ color: '#ff5722' });
      // No need to call updateBadge here, as we explicitly clear it and set color.
    });
  });
}

function clearAlarm() {
  chrome.alarms.clear(ALARM_NAME);
}

// ────────────────────────────────────────────────────────────
//  UI Feedback: Badge, Notification, Sound
// ────────────────────────────────────────────────────────────
function updateBadge(sec, session) {
  const mins = Math.ceil(sec / 60).toString();
  chrome.action.setBadgeText({ text: mins });
  chrome.action.setBadgeBackgroundColor({
    color: session === 'focus' ? '#ff5722' : '#4caf50'
  });
}

function notifyEndOfSession(session) {
  const title = session === 'focus' ? 'Focus session complete!' : 'Break is over!';
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/clock-48.png',
    title,
    message: session === 'focus'
      ? 'Time for a short/long break ☕'
      : 'Back to work! 🎯'
  });
}

function playBell() {
  const audio = new Audio(chrome.runtime.getURL('sounds/bell.mp3'));
  audio.play();
}