// Chrome TTS — popup.js
// Settings UI logic: language picker, voice picker, speed, preview, storage

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE MAP — country flag + name + voice language prefixes
// Only languages with available voices will be shown in the dropdown.
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGE_MAP = [
  { code: 'auto',  flag: '🌐', name: 'Auto-detect',              prefixes: [] },
  { code: 'vi',    flag: '🇻🇳', name: 'Vietnamese',              prefixes: ['vi'] },
  { code: 'en-US', flag: '🇺🇸', name: 'English (United States)', prefixes: ['en-US', 'en_US'] },
  { code: 'en-GB', flag: '🇬🇧', name: 'English (United Kingdom)',prefixes: ['en-GB', 'en_GB'] },
  { code: 'en-AU', flag: '🇦🇺', name: 'English (Australia)',     prefixes: ['en-AU', 'en_AU'] },
  { code: 'en-IN', flag: '🇮🇳', name: 'English (India)',         prefixes: ['en-IN', 'en_IN'] },
  { code: 'fr-FR', flag: '🇫🇷', name: 'French (France)',         prefixes: ['fr-FR', 'fr_FR', 'fr'] },
  { code: 'fr-CA', flag: '🇨🇦', name: 'French (Canada)',         prefixes: ['fr-CA', 'fr_CA'] },
  { code: 'de-DE', flag: '🇩🇪', name: 'German (Germany)',        prefixes: ['de-DE', 'de_DE', 'de'] },
  { code: 'es-ES', flag: '🇪🇸', name: 'Spanish (Spain)',         prefixes: ['es-ES', 'es_ES'] },
  { code: 'es-MX', flag: '🇲🇽', name: 'Spanish (Mexico)',        prefixes: ['es-MX', 'es_MX'] },
  { code: 'es-US', flag: '🇺🇸', name: 'Spanish (US)',            prefixes: ['es-US', 'es_US'] },
  { code: 'it-IT', flag: '🇮🇹', name: 'Italian (Italy)',         prefixes: ['it-IT', 'it_IT', 'it'] },
  { code: 'pt-BR', flag: '🇧🇷', name: 'Portuguese (Brazil)',     prefixes: ['pt-BR', 'pt_BR'] },
  { code: 'pt-PT', flag: '🇵🇹', name: 'Portuguese (Portugal)',   prefixes: ['pt-PT', 'pt_PT'] },
  { code: 'nl-NL', flag: '🇳🇱', name: 'Dutch (Netherlands)',     prefixes: ['nl-NL', 'nl_NL', 'nl'] },
  { code: 'pl-PL', flag: '🇵🇱', name: 'Polish (Poland)',         prefixes: ['pl-PL', 'pl_PL', 'pl'] },
  { code: 'ru-RU', flag: '🇷🇺', name: 'Russian (Russia)',        prefixes: ['ru-RU', 'ru_RU', 'ru'] },
  { code: 'uk-UA', flag: '🇺🇦', name: 'Ukrainian (Ukraine)',     prefixes: ['uk-UA', 'uk_UA', 'uk'] },
  { code: 'cs-CZ', flag: '🇨🇿', name: 'Czech (Czech Republic)',  prefixes: ['cs-CZ', 'cs_CZ', 'cs'] },
  { code: 'sk-SK', flag: '🇸🇰', name: 'Slovak (Slovakia)',       prefixes: ['sk-SK', 'sk_SK', 'sk'] },
  { code: 'ro-RO', flag: '🇷🇴', name: 'Romanian (Romania)',      prefixes: ['ro-RO', 'ro_RO', 'ro'] },
  { code: 'hu-HU', flag: '🇭🇺', name: 'Hungarian (Hungary)',     prefixes: ['hu-HU', 'hu_HU', 'hu'] },
  { code: 'el-GR', flag: '🇬🇷', name: 'Greek (Greece)',          prefixes: ['el-GR', 'el_GR', 'el'] },
  { code: 'sv-SE', flag: '🇸🇪', name: 'Swedish (Sweden)',        prefixes: ['sv-SE', 'sv_SE', 'sv'] },
  { code: 'nb-NO', flag: '🇳🇴', name: 'Norwegian (Norway)',      prefixes: ['nb-NO', 'nb_NO', 'nb', 'no'] },
  { code: 'da-DK', flag: '🇩🇰', name: 'Danish (Denmark)',        prefixes: ['da-DK', 'da_DK', 'da'] },
  { code: 'fi-FI', flag: '🇫🇮', name: 'Finnish (Finland)',       prefixes: ['fi-FI', 'fi_FI', 'fi'] },
  { code: 'tr-TR', flag: '🇹🇷', name: 'Turkish (Turkey)',        prefixes: ['tr-TR', 'tr_TR', 'tr'] },
  { code: 'ar-SA', flag: '🇸🇦', name: 'Arabic (Saudi Arabia)',   prefixes: ['ar-SA', 'ar_SA'] },
  { code: 'ar-EG', flag: '🇪🇬', name: 'Arabic (Egypt)',          prefixes: ['ar-EG', 'ar_EG'] },
  { code: 'ar',    flag: '🇦🇪', name: 'Arabic (General)',        prefixes: ['ar'] },
  { code: 'he-IL', flag: '🇮🇱', name: 'Hebrew (Israel)',         prefixes: ['he-IL', 'he_IL', 'he'] },
  { code: 'hi-IN', flag: '🇮🇳', name: 'Hindi (India)',           prefixes: ['hi-IN', 'hi_IN', 'hi'] },
  { code: 'bn-IN', flag: '🇧🇩', name: 'Bengali (India)',         prefixes: ['bn-IN', 'bn_IN', 'bn'] },
  { code: 'th-TH', flag: '🇹🇭', name: 'Thai (Thailand)',         prefixes: ['th-TH', 'th_TH', 'th'] },
  { code: 'id-ID', flag: '🇮🇩', name: 'Indonesian (Indonesia)',  prefixes: ['id-ID', 'id_ID', 'id'] },
  { code: 'ms-MY', flag: '🇲🇾', name: 'Malay (Malaysia)',        prefixes: ['ms-MY', 'ms_MY', 'ms'] },
  { code: 'fil',   flag: '🇵🇭', name: 'Filipino (Philippines)',  prefixes: ['fil'] },
  { code: 'ja-JP', flag: '🇯🇵', name: 'Japanese (Japan)',        prefixes: ['ja-JP', 'ja_JP', 'ja'] },
  { code: 'ko-KR', flag: '🇰🇷', name: 'Korean (South Korea)',    prefixes: ['ko-KR', 'ko_KR', 'ko'] },
  { code: 'zh-CN', flag: '🇨🇳', name: 'Chinese (Simplified)',    prefixes: ['zh-CN', 'zh_CN'] },
  { code: 'zh-TW', flag: '🇹🇼', name: 'Chinese (Traditional)',  prefixes: ['zh-TW', 'zh_TW'] },
  { code: 'zh-HK', flag: '🇭🇰', name: 'Chinese (Hong Kong)',     prefixes: ['zh-HK', 'zh_HK'] },
];

