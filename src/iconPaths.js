// iconPaths.js
// (MUST be loaded *before* popup.js via <script> tags in popup.html)
window.ICON_PATHS = {
  clock16: chrome.runtime.getURL('icons/clock-16.png'),
  clock48: chrome.runtime.getURL('icons/clock-48.png'),
  eye:     chrome.runtime.getURL('icons/fluent-eye-16-regular.svg'),
  reset:   chrome.runtime.getURL('icons/fluent-arrow-counterclockwise-16-regular.svg'),
  back:    chrome.runtime.getURL('icons/fluent-chevron-left-16-regular.svg'),
  forward: chrome.runtime.getURL('icons/fluent-chevron-right-16-regular.svg'),
  plus:    chrome.runtime.getURL('icons/fluent-add-16-regular.svg'),
  minus:   chrome.runtime.getURL('icons/fluent-subtract-16-regular.svg'),
  settings:chrome.runtime.getURL('icons/fluent-settings-20-regular.svg'),
  coffee:  chrome.runtime.getURL('icons/fluent-drink-coffee-16-regular.svg')
};