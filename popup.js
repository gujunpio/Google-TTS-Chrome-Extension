// Chrome TTS — popup.js
// Settings UI logic: custom language dropdown with flags, voice picker, speed, preview, storage
// Uses window.speechSynthesis API for voice enumeration and preview

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE METADATA MAP — display names + country codes for flag images
// This is ONLY metadata — availability is determined by speechSynthesis.getVoices()
// ─────────────────────────────────────────────────────────────────────────────

const LANG_META = {
  'af':     { flag: 'za',     name: 'Afrikaans' },
  'am':     { flag: 'et',     name: 'Amharic (Ethiopia)' },
  'ar':     { flag: 'sa',     name: 'Arabic' },
  'ar-EG':  { flag: 'eg',     name: 'Arabic (Egypt)' },
  'ar-SA':  { flag: 'sa',     name: 'Arabic (Saudi Arabia)' },
  'bg':     { flag: 'bg',     name: 'Bulgarian' },
  'bg-BG':  { flag: 'bg',     name: 'Bulgarian' },
  'bn':     { flag: 'bd',     name: 'Bengali' },
  'bn-BD':  { flag: 'bd',     name: 'Bengali (Bangladesh)' },
  'bn-IN':  { flag: 'in',     name: 'Bengali (India)' },
  'ca':     { flag: 'es-ct',  name: 'Catalan' },
  'cs':     { flag: 'cz',     name: 'Czech' },
  'cs-CZ':  { flag: 'cz',     name: 'Czech' },
  'yue':    { flag: 'hk',     name: 'Cantonese' },
  'yue-HK': { flag: 'hk',     name: 'Cantonese (Hong Kong)' },
  'yue-Hant-HK': { flag: 'hk', name: 'Cantonese (Hong Kong)' },
  'cy':     { flag: 'gb-wls', name: 'Welsh' },
  'da':     { flag: 'dk',     name: 'Danish' },
  'da-DK':  { flag: 'dk',     name: 'Danish' },
  'de':     { flag: 'de',     name: 'German' },
  'de-DE':  { flag: 'de',     name: 'German (Germany)' },
  'de-AT':  { flag: 'at',     name: 'German (Austria)' },
  'de-CH':  { flag: 'ch',     name: 'German (Switzerland)' },
  'el':     { flag: 'gr',     name: 'Greek' },
  'el-GR':  { flag: 'gr',     name: 'Greek' },
  'en':     { flag: 'us',     name: 'English' },
  'en-AU':  { flag: 'au',     name: 'English (Australia)' },
  'en-CA':  { flag: 'ca',     name: 'English (Canada)' },
  'en-GB':  { flag: 'gb',     name: 'English (United Kingdom)' },
  'en-IE':  { flag: 'ie',     name: 'English (Ireland)' },
  'en-IN':  { flag: 'in',     name: 'English (India)' },
  'en-NZ':  { flag: 'nz',     name: 'English (New Zealand)' },
  'en-US':  { flag: 'us',     name: 'English (United States)' },
  'en-ZA':  { flag: 'za',     name: 'English (South Africa)' },
  'es':     { flag: 'es',     name: 'Spanish' },
  'es-AR':  { flag: 'ar',     name: 'Spanish (Argentina)' },
  'es-ES':  { flag: 'es',     name: 'Spanish (Spain)' },
  'es-MX':  { flag: 'mx',     name: 'Spanish (Mexico)' },
  'es-US':  { flag: 'us',     name: 'Spanish (United States)' },
  'et':     { flag: 'ee',     name: 'Estonian' },
  'eu':     { flag: 'es',     name: 'Basque' },
  'fa':     { flag: 'ir',     name: 'Persian' },
  'fi':     { flag: 'fi',     name: 'Finnish' },
  'fi-FI':  { flag: 'fi',     name: 'Finnish' },
  'fil':    { flag: 'ph',     name: 'Filipino' },
  'fil-PH': { flag: 'ph',     name: 'Filipino' },
  'fr':     { flag: 'fr',     name: 'French' },
  'fr-CA':  { flag: 'ca',     name: 'French (Canada)' },
  'fr-CH':  { flag: 'ch',     name: 'French (Switzerland)' },
  'fr-FR':  { flag: 'fr',     name: 'French (France)' },
  'ga':     { flag: 'ie',     name: 'Irish' },
  'gl':     { flag: 'es',     name: 'Galician' },
  'gu':     { flag: 'in',     name: 'Gujarati' },
  'gu-IN':  { flag: 'in',     name: 'Gujarati' },
  'he':     { flag: 'il',     name: 'Hebrew' },
  'he-IL':  { flag: 'il',     name: 'Hebrew' },
  'hi':     { flag: 'in',     name: 'Hindi' },
  'hi-IN':  { flag: 'in',     name: 'Hindi (India)' },
  'hr':     { flag: 'hr',     name: 'Croatian' },
  'hu':     { flag: 'hu',     name: 'Hungarian' },
  'hu-HU':  { flag: 'hu',     name: 'Hungarian' },
  'hy':     { flag: 'am',     name: 'Armenian' },
  'id':     { flag: 'id',     name: 'Indonesian' },
  'id-ID':  { flag: 'id',     name: 'Indonesian' },
  'is':     { flag: 'is',     name: 'Icelandic' },
  'it':     { flag: 'it',     name: 'Italian' },
  'it-IT':  { flag: 'it',     name: 'Italian (Italy)' },
  'ja':     { flag: 'jp',     name: 'Japanese' },
  'ja-JP':  { flag: 'jp',     name: 'Japanese' },
  'jv':     { flag: 'id',     name: 'Javanese' },
  'ka':     { flag: 'ge',     name: 'Georgian' },
  'km':     { flag: 'kh',     name: 'Khmer' },
  'km-KH':  { flag: 'kh',     name: 'Khmer (Cambodia)' },
  'kn':     { flag: 'in',     name: 'Kannada' },
  'kn-IN':  { flag: 'in',     name: 'Kannada' },
  'ko':     { flag: 'kr',     name: 'Korean' },
  'ko-KR':  { flag: 'kr',     name: 'Korean' },
  'la':     { flag: 'va',     name: 'Latin' },
  'lt':     { flag: 'lt',     name: 'Lithuanian' },
  'lv':     { flag: 'lv',     name: 'Latvian' },
  'mk':     { flag: 'mk',     name: 'Macedonian' },
  'ml':     { flag: 'in',     name: 'Malayalam' },
  'ml-IN':  { flag: 'in',     name: 'Malayalam' },
  'mn':     { flag: 'mn',     name: 'Mongolian' },
  'mr':     { flag: 'in',     name: 'Marathi' },
  'mr-IN':  { flag: 'in',     name: 'Marathi' },
  'ms':     { flag: 'my',     name: 'Malay' },
  'ms-MY':  { flag: 'my',     name: 'Malay (Malaysia)' },
  'my':     { flag: 'mm',     name: 'Burmese' },
  'nb':     { flag: 'no',     name: 'Norwegian Bokmål' },
  'nb-NO':  { flag: 'no',     name: 'Norwegian' },
  'ne':     { flag: 'np',     name: 'Nepali' },
  'ne-NP':  { flag: 'np',     name: 'Nepali' },
  'nl':     { flag: 'nl',     name: 'Dutch' },
  'nl-BE':  { flag: 'be',     name: 'Dutch (Belgium)' },
  'nl-NL':  { flag: 'nl',     name: 'Dutch (Netherlands)' },
  'no':     { flag: 'no',     name: 'Norwegian' },
  'pa':     { flag: 'in',     name: 'Punjabi' },
  'pl':     { flag: 'pl',     name: 'Polish' },
  'pl-PL':  { flag: 'pl',     name: 'Polish' },
  'pt':     { flag: 'pt',     name: 'Portuguese' },
  'pt-BR':  { flag: 'br',     name: 'Portuguese (Brazil)' },
  'pt-PT':  { flag: 'pt',     name: 'Portuguese (Portugal)' },
  'ro':     { flag: 'ro',     name: 'Romanian' },
  'ro-RO':  { flag: 'ro',     name: 'Romanian' },
  'ru':     { flag: 'ru',     name: 'Russian' },
  'ru-RU':  { flag: 'ru',     name: 'Russian' },
  'si':     { flag: 'lk',     name: 'Sinhala' },
  'si-LK':  { flag: 'lk',     name: 'Sinhala' },
  'sk':     { flag: 'sk',     name: 'Slovak' },
  'sk-SK':  { flag: 'sk',     name: 'Slovak' },
  'sl':     { flag: 'si',     name: 'Slovenian' },
  'sq':     { flag: 'al',     name: 'Albanian' },
  'sr':     { flag: 'rs',     name: 'Serbian' },
  'su':     { flag: 'id',     name: 'Sundanese' },
  'sv':     { flag: 'se',     name: 'Swedish' },
  'sv-SE':  { flag: 'se',     name: 'Swedish' },
  'sw':     { flag: 'ke',     name: 'Swahili' },
  'ta':     { flag: 'in',     name: 'Tamil' },
  'ta-IN':  { flag: 'in',     name: 'Tamil' },
  'te':     { flag: 'in',     name: 'Telugu' },
  'te-IN':  { flag: 'in',     name: 'Telugu' },
  'th':     { flag: 'th',     name: 'Thai' },
  'th-TH':  { flag: 'th',     name: 'Thai' },
  'tr':     { flag: 'tr',     name: 'Turkish' },
  'tr-TR':  { flag: 'tr',     name: 'Turkish' },
  'uk':     { flag: 'ua',     name: 'Ukrainian' },
  'uk-UA':  { flag: 'ua',     name: 'Ukrainian' },
  'ur':     { flag: 'pk',     name: 'Urdu' },
  'vi':     { flag: 'vn',     name: 'Vietnamese' },
  'vi-VN':  { flag: 'vn',     name: 'Vietnamese' },
  'zh':     { flag: 'cn',     name: 'Chinese' },
  'zh-CN':  { flag: 'cn',     name: 'Chinese (Simplified)' },
  'zh-HK':  { flag: 'hk',     name: 'Chinese (Hong Kong)' },
  'zh-TW':  { flag: 'tw',     name: 'Chinese (Traditional)' },
  'zu':     { flag: 'za',     name: 'Zulu' },
};

