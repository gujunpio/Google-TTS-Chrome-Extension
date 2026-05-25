// Chrome TTS — content.js
// TTS Engine + Shadow DOM Floating Player
// Injected into all pages via manifest content_scripts

(function () {
  'use strict';

  // Guard: prevent double-injection
  if (window.__chromeTTSLoaded) return;
  window.__chromeTTSLoaded = true;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. VOICE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  let allVoices = [];

  function loadVoices() {
    allVoices = speechSynthesis.getVoices();
    if (allVoices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        allVoices = speechSynthesis.getVoices();
      };
    }
  }

  loadVoices();

  /**
   * Returns the best matching voice for a given language code.
   * Prioritizes voices with "Natural" or "Google" in their name.
   */
  function getPreferredVoice(langCode) {
    if (!langCode || langCode === 'auto') return null;
    const prefix = langCode.toLowerCase().replace('_', '-');
    const matching = allVoices.filter(v =>
      v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
    );
    if (matching.length === 0) return null;
    const natural = matching.find(v =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('google')
    );
    return natural || matching[0];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. LANGUAGE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  function detectLang(text) {
    if (/[àáảãạăắặẵẳâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text)) return 'vi';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko';
    if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)) return 'zh-CN';
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    return 'en-US';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TEXT CHUNKING
  // ─────────────────────────────────────────────────────────────────────────────

  function chunkText(text) {
    const MAX_WORDS = 200;
    // Split on sentence-ending punctuation followed by whitespace
    const sentences = text.split(/(?<=[.!?。！？])\s+/);
    const chunks = [];
    let current = '';
    let wordCount = 0;

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).length;
      if (wordCount + words > MAX_WORDS && current.trim()) {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TTS CONTROLLER
  // ─────────────────────────────────────────────────────────────────────────────

  const TTSController = {
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    currentVoice: null,
    currentRate: 1.0,

    // Callbacks
    onProgress: null,
    onEnd: null,
    onChunkStart: null,

    speak(text, voiceName, rate) {
      this.stop();
      if (!text || text.trim().length < 3) return;

      this.currentRate = parseFloat(rate) || 1.0;
      this.queue = chunkText(text);
      this.currentIndex = 0;
      this.isPlaying = true;
      this.isPaused = false;

      // Resolve voice
      this.currentVoice = null;
      if (voiceName) {
        this.currentVoice = allVoices.find(v => v.name === voiceName) || null;
      }

      this._playNext();
    },

    _playNext() {
      if (!this.isPlaying) return;
      if (this.currentIndex >= this.queue.length) {
        this.isPlaying = false;
        if (this.onEnd) this.onEnd();
        return;
      }

      const chunkText = this.queue[this.currentIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);

      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
        utterance.lang = this.currentVoice.lang;
      }
      utterance.rate = this.currentRate;

      utterance.onstart = () => {
        if (this.onChunkStart) this.onChunkStart(this.currentIndex, this.queue.length, chunkText);
      };

      utterance.onend = () => {
        this.currentIndex++;
        if (this.isPlaying) this._playNext();
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        console.warn('[ChromeTTS] Error on chunk', this.currentIndex, ':', e.error);
        this.currentIndex++;
        if (this.isPlaying) this._playNext();
      };

      if (this.onProgress) {
        this.onProgress(this.currentIndex, this.queue.length);
      }

      speechSynthesis.speak(utterance);
    },

    pause() {
      if (this.isPlaying && !this.isPaused) {
        speechSynthesis.pause();
        this.isPaused = true;
      }
    },

    resume() {
      if (this.isPaused) {
        speechSynthesis.resume();
        this.isPaused = false;
      }
    },

    stop() {
      speechSynthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.queue = [];
      this.currentIndex = 0;
    },

    setRate(rate) {
      const newRate = parseFloat(rate) || 1.0;
      this.currentRate = newRate;
      // If currently speaking, cancel and restart this chunk immediately with new rate
      if (this.isPlaying && !this.isPaused && this.queue.length > 0) {
        speechSynthesis.cancel();
        // Small delay lets speechSynthesis.cancel() fully propagate before new speak()
        setTimeout(() => {
          if (this.isPlaying) this._playNext();
        }, 80);
      }
    },

    skipBack() {
      const newIndex = Math.max(0, this.currentIndex - 1);
      speechSynthesis.cancel();
      this.currentIndex = newIndex;
      this.isPaused = false;
      if (this.isPlaying) this._playNext();
    },

    skipForward() {
      speechSynthesis.cancel();
      this.currentIndex = Math.min(this.currentIndex + 1, this.queue.length - 1);
      this.isPaused = false;
      if (this.isPlaying) this._playNext();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. FLOATING PLAYER — SHADOW DOM
  // ─────────────────────────────────────────────────────────────────────────────

  let playerHost = null;
  let shadow = null;
  let currentSpeed = 1.0;

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

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .player {
      width: 320px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(30, 111, 255, 0.22), 0 2px 12px rgba(0, 0, 0, 0.10);
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: ttsSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      user-select: none;
    }

    @keyframes ttsSlideIn {
      from { opacity: 0; transform: translateY(24px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes ttsPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.6; }
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      padding: 13px 15px;
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
      width: 80px; height: 80px;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
      top: -30px; right: 20px;
      pointer-events: none;
    }

    .header:active { cursor: grabbing; }

    .header-left {
      display: flex;
      align-items: center;
      gap: 9px;
      position: relative;
    }

    .header-icon {
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
      backdrop-filter: blur(4px);
    }

    .header-icon.pulse { animation: ttsPulse 1.6s ease-in-out infinite; }

    .header-title {
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .header-status {
      color: rgba(255,255,255,0.78);
      font-size: 11px;
      margin-top: 1px;
      font-weight: 400;
    }

    .close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      width: 28px; height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.2s;
      flex-shrink: 0;
      position: relative;
    }
    .close-btn:hover { background: rgba(255,255,255,0.32); }

    /* ── Body ── */
    .body { padding: 14px 15px 15px; }

    .text-preview {
      font-size: 12px;
      color: #5A6A8A;
      background: #F4F7FF;
      border-radius: 8px;
      padding: 8px 11px;
      margin-bottom: 10px;
      line-height: 1.55;
      max-height: 46px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      border-left: 3px solid #1E6FFF;
      font-style: italic;
    }

    /* ── Progress bar ── */
    .progress-bar {
      height: 3px;
      background: #EBF1FF;
      border-radius: 2px;
      margin-bottom: 13px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1E6FFF 0%, #5B9FFF 100%);
      border-radius: 2px;
      transition: width 0.6s ease;
      width: 0%;
    }

    /* ── Controls ── */
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 13px;
    }

    .ctrl-btn {
      background: #EBF1FF;
      border: none;
      border-radius: 50%;
      width: 38px; height: 38px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
      color: #1E6FFF;
      transition: all 0.18s ease;
    }
    .ctrl-btn:hover {
      background: #D0DCFF;
      transform: scale(1.1);
    }
    .ctrl-btn:active { transform: scale(0.95); }

    .ctrl-btn.primary {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      color: #fff;
      width: 48px; height: 48px;
      font-size: 19px;
      box-shadow: 0 4px 14px rgba(30, 111, 255, 0.38);
    }
    .ctrl-btn.primary:hover {
      box-shadow: 0 6px 18px rgba(30, 111, 255, 0.48);
      transform: scale(1.08);
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: #EBF1FF;
      margin-bottom: 11px;
    }

    /* ── Speed ── */
    .speed-label {
      font-size: 10px;
      font-weight: 600;
      color: #5A6A8A;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      margin-bottom: 7px;
    }

    .speed-btns {
      display: flex;
      gap: 5px;
    }

    .speed-btn {
      flex: 1;
      background: #F4F7FF;
      border: 1.5px solid #D0DCFF;
      border-radius: 7px;
      padding: 6px 0;
      font-size: 11px;
      font-weight: 600;
      color: #5A6A8A;
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: center;
      font-family: inherit;
    }
    .speed-btn:hover {
      border-color: #1E6FFF;
      color: #1E6FFF;
      background: #EBF1FF;
    }
    .speed-btn.active {
      background: linear-gradient(135deg, #1E6FFF 0%, #5B9FFF 100%);
      border-color: #1E6FFF;
      color: #fff;
    }
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
            </div>
          </div>
          <button class="close-btn" id="tts-close" title="Close">✕</button>
        </div>
        <div class="body">
          <div class="text-preview" id="tts-preview"></div>
          <div class="progress-bar">
            <div class="progress-fill" id="tts-progress"></div>
          </div>
          <div class="controls">
            <button class="ctrl-btn" id="tts-skipback" title="Skip back">⏮</button>
            <button class="ctrl-btn primary" id="tts-playpause" title="Pause">⏸</button>
            <button class="ctrl-btn" id="tts-skipfwd" title="Skip forward">⏭</button>
          </div>
          <div class="divider"></div>
          <div class="speed-label">Speed</div>
          <div class="speed-btns" id="tts-speeds">
            <button class="speed-btn" data-speed="0.75">0.75×</button>
            <button class="speed-btn active" data-speed="1">1×</button>
            <button class="speed-btn" data-speed="1.25">1.25×</button>
            <button class="speed-btn" data-speed="1.5">1.5×</button>
            <button class="speed-btn" data-speed="2">2×</button>
          </div>
        </div>
      </div>
    `;
  }

  function createPlayer() {
    if (playerHost) return;

    playerHost = document.createElement('div');
    playerHost.id = 'chrome-tts-host';
    shadow = playerHost.attachShadow({ mode: 'open' });

    // Inject Google Fonts link into shadow
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    shadow.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = PLAYER_CSS;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildPlayerHTML();
    shadow.appendChild(wrapper.firstElementChild);

    document.body.appendChild(playerHost);
    setupPlayerEvents();
  }

  function showPlayer(text) {
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

    // Update preview text
    const preview = shadow.getElementById('tts-preview');
    if (preview) {
      preview.textContent = text.length > 180 ? text.slice(0, 180) + '…' : text;
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

  function setPauseIcon(isPaused) {
    const btn = shadow && shadow.getElementById('tts-playpause');
    if (btn) btn.textContent = isPaused ? '▶' : '⏸';
  }

  function setActiveSpeed(speed) {
    const btns = shadow && shadow.querySelectorAll('.speed-btn');
    if (!btns) return;
    btns.forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.speed) === speed);
    });
  }

  function setupPlayerEvents() {
    // Close
    shadow.getElementById('tts-close').addEventListener('click', () => {
      TTSController.stop();
      hidePlayer();
    });

    // Play / Pause toggle
    shadow.getElementById('tts-playpause').addEventListener('click', () => {
      if (TTSController.isPaused) {
        TTSController.resume();
        setPauseIcon(false);
        setStatus('Reading...');
        const icon = shadow.getElementById('tts-icon');
        if (icon) icon.classList.add('pulse');
      } else {
        TTSController.pause();
        setPauseIcon(true);
        setStatus('Paused');
        const icon = shadow.getElementById('tts-icon');
        if (icon) icon.classList.remove('pulse');
      }
    });

    // Skip back
    shadow.getElementById('tts-skipback').addEventListener('click', () => {
      TTSController.skipBack();
      setPauseIcon(false);
      setStatus('Reading...');
    });

    // Skip forward
    shadow.getElementById('tts-skipfwd').addEventListener('click', () => {
      TTSController.skipForward();
      setPauseIcon(false);
      setStatus('Reading...');
    });

    // Speed buttons
    shadow.getElementById('tts-speeds').addEventListener('click', e => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      currentSpeed = parseFloat(btn.dataset.speed);
      TTSController.setRate(currentSpeed);
      setActiveSpeed(currentSpeed);
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

  // ── TTS Controller Callbacks ─────────────────────────────────────────────────

  TTSController.onProgress = (current, total) => {
    setProgress(current, total);
  };

  TTSController.onChunkStart = (current, total, _text) => {
    setProgress(current, total);
    setStatus(`Reading ${current + 1} / ${total}`);
  };

  TTSController.onEnd = () => {
    setStatus('Done ✓');
    setPauseIcon(false);
    setProgress(1, 1);
    const icon = shadow && shadow.getElementById('tts-icon');
    if (icon) {
      icon.classList.remove('pulse');
      icon.textContent = '✓';
    }
    setTimeout(() => {
      hidePlayer();
      if (shadow) {
        const icon2 = shadow.getElementById('tts-icon');
        if (icon2) icon2.textContent = '🔊';
      }
    }, 2200);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. MAIN MESSAGE LISTENER
  // ─────────────────────────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action !== 'speak') return;
    const text = (msg.text || '').trim();
    if (text.length < 3) return;

    // Check TTS support
    if (!window.speechSynthesis) {
      alert('Your browser does not support Text-to-Speech.');
      return;
    }

    chrome.storage.sync.get(['voiceName', 'lang', 'rate', 'autoDetect'], (settings) => {
      const rate = parseFloat(settings.rate) || 1.0;
      currentSpeed = rate;

      let voiceName = null;
      const savedVoiceName = settings.voiceName || null;
      const autoDetect = settings.autoDetect !== false; // default true

      if (autoDetect) {
        // Detect language from the text content
        const detectedLang = detectLang(text);
        const detectedPrefix = detectedLang.toLowerCase().replace('_', '-').split('-')[0];

        if (savedVoiceName) {
          // Check if the user's chosen voice matches the detected language
          const savedVoice = allVoices.find(v => v.name === savedVoiceName);
          const savedLangPrefix = savedVoice
            ? savedVoice.lang.toLowerCase().replace('_', '-').split('-')[0]
            : '';

          if (savedVoice && savedLangPrefix === detectedPrefix) {
            // ✅ User's saved voice matches the detected language → honor their choice
            voiceName = savedVoiceName;
          } else {
            // ⚡ Detected language differs from saved voice → auto-pick best for detected lang
            const autoVoice = getPreferredVoice(detectedLang);
            if (autoVoice) voiceName = autoVoice.name;
          }
        } else {
          // No voice saved yet → auto-pick best for detected language
          const autoVoice = getPreferredVoice(detectedLang);
          if (autoVoice) voiceName = autoVoice.name;
        }

      } else {
        // Auto-detect OFF → always use exactly the voice the user selected
        voiceName = savedVoiceName;
        // Fallback only if no voice has been selected yet
        if (!voiceName && settings.lang && settings.lang !== 'auto') {
          const fallbackVoice = getPreferredVoice(settings.lang);
          if (fallbackVoice) voiceName = fallbackVoice.name;
        }
      }

      showPlayer(text);

      const startSpeaking = () => {
        TTSController.speak(text, voiceName, rate);
      };

      if (allVoices.length === 0) {
        setStatus('Loading voices…');
        let retries = 0;
        const interval = setInterval(() => {
          allVoices = speechSynthesis.getVoices();
          retries++;
          if (allVoices.length > 0 || retries >= 10) {
            clearInterval(interval);
            startSpeaking();
          }
        }, 500);
      } else {
        startSpeaking();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. TAB VISIBILITY — Pause when tab is hidden
  // ─────────────────────────────────────────────────────────────────────────────

  document.addEventListener('visibilitychange', () => {
    if (!TTSController.isPlaying) return;
    if (document.hidden) {
      if (!TTSController.isPaused) {
        TTSController.pause();
        setStatus('Paused (tab inactive)');
        setPauseIcon(true);
        const icon = shadow && shadow.getElementById('tts-icon');
        if (icon) icon.classList.remove('pulse');
      }
    } else {
      if (TTSController.isPaused) {
        TTSController.resume();
        setStatus('Reading...');
        setPauseIcon(false);
        const icon = shadow && shadow.getElementById('tts-icon');
        if (icon) icon.classList.add('pulse');
      }
    }
  });

})();
