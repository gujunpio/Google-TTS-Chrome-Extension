# 🔊 Chrome TTS — Natural Voice Reader

> Select text. Right-click. Listen. Powered by Chrome's built-in Neural voices — no API keys, no cloud, no tracking.

---

## ✨ What makes it special

| | |
|---|---|
| 🧠 **Smart Language Detection** | Google CLD3 engine auto-detects 33+ languages — same tech powering Google Translate |
| 🔊 **Natural Neural Voices** | Uses Chrome's highest-quality built-in voices, same as Chrome Reading Mode |
| 🌐 **Tab-Independent Audio** | Powered by `chrome.tts` API — audio **continues playing when you switch tabs** |
| 🎛️ **Floating Mini Player** | Drag anywhere · Pause · Skip · Speed · Shows detected language flag |
| 🔒 **100% Private** | Everything runs locally in your browser. Zero data sent anywhere. |

---

## 🚀 Quick Start

```
1. Load unpacked in chrome://extensions (Developer Mode)
2. Select any text on a webpage
3. Right-click → 🔊 Read Selected Text
```

> **For Natural voices:** Pin *Reading Mode* to your toolbar once — the extension walks you through it.

---

## 🌍 Supported Languages (33+)

`🇻🇳 Vietnamese` `🇺🇸 English` `🇬🇧 English UK` `🇩🇪 German` `🇫🇷 French` `🇪🇸 Spanish`  
`🇮🇹 Italian` `🇧🇷 Portuguese` `🇳🇱 Dutch` `🇵🇱 Polish` `🇹🇷 Turkish` `🇮🇩 Indonesian`  
`🇯🇵 Japanese` `🇰🇷 Korean` `🇨🇳 Chinese` `🇷🇺 Russian` `🇸🇦 Arabic` `🇮🇳 Hindi`  
`🇹🇭 Thai` `🇨🇿 Czech` `🇭🇺 Hungarian` `🇸🇪 Swedish` `🇫🇮 Finnish` `🇩🇰 Danish`  
`🇬🇷 Greek` `🇺🇦 Ukrainian` `🇳🇴 Norwegian` `🇸🇰 Slovak` `🇷🇴 Romanian` `🇲🇾 Malay` and more

---

## 🏗️ Architecture

```
Right-click / Popup button
        │
        ▼
  content.js (UI only)
  ─ Shadow DOM floating player
  ─ Language pill: 🇩🇪 Deutsch · Google★
  ─ Relays control messages
        │
        ▼
  background.js  ←── chrome.tts API
  ─ Language detection (Google CLD3)
  ─ Voice resolution (Natural > Google > default)
  ─ Text chunking + playback queue
  ─ State: play / pause / skip / rate
  ─ Tab-independent: survives tab switching
```

**Key design decisions:**
- `chrome.tts` runs in the **Service Worker** — audio is not tied to any tab's DOM
- Shadow DOM player — **zero CSS conflicts** with host pages, works on CNN, elpais, and any CSP-restricted site
- No bundler, no npm, no dependencies — pure Manifest V3 vanilla JS

---

## ⚙️ Settings

| | |
|---|---|
| **Auto-detect Language** | On by default — uses Chrome's CLD3 engine |
| **Manual Language / Voice** | Full dropdown with country flags + voice quality labels |
| **Reading Speed** | 0.5× to 2× with live slider |
| **Preview Voice** | Test any voice before using it |
| **Quick Setup Guide** | Built-in collapsible guide to unlock Natural voices |

---

## 🔒 Privacy

- ✅ No external requests — text never leaves your browser
- ✅ No analytics or telemetry
- ✅ Permissions: `contextMenus` `storage` `activeTab` `scripting` `tts`
- ✅ Full source code — inspect everything

---

## 🛣️ Roadmap

- [x] v1.0 — Core TTS, floating player, settings
- [x] v1.1 — `chrome.tts` migration, tab-independent audio
- [x] v1.1 — Google CLD3 language detection, 33+ languages
- [x] v1.1 — Compact player UI, CSP/SPA bug fixes
- [ ] v1.2 — Keyboard shortcut
- [ ] v1.3 — Word-level highlight sync
- [ ] v2.0 — Optional cloud voices (ElevenLabs / Google Cloud TTS)

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with Manifest V3 · Shadow DOM · Vanilla JS · No dependencies*  
*Made with ❤️ for people who prefer to listen.*