// Preview sample texts per language
const PREVIEW_TEXT = {
  'vi':    'Xin chào! Đây là bản xem trước giọng đọc của bạn.',
  'en-US': 'Hello! This is a preview of your selected voice.',
  'en-GB': 'Hello! This is a preview of your selected voice.',
  'en-AU': "G'day! This is a preview of your selected voice.",
  'en-IN': 'Hello! This is a preview of your selected voice.',
  'fr-FR': 'Bonjour! Ceci est un aperçu de votre voix sélectionnée.',
  'fr-CA': 'Bonjour! Ceci est un aperçu de votre voix sélectionnée.',
  'de-DE': 'Hallo! Dies ist eine Vorschau Ihrer ausgewählten Stimme.',
  'es-ES': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'es-MX': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'es-US': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'it-IT': 'Ciao! Questa è un\'anteprima della voce selezionata.',
  'pt-BR': 'Olá! Esta é uma prévia da sua voz selecionada.',
  'pt-PT': 'Olá! Esta é uma pré-visualização da sua voz selecionada.',
  'nl-NL': 'Hallo! Dit is een voorbeeld van uw geselecteerde stem.',
  'pl-PL': 'Cześć! To jest podgląd wybranego głosu.',
  'ru-RU': 'Привет! Это предварительный просмотр выбранного голоса.',
  'uk-UA': 'Привіт! Це попередній перегляд вибраного голосу.',
  'cs-CZ': 'Ahoj! Toto je náhled vybraného hlasu.',
  'sk-SK': 'Ahoj! Toto je náhľad vybraného hlasu.',
  'ro-RO': 'Bună! Acesta este un exemplu al vocii selectate.',
  'hu-HU': 'Helló! Ez a kiválasztott hang előnézete.',
  'el-GR': 'Γεια σας! Αυτή είναι μια προεπισκόπηση της επιλεγμένης φωνής.',
  'sv-SE': 'Hej! Det här är en förhandsvisning av den valda rösten.',
  'nb-NO': 'Hei! Dette er en forhåndsvisning av den valgte stemmen.',
  'da-DK': 'Hej! Dette er en forhåndsvisning af den valgte stemme.',
  'fi-FI': 'Hei! Tämä on esikatselu valitusta äänestä.',
  'tr-TR': 'Merhaba! Bu, seçilen sesin önizlemesidir.',
  'ar-SA': 'مرحبا! هذا معاينة للصوت المحدد.',
  'ar-EG': 'مرحبا! هذا معاينة للصوت المحدد.',
  'ar':    'مرحبا! هذا معاينة للصوت المحدد.',
  'he-IL': 'שלום! זו תצוגה מקדימה של הקול שנבחר.',
  'hi-IN': 'नमस्ते! यह चयनित आवाज़ का पूर्वावलोकन है।',
  'bn-IN': 'হ্যালো! এটি নির্বাচিত কণ্ঠের পূর্বরূপ।',
  'th-TH': 'สวัสดี! นี่คือตัวอย่างเสียงที่คุณเลือก',
  'id-ID': 'Halo! Ini adalah pratinjau suara yang Anda pilih.',
  'ms-MY': 'Helo! Ini adalah pratonton suara yang anda pilih.',
  'fil':   'Kamusta! Ito ay isang preview ng iyong napiling boses.',
  'ja-JP': 'こんにちは！これはあなたが選んだ音声のプレビューです。',
  'ko-KR': '안녕하세요! 이것은 선택한 음성의 미리보기입니다.',
  'zh-CN': '你好！这是您所选声音的预览。',
  'zh-TW': '你好！這是您所選語音的預覽。',
  'zh-HK': '你好！呢個係你揀嘅語音嘅預覽。',
  'default': 'Hello! This is a preview of your selected voice.',
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

let allVoices = [];
let selectedVoiceName = '';
let selectedLang = 'auto';
let currentRate = 1.0;
let isPreviewPlaying = false;

// DOM refs
const autoDetectEl   = document.getElementById('auto-detect');
const manualBlock    = document.getElementById('manual-block');
const langSelectEl   = document.getElementById('lang-select');
const voiceSelectEl  = document.getElementById('voice-select');
const speedSliderEl  = document.getElementById('speed-slider');
const speedDisplayEl = document.getElementById('speed-display');
const btnPreview     = document.getElementById('btn-preview');
const previewLabel   = document.getElementById('preview-label');
const previewIcon    = document.getElementById('preview-icon');
const voicesBadge    = document.getElementById('voices-badge');

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  loadVoices();
  loadSettings();
  setupEvents();
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICES
// ─────────────────────────────────────────────────────────────────────────────

function loadVoices() {
  allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      allVoices = speechSynthesis.getVoices();
      populateLangSelect();
      updateVoiceSelect();
    };
  } else {
    populateLangSelect();
    updateVoiceSelect();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE FILTERING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns false for low-quality or noisy voices:
 *  - eSpeak / eSpeakNG  → very robotic synthesiser, rarely useful
 */
function isUsableVoice(v) {
  const name = v.name.toLowerCase();
  return !name.includes('espeak') && !name.includes('espeakng');
}

/**
 * Removes "Chrome OS" branded voices for a language when a "Google" branded
 * voice already exists for the same language code — avoids duplicate entries.
 * e.g. keeps "Google Tiếng Việt 2" and removes "Chrome OS Vietnamese 1".
 */
function deduplicateVoices(voices) {
  // Build set of lang codes that already have a Google-branded voice
  const googleLangs = new Set(
    voices
      .filter(v => v.name.toLowerCase().includes('google'))
      .map(v => v.lang.toLowerCase())
  );
  return voices.filter(v => {
    const name = v.name.toLowerCase();
    // If this is a Chrome OS voice AND a Google voice exists for same lang → skip it
    if (name.startsWith('chrome os') && googleLangs.has(v.lang.toLowerCase())) return false;
    return true;
  });
}

/**
 * Returns the set of language codes (from LANGUAGE_MAP) that have
 * at least one usable voice available in the user's Chrome.
 */
function getAvailableLangCodes() {
  const available = new Set();
  allVoices.filter(isUsableVoice).forEach(v => {
    const voiceLang = v.lang.toLowerCase().replace('_', '-');
    LANGUAGE_MAP.forEach(entry => {
      if (entry.code === 'auto') return;
      if (entry.prefixes.some(p => {
        const lp = p.toLowerCase().replace('_', '-');
        return voiceLang === lp || voiceLang.startsWith(lp + '-') || voiceLang.startsWith(lp);
      })) {
        available.add(entry.code);
      }
    });
  });
  return available;
}

function populateLangSelect() {
  const available = getAvailableLangCodes();
  langSelectEl.innerHTML = '';

  LANGUAGE_MAP.forEach(entry => {
    if (entry.code !== 'auto' && !available.has(entry.code)) return;
    const opt = document.createElement('option');
    opt.value = entry.code;
    opt.textContent = `${entry.flag}  ${entry.name}`;
    langSelectEl.appendChild(opt);
  });

  const usableCount = allVoices.filter(isUsableVoice).length;
  voicesBadge.textContent = `⚡ ${usableCount} voices available`;

  // Restore saved lang
  if (selectedLang && langSelectEl.querySelector(`option[value="${selectedLang}"]`)) {
    langSelectEl.value = selectedLang;
  }
}

/**
 * Populate the voice dropdown for the currently selected language.
 * Natural/Google voices are sorted to the top and marked with ★.
 */
function updateVoiceSelect() {
  voiceSelectEl.innerHTML = '';

  let voices = [];

  if (selectedLang === 'auto') {
    voices = [...allVoices];
  } else {
    const langDef = LANGUAGE_MAP.find(l => l.code === selectedLang);
    if (langDef && langDef.prefixes.length > 0) {
      voices = allVoices.filter(v => {
        const voiceLang = v.lang.toLowerCase().replace('_', '-');
        return langDef.prefixes.some(p => {
          const lp = p.toLowerCase().replace('_', '-');
          return voiceLang === lp || voiceLang.startsWith(lp);
        });
      });
    } else {
      voices = [...allVoices];
    }
  }

  // Apply quality filter and deduplicate Chrome OS duplicates
  voices = deduplicateVoices(voices.filter(isUsableVoice));

  if (voices.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No voices found for this language';
    voiceSelectEl.appendChild(opt);
    return;
  }

  // Sort: Natural/Google voices first, then alphabetical
  const isPreferred = v =>
    v.name.toLowerCase().includes('natural') ||
    v.name.toLowerCase().includes('google');

  voices.sort((a, b) => {
    const ap = isPreferred(a), bp = isPreferred(b);
    if (ap && !bp) return -1;
    if (!ap && bp) return 1;
    return a.name.localeCompare(b.name);
  });

  voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const star = isPreferred(v) ? '★ ' : '';
    opt.textContent = `${star}${v.name}  (${v.lang})`;
    voiceSelectEl.appendChild(opt);
  });

  // Restore saved voice if still available
  if (selectedVoiceName && voices.find(v => v.name === selectedVoiceName)) {
    voiceSelectEl.value = selectedVoiceName;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS — Load & Save
// ─────────────────────────────────────────────────────────────────────────────

function loadSettings() {
  chrome.storage.sync.get(['voiceName', 'lang', 'rate', 'autoDetect'], (s) => {
    selectedVoiceName = s.voiceName || '';
    selectedLang      = s.lang || 'auto';
    currentRate       = parseFloat(s.rate) || 1.0;
    const autoDetect  = s.autoDetect !== false; // default true

    autoDetectEl.checked = autoDetect;
    setManualDimmed(autoDetect);

    speedSliderEl.value = currentRate;
    updateSpeedDisplay(currentRate);

    if (allVoices.length > 0) {
      populateLangSelect();
      langSelectEl.value = selectedLang;
      updateVoiceSelect();
      if (selectedVoiceName) voiceSelectEl.value = selectedVoiceName;
    }
  });
}

function saveSettings() {
  chrome.storage.sync.set({
    voiceName:  voiceSelectEl.value,
    lang:       langSelectEl.value,
    rate:       currentRate,
    autoDetect: autoDetectEl.checked
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEED DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

function updateSpeedDisplay(val) {
  const v = parseFloat(val);
  // Format: "1.0×", "1.25×" etc.
  const formatted = Number.isInteger(v) ? v.toFixed(1) + '×' : v.toFixed(2).replace(/0$/, '') + '×';
  speedDisplayEl.textContent = formatted;

  // Update CSS fill var for slider gradient
  const min = 0.5, max = 2.0;
  const pct = ((v - min) / (max - min)) * 100;
  speedSliderEl.style.setProperty('--fill', pct.toFixed(1) + '%');
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL BLOCK DIM
// ─────────────────────────────────────────────────────────────────────────────

function setManualDimmed(isDimmed) {
  if (isDimmed) {
    manualBlock.classList.add('dimmed');
  } else {
    manualBlock.classList.remove('dimmed');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function getPreviewText() {
  if (autoDetectEl.checked) return PREVIEW_TEXT['en-US'];
  const lang = langSelectEl.value;
  return PREVIEW_TEXT[lang] || PREVIEW_TEXT['default'];
}

function stopPreview() {
  speechSynthesis.cancel();
  isPreviewPlaying = false;
  btnPreview.classList.remove('playing', 'loading');
  previewLabel.textContent = 'Preview Voice';
  previewIcon.textContent = '▶';
}

function playPreview() {
  const voiceName = voiceSelectEl.value;
  const voice = allVoices.find(v => v.name === voiceName) || null;
  const text = getPreviewText();

  if (!window.speechSynthesis) {
    previewLabel.textContent = 'TTS not supported';
    return;
  }

  btnPreview.classList.add('loading');
  previewLabel.textContent = 'Loading…';

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = currentRate;

  utterance.onstart = () => {
    isPreviewPlaying = true;
    btnPreview.classList.remove('loading');
    btnPreview.classList.add('playing');
    previewLabel.textContent = 'Stop Preview';
    previewIcon.textContent = '■';
  };

  utterance.onend = () => stopPreview();
  utterance.onerror = () => stopPreview();

  speechSynthesis.speak(utterance);
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────

function setupEvents() {
  // Auto-detect toggle
  autoDetectEl.addEventListener('change', () => {
    setManualDimmed(autoDetectEl.checked);
    saveSettings();
  });

  // Language select
  langSelectEl.addEventListener('change', () => {
    selectedLang = langSelectEl.value;
    updateVoiceSelect();
    saveSettings();
  });

  // Voice select
  voiceSelectEl.addEventListener('change', () => {
    selectedVoiceName = voiceSelectEl.value;
    saveSettings();
  });

  // Speed slider
  speedSliderEl.addEventListener('input', () => {
    currentRate = parseFloat(speedSliderEl.value);
    updateSpeedDisplay(currentRate);
    saveSettings();
  });

  // Preview button
  btnPreview.addEventListener('click', () => {
    if (isPreviewPlaying) {
      stopPreview();
    } else {
      playPreview();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
