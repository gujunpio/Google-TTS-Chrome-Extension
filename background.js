// Chrome TTS — background.js (chrome.tts engine)
// All speech handled here — independent of any tab.

// ── Context Menu ──────────────────────────────────────────────────────────────
function registerContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'speak-selection',
      title: '🔊 Read Selected Text',
      contexts: ['selection']
    });
  });
}
chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  isPlaying: false,
  isPaused:  false,
  queue:        [],
  currentIndex: 0,
  rate:      1.0,
  lang:      null,
  voiceName: null,
  sourceTabId: null,
};

// ── Language Detection (BCP-47 map) ──────────────────────────────────────────
const CLD_TO_BCP47 = {
  'vi': 'vi-VN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN',
  'th': 'th-TH', 'ar': 'ar-SA', 'ru': 'ru-RU', 'hi': 'hi-IN',
  'de': 'de-DE', 'es': 'es-ES', 'fr': 'fr-FR', 'it': 'it-IT',
  'pt': 'pt-BR', 'nl': 'nl-NL', 'pl': 'pl-PL', 'tr': 'tr-TR',
  'id': 'id-ID', 'cs': 'cs-CZ', 'hu': 'hu-HU', 'sv': 'sv-SE',
  'fi': 'fi-FI', 'da': 'da-DK', 'nb': 'nb-NO', 'no': 'nb-NO',
  'el': 'el-GR', 'uk': 'uk-UA', 'fil': 'fil-PH', 'sk': 'sk-SK',
  'ro': 'ro-RO', 'ms': 'ms-MY', 'bn': 'bn-BD', 'he': 'he-IL',
  'en': 'en-US',
};

async function detectLang(text) {
  try {
    const sample = text.slice(0, 500);
    const result = await new Promise(resolve =>
      chrome.i18n.detectLanguage(sample, resolve)
    );
    if (result && result.languages.length > 0) {
      const top = result.languages[0];
      if (top.percentage >= 30) {
        return CLD_TO_BCP47[top.language] || top.language;
      }
    }
  } catch (e) {}
  return 'en-US';
}

