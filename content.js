// Chrome TTS — content.js
// Full TTS engine using window.speechSynthesis + Shadow DOM Floating Player
// Injected into all pages via manifest content_scripts

(function () {
  'use strict';

  // Guard: prevent double-injection
  if (window.__chromeTTSLoaded) return;
  window.__chromeTTSLoaded = true;

  // ═══════════════════════════════════════════════
  // 1. STATE
  // ═══════════════════════════════════════════════

  let allVoices = [];
  let isPlaying = false;
  let isPaused = false;
  let currentSpeed = 1.0;

  // ═══════════════════════════════════════════════
  // 2. VOICE LOADING — speechSynthesis
  // ═══════════════════════════════════════════════

  function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    // Log for debugging
    console.log('[ChromeTTS] Voices loaded:', allVoices.length,
      allVoices.filter(v => v.name.includes('Natural')).map(v => v.name));
  }

  // CRITICAL: voices load asynchronously. Must use onvoiceschanged.
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  // Also retry after delays (some Chrome versions are slow)
  setTimeout(loadVoices, 500);
  setTimeout(loadVoices, 2000);

  // ═══════════════════════════════════════════════
  // 3. LANGUAGE DETECTION
  // ═══════════════════════════════════════════════

  // ── Language code → display info (flag + short name) ──────────────────────
  const LANG_DISPLAY = {
    'vi-VN': { flag: '\uD83C\uDDFB\uD83C\uDDF3', name: 'Tiếng Việt' },
    'en-US': { flag: '\uD83C\uDDFA\uD83C\uDDF8', name: 'English (US)' },
    'en-GB': { flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'English (UK)' },
    'ja-JP': { flag: '\uD83C\uDDEF\uD83C\uDDF5', name: '日本語' },
    'ko-KR': { flag: '\uD83C\uDDF0\uD83C\uDDF7', name: '한국어' },
    'zh-CN': { flag: '\uD83C\uDDE8\uD83C\uDDF3', name: '中文(简)' },
    'zh-TW': { flag: '\uD83C\uDDF9\uD83C\uDDFC', name: '中文(繁)' },
    'th-TH': { flag: '\uD83C\uDDF9\uD83C\uDDED', name: 'ภาษาไทย' },
    'ar-SA': { flag: '\uD83C\uDDF8\uD83C\uDDE6', name: 'العربية' },
    'ru-RU': { flag: '\uD83C\uDDF7\uD83C\uDDFA', name: 'Русский' },
    'hi-IN': { flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'हिन्दी' },
    'es-ES': { flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Español' },
    'es-MX': { flag: '\uD83C\uDDF2\uD83C\uDDFD', name: 'Español (MX)' },
    'de-DE': { flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'Deutsch' },
    'fr-FR': { flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'Français' },
    'it-IT': { flag: '\uD83C\uDDEE\uD83C\uDDF9', name: 'Italiano' },
    'pt-BR': { flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Português (BR)' },
    'pt-PT': { flag: '\uD83C\uDDF5\uD83C\uDDF9', name: 'Português (PT)' },
    'nl-NL': { flag: '\uD83C\uDDF3\uD83C\uDDF1', name: 'Nederlands' },
    'pl-PL': { flag: '\uD83C\uDDF5\uD83C\uDDF1', name: 'Polski' },
    'tr-TR': { flag: '\uD83C\uDDF9\uD83C\uDDF7', name: 'Türkçe' },
    'id-ID': { flag: '\uD83C\uDDEE\uD83C\uDDE9', name: 'Indonesia' },
  };

  function getLangDisplay(langCode) {
    if (!langCode) return null;
    return LANG_DISPLAY[langCode] || LANG_DISPLAY[langCode.split('-')[0] + '-' + langCode.split('-')[0].toUpperCase()]
           || { flag: '\uD83C\uDF10', name: langCode };
  }

  // ── BCP-47 map: 2-letter CLD code → full locale code ─────────────────────
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

  // ── Language detection: chrome.i18n.detectLanguage (Google CLD3) ────────────
  async function detectLang(text) {
    try {
      const sample = text.slice(0, 500);
      const result = await new Promise(resolve =>
        chrome.i18n.detectLanguage(sample, resolve)
      );
      if (result && result.languages.length > 0) {
        const top = result.languages[0];
        // Chấp nhận kết quả khi percentage >= 30%
        // (isReliable thường = false với text ngắn dù CLD3 đã biết đúng)
        if (top.percentage >= 30) {
          const bcp47 = CLD_TO_BCP47[top.language];
          return bcp47 || top.language;
        }
      }
    } catch (e) {
      // fallback
    }
    return 'en-US';
  }

  // ═══════════════════════════════════════════════
  // 4. VOICE RESOLUTION — Prefer Natural > Google > Others
  // ═══════════════════════════════════════════════

  function getPreferredVoice(langCode) {
    if (!langCode || langCode === 'auto') return null;
    const prefix = langCode.toLowerCase().replace('_', '-');
    const basePrefix = prefix.split('-')[0];

    // Find all matching voices for this language
    const matching = allVoices.filter(v => {
      const vl = (v.lang || '').toLowerCase().replace('_', '-');
      return vl === prefix || vl.startsWith(prefix + '-') ||
             vl === basePrefix || vl.startsWith(basePrefix + '-');
    });
    if (matching.length === 0) return null;

    // Priority: Natural voices first, then Google, then others
    const natural = matching.filter(v => v.name.includes('Natural'));
    if (natural.length > 0) return natural[0];

    const google = matching.filter(v => v.name.toLowerCase().includes('google'));
    if (google.length > 0) return google[0];

    return matching[0];
  }

  // ═══════════════════════════════════════════════
  // 5. TEXT CHUNKING
  // ═══════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════
  // 6. TTS CONTROLLER — using window.speechSynthesis
  // ═══════════════════════════════════════════════

  const TTS = {
    queue: [],
    currentIndex: 0,
    utterance: null,

    _cancelCurrent() {
      if (this.utterance) {
        this.utterance.onend = null;
        this.utterance.onerror = null;
      }
      window.speechSynthesis.cancel();
    },

    async start(text) {
      this.stop();
      if (!text || text.trim().length < 3) return;

      // Ensure voices are loaded
      if (allVoices.length === 0) {
        loadVoices();
        // Wait up to 3s for voices to load
        await new Promise(resolve => {
          let attempts = 0;
          const check = () => {
            loadVoices();
            if (allVoices.length > 0 || attempts++ > 30) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
      }

      // Load settings
      const settings = await new Promise(r => {
        chrome.storage.sync.get(['voiceName', 'lang', 'rate', 'autoDetect'], r);
      });

      const rate = parseFloat(settings.rate) || 1.0;
      currentSpeed = rate;
      const autoDetect = settings.autoDetect !== false;
      const savedVoiceName = settings.voiceName || null;

      // Resolve voice
      let voice = null;
      let lang = null;

      if (autoDetect) {
        const detectedLang = await detectLang(text);
        lang = detectedLang;

        // If saved voice matches detected language, use it
        if (savedVoiceName) {
          const savedVoice = allVoices.find(v => v.name === savedVoiceName);
          if (savedVoice) {
            const savedBase = savedVoice.lang.toLowerCase().split('-')[0];
            const detectedBase = detectedLang.toLowerCase().split('-')[0];
            if (savedBase === detectedBase) {
              voice = savedVoice;
            }
          }
        }

        if (!voice) {
          voice = getPreferredVoice(detectedLang);
        }
      } else {
        // Manual mode
        if (savedVoiceName) {
          voice = allVoices.find(v => v.name === savedVoiceName);
        }
        if (!voice && settings.lang && settings.lang !== 'auto') {
          voice = getPreferredVoice(settings.lang);
        }
        lang = settings.lang || 'en-US';
      }

      // Chunk text
      this.queue = chunkText(text);
      this.currentIndex = 0;
      isPlaying = true;
      isPaused = false;

      // Store resolved voice + rate for playback
      this._voice = voice;
      this._rate = rate;
      this._lang = lang;

      // Show player with detected language info
      showPlayer(text, lang, voice ? voice.name : null);
      setActiveSpeed(rate);

      // Start playback
      this.playNextChunk();
    },

    playNextChunk() {
      if (!isPlaying) return;
      if (this.currentIndex >= this.queue.length) {
        isPlaying = false;
        isPaused = false;
        setStatus('Done ✓');
        setProgress(1, 1);
        const icon = shadow && shadow.getElementById('tts-icon');
        if (icon) { icon.classList.remove('pulse'); icon.textContent = '✓'; }
        setTimeout(() => {
          hidePlayer();
          const icon2 = shadow && shadow.getElementById('tts-icon');
          if (icon2) icon2.textContent = '🔊';
        }, 2200);
        return;
      }

      const chunk = this.queue[this.currentIndex];
      const total = this.queue.length;
      const current = this.currentIndex;

      // Update UI
      setProgress(current, total);
      setStatus(`Reading ${current + 1} / ${total}`);

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (this._voice) utterance.voice = this._voice;
      if (this._lang) utterance.lang = this._lang;
      utterance.rate = this._rate || 1.0;

      utterance.onend = () => {
        this.currentIndex++;
        this.playNextChunk();
      };

      utterance.onerror = (e) => {
        console.warn('[ChromeTTS] Utterance error:', e);
        this.currentIndex++;
        this.playNextChunk();
      };

      this._cancelCurrent();
      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    },

    pause() {
      if (isPlaying && !isPaused) {
        window.speechSynthesis.pause();
        isPaused = true;
        setPauseIcon(true);
        setStatus('Paused');
        const icon = shadow && shadow.getElementById('tts-icon');
        if (icon) icon.classList.remove('pulse');
      }
    },

    resume() {
      if (isPaused) {
        window.speechSynthesis.resume();
        isPaused = false;
        setPauseIcon(false);
        setStatus('Reading...');
        const icon = shadow && shadow.getElementById('tts-icon');
        if (icon) icon.classList.add('pulse');
      }
    },

    stop() {
      this._cancelCurrent();
      isPlaying = false;
      isPaused = false;
      this.queue = [];
      this.currentIndex = 0;
      this.utterance = null;
    },

    setRate(rate) {
      this._rate = parseFloat(rate) || 1.0;
      currentSpeed = this._rate;
      if (isPlaying && !isPaused && this.queue.length > 0) {
        // Restart current chunk with new rate
        this._cancelCurrent();
        setTimeout(() => {
          if (isPlaying) this.playNextChunk();
        }, 80);
      }
    },

    skipBack() {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this._cancelCurrent();
      isPaused = false;
      setPauseIcon(false);
      if (isPlaying) this.playNextChunk();
    },

    skipForward() {
      this.currentIndex = Math.min(this.currentIndex + 1, this.queue.length - 1);
      this._cancelCurrent();
      isPaused = false;
      setPauseIcon(false);
      if (isPlaying) this.playNextChunk();
    }
  };

  // ═══════════════════════════════════════════════
  // 7. FLOATING PLAYER — SHADOW DOM
  // ═══════════════════════════════════════════════

  let playerHost = null;
  let shadow = null;

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

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYER UI FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  function createPlayer() {
    // Kiểm tra playerHost còn gắn vào DOM không (SPA navigation detaches it)
    const mountTarget = document.body || document.documentElement;
    if (playerHost) {
      if (!mountTarget.contains(playerHost)) {
        // playerHost bị detach (SPA navigate) — re-attach
        mountTarget.appendChild(playerHost);
      }
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

    // Fallback: dùng documentElement nếu body chưa sẵn sàng
    try {
      mountTarget.appendChild(playerHost);
    } catch (e) {
      console.warn('[ChromeTTS] Could not mount player:', e);
      return;
    }
    setupPlayerEvents();
  }

  function showPlayer(text, langCode, voiceName) {
    createPlayer();

    // Restore last saved position
    try {
      const pos = JSON.parse(localStorage.getItem('__chromeTTSPos') || 'null');
      if (pos && pos.left !== undefined && pos.top !== undefined) {
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

    // Update preview text (no longer shown, skip)

    // Show language pill
    const pill     = shadow.getElementById('tts-lang-pill');
    const flagEl   = shadow.getElementById('tts-lang-flag');
    const nameEl   = shadow.getElementById('tts-lang-name');
    if (pill && langCode) {
      const info = getLangDisplay(langCode);
      flagEl.textContent = info.flag;
      // Show: flag + lang name + voice short name if available
      const voiceShort = voiceName ? ' · ' + voiceName.replace('Google ', '').replace(' Natural', '★').slice(0, 28) : '';
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
    if (icon) icon.classList.add('pulse');
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
    btns.forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.speed) === speed);
    });
  }

  // ═══════════════════════════════════════════════
  // 8. PLAYER EVENTS
  // ═══════════════════════════════════════════════

  function setupPlayerEvents() {
    // Close
    shadow.getElementById('tts-close').addEventListener('click', () => {
      TTS.stop();
      isPlaying = false;
      isPaused = false;
      hidePlayer();
    });

    // Play/Pause toggle
    shadow.getElementById('tts-playpause').addEventListener('click', () => {
      if (isPaused) TTS.resume();
      else TTS.pause();
    });

    // Skip back
    shadow.getElementById('tts-skipback').addEventListener('click', () => {
      TTS.skipBack();
    });

    // Skip forward
    shadow.getElementById('tts-skipfwd').addEventListener('click', () => {
      TTS.skipForward();
    });

    // Speed buttons
    shadow.getElementById('tts-speeds').addEventListener('click', e => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      const speed = parseFloat(btn.dataset.speed);
      TTS.setRate(speed);
      setActiveSpeed(speed);
    });

    // ── Dragging ──────────────────────────────────────────────────────────────
    let isDragging = false;
    let dragOffX = 0;
    let dragOffY = 0;

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
      const x = Math.max(0, Math.min(e.clientX - dragOffX, window.innerWidth - playerHost.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - dragOffY, window.innerHeight - playerHost.offsetHeight));
      playerHost.style.left   = x + 'px';
      playerHost.style.top    = y + 'px';
      playerHost.style.right  = 'auto';
      playerHost.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      // Save position
      try {
        localStorage.setItem('__chromeTTSPos', JSON.stringify({
          left: playerHost.style.left,
          top:  playerHost.style.top
        }));
      } catch (e) {}
    });
  }

  // ═══════════════════════════════════════════════
  // 9. MESSAGE LISTENER
  // ═══════════════════════════════════════════════

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
      case 'speak':
        TTS.start(msg.text);
        break;
      case 'ping':
        sendResponse({ status: 'ok' });
        break;
    }
    return true;
  });

})();
