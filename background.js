// Chrome TTS — background.js
// Service Worker: thin relay between context menu and content script.
// All TTS logic lives in content.js using window.speechSynthesis.

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'speak-selection',
      title: '🔊 Read Selected Text',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'speak-selection' || !info.selectionText || !tab?.id) return;
  const text = info.selectionText.trim();
  if (text.length < 3) return;

  const doSpeak = () => {
    chrome.tabs.sendMessage(tab.id, { action: 'speak', text });
  };

  // Ping to check if content script is loaded
  chrome.tabs.sendMessage(tab.id, { action: 'ping' }).then(() => {
    doSpeak();
  }).catch(() => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      setTimeout(doSpeak, 300);
    }).catch(() => {});
  });
});
