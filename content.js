// Chrome TTS — content.js
// UI-only: Shadow DOM floating player.
// All TTS speech handled by background.js via chrome.tts API.

(function () {
  'use strict';

  if (window.__chromeTTSLoaded) return;
  window.__chromeTTSLoaded = true;

  // ── UI state (for button rendering only) ─────────────────────────────────
  let isPlaying  = false;
  let isPaused   = false;
  let currentSpeed = 1.0;
  let playerHost = null;
  let shadow     = null;

  // ── Language display map ──────────────────────────────────────────────────
  const LANG_DISPLAY = {
    'vi-VN': { flag: '🇻🇳', name: 'Tiếng Việt' },
    'en-US': { flag: '🇺🇸', name: 'English (US)' },
    'en-GB': { flag: '🇬🇧', name: 'English (UK)' },
    'ja-JP': { flag: '🇯🇵', name: '日本語' },
    'ko-KR': { flag: '🇰🇷', name: '한국어' },
    'zh-CN': { flag: '🇨🇳', name: '中文(简)' },
    'zh-TW': { flag: '🇹🇼', name: '中文(繁)' },
    'th-TH': { flag: '🇹🇭', name: 'ภาษาไทย' },
    'ar-SA': { flag: '🇸🇦', name: 'العربية' },
    'ru-RU': { flag: '🇷🇺', name: 'Русский' },
    'hi-IN': { flag: '🇮🇳', name: 'हिन्दी' },
    'es-ES': { flag: '🇪🇸', name: 'Español' },
    'es-MX': { flag: '🇲🇽', name: 'Español (MX)' },
    'de-DE': { flag: '🇩🇪', name: 'Deutsch' },
    'fr-FR': { flag: '🇫🇷', name: 'Français' },
    'it-IT': { flag: '🇮🇹', name: 'Italiano' },
    'pt-BR': { flag: '🇧🇷', name: 'Português (BR)' },
    'pt-PT': { flag: '🇵🇹', name: 'Português (PT)' },
    'nl-NL': { flag: '🇳🇱', name: 'Nederlands' },
    'pl-PL': { flag: '🇵🇱', name: 'Polski' },
    'tr-TR': { flag: '🇹🇷', name: 'Türkçe' },
    'id-ID': { flag: '🇮🇩', name: 'Indonesia' },
    'cs-CZ': { flag: '🇨🇿', name: 'Čeština' },
    'hu-HU': { flag: '🇭🇺', name: 'Magyar' },
    'sv-SE': { flag: '🇸🇪', name: 'Svenska' },
    'fi-FI': { flag: '🇫🇮', name: 'Suomi' },
    'da-DK': { flag: '🇩🇰', name: 'Dansk' },
    'el-GR': { flag: '🇬🇷', name: 'Ελληνικά' },
    'uk-UA': { flag: '🇺🇦', name: 'Українська' },
    'nb-NO': { flag: '🇳🇴', name: 'Norsk' },
    'sk-SK': { flag: '🇸🇰', name: 'Slovenčina' },
    'ro-RO': { flag: '🇷🇴', name: 'Română' },
    'ms-MY': { flag: '🇲🇾', name: 'Melayu' },
    'he-IL': { flag: '🇮🇱', name: 'עברית' },
  };

  function getLangDisplay(langCode) {
    if (!langCode) return null;
    return LANG_DISPLAY[langCode] || { flag: '🌐', name: langCode };
  }

  // ── Player CSS ─────────────────────────────────────────────────────────────
  const PLAYER_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      bottom: 24px;
      right: 24px;
      display: block;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .player {
      width: 260px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(30, 111, 255, 0.22), 0 2px 12px rgba(0,0,0,0.10);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: ttsSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      user-select: none;
    }

    @keyframes ttsSlideIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes ttsPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.55; }
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: grab;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      width: 60px; height: 60px;
      background: rgba(255,255,255,0.07);
      border-radius: 50%;
      top: -20px; right: 14px;
      pointer-events: none;
    }
    .header:active { cursor: grabbing; }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon {
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .header-icon.pulse { animation: ttsPulse 1.6s ease-in-out infinite; }

    .header-title {
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.2px;
      line-height: 1.2;
    }
    .header-status {
      color: rgba(255,255,255,0.75);
      font-size: 10px;
      font-weight: 400;
      line-height: 1.3;
    }

    .close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      width: 24px; height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      font-weight: 700;
      transition: background 0.18s;
      flex-shrink: 0;
    }
    .close-btn:hover { background: rgba(255,255,255,0.30); }

    /* ── Progress ── */
    .progress-bar {
      height: 3px;
      background: #EBF1FF;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1E6FFF 0%, #5B9FFF 100%);
      transition: width 0.6s ease;
      width: 0%;
    }

    /* ── Body ── */
    .body { padding: 10px 12px 12px; }

    /* ── Controls ── */
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .ctrl-btn {
      background: #EBF1FF;
      border: none;
      border-radius: 50%;
      width: 34px; height: 34px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      color: #1E6FFF;
      transition: all 0.16s ease;
    }
    .ctrl-btn:hover { background: #D0DCFF; transform: scale(1.08); }
    .ctrl-btn:active { transform: scale(0.93); }

    .ctrl-btn.primary {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      color: #fff;
      width: 44px; height: 44px;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(30, 111, 255, 0.35);
    }
    .ctrl-btn.primary:hover {
      box-shadow: 0 6px 16px rgba(30, 111, 255, 0.45);
      transform: scale(1.06);
    }

    /* ── Speed ── */
    .speed-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .speed-label {
      font-size: 9px;
      font-weight: 700;
      color: #8A9ABB;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      flex-shrink: 0;
    }
    .speed-btns {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .speed-btn {
      flex: 1;
      background: #F4F7FF;
      border: 1.5px solid #D0DCFF;
      border-radius: 6px;
      padding: 4px 0;
      font-size: 10px;
      font-weight: 600;
      color: #5A6A8A;
      cursor: pointer;
      transition: all 0.16s ease;
      text-align: center;
      font-family: inherit;
    }
    .speed-btn:hover { border-color: #1E6FFF; color: #1E6FFF; background: #EBF1FF; }
    .speed-btn.active {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      border-color: #1E6FFF;
      color: #fff;
    }

    /* ── Lang pill ── */
    .lang-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 1px 6px 1px 4px;
      font-size: 9px;
      font-weight: 600;
      color: rgba(255,255,255,0.88);
      margin-top: 2px;
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lang-pill-flag { font-size: 11px; line-height: 1; }
  `;

  // ── Player HTML ────────────────────────────────────────────────────────────
  function buildPlayerHTML() {
    return `
      <div class="player" id="tts-player">
        <div class="header" id="tts-header">
          <div class="header-left">
            <div class="header-icon pulse" id="tts-icon">🔊</div>
            <div>
              <div class="header-title">Chrome TTS</div>
              <div class="header-status" id="tts-status">Reading...</div>
              <div class="lang-pill" id="tts-lang-pill" style="display:none">
                <span class="lang-pill-flag" id="tts-lang-flag"></span>
                <span id="tts-lang-name"></span>
              </div>
            </div>
          </div>
          <button class="close-btn" id="tts-close" title="Close">✕</button>
        </div>
        <div class="progress-bar"><div class="progress-fill" id="tts-progress"></div></div>
        <div class="body">
          <div class="controls">
            <button class="ctrl-btn" id="tts-skipback" title="Skip back">⏮</button>
            <button class="ctrl-btn primary" id="tts-playpause" title="Pause">⏸</button>
            <button class="ctrl-btn" id="tts-skipfwd" title="Skip forward">⏭</button>
          </div>
          <div class="speed-row">
            <span class="speed-label">Speed</span>
            <div class="speed-btns" id="tts-speeds">
              <button class="speed-btn" data-speed="0.75">0.75×</button>
              <button class="speed-btn active" data-speed="1">1×</button>
              <button class="speed-btn" data-speed="1.25">1.25×</button>
              <button class="speed-btn" data-speed="1.5">1.5×</button>
              <button class="speed-btn" data-speed="2">2×</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Player DOM ─────────────────────────────────────────────────────────────
  function createPlayer() {
    const mountTarget = document.body || document.documentElement;
    if (playerHost) {
      if (!mountTarget.contains(playerHost)) mountTarget.appendChild(playerHost);
      return;
    }
    playerHost = document.createElement('div');
    playerHost.id = 'chrome-tts-host';
    shadow = playerHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PLAYER_CSS;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildPlayerHTML();
    shadow.appendChild(wrapper.firstElementChild);

    try { mountTarget.appendChild(playerHost); } catch (e) {
      console.warn('[ChromeTTS] Mount failed:', e);
      return;
    }
    setupPlayerEvents();
  }

  function showPlayer(langCode, voiceName) {
    createPlayer();

    // Restore saved position
    try {
      const pos = JSON.parse(localStorage.getItem('__chromeTTSPos') || 'null');
      if (pos && pos.left !== undefined) {
        playerHost.style.left   = pos.left;
        playerHost.style.top    = pos.top;
        playerHost.style.right  = 'auto';
        playerHost.style.bottom = 'auto';
      } else {
        playerHost.style.right  = '24px';
        playerHost.style.bottom = '24px';
        playerHost.style.left   = 'auto';
        playerHost.style.top    = 'auto';
      }
    } catch (e) {
      playerHost.style.right  = '24px';
      playerHost.style.bottom = '24px';
    }

    // Language pill
    const pill   = shadow.getElementById('tts-lang-pill');
    const flagEl = shadow.getElementById('tts-lang-flag');
    const nameEl = shadow.getElementById('tts-lang-name');
    if (pill && langCode) {
      const info = getLangDisplay(langCode);
      flagEl.textContent = info.flag;
      const voiceShort = voiceName
        ? ' · ' + voiceName.replace('Google ', '').replace(' Natural', '★').slice(0, 24)
        : '';
      nameEl.textContent = info.name + voiceShort;
      pill.style.display = 'inline-flex';
    } else if (pill) {
      pill.style.display = 'none';
    }

    playerHost.style.display = 'block';
    setStatus('Reading...');
    setProgress(0, 1);
    setActiveSpeed(currentSpeed);
    setPauseIcon(false);

    const icon = shadow.getElementById('tts-icon');
    if (icon) { icon.classList.add('pulse'); icon.textContent = '🔊'; }
  }

  function hidePlayer() {
    if (playerHost) playerHost.style.display = 'none';
    const icon = shadow && shadow.getElementById('tts-icon');
    if (icon) icon.classList.remove('pulse');
  }

  function setStatus(text) {
    const el = shadow && shadow.getElementById('tts-status');
    if (el) el.textContent = text;
  }

  function setProgress(current, total) {
    const el = shadow && shadow.getElementById('tts-progress');
    if (!el) return;
    const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;
    el.style.width = pct + '%';
  }

  function setPauseIcon(paused) {
    const btn = shadow && shadow.getElementById('tts-playpause');
    if (btn) btn.textContent = paused ? '▶' : '⏸';
  }

  function setActiveSpeed(speed) {
    const btns = shadow && shadow.querySelectorAll('.speed-btn');
    if (!btns) return;
    btns.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === speed));
  }

  // ── Player Events → send to background ────────────────────────────────────
  function setupPlayerEvents() {
    // Close
    shadow.getElementById('tts-close').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stop' });
      hidePlayer();
      isPlaying = false;
      isPaused  = false;
    });

    // Play / Pause
    shadow.getElementById('tts-playpause').addEventListener('click', () => {
      if (isPaused) chrome.runtime.sendMessage({ action: 'resume' });
      else          chrome.runtime.sendMessage({ action: 'pause' });
    });

    // Skip back
    shadow.getElementById('tts-skipback').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'skipBack' });
    });

    // Skip forward
    shadow.getElementById('tts-skipfwd').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'skipForward' });
    });

    // Speed buttons
    shadow.getElementById('tts-speeds').addEventListener('click', e => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      const speed = parseFloat(btn.dataset.speed);
      currentSpeed = speed;
      setActiveSpeed(speed);
      chrome.runtime.sendMessage({ action: 'setRate', rate: speed });
    });

    // ── Drag ──────────────────────────────────────────────────────────────
    let isDragging = false, dragOffX = 0, dragOffY = 0;
    const header = shadow.getElementById('tts-header');

    header.addEventListener('mousedown', e => {
      isDragging = true;
      const rect = playerHost.getBoundingClientRect();
      dragOffX = e.clientX - rect.left;
      dragOffY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const x = Math.max(0, Math.min(e.clientX - dragOffX, window.innerWidth  - playerHost.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - dragOffY, window.innerHeight - playerHost.offsetHeight));
      playerHost.style.left   = x + 'px';
      playerHost.style.top    = y + 'px';
      playerHost.style.right  = 'auto';
      playerHost.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      try {
        localStorage.setItem('__chromeTTSPos', JSON.stringify({
          left: playerHost.style.left,
          top:  playerHost.style.top
        }));
      } catch (e) {}
    });
  }

  // ── Message listener (from background + popup) ────────────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {

      // ── Relay: popup or another content script triggered speak ────────────
      case 'speak':
        chrome.runtime.sendMessage({ action: 'startTTS', text: msg.text });
        break;

      // ── Background → UI state updates ─────────────────────────────────────
      case 'ttsStarted':
        isPlaying = true;
        isPaused  = false;
        showPlayer(msg.lang, msg.voiceName);
        setStatus(`Reading 1 / ${msg.total}`);
        setProgress(0, msg.total);
        break;

      case 'ttsProgress':
        setStatus(`Reading ${msg.current + 1} / ${msg.total}`);
        setProgress(msg.current, msg.total);
        break;

      case 'ttsPaused':
        isPaused = true;
        setPauseIcon(true);
        setStatus('Paused');
        const iconP = shadow && shadow.getElementById('tts-icon');
        if (iconP) iconP.classList.remove('pulse');
        break;

      case 'ttsResumed':
        isPaused = false;
        setPauseIcon(false);
        setStatus('Reading...');
        const iconR = shadow && shadow.getElementById('tts-icon');
        if (iconR) iconR.classList.add('pulse');
        break;

      case 'ttsDone':
        isPlaying = false;
        isPaused  = false;
        setStatus('Done ✓');
        setProgress(1, 1);
        const iconD = shadow && shadow.getElementById('tts-icon');
        if (iconD) { iconD.classList.remove('pulse'); iconD.textContent = '✓'; }
        setTimeout(() => {
          hidePlayer();
          const icon2 = shadow && shadow.getElementById('tts-icon');
          if (icon2) icon2.textContent = '🔊';
        }, 2200);
        break;

      case 'ttsStopped':
        isPlaying = false;
        isPaused  = false;
        hidePlayer();
        break;

      case 'ping':
        sendResponse({ status: 'ok' });
        break;
    }
    return true;
  });

})();