// Core languages matching Chrome Reading Mode's supported languages (34 total)
// These always appear in the dropdown even if Natural voices aren't downloaded yet
const CORE_LANGUAGES = [
  // Reading Mode languages (use region-specific codes to match speechSynthesis)
  'yue-Hant-HK', // Cantonese (Hong Kong)
  'cs-CZ',       // Czech
  'da-DK',       // Danish
  'de-DE',       // German
  'en-AU',       // English (Australia)
  'en-GB',       // English (UK)
  'en-US',       // English (US)
  'es-ES',       // Spanish (Spain)
  'es-US',       // Spanish (US)
  'fil-PH',      // Filipino
  'fr-FR',       // French
  'id-ID',       // Indonesian
  'it-IT',       // Italian
  'hu-HU',       // Hungarian
  'nl-NL',       // Dutch
  'nb-NO',       // Norwegian
  'pl-PL',       // Polish
  'pt-BR',       // Portuguese (Brazil)
  'pt-PT',       // Portuguese (Portugal)
  'sk-SK',       // Slovak
  'fi-FI',       // Finnish
  'sv-SE',       // Swedish
  'vi-VN',       // Vietnamese
  'tr-TR',       // Turkish
  'el-GR',       // Greek
  'uk-UA',       // Ukrainian
  'ne-NP',       // Nepali
  'hi-IN',       // Hindi
  'bn-BD',       // Bengali (Bangladesh)
  'si-LK',       // Sinhala
  'th-TH',       // Thai
  'km-KH',       // Khmer (Cambodia)
  'ko-KR',       // Korean
  'ja-JP',       // Japanese
];

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW SAMPLE TEXTS
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_TEXT = {
  'vi':    'Xin chào! Đây là bản xem trước giọng đọc của bạn.',
  'vi-VN': 'Xin chào! Đây là bản xem trước giọng đọc của bạn.',
  'en':    'Hello! This is a preview of your selected voice.',
  'en-US': 'Hello! This is a preview of your selected voice.',
  'en-GB': 'Hello! This is a preview of your selected voice.',
  'en-AU': "G'day! This is a preview of your selected voice.",
  'en-IN': 'Hello! This is a preview of your selected voice.',
  'fr':    'Bonjour! Ceci est un aperçu de votre voix sélectionnée.',
  'fr-FR': 'Bonjour! Ceci est un aperçu de votre voix sélectionnée.',
  'fr-CA': 'Bonjour! Ceci est un aperçu de votre voix sélectionnée.',
  'de':    'Hallo! Dies ist eine Vorschau Ihrer ausgewählten Stimme.',
  'de-DE': 'Hallo! Dies ist eine Vorschau Ihrer ausgewählten Stimme.',
  'es':    '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'es-ES': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'es-MX': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'es-US': '¡Hola! Esta es una vista previa de su voz seleccionada.',
  'it':    'Ciao! Questa è un\'anteprima della voce selezionata.',
  'it-IT': 'Ciao! Questa è un\'anteprima della voce selezionata.',
  'pt-BR': 'Olá! Esta é uma prévia da sua voz selecionada.',
  'pt-PT': 'Olá! Esta é uma pré-visualização da sua voz selecionada.',
  'nl':    'Hallo! Dit is een voorbeeld van uw geselecteerde stem.',
  'nl-NL': 'Hallo! Dit is een voorbeeld van uw geselecteerde stem.',
  'pl':    'Cześć! To jest podgląd wybranego głosu.',
  'pl-PL': 'Cześć! To jest podgląd wybranego głosu.',
  'ru':    'Привет! Это предварительный просмотр выбранного голоса.',
  'ru-RU': 'Привет! Это предварительный просмотр выбранного голоса.',
  'uk':    'Привіт! Це попередній перегляд вибраного голосу.',
  'uk-UA': 'Привіт! Це попередній перегляд вибраного голосу.',
  'cs':    'Ahoj! Toto je náhled vybraného hlasu.',
  'cs-CZ': 'Ahoj! Toto je náhled vybraného hlasu.',
  'sk':    'Ahoj! Toto je náhľad vybraného hlasu.',
  'sk-SK': 'Ahoj! Toto je náhľad vybraného hlasu.',
  'ro':    'Bună! Acesta este un exemplu al vocii selectate.',
  'ro-RO': 'Bună! Acesta este un exemplu al vocii selectate.',
  'hu':    'Helló! Ez a kiválasztott hang előnézete.',
  'hu-HU': 'Helló! Ez a kiválasztott hang előnézete.',
  'el':    'Γεια σας! Αυτή είναι μια προεπισκόπηση της επιλεγμένης φωνής.',
  'el-GR': 'Γεια σας! Αυτή είναι μια προεπισκόπηση της επιλεγμένης φωνής.',
  'sv':    'Hej! Det här är en förhandsvisning av den valda rösten.',
  'sv-SE': 'Hej! Det här är en förhandsvisning av den valda rösten.',
  'nb':    'Hei! Dette er en forhåndsvisning av den valgte stemmen.',
  'nb-NO': 'Hei! Dette er en forhåndsvisning av den valgte stemmen.',
  'no':    'Hei! Dette er en forhåndsvisning av den valgte stemmen.',
  'da':    'Hej! Dette er en forhåndsvisning af den valgte stemme.',
  'da-DK': 'Hej! Dette er en forhåndsvisning af den valgte stemme.',
  'fi':    'Hei! Tämä on esikatselu valitusta äänestä.',
  'fi-FI': 'Hei! Tämä on esikatselu valitusta äänestä.',
  'tr':    'Merhaba! Bu, seçilen sesin önizlemesidir.',
  'tr-TR': 'Merhaba! Bu, seçilen sesin önizlemesidir.',
  'ar':    'مرحبا! هذا معاينة للصوت المحدد.',
  'ar-SA': 'مرحبا! هذا معاينة للصوت المحدد.',
  'ar-EG': 'مرحبا! هذا معاينة للصوت المحدد.',
  'he':    'שלום! זו תצוגה מקדימה של הקול שנבחר.',
  'he-IL': 'שלום! זו תצוגה מקדימה של הקול שנבחר.',
  'hi':    'नमस्ते! यह चयनित आवाज़ का पूर्वावलोकन है।',
  'hi-IN': 'नमस्ते! यह चयनित आवाज़ का पूर्वावलोकन है।',
  'bn':    'হ্যালো! এটি নির্বাচিত কণ্ঠের পূর্বরূপ।',
  'bn-IN': 'হ্যালো! এটি নির্বাচিত কণ্ঠের পূর্বরূপ।',
  'th':    'สวัสดี! นี่คือตัวอย่างเสียงที่คุณเลือก',
  'th-TH': 'สวัสดี! นี่คือตัวอย่างเสียงที่คุณเลือก',
  'id':    'Halo! Ini adalah pratinjau suara yang Anda pilih.',
  'id-ID': 'Halo! Ini adalah pratinjau suara yang Anda pilih.',
  'ms':    'Helo! Ini adalah pratonton suara yang anda pilih.',
  'ms-MY': 'Helo! Ini adalah pratonton suara yang anda pilih.',
  'fil':   'Kamusta! Ito ay isang preview ng iyong napiling boses.',
  'ja':    'こんにちは！これはあなたが選んだ音声のプレビューです。',
  'ja-JP': 'こんにちは！これはあなたが選んだ音声のプレビューです。',
  'ko':    '안녕하세요! 이것은 선택한 음성의 미리보기입니다.',
  'ko-KR': '안녕하세요! 이것은 선택한 음성의 미리보기입니다.',
  'zh':    '你好！这是您所选声音的预览。',
  'zh-CN': '你好！这是您所选声音的预览。',
  'zh-TW': '你好！這是您所選語音的預覽。',
  'zh-HK': '你好！呢個係你揀嘅語音嘅預覽。',
  'yue':   '你好！呢個係你揀嘅語音嘅預覽。',
  'yue-HK': '你好！呢個係你揀嘅語音嘅預覽。',
  'yue-Hant-HK': '你好！呢個係你揀嘅語音嘅預覽。',
  'bn-BD': 'হ্যালো! এটি নির্বাচিত কণ্ঠের পূর্বরূপ।',
  'ne':    'नमस्ते! यो चयन गरिएको आवाजको पूर्वावलोकन हो।',
  'ne-NP': 'नमस्ते! यो चयन गरिएको आवाजको पूर्वावलोकन हो।',
  'si':    'හෙලෝ! මෙය ඔබ තෝරාගත් හඬේ පෙරදසුනකි.',
  'si-LK': 'හෙලෝ! මෙය ඔබ තෝරාගත් හඬේ පෙරදසුනකි.',
  'km':    'សួស្តី! នេះជាការពិនិត្យមុននៃសម្លេងដែលអ្នកបានជ្រើសរើស។',
  'km-KH': 'សួស្តី! នេះជាការពិនិត្យមុននៃសម្លេងដែលអ្នកបានជ្រើសរើស។',
  'fil-PH': 'Kamusta! Ito ay isang preview ng iyong napiling boses.',
  'default': 'Hello! This is a preview of your selected voice.',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up language metadata by code.
 * Falls back to base language (e.g. 'en-US' → 'en'), then to a generic entry.
 */
function getLangMeta(langCode) {
  if (LANG_META[langCode]) return LANG_META[langCode];
  // Try base language: 'en-US' → 'en'
  const base = langCode.split('-')[0];
  if (LANG_META[base]) return LANG_META[base];
  // Fallback: use UN flag
  return { flag: 'un', name: langCode };
}

/**
 * Build a flag image URL from a country code using flagcdn.
 */
function getFlagUrl(countryCode) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

let allVoices = [];
let selectedVoiceName = '';
let selectedLang = 'auto';
let currentRate = 1.0;
let isPreviewPlaying = false;
let currentUtterance = null;

// DOM refs
const autoDetectEl   = document.getElementById('auto-detect');
const manualBlock    = document.getElementById('manual-block');
const langSelectEl   = document.getElementById('lang-select');       // hidden input
const langWrapper    = document.getElementById('lang-select-wrapper');
const langTrigger    = document.getElementById('lang-trigger');
const langFlag       = document.getElementById('lang-flag');
const langText       = document.getElementById('lang-text');
const langDropdown   = document.getElementById('lang-dropdown');
const langSearch     = document.getElementById('lang-search');
const langOptions    = document.getElementById('lang-options');
const voiceSelectEl  = document.getElementById('voice-select');
const speedSliderEl  = document.getElementById('speed-slider');
const speedDisplayEl = document.getElementById('speed-display');
const btnPreview     = document.getElementById('btn-preview');
const previewLabel   = document.getElementById('preview-label');
const previewIcon    = document.getElementById('preview-icon');
const voicesBadge    = document.getElementById('voices-badge');
const naturalVoiceHint = document.getElementById('natural-voice-hint');
const guideModal       = document.getElementById('guide-modal');
const openGuideBtn     = document.getElementById('open-guide-btn');
const closeGuideBtn    = document.getElementById('close-guide-btn');
const btnRefreshVoices = document.getElementById('btn-refresh-voices');

// ─────────────────────────────────────────────────────────────────────────────
// VOICE LOADING — speechSynthesis API (top-level, outside init)
// ─────────────────────────────────────────────────────────────────────────────

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    allVoices = voices;
    populateLangSelect();
    updateVoiceSelect();
  }
}

