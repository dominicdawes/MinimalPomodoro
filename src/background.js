// background.js
// Service worker: alarms, badge updates, notifications, sound

const FOCUS = 'focus';
const BREAK = 'break';
let remaining = 0;
let mode = FOCUS;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ focusDuration: 25*60, breakDuration: 5*60 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'tick') {
    remaining--;
    updateBadge(remaining);
    if (remaining <= 0) {
      chrome.alarms.clear('tick');
      playBell();
      notify(mode === FOCUS ? 'Time for a break!' : 'Back to work!');
      // flip modes
      mode = mode === FOCUS ? BREAK : FOCUS;
      remaining = (mode === FOCUS ? getStored('focusDuration') : getStored('breakDuration'));
      chrome.alarms.create('tick', { periodInMinutes: 1/60 });
    }
  }
});

function updateBadge(sec) {
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  chrome.action.setBadgeText({ text: `${m}${s}` });
  chrome.action.setBadgeBackgroundColor({ color: '#e53935' });
}

function notify(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/clock-48.png',
    title: 'Pomodoro',
    message
  });
}

function playBell() {
  const audio = new Audio(chrome.runtime.getURL('sounds/bell.mp3'));
  audio.play();
}

function getStored(key) {
  return new Promise(res =>
    chrome.storage.local.get(key, o => res(o[key]))
  );
}
