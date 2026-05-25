# Chrome TTS — Natural Voice Text Reader

> A free, privacy-first Chrome Extension that reads selected text aloud using Chrome's built-in Natural voices. No API keys. No cloud. No tracking.

![Chrome TTS](icons/icon-128.png)

---

## ✨ Features

- 🔊 **Right-click to read** — Select any text, right-click → *Read Selected Text*
- 🌍 **43 languages supported** — Auto-detect or manually pick your language & country
- 🎙️ **Natural voices** — Uses Chrome's built-in Google Neural TTS voices (same as Chrome Reading Mode)
- 🎛️ **Floating Player** — Beautiful draggable player with pause/resume/skip/speed controls
- 💾 **Remembers position** — Player snaps back to where you left it
- ⚡ **Instant speed change** — Adjust speed mid-sentence and it takes effect immediately
- 🔒 **100% Private** — All processing is local in your browser. Zero data sent anywhere.
- 📴 **Works offline** — No internet required (voices are built into Chrome)

---

## 🖥️ Screenshots

### Popup Settings
Clean blue/white modern UI with language picker grouped by country flag.

### Floating Player
Draggable mini-player that appears on the page with play/pause, skip, and speed controls.

---

## 🚀 Installation (Developer Mode)

Until this extension is published on the Chrome Web Store:

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the project folder
6. The 🔊 Chrome TTS icon will appear in your toolbar

---

## 📖 How to Use

1. **Select any text** on a webpage
2. **Right-click** → choose **🔊 Read Selected Text**
3. A floating player appears — use it to:
   - ⏸ Pause / ▶ Resume
   - ⏮ Skip back to previous sentence
   - ⏭ Skip to next sentence
   - Change speed: `0.75×` `1×` `1.25×` `1.5×` `2×`
   - Drag the player anywhere on screen
4. Player **auto-hides** when reading finishes

---

## ⚙️ Settings (Popup)

Click the extension icon in the toolbar to open settings:

| Setting | Description |
|---------|-------------|
| **Auto-detect Language** | Automatically detects Vietnamese, Japanese, Korean, Chinese, Arabic, Thai, Russian, Hindi, and English from the selected text |
| **Language / Country** | Manually pick a language, grouped by country with flag emoji |
| **Voice** | Choose a specific voice — Google Neural voices marked with ★ appear first |
| **Reading Speed** | Drag the slider from 0.5× (slow) to 2× (fast) |
| **Preview** | Listen to a sample sentence in the selected language |

---

## 🌍 Supported Languages

The extension shows only languages for which your Chrome has installed voices.

| Tier | Languages |
|------|-----------|
| **Full (5–10 voices)** | 🇺🇸 English (US), 🇬🇧 English (UK), 🇻🇳 Vietnamese |
| **Good (2–3 voices)** | 🇩🇪 German, 🇫🇷 French, 🇯🇵 Japanese, 🇰🇷 Korean, 🇨🇳 Chinese, 🇧🇷 Portuguese, 🇮🇹 Italian, 🇪🇸 Spanish |
| **Basic (1 voice)** | 🇮🇩 Indonesian, 🇹🇭 Thai, 🇷🇺 Russian, 🇹🇷 Turkish, 🇳🇱 Dutch, 🇵🇱 Polish, 🇸🇦 Arabic, 🇮🇳 Hindi, and 15+ more |

> Voice quality and quantity depend on which voices Google has installed with your version of Chrome.

---

## 🏗️ Project Structure

```
chrome-tts/
├── manifest.json     — Manifest V3, permissions, service worker config
├── background.js     — Creates context menu, relays messages to content script
├── content.js        — TTS engine + Shadow DOM floating player (injected into all pages)
├── popup.html        — Settings UI (blue/white modern theme, Inter font)
├── popup.js          — Language picker, voice selector, speed slider, preview
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

---

## 🔧 Technical Details

### Architecture

```
User selects text → Right-click → Context Menu
    → background.js captures selectionText
        → Sends message to content.js
            → Reads chrome.storage.sync (voice, rate, lang, autoDetect)
                → Detects language (if autoDetect ON)
                    → Chunks text into ≤200-word segments
                        → Queues SpeechSynthesisUtterances
                            → Plays sequentially via Web Speech API
                                → Floating Player shows progress
```

### Key Technologies

| Component | Technology |
|-----------|-----------|
| **TTS Engine** | `window.speechSynthesis` (Web Speech API) |
| **Floating Player** | Shadow DOM (zero CSS conflict with host page) |
| **Settings Storage** | `chrome.storage.sync` (synced across devices) |
| **Language Detection** | Unicode character range analysis (no API) |
| **Extension Manifest** | Manifest V3 |

### Voice Selection Logic

1. **Auto-detect ON** (default): Detect language from text → if user's saved voice matches detected language, use it; otherwise auto-pick best Google Neural voice for detected language
2. **Auto-detect OFF**: Always use exactly the voice the user selected in popup settings

### Text Chunking

Long texts are split at sentence boundaries (`.`, `!`, `?`, `。`, `！`, `？`) into chunks of max 200 words. This ensures smooth playback and allows skip-back/forward at the sentence level.

---

## 🔒 Privacy

- ✅ **No external requests** — The extension never sends your text to any server
- ✅ **No tracking** — No analytics, no telemetry
- ✅ **Minimal permissions** — Only `contextMenus`, `storage`, `activeTab`, `scripting`
- ✅ **Open source** — Full source code available here

---

## 🛣️ Roadmap

- [x] v1.0 — Core TTS with floating player and settings popup
- [ ] v1.1 — OS-level voice pack install guide for unsupported languages
- [ ] v1.2 — Keyboard shortcut to trigger reading
- [ ] v1.5 — Highlight text as it's being read (word-level sync)
- [ ] v2.0 — Optional premium voices via ElevenLabs / Google Cloud TTS API

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## ⭐ Acknowledgements

- Voices provided by Chrome's built-in Web Speech API (Google Neural TTS)
- Extension built with Manifest V3, Shadow DOM, and vanilla JavaScript — no dependencies
- UI design: Inter font, blue/white modern theme

---

*Made with ❤️ for people who prefer to listen rather than read.*