// Critical: handle async voice loading
loadVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
// Retry after delays (some Chrome versions are slow)
setTimeout(loadVoices, 300);
setTimeout(loadVoices, 1000);
setTimeout(loadVoices, 3000);

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  loadVoices(); // Will also be called by onvoiceschanged
  loadSettings();
  setupEvents();
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE FILTERING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns false for low-quality or noisy voices (eSpeak, eSpeakNG).
 * Uses v.name (speechSynthesis API property)
 */
function isUsableVoice(v) {
  const name = (v.name || '').toLowerCase();
  return !name.includes('espeak') && 
         !name.includes('espeakng') && 
         !name.includes('chrome os') && 
         !name.includes('microsoft');
}

/**
 * Removes "Chrome OS" branded voices when a "Google" branded
 * voice already exists for the same language code.
 */
function deduplicateVoices(voices) {
  const googleLangs = new Set(
    voices
      .filter(v => (v.name || '').toLowerCase().includes('google'))
      .map(v => (v.lang || '').toLowerCase())
  );
  return voices.filter(v => {
    const name = (v.name || '').toLowerCase();
    if (name.startsWith('chrome os') && googleLangs.has((v.lang || '').toLowerCase())) return false;
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LANGUAGE DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the language dropdown from available voices.
 * Groups voices by lang code, resolves display names via LANG_META,
 * sorts alphabetically, and prepends "Auto-detect".
 */
function populateLangSelect() {
  // Collect unique lang codes from all voices
  const langSet = new Set();
  allVoices.filter(isUsableVoice).forEach(v => {
    if (v.lang) langSet.add(v.lang);
  });

  // Build entries: { code, name, flag }
  let entries = [];
  langSet.forEach(code => {
    const meta = getLangMeta(code);
    entries.push({ code, name: meta.name, flag: meta.flag });
  });

  // Add core languages only if no variant of that language exists yet
  // (e.g., don't add 'vi-VN' if 'vi-VN' already exists from voices)
  const existingCodes = new Set(entries.map(e => e.code));
  const existingBases = new Set(entries.map(e => e.code.split('-')[0].split('_')[0].toLowerCase()));
  CORE_LANGUAGES.forEach(code => {
    if (!existingCodes.has(code)) {
      const base = code.split('-')[0].split('_')[0].toLowerCase();
      // Only add if no entry with same base language exists
      // (but allow multiple variants like en-US, en-GB, en-AU)
      const isMultiVariant = CORE_LANGUAGES.filter(c => c.split('-')[0].split('_')[0].toLowerCase() === base).length > 1;
      if (isMultiVariant || !existingBases.has(base)) {
        const meta = getLangMeta(code);
        entries.push({ code, name: meta.name, flag: meta.flag });
      }
    }
  });

  // Remove base-only entries when a region-specific entry exists
  // e.g., remove 'vi' when 'vi-VN' exists, remove 'ja' when 'ja-JP' exists
  const regionCodes = new Set();
  entries.forEach(e => {
    if (e.code.includes('-') || e.code.includes('_')) {
      regionCodes.add(e.code.split('-')[0].split('_')[0].toLowerCase());
    }
  });
  entries = entries.filter(e => {
    // Keep entries with region codes
    if (e.code.includes('-') || e.code.includes('_')) return true;
    // Remove base-only if region-specific variant exists
    return !regionCodes.has(e.code.toLowerCase());
  });

  // Sort ALL entries alphabetically by display name
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  // Clear options container
  langOptions.innerHTML = '';

  // Add all language options (sorted)
  entries.forEach(entry => {
    const opt = createDropdownOption(entry.code, entry.flag, entry.name, false);
    langOptions.appendChild(opt);
  });

  // Update badge
  voicesBadge.textContent = `⚡ ${allVoices.length} voices available`;

  // Restore selected lang in trigger display
  updateTriggerDisplay(selectedLang);
  highlightSelectedOption(selectedLang);
}

/**
 * Create a single dropdown option element.
 */
function createDropdownOption(value, flagOrEmoji, displayName, isGlobe) {
  const div = document.createElement('div');
  div.className = 'dropdown-option';
  div.dataset.value = value;

  if (isGlobe) {
    // Use a text globe icon for auto-detect
    const globe = document.createElement('span');
    globe.className = 'globe-icon';
    globe.textContent = '🌐';
    div.appendChild(globe);
  } else {
    // Use flag image
    const img = document.createElement('img');
    img.className = 'flag-img';
    img.src = getFlagUrl(flagOrEmoji);
    img.alt = displayName;
    img.width = 20;
    img.height = 15;
    img.loading = 'lazy';
    // Fallback if flag image fails
    img.onerror = function() {
      this.style.display = 'none';
    };
    div.appendChild(img);
  }

  const text = document.createElement('span');
  text.className = 'option-text';
  text.textContent = displayName;
  div.appendChild(text);

  // Click handler
  div.addEventListener('click', () => {
    selectLangOption(value);
  });

  return div;
}

/**
 * Select a language option: update hidden input, trigger display, close dropdown.
 */
function selectLangOption(value) {
  selectedLang = value;
  langSelectEl.value = value;

  updateTriggerDisplay(value);
  highlightSelectedOption(value);
  closeDropdown();

  updateVoiceSelect();
  saveSettings();
}

/**
 * Update the trigger button to show the selected language's flag + name.
 */
function updateTriggerDisplay(value) {
  if (value === 'auto') {
    langFlag.style.display = 'none';
    langText.textContent = '🌐 Auto-detect';
  } else {
    const meta = getLangMeta(value);
    langFlag.src = getFlagUrl(meta.flag);
    langFlag.alt = meta.name;
    langFlag.style.display = 'block';
    langFlag.onerror = function() { this.style.display = 'none'; };
    langText.textContent = meta.name;
  }
}

/**
 * Highlight the currently selected option in the dropdown.
 */
function highlightSelectedOption(value) {
  const options = langOptions.querySelectorAll('.dropdown-option');
  options.forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.value === value);
  });
}