// ── Text Chunking ─────────────────────────────────────────────────────────────
function chunkText(text, maxWords = 150) {
  const sentences = text.split(/(?<=[.!?。！？])\s+/);
  const chunks = [];
  let current = '';
  let wordCount = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (wordCount + words > maxWords && current.trim()) {
      chunks.push(current.trim());
      current = sentence + ' ';
      wordCount = words;
    } else {
      current += sentence + ' ';
      wordCount += words;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// ── Voice Resolution ──────────────────────────────────────────────────────────
async function getPreferredVoice(langCode) {
  if (!langCode) return null;
  const voices = await new Promise(resolve => chrome.tts.getVoices(resolve));
  const prefix     = langCode.toLowerCase().replace('_', '-');
  const basePrefix = prefix.split('-')[0];

  const matching = voices.filter(v => {
    const vl = (v.lang || '').toLowerCase().replace('_', '-');
    return vl === prefix || vl.startsWith(prefix + '-') ||
           vl === basePrefix || vl.startsWith(basePrefix + '-');
  });
  if (matching.length === 0) return null;

  const natural = matching.find(v => (v.voiceName || '').includes('Natural'));
  if (natural) return natural.voiceName;
  const google = matching.find(v => (v.voiceName || '').toLowerCase().includes('google'));
  if (google) return google.voiceName;
  return matching[0].voiceName || null;
}

// ── TTS Core ──────────────────────────────────────────────────────────────────
async function startTTS(text, tabId) {
  chrome.tts.stop();

  const settings = await new Promise(r =>
    chrome.storage.sync.get(['voiceName', 'lang', 'rate', 'autoDetect'], r)
  );

  const rate       = parseFloat(settings.rate) || 1.0;
  const autoDetect = settings.autoDetect !== false;

  let lang      = 'en-US';
  let voiceName = null;

  if (autoDetect) {
    lang      = await detectLang(text);
    voiceName = await getPreferredVoice(lang);
    // Prefer saved voice if it matches detected language
    if (settings.voiceName) {
      const voices = await new Promise(resolve => chrome.tts.getVoices(resolve));
      const saved  = voices.find(v => v.voiceName === settings.voiceName);
      if (saved) {
        const savedBase    = (saved.lang || '').toLowerCase().split('-')[0];
        const detectedBase = lang.toLowerCase().split('-')[0];
        if (savedBase === detectedBase) voiceName = settings.voiceName;
      }
    }
  } else {
    voiceName = settings.voiceName || null;
    lang      = settings.lang || 'en-US';
    if (!voiceName) voiceName = await getPreferredVoice(lang);
  }

  const queue = chunkText(text);

  state = {
    isPlaying:    true,
    isPaused:     false,
    queue,
    currentIndex: 0,
    rate,
    lang,
    voiceName,
    sourceTabId: tabId,
  };

  // Tell content script to show the player
  notifyTab({ action: 'ttsStarted', lang, voiceName, total: queue.length });

  playNextChunk();
}

function playNextChunk() {
  if (!state.isPlaying) return;

  if (state.currentIndex >= state.queue.length) {
    state.isPlaying = false;
    state.isPaused  = false;
    notifyTab({ action: 'ttsDone' });
    return;
  }

  const chunk = state.queue[state.currentIndex];

  const options = {
    rate: state.rate,
    lang: state.lang,
    onEvent: (event) => {
      if (event.type === 'end') {
        state.currentIndex++;
        notifyTab({
          action:  'ttsProgress',
          current: state.currentIndex,
          total:   state.queue.length,
        });
        playNextChunk();
      } else if (event.type === 'error') {
        state.currentIndex++;
        playNextChunk();
      }
      // 'cancelled' / 'interrupted' → stop() was called, ignore
    }
  };
  if (state.voiceName) options.voiceName = state.voiceName;

  // Notify UI about current chunk position
  notifyTab({
    action:  'ttsProgress',
    current: state.currentIndex,
    total:   state.queue.length,
  });

  chrome.tts.speak(chunk, options);
}

function pauseTTS() {
  if (state.isPlaying && !state.isPaused) {
    chrome.tts.pause();
    state.isPaused = true;
    notifyTab({ action: 'ttsPaused' });
  }
}

function resumeTTS() {
  if (state.isPlaying && state.isPaused) {
    chrome.tts.resume();
    state.isPaused = false;
    notifyTab({ action: 'ttsResumed' });
  }
}

function stopTTS() {
  chrome.tts.stop();
  state.isPlaying = false;
  state.isPaused  = false;
  notifyTab({ action: 'ttsStopped' });
}

function skipBack() {
  chrome.tts.stop();
  state.currentIndex = Math.max(0, state.currentIndex - 1);
  state.isPaused = false;
  if (state.isPlaying) playNextChunk();
}

function skipForward() {
  chrome.tts.stop();
  state.currentIndex = Math.min(state.currentIndex + 1, state.queue.length - 1);
  state.isPaused = false;
  if (state.isPlaying) playNextChunk();
}

function setRate(rate) {
  state.rate = rate;
  if (state.isPlaying && !state.isPaused) {
    chrome.tts.stop();
    playNextChunk();
  }
}

function notifyTab(message) {
  if (!state.sourceTabId) return;
  chrome.tabs.sendMessage(state.sourceTabId, message).catch(() => {});
}

// ── Context Menu click ────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'speak-selection' || !info.selectionText || !tab?.id) return;
  const text = info.selectionText.trim();
  if (text.length < 3) return;

  // Ensure content script is injected first (for player UI)
  chrome.tabs.sendMessage(tab.id, { action: 'ping' })
    .then(() => startTTS(text, tab.id))
    .catch(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => setTimeout(() => startTTS(text, tab.id), 300))
        .catch(() => {});
    });
});

// ── Message Handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (msg.action) {
    case 'startTTS':
      startTTS(msg.text, tabId);
      break;
    case 'pause':
      pauseTTS();
      break;
    case 'resume':
      resumeTTS();
      break;
    case 'stop':
      stopTTS();
      break;
    case 'skipBack':
      skipBack();
      break;
    case 'skipForward':
      skipForward();
      break;
    case 'setRate':
      setRate(msg.rate);
      break;
    case 'ping':
      sendResponse({ status: 'ok' });
      break;
    case 'getState':
      sendResponse({ ...state });
      break;
  }
  return true;
});
