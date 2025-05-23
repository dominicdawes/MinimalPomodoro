// popup.js
// this file does popup logic: controls, storage, messaging
document.addEventListener('DOMContentLoaded', async () => {
  const { focusDuration, breakDuration, theme } = await chrome.storage.local.get(['focusDuration','breakDuration','theme']);
  focusRange.value = focusDuration/60;
  breakRange.value = breakDuration;
  document.body.dataset.theme = theme || 'light';
  themeToggle.checked = theme === 'dark';
  syncLabels();

  focusRange.oninput = () => {
    focusLabel.textContent = focusRange.value;
    chrome.storage.local.set({ focusDuration: focusRange.value * 60 });
  };
  breakRange.oninput = () => {
    breakLabel.textContent = breakRange.value;
    chrome.storage.local.set({ breakDuration: parseInt(breakRange.value) });
  };

  themeToggle.onchange = () => {
    const t = themeToggle.checked ? 'dark' : 'light';
    document.body.dataset.theme = t;
    chrome.storage.local.set({ theme: t });
  };

  reset.onclick = () => chrome.runtime.sendMessage({ action: 'reset' });
  skip.onclick = () => chrome.runtime.sendMessage({ action: 'skip' });
});