/**
 * Toggle dropdown open/close.
 */
function toggleDropdown() {
  if (langWrapper.classList.contains('open')) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  langWrapper.classList.add('open');
  langSearch.value = '';
  filterOptions('');
  // Focus the search input
  setTimeout(() => langSearch.focus(), 50);
  // Scroll selected into view
  const selected = langOptions.querySelector('.dropdown-option.selected');
  if (selected) {
    setTimeout(() => selected.scrollIntoView({ block: 'nearest' }), 60);
  }
}

function closeDropdown() {
  langWrapper.classList.remove('open');
}

/**
 * Filter options based on search text.
 */
function filterOptions(query) {
  const q = query.toLowerCase().trim();
  const options = langOptions.querySelectorAll('.dropdown-option');
  let visibleCount = 0;

  options.forEach(opt => {
    const text = opt.querySelector('.option-text').textContent.toLowerCase();
    const code = (opt.dataset.value || '').toLowerCase();
    const match = !q || text.includes(q) || code.includes(q);
    opt.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  // Show "no results" message if needed
  let noResults = langOptions.querySelector('.dropdown-no-results');
  if (visibleCount === 0) {
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'dropdown-no-results';
      noResults.textContent = 'No languages found';
      langOptions.appendChild(noResults);
    }
    noResults.style.display = '';
  } else if (noResults) {
    noResults.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE DROPDOWN (native <select>)
// ─────────────────────────────────────────────────────────────────────────────

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
    // Normalize selected lang for matching
    const selNorm = selectedLang.toLowerCase().replace('_', '-');
    const selBase = selNorm.split('-')[0];
    voices = allVoices.filter(v => {
      const voiceLang = (v.lang || '').toLowerCase().replace('_', '-');
      const voiceBase = voiceLang.split('-')[0];
      // Match by: exact, prefix, reverse prefix, or base language
      return voiceLang === selNorm ||
             voiceLang.startsWith(selNorm + '-') ||
             selNorm.startsWith(voiceLang + '-') ||
             voiceBase === selBase;
    });
  }

  // Apply quality filter and deduplicate
  voices = deduplicateVoices(voices.filter(isUsableVoice));

  if (voices.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No voices found';
    voiceSelectEl.appendChild(opt);
    return;
  }

  // Sort: Natural/Google voices first, then alphabetical
  const isPreferred = v => {
    const name = (v.name || '').toLowerCase();
    return name.includes('natural') || name.includes('google');
  };

  // Check if there's any natural voice for this language
  const hasNatural = voices.some(isPreferred);
  
  // CORE_LANGUAGES have natural voices. Check if the selected lang is supported
  const hasNaturalSupport = selectedLang !== 'auto' && CORE_LANGUAGES.some(c => {
    const cBase = c.split('-')[0].split('_')[0].toLowerCase();
    const sBase = selectedLang.split('-')[0].split('_')[0].toLowerCase();
    return c === selectedLang || cBase === sBase;
  });

  if (hasNaturalSupport && !hasNatural) {
    naturalVoiceHint.style.display = 'flex';
  } else {
    naturalVoiceHint.style.display = 'none';
  }

  voices.sort((a, b) => {
    const ap = isPreferred(a), bp = isPreferred(b);
    if (ap && !bp) return -1;
    if (!ap && bp) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const star = isPreferred(v) ? '★ ' : '';
    opt.textContent = `${star}${v.name}  (${v.lang || '?'})`;
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
    selectedLang      = s.lang || 'en-US';
    currentRate       = parseFloat(s.rate) || 1.0;
    const autoDetect  = s.autoDetect !== false; // default true

    autoDetectEl.checked = autoDetect;
    setManualDimmed(autoDetect);

    speedSliderEl.value = currentRate;
    updateSpeedDisplay(currentRate);

    // Update lang hidden input
    langSelectEl.value = selectedLang;

    if (allVoices.length > 0) {
      populateLangSelect();
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
// PREVIEW — using speechSynthesis API
// ─────────────────────────────────────────────────────────────────────────────

function getPreviewText() {
  if (autoDetectEl.checked) return PREVIEW_TEXT['en-US'];
  const lang = langSelectEl.value;
  // Try exact match, then base language fallback
  return PREVIEW_TEXT[lang] || PREVIEW_TEXT[lang.split('-')[0]] || PREVIEW_TEXT['default'];
}

function stopPreview() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
  isPreviewPlaying = false;
  btnPreview.classList.remove('playing', 'loading');
  previewLabel.textContent = 'Preview Voice';
  previewIcon.textContent = '▶';
}

function playPreview() {
  const voiceName = voiceSelectEl.value;
  const text = getPreviewText();

  window.speechSynthesis.cancel();
  btnPreview.classList.add('loading');
  previewLabel.textContent = 'Loading…';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = currentRate;

  // Find and set the voice
  const voice = allVoices.find(v => v.name === voiceName);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.onstart = () => {
    isPreviewPlaying = true;
    btnPreview.classList.remove('loading');
    btnPreview.classList.add('playing');
    previewLabel.textContent = 'Stop Preview';
    previewIcon.textContent = '■';
  };

  utterance.onend = () => stopPreview();
  utterance.onerror = () => stopPreview();

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
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

  // Custom language dropdown: trigger click
  langTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Trigger keyboard support
  langTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    }
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // Search input
  langSearch.addEventListener('input', () => {
    filterOptions(langSearch.value);
  });

  // Prevent search input from closing dropdown on click
  langSearch.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Escape key in search closes dropdown
  langSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
      langTrigger.focus();
    }
  });

  // Modal events
  openGuideBtn.addEventListener('click', (e) => {
    e.preventDefault();
    guideModal.classList.add('active');
  });

  closeGuideBtn.addEventListener('click', () => {
    guideModal.classList.remove('active');
  });

  btnRefreshVoices.addEventListener('click', () => {
    loadVoices();
    btnRefreshVoices.textContent = '✓ Refreshed!';
    setTimeout(() => {
      btnRefreshVoices.textContent = '🔄 Refresh Voices';
      guideModal.classList.remove('active');
    }, 1500);
  });

  // Click outside closes dropdown
  document.addEventListener('click', (e) => {
    if (!langWrapper.contains(e.target)) {
      closeDropdown();
    }
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
