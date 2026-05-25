// Chrome TTS — background.js
// Service Worker: creates context menu and relays speak messages to content script

chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'speak-selection',
      title: '🔊 Read Selected Text',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'speak-selection' && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'speak',
      text: info.selectionText
    }).catch(err => {
      // Content script may not be injected yet — inject it manually
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        // Retry after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'speak',
            text: info.selectionText
          }).catch(() => {});
        }, 300);
      }).catch(() => {});
    });
  }
});
