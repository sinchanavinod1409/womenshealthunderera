export const LANGS = ["en", "kn", "hi", "ta"] as const;
export type Language = (typeof LANGS)[number];
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
  ta: "தமிழ்",
};

const scripts: Record<Language, RegExp> = {
  en: /[A-Za-z]/,
  kn: /[\u0C80-\u0CFF]/,
  hi: /[\u0900-\u097F]/,
  ta: /[\u0B80-\u0BFF]/,
};
export function detectScriptLanguage(text: string): Language | null {
  for (const lang of ["kn", "hi", "ta"] as const)
    if (scripts[lang].test(text)) return lang;
  const latin = text.toLowerCase();
  if (
    /\b(?:nanage|nanna|nimage|yake|yaake|hege|sariyagi|aaguttilla|agolla|lakshanagalu|maasika)\b/.test(
      latin
    )
  )
    return "kn";
  if (
    /\b(?:mujhe|mere|meri|kyun|kyon|kaise|kya|hain|hai|dard|mahina|maheene|anियमित)\b/.test(
      latin
    )
  )
    return "hi";
  if (
    /\b(?:enakku|ennoda|enoda|eppadi|epdi|irukku|varala|valikkuthu|maadhavidai|maathiri)\b/.test(
      latin
    )
  )
    return "ta";
  return /[A-Za-z]/.test(text) ? "en" : null;
}
export function matchesResponseLanguage(
  text: string,
  language: Language
): boolean {
  const letters = Array.from(text).filter(character =>
    /\p{L}/u.test(character)
  );
  if (!letters.length) return false;
  const expected = letters.filter(character =>
    scripts[language].test(character)
  ).length;
  const ratio = expected / letters.length;
  return ratio >= 0.6;
}
export function explicitLanguageRequest(text: string): Language | null {
  const s = text.toLowerCase();
  if (
    /(?:reply|answer|speak|switch|in)\s+(?:to\s+)?english|ಇಂಗ್ಲಿಷ್(?:ನಲ್ಲಿ|ಗೆ)|अंग्रेज़ी में|ஆங்கிலத்தில்/.test(
      s
    )
  )
    return "en";
  if (
    /(?:reply|answer|speak|switch|in)\s+(?:to\s+)?kannada|ಕನ್ನಡ(?:ದಲ್ಲಿ|ಕ್ಕೆ)|कन्नड़ में|கன்னடத்தில்/.test(
      s
    )
  )
    return "kn";
  if (
    /(?:reply|answer|speak|switch|in)\s+(?:to\s+)?hindi|हिन्दी में|हिंदी में|இந்தியில்/.test(
      s
    )
  )
    return "hi";
  if (
    /(?:reply|answer|speak|switch|in)\s+(?:to\s+)?tamil|தமிழில்|तमिल में/.test(
      s
    )
  )
    return "ta";
  return null;
}
export function resolveLanguage(
  text: string,
  preferred: Language = "en",
  conversation?: Language,
  languageOverride?: Language
): Language {
  const explicit = explicitLanguageRequest(text);
  if (explicit) return explicit;
  if (languageOverride) return languageOverride;
  const detected = detectScriptLanguage(text);
  if (conversation && conversation !== "en" && detected === "en")
    return conversation;
  return detected ?? conversation ?? preferred;
}

export const UI: Record<Language, Record<string, string>> = {
  en: {
    app: "WOMEN’S HEALTH",
    subtitle: "Your multilingual health companion",
    login: "Sign in",
    register: "Create account",
    name: "Full name",
    username: "Username",
    password: "Password",
    confirm: "Confirm password",
    remember: "Remember me",
    create: "Create account",
    loginCta: "Sign in",
    logout: "Sign out",
    dashboard: "Your space",
    chat: "Ask a question",
    newChat: "New conversation",
    symptoms: "Understand symptoms",
    pcos: "PCOS learning",
    settings: "Settings",
    language: "Preferred language",
    send: "Send message",
    placeholder: "What would you like to understand?",
    loading: "A moment, please…",
    save: "Save changes",
    delete: "Delete",
    empty: "Your conversations will appear here.",
    safety:
      "Education and care guidance only—not a medical diagnosis or a substitute for a qualified healthcare professional.",
    fallback: "Fallback mode · curated information, not a live AI response",
    live: "Live AI response",
    welcome: "A calmer way to make sense of your health.",
    start: "Start a conversation",
    symptomPrompt: "Describe what you’ve noticed, in your own words.",
    analyze: "Organize my description",
    summary: "Your summary",
    original: "Your original description",
    unknown: "Not provided",
    sources: "Sources and further reading",
    prefsSaved: "Language preference saved.",
  },
  kn: {
    app: "ಮಹಿಳೆಯರ ಆರೋಗ್ಯ",
    subtitle: "ನಿಮ್ಮ ಬಹುಭಾಷಾ ಆರೋಗ್ಯ ಸಹಾಯಕಿ",
    login: "ಲಾಗಿನ್",
    register: "ಖಾತೆ ತೆರೆಯಿರಿ",
    name: "ಪೂರ್ಣ ಹೆಸರು",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    confirm: "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    remember: "ನನ್ನನ್ನು ನೆನಪಿಡಿ",
    create: "ಖಾತೆ ತೆರೆಯಿರಿ",
    loginCta: "ಲಾಗಿನ್",
    logout: "ಲಾಗ್ ಔಟ್",
    dashboard: "ನಿಮ್ಮ ಸ್ಥಳ",
    chat: "ಪ್ರಶ್ನೆ ಕೇಳಿ",
    newChat: "ಹೊಸ ಸಂಭಾಷಣೆ",
    symptoms: "ಲಕ್ಷಣಗಳನ್ನು ತಿಳಿಯಿರಿ",
    pcos: "PCOS ಮಾಹಿತಿ",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    language: "ಆದ್ಯತೆಯ ಭಾಷೆ",
    send: "ಸಂದೇಶ ಕಳುಹಿಸಿ",
    placeholder: "ನೀವು ಏನನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?",
    loading: "ದಯವಿಟ್ಟು ಕ್ಷಣಕಾಲ ಕಾಯಿರಿ…",
    save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    delete: "ಅಳಿಸಿ",
    empty: "ನಿಮ್ಮ ಸಂಭಾಷಣೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    safety:
      "ಇದು ಆರೋಗ್ಯ ಶಿಕ್ಷಣ ಮತ್ತು ಆರೈಕೆ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ವೈದ್ಯಕೀಯ ನಿರ್ಣಯವೂ ಅಲ್ಲ, ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರ ಬದಲಿಯೂ ಅಲ್ಲ.",
    fallback: "ಪರ್ಯಾಯ ವಿಧಾನ · ಸಂಗ್ರಹಿತ ಮಾಹಿತಿ, ನೇರ AI ಉತ್ತರ ಅಲ್ಲ",
    live: "ನೇರ AI ಉತ್ತರ",
    welcome: "ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನೆಮ್ಮದಿಯ ದಾರಿ.",
    start: "ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ",
    symptomPrompt: "ನೀವು ಗಮನಿಸಿದುದನ್ನು ನಿಮ್ಮದೇ ಮಾತಿನಲ್ಲಿ ವಿವರಿಸಿ.",
    analyze: "ನನ್ನ ವಿವರಣೆಯನ್ನು ಕ್ರಮಬದ್ಧಗೊಳಿಸಿ",
    summary: "ನಿಮ್ಮ ಸಾರಾಂಶ",
    original: "ನಿಮ್ಮ ಮೂಲ ವಿವರಣೆ",
    unknown: "ನೀಡಿಲ್ಲ",
    sources: "ಮೂಲಗಳು ಮತ್ತು ಹೆಚ್ಚಿನ ಓದು",
    prefsSaved: "ಭಾಷೆಯ ಆದ್ಯತೆ ಉಳಿಸಲಾಗಿದೆ.",
  },
  hi: {
    app: "महिला स्वास्थ्य",
    subtitle: "आपकी बहुभाषी स्वास्थ्य सहायक",
    login: "साइन इन",
    register: "खाता बनाएँ",
    name: "पूरा नाम",
    username: "यूज़रनेम",
    password: "पासवर्ड",
    confirm: "पासवर्ड की पुष्टि",
    remember: "मुझे याद रखें",
    create: "खाता बनाएँ",
    loginCta: "साइन इन",
    logout: "साइन आउट",
    dashboard: "आपका स्थान",
    chat: "सवाल पूछें",
    newChat: "नई बातचीत",
    symptoms: "लक्षण समझें",
    pcos: "PCOS जानकारी",
    settings: "सेटिंग्स",
    language: "पसंदीदा भाषा",
    send: "संदेश भेजें",
    placeholder: "आप क्या समझना चाहती हैं?",
    loading: "एक पल…",
    save: "बदलाव सहेजें",
    delete: "हटाएँ",
    empty: "आपकी बातचीत यहाँ दिखाई देगी।",
    safety:
      "यह केवल स्वास्थ्य शिक्षा और देखभाल मार्गदर्शन है—चिकित्सीय निदान या योग्य स्वास्थ्य पेशेवर का विकल्प नहीं।",
    fallback: "फॉलबैक मोड · चुनिंदा जानकारी, लाइव AI उत्तर नहीं",
    live: "लाइव AI उत्तर",
    welcome: "अपने स्वास्थ्य को समझने का थोड़ा सुकूनभरा तरीका।",
    start: "बातचीत शुरू करें",
    symptomPrompt: "जो आपने महसूस किया है, उसे अपने शब्दों में बताएँ।",
    analyze: "मेरी बात का सार बनाएँ",
    summary: "आपका सारांश",
    original: "आपका मूल विवरण",
    unknown: "नहीं बताया गया",
    sources: "स्रोत और आगे पढ़ें",
    prefsSaved: "भाषा की पसंद सहेजी गई।",
  },
  ta: {
    app: "பெண்கள் நலம்",
    subtitle: "உங்கள் பன்மொழி நலத் துணை",
    login: "உள்நுழைய",
    register: "கணக்கு உருவாக்கு",
    name: "முழுப் பெயர்",
    username: "பயனர் பெயர்",
    password: "கடவுச்சொல்",
    confirm: "கடவுச்சொல்லை உறுதிப்படுத்து",
    remember: "என்னை நினைவில் வைத்திரு",
    create: "கணக்கு உருவாக்கு",
    loginCta: "உள்நுழைய",
    logout: "வெளியேறு",
    dashboard: "உங்கள் இடம்",
    chat: "கேள்வி கேளுங்கள்",
    newChat: "புதிய உரையாடல்",
    symptoms: "அறிகுறிகளைப் புரிந்துகொள்ள",
    pcos: "PCOS தகவல்",
    settings: "அமைப்புகள்",
    language: "விருப்ப மொழி",
    send: "செய்தி அனுப்பு",
    placeholder: "நீங்கள் எதைப் புரிந்துகொள்ள விரும்புகிறீர்கள்?",
    loading: "சற்று காத்திருக்கவும்…",
    save: "மாற்றங்களைச் சேமி",
    delete: "நீக்கு",
    empty: "உங்கள் உரையாடல்கள் இங்கே தோன்றும்.",
    safety:
      "இது சுகாதாரக் கல்வி மற்றும் பராமரிப்பு வழிகாட்டுதல் மட்டுமே—மருத்துவ நோயறிதலோ தகுதிபெற்ற சுகாதார நிபுணருக்குப் பதிலோ அல்ல.",
    fallback: "மாற்று முறை · தொகுக்கப்பட்ட தகவல்; நேரடி AI பதில் அல்ல",
    live: "நேரடி AI பதில்",
    welcome: "உங்கள் நலனைப் புரிந்துகொள்ள அமைதியான வழி.",
    start: "உரையாடலைத் தொடங்கு",
    symptomPrompt: "நீங்கள் கவனித்ததை உங்கள் சொற்களில் விவரிக்கவும்.",
    analyze: "என் விளக்கத்தை ஒழுங்குபடுத்து",
    summary: "உங்கள் சுருக்கம்",
    original: "உங்கள் அசல் விளக்கம்",
    unknown: "வழங்கப்படவில்லை",
    sources: "ஆதாரங்கள் மற்றும் மேலும் வாசிக்க",
    prefsSaved: "மொழி விருப்பம் சேமிக்கப்பட்டது.",
  },
};

export const URGENT: Record<Language, string> = {
  en: "Please seek urgent medical care now. Severe pelvic or abdominal pain, fainting, very heavy bleeding, or severe pain/bleeding when pregnancy is possible needs prompt assessment. Contact your local emergency service or go to an emergency department. This app cannot assess an emergency.",
  kn: "ದಯವಿಟ್ಟು ಈಗಲೇ ತುರ್ತು ವೈದ್ಯಕೀಯ ಆರೈಕೆ ಪಡೆಯಿರಿ. ತೀವ್ರ ಹೊಟ್ಟೆ ಅಥವಾ ಶ್ರೋಣಿಯ ನೋವು, ಮೂರ್ಛೆ, ಅತಿಯಾದ ರಕ್ತಸ್ರಾವ, ಅಥವಾ ಗರ್ಭಧಾರಣೆ ಸಾಧ್ಯವಾಗಿರುವಾಗ ತೀವ್ರ ನೋವು/ರಕ್ತಸ್ರಾವ ಕಂಡರೆ ತಕ್ಷಣ ಪರೀಕ್ಷೆ ಅಗತ್ಯ. ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ. ಈ ಆ್ಯಪ್ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
  hi: "कृपया अभी तुरंत चिकित्सा सहायता लें। पेट या श्रोणि में तेज़ दर्द, बेहोशी, बहुत अधिक रक्तस्राव, या गर्भावस्था की संभावना के साथ तेज़ दर्द/रक्तस्राव में शीघ्र जाँच ज़रूरी है। स्थानीय आपातकालीन सेवा से संपर्क करें या आपातकालीन विभाग जाएँ। यह ऐप आपात स्थिति का आकलन नहीं कर सकता।",
  ta: "தயவுசெய்து இப்போதே அவசர மருத்துவ உதவியைப் பெறுங்கள். கடுமையான வயிறு அல்லது இடுப்புவலி, மயக்கம், மிக அதிக இரத்தப்போக்கு, அல்லது கர்ப்பம் இருக்கக்கூடும் என்ற நிலையில் கடுமையான வலி/இரத்தப்போக்கு ஏற்பட்டால் உடனடி பரிசோதனை தேவை. உள்ளூர் அவசர சேவையைத் தொடர்புகொள்ளவும் அல்லது அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும். இந்தச் செயலி அவசரநிலையை மதிப்பிட முடியாது.",
};

export const PCOS: Record<
  Language,
  {
    title: string;
    intro: string;
    sections: { heading: string; body: string }[];
  }
> = {
  en: {
    title: "PCOS, without the guesswork",
    intro:
      "Polycystic ovary syndrome (PCOS) is a common hormonal and metabolic condition. It can look different from person to person. Symptoms can have other causes, so this page is education—not a way to diagnose yourself.",
    sections: [
      {
        heading: "What it can look like",
        body: "Some people notice irregular or infrequent periods, acne or oily skin, increased facial or body hair, thinning scalp hair, or difficulty with ovulation or fertility. Some also have metabolic concerns. Not everyone has the same features, and no single symptom confirms PCOS.",
      },
      {
        heading: "Why it happens",
        body: "PCOS is linked to hormonal signaling and can run in families. Its exact causes are not fully understood. Hormones, ovulation, skin and hair, and metabolic health may all be involved. A symptom such as a late period or acne may also have many other explanations.",
      },
      {
        heading: "How clinicians assess it",
        body: "A healthcare professional asks about your health and cycle history and may examine you or request blood tests. In adults, assessment considers a combination of features such as androgen-related signs or tests, ovulatory irregularity, and ovarian appearance or other accepted tests. Other causes may need to be ruled out. The approach differs for adolescents. Period changes alone do not establish PCOS.",
      },
      {
        heading: "Everyday support",
        body: "Regular movement, nourishing food, sleep and stress support can benefit general health. There is no single diet or exercise plan that suits everyone, and lifestyle changes do not replace an assessment. A clinician can help tailor care to your goals without blame or stigma.",
      },
      {
        heading: "Questions you could ask",
        body: "What else might explain my symptoms? Which checks are useful for me? Should we review my cycle, skin/hair changes, or metabolic health? What options fit my priorities? When should I follow up?",
      },
      {
        heading: "Myths and facts",
        body: "Myth: irregular periods automatically mean PCOS. Fact: many causes can change a cycle. Myth: PCOS always means ovarian cysts or infertility. Fact: people’s symptoms and fertility experiences differ, and ovarian cysts are not required in every diagnostic pathway. A qualified professional evaluates the whole picture.",
      },
    ],
  },
  kn: {
    title: "ಊಹೆಗಳಿಲ್ಲದೆ PCOS ತಿಳಿಯಿರಿ",
    intro:
      "ಪಾಲಿಸಿಸ್ಟಿಕ್ ಓವರಿ ಸಿಂಡ್ರೋಮ್ (PCOS) ಸಾಮಾನ್ಯ ಹಾರ್ಮೋನ್ ಮತ್ತು ಮೆಟಾಬಾಲಿಕ್ ಸ್ಥಿತಿ. ಪ್ರತಿಯೊಬ್ಬರಲ್ಲೂ ಇದು ವಿಭಿನ್ನವಾಗಿ ಕಾಣಬಹುದು. ಲಕ್ಷಣಗಳಿಗೆ ಬೇರೆ ಕಾರಣಗಳೂ ಇರಬಹುದು; ಈ ಪುಟ ಮಾಹಿತಿ ಮಾತ್ರ, ಸ್ವಯಂ ನಿರ್ಣಯವಲ್ಲ.",
    sections: [
      {
        heading: "ಹೇಗೆ ಕಾಣಬಹುದು",
        body: "ಕೆಲವರಿಗೆ ಅನಿಯಮಿತ ಅಥವಾ ಕಡಿಮೆ ಬಾರಿ ಪೀರಿಯಡ್ಸ್, ಮೊಡವೆ ಅಥವಾ ಎಣ್ಣೆಯ ಚರ್ಮ, ಮುಖ/ದೇಹದಲ್ಲಿ ಹೆಚ್ಚುವರಿ ಕೂದಲು, ತಲೆಯ ಕೂದಲು ತೆಳುವಾಗುವುದು ಅಥವಾ ಅಂಡೋತ್ಸರ್ಗ/ಗರ್ಭಧಾರಣೆಯ ತೊಂದರೆ ಕಾಣಬಹುದು. ಕೆಲವರಿಗೆ ಮೆಟಾಬಾಲಿಕ್ ಆರೋಗ್ಯದ ಕಾಳಜಿಗಳೂ ಇರಬಹುದು. ಎಲ್ಲರಲ್ಲೂ ಒಂದೇ ಲಕ್ಷಣಗಳಿರುವುದಿಲ್ಲ; ಒಂದೇ ಲಕ್ಷಣದಿಂದ PCOS ಖಚಿತವಾಗುವುದಿಲ್ಲ.",
      },
      {
        heading: "ಕಾರಣಗಳ ಬಗ್ಗೆ",
        body: "PCOS ಹಾರ್ಮೋನ್ ನಿಯಂತ್ರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ ಮತ್ತು ಕುಟುಂಬದಲ್ಲಿ ಕಾಣಿಸಬಹುದು. ನಿಖರ ಕಾರಣಗಳು ಸಂಪೂರ್ಣವಾಗಿ ತಿಳಿದಿಲ್ಲ. ಹಾರ್ಮೋನ್, ಅಂಡೋತ್ಸರ್ಗ, ಚರ್ಮ/ಕೂದಲು ಮತ್ತು ಮೆಟಾಬಾಲಿಕ್ ಆರೋಗ್ಯ ಇದರಲ್ಲಿ ಭಾಗಿಯಾಗಿರಬಹುದು. ತಡವಾದ ಪೀರಿಯಡ್ ಅಥವಾ ಮೊಡವೆಗೆ ಬೇರೆ ಕಾರಣಗಳೂ ಇರಬಹುದು.",
      },
      {
        heading: "ಆರೋಗ್ಯ ವೃತ್ತಿಪರರು ಹೇಗೆ ಪರಿಶೀಲಿಸುತ್ತಾರೆ",
        body: "ವೃತ್ತಿಪರರು ಆರೋಗ್ಯ ಮತ್ತು ಪೀರಿಯಡ್ ಇತಿಹಾಸವನ್ನು ಕೇಳಿ, ಪರೀಕ್ಷೆ ಅಥವಾ ರಕ್ತ ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಬಹುದು. ವಯಸ್ಕರಲ್ಲಿ ಆಂಡ್ರೋಜನ್ ಲಕ್ಷಣಗಳು/ಪರೀಕ್ಷೆಗಳು, ಅಂಡೋತ್ಸರ್ಗದ ವ್ಯತ್ಯಾಸ ಮತ್ತು ಅಂಡಾಶಯದ ಚಿತ್ರಣ ಅಥವಾ ಒಪ್ಪಿಗೆಯ ಇತರೆ ಪರೀಕ್ಷೆಗಳ ಸಂಯೋಜನೆಯನ್ನು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ. ಬೇರೆ ಕಾರಣಗಳನ್ನೂ ಹೊರತುಪಡಿಸಬೇಕಾಗಬಹುದು. ಕಿಶೋರಿಯರ ವಿಧಾನ ಬೇರೆ. ಪೀರಿಯಡ್ ಬದಲಾವಣೆ ಮಾತ್ರದಿಂದ PCOS ನಿರ್ಧಾರವಾಗುವುದಿಲ್ಲ.",
      },
      {
        heading: "ದಿನನಿತ್ಯದ ಆರೈಕೆ",
        body: "ನಿಯಮಿತ ಚಲನೆ, ಪೋಷಕ ಆಹಾರ, ನಿದ್ರೆ ಮತ್ತು ಒತ್ತಡ ನಿರ್ವಹಣೆ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯಕ್ಕೆ ನೆರವಾಗಬಹುದು. ಎಲ್ಲರಿಗೂ ಹೊಂದುವ ಒಂದೇ ಆಹಾರ ಅಥವಾ ವ್ಯಾಯಾಮ ಯೋಜನೆ ಇಲ್ಲ; ಜೀವನಶೈಲಿ ಬದಲಾವಣೆಗಳು ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಬದಲಿಯಲ್ಲ. ನಿಮ್ಮ ಗುರಿಗಳಿಗೆ ತಕ್ಕ ಆರೈಕೆಯನ್ನು ವೃತ್ತಿಪರರೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
      },
      {
        heading: "ವೃತ್ತಿಪರರನ್ನು ಕೇಳಬಹುದಾದ ಪ್ರಶ್ನೆಗಳು",
        body: "ನನ್ನ ಲಕ್ಷಣಗಳಿಗೆ ಬೇರೆ ಕಾರಣಗಳಿರಬಹುದೇ? ನನಗೆ ಯಾವ ಪರೀಕ್ಷೆಗಳು ಉಪಯುಕ್ತ? ಪೀರಿಯಡ್, ಚರ್ಮ/ಕೂದಲು ಅಥವಾ ಮೆಟಾಬಾಲಿಕ್ ಆರೋಗ್ಯ ಪರಿಶೀಲಿಸಬೇಕೇ? ನನ್ನ ಆದ್ಯತೆಗಳಿಗೆ ಯಾವ ಆಯ್ಕೆಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತವೆ? ಮತ್ತೆ ಯಾವಾಗ ಭೇಟಿ ನೀಡಬೇಕು?",
      },
      {
        heading: "ನಂಬಿಕೆ ಮತ್ತು ಸತ್ಯ",
        body: "ನಂಬಿಕೆ: ಅನಿಯಮಿತ ಪೀರಿಯಡ್ಸ್ ಎಂದರೆ PCOS. ಸತ್ಯ: ಚಕ್ರದಲ್ಲಿ ಬದಲಾವಣೆಗೆ ಹಲವು ಕಾರಣಗಳಿವೆ. ನಂಬಿಕೆ: PCOS ಇದ್ದರೆ ಅಂಡಾಶಯದಲ್ಲಿ ಸಿಸ್ಟ್ ಅಥವಾ ಬಂಜೆತನ ಖಚಿತ. ಸತ್ಯ: ಲಕ್ಷಣಗಳು ಮತ್ತು ಗರ್ಭಧಾರಣೆಯ ಅನುಭವ ವಿಭಿನ್ನ; ಪ್ರತಿ ನಿರ್ಣಯ ವಿಧಾನದಲ್ಲೂ ಸಿಸ್ಟ್ ಅಗತ್ಯವಿಲ್ಲ. ಅರ್ಹ ವೃತ್ತಿಪರರು ಸಂಪೂರ್ಣ ಸ್ಥಿತಿಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತಾರೆ.",
      },
    ],
  },
  hi: {
    title: "अनुमान नहीं, PCOS की समझ",
    intro:
      "पॉलीसिस्टिक ओवरी सिंड्रोम (PCOS) एक आम हार्मोनल और मेटाबॉलिक स्थिति है। यह हर व्यक्ति में अलग दिख सकती है। लक्षणों के अन्य कारण भी हो सकते हैं; यह पृष्ठ जानकारी देता है, स्वयं निदान नहीं।",
    sections: [
      {
        heading: "यह कैसा दिख सकता है",
        body: "कुछ लोगों को अनियमित या कम पीरियड, मुहाँसे या तैलीय त्वचा, चेहरे/शरीर पर अधिक बाल, सिर के बाल पतले होना, या ओव्यूलेशन/गर्भधारण में कठिनाई दिख सकती है। कुछ को मेटाबॉलिक स्वास्थ्य की चिंता भी हो सकती है। सबके लक्षण समान नहीं होते; एक लक्षण से PCOS की पुष्टि नहीं होती।",
      },
      {
        heading: "संभावित कारण",
        body: "PCOS हार्मोन के संकेतों से जुड़ा है और परिवारों में हो सकता है। इसके सटीक कारण पूरी तरह समझे नहीं गए हैं। हार्मोन, ओव्यूलेशन, त्वचा/बाल और मेटाबॉलिक स्वास्थ्य इसमें शामिल हो सकते हैं। देर से पीरियड या मुहाँसों के कई अन्य कारण भी हैं।",
      },
      {
        heading: "स्वास्थ्यकर्मी कैसे जाँचते हैं",
        body: "स्वास्थ्यकर्मी स्वास्थ्य और मासिक-चक्र का इतिहास पूछ सकते हैं और जाँच या रक्त परीक्षण सुझा सकते हैं। वयस्कों में एंड्रोजन से जुड़े संकेत/परीक्षण, ओव्यूलेशन में बदलाव और अंडाशय का रूप या अन्य स्वीकृत जाँचों के संयोजन पर विचार होता है। अन्य कारणों को बाहर करना भी ज़रूरी हो सकता है। किशोरों में तरीका अलग है। केवल पीरियड में बदलाव PCOS सिद्ध नहीं करता।",
      },
      {
        heading: "रोज़मर्रा की देखभाल",
        body: "नियमित गतिविधि, पौष्टिक भोजन, नींद और तनाव में सहयोग सामान्य स्वास्थ्य के लिए लाभकारी हो सकते हैं। हर किसी के लिए एक ही आहार या व्यायाम योजना नहीं होती और जीवनशैली बदलाव जाँच का विकल्प नहीं हैं। अपने लक्ष्यों के अनुरूप देखभाल के लिए स्वास्थ्यकर्मी से बात करें।",
      },
      {
        heading: "स्वास्थ्यकर्मी से पूछने योग्य बातें",
        body: "मेरे लक्षणों के अन्य कारण क्या हो सकते हैं? मेरे लिए कौन-सी जाँच उपयोगी है? क्या चक्र, त्वचा/बाल या मेटाबॉलिक स्वास्थ्य की समीक्षा करनी चाहिए? मेरी प्राथमिकताओं के अनुरूप विकल्प क्या हैं? अगली मुलाक़ात कब हो?",
      },
      {
        heading: "मिथक और तथ्य",
        body: "मिथक: अनियमित पीरियड का मतलब PCOS है। तथ्य: चक्र में बदलाव के कई कारण होते हैं। मिथक: PCOS में हमेशा अंडाशय में सिस्ट या बांझपन होता है। तथ्य: लक्षण और प्रजनन अनुभव अलग-अलग हैं; हर निदान-पद्धति में सिस्ट ज़रूरी नहीं। योग्य स्वास्थ्यकर्मी पूरी स्थिति का आकलन करते हैं।",
      },
    ],
  },
  ta: {
    title: "ஊகமின்றி PCOS-ஐப் புரிந்துகொள்வோம்",
    intro:
      "பாலிசிஸ்டிக் ஓவரி சிண்ட்ரோம் (PCOS) ஒரு பொதுவான ஹார்மோன் மற்றும் வளர்சிதை மாற்ற நிலை. ஒவ்வொருவருக்கும் இது வேறுபடலாம். அறிகுறிகளுக்கு வேறு காரணங்களும் இருக்கலாம்; இது தகவல் மட்டுமே, சுய நோயறிதல் அல்ல.",
    sections: [
      {
        heading: "எப்படி தோன்றலாம்",
        body: "சிலருக்கு ஒழுங்கற்ற அல்லது குறைவான மாதவிடாய், முகப்பரு/எண்ணெய்ப்பசை தோல், முகம் அல்லது உடலில் அதிக முடி, தலை முடி மெலிதல், அல்லது அண்டவிடுப்பு/கருவுறுதலில் சிரமம் இருக்கலாம். வளர்சிதை மாற்ற நலக் கவலைகளும் இருக்கலாம். அனைவருக்கும் ஒரே அறிகுறிகள் இருக்காது; ஒரே அறிகுறி PCOS-ஐ உறுதிப்படுத்தாது.",
      },
      {
        heading: "ஏன் ஏற்படலாம்",
        body: "PCOS ஹார்மோன் செயல்பாட்டுடன் தொடர்புடையது; குடும்பத்திலும் காணப்படலாம். துல்லியமான காரணங்கள் முழுமையாகத் தெரியவில்லை. ஹார்மோன்கள், அண்டவிடுப்பு, தோல்/முடி மற்றும் வளர்சிதை மாற்ற நலம் இதில் பங்கெடுக்கலாம். தாமதமான மாதவிடாய் அல்லது முகப்பருவுக்கு வேறு பல காரணங்களும் உண்டு.",
      },
      {
        heading: "சுகாதார நிபுணர்கள் எப்படிப் பரிசோதிப்பார்கள்",
        body: "நிபுணர் உடல்நலம் மற்றும் மாதவிடாய் வரலாற்றைக் கேட்டு, பரிசோதனை அல்லது இரத்தப் பரிசோதனைகளைப் பரிந்துரைக்கலாம். பெரியவர்களுக்கு ஆண்ட்ரோஜன் தொடர்பான அறிகுறிகள்/பரிசோதனைகள், அண்டவிடுப்பு மாற்றங்கள், கருப்பையின் தோற்றம் அல்லது ஏற்றுக்கொள்ளப்பட்ட பிற பரிசோதனைகளின் சேர்க்கை கருதப்படும். வேறு காரணங்களும் விலக்கப்பட வேண்டும். இளம்பருவத்தினருக்கான அணுகுமுறை வேறுபடும். மாதவிடாய் மாற்றம் மட்டும் PCOS-ஐ நிரூபிக்காது.",
      },
      {
        heading: "அன்றாட ஆதரவு",
        body: "தொடர்ந்த உடற்பயிற்சி, சத்தான உணவு, தூக்கம் மற்றும் மனஅழுத்த ஆதரவு பொது நலத்திற்கு உதவலாம். அனைவருக்கும் ஒரே உணவு அல்லது உடற்பயிற்சித் திட்டம் இல்லை; வாழ்க்கைமுறை மாற்றங்கள் மருத்துவ மதிப்பீட்டுக்கு மாற்றாகாது. உங்கள் இலக்குகளுக்கு ஏற்ற பராமரிப்பை நிபுணருடன் ஆலோசிக்கவும்.",
      },
      {
        heading: "நிபுணரிடம் கேட்கக்கூடியவை",
        body: "என் அறிகுறிகளுக்கு வேறு காரணங்கள் இருக்குமா? எனக்கு எந்தப் பரிசோதனைகள் பயனுள்ளதாக இருக்கும்? மாதவிடாய், தோல்/முடி அல்லது வளர்சிதை நலத்தை மதிப்பிட வேண்டுமா? என் விருப்பங்களுக்கு ஏற்ற தேர்வுகள் என்ன? எப்போது மீண்டும் சந்திக்க வேண்டும்?",
      },
      {
        heading: "புரளியும் உண்மையும்",
        body: "புரளி: ஒழுங்கற்ற மாதவிடாய் என்றால் PCOS. உண்மை: சுழற்சி மாற்றத்திற்கு பல காரணங்கள் உள்ளன. புரளி: PCOS என்றால் எப்போதும் கருப்பை நீர்க்கட்டிகள் அல்லது கருத்தரிக்க முடியாமை. உண்மை: அறிகுறிகளும் கருத்தரிப்பு அனுபவமும் மாறுபடும்; எல்லா நோயறிதல் முறைகளிலும் நீர்க்கட்டி அவசியமில்லை. தகுதியுள்ள நிபுணர் முழு நிலையையும் மதிப்பிடுவார்.",
      },
    ],
  },
};

export function urgentWarning(text: string): boolean {
  const s = text.toLowerCase();
  const groups = [
    /severe.{0,30}(abdominal|stomach|belly|pelvic).{0,20}(pain|ache)|(?:abdominal|stomach|belly|pelvic).{0,20}(?:severe|unbearable|very bad).{0,10}(?:pain|ache)|faint(?:ed|ing)|pass(?:ed )?out|unconscious|very heavy bleeding|soak(?:ing)? (?:a )?(?:pad|tampon).{0,15}(?:hour|quick)|pregnan.{0,50}(?:severe pain|heavy bleed|bleed)|possible pregnancy.{0,35}(?:pain|bleed)|(?:severe pain|pain|bleed).{0,50}(?:possible pregnancy|pregnan)/,
    /ತೀವ್ರ.{0,18}(?:ಹೊಟ್ಟೆ|ಶ್ರೋಣಿ|ನೋವು)|(?:ಮೂರ್ಛೆ|ಪ್ರಜ್ಞೆ ತಪ್ಪಿ|ಅತಿಯಾದ ರಕ್ತಸ್ರಾವ|ತುಂಬಾ ರಕ್ತಸ್ರಾವ)|(?:ಗರ್ಭಧಾರಣೆ|ಗರ್ಭಿಣಿ).{0,30}(?:ನೋವು|ರಕ್ತಸ್ರಾವ)|(?:ನೋವು|ರಕ್ತಸ್ರಾವ).{0,30}(?:ಗರ್ಭಧಾರಣೆ|ಗರ್ಭಿಣಿ)/,
    /(?:तेज़|तीव्र|असहनीय).{0,18}(?:पेट|श्रोणि|दर्द)|(?:बेहोश|मूर्छित|बहुत अधिक रक्तस्राव|भारी रक्तस्राव)|(?:गर्भावस्था|गर्भवती|संभावित गर्भ).{0,35}(?:दर्द|रक्तस्राव|खून)|(?:दर्द|रक्तस्राव|खून).{0,35}(?:गर्भावस्था|गर्भवती|संभावित गर्भ)/,
    /(?:கடுமையான|தாங்க முடியாத).{0,18}(?:வயிறு|இடுப்பு|வலி)|(?:மயக்கம்|நினைவிழப்பு|மிக அதிக இரத்தப்போக்கு|அதிக இரத்தப்போக்கு)|(?:கர்ப்பம்|கர்ப்பமாக).{0,35}(?:வலி|இரத்தப்போக்கு)|(?:வலி|இரத்தப்போக்கு).{0,35}(?:கர்ப்பம்|கர்ப்பமாக)/,
  ];
  return groups.some(pattern => pattern.test(s));
}

const fallbackAnswers: Record<
  Language,
  {
    pcos: string;
    cycle: string;
    care: string;
    lifestyle: string;
    general: string;
  }
> = {
  en: {
    pcos: "PCOS is a hormonal and metabolic condition that can affect menstrual cycles, skin or hair, ovulation and health in different ways. PCOD is a term some people use for PCOS; PCOS is the term commonly used in current clinical guidance, though usage can vary. Symptoms overlap with other conditions; no single symptom confirms it. A healthcare professional can review your history and decide whether tests are appropriate.",
    cycle:
      "A cycle can change for many reasons, including stress, life stage, pregnancy, changes in health, and hormonal conditions. If changes persist, are worrying, or periods stop for a long time, consider discussing them with a healthcare professional. One change alone does not diagnose PCOS.",
    care: "A healthcare professional can review your cycle and symptoms and discuss whether an examination or tests may help. Seek prompt care if symptoms are severe, sudden, or rapidly worsening.",
    lifestyle:
      "Regular movement, balanced nourishment, adequate sleep and stress support may help general well-being. There is no one plan for everyone, and lifestyle changes do not establish or rule out a diagnosis.",
    general:
      "I’m in fallback mode and can only share curated general information on PCOS, menstrual-cycle changes, supportive habits and seeking care. I could not interpret this question reliably. You can rephrase it or contact a qualified health professional. I will not guess or switch languages.",
  },
  kn: {
    pcos: "PCOS ಒಂದು ಹಾರ್ಮೋನ್ ಮತ್ತು ಮೆಟಾಬಾಲಿಕ್ ಸ್ಥಿತಿ. ಇದು ಪೀರಿಯಡ್ಸ್, ಚರ್ಮ/ಕೂದಲು, ಅಂಡೋತ್ಸರ್ಗ ಮತ್ತು ಆರೋಗ್ಯವನ್ನು ವಿಭಿನ್ನವಾಗಿ ಪ್ರಭಾವಿಸಬಹುದು. ಕೆಲವರು PCOD ಪದವನ್ನು PCOSಗಾಗಿ ಬಳಸುತ್ತಾರೆ; ಪ್ರಸ್ತುತ ವೈದ್ಯಕೀಯ ಮಾರ್ಗದರ್ಶನದಲ್ಲಿ PCOS ಸಾಮಾನ್ಯ ಪದವಾದರೂ ಬಳಕೆ ಬದಲಾಗಬಹುದು. ಲಕ್ಷಣಗಳು ಬೇರೆ ಸ್ಥಿತಿಗಳಿಗೂ ಹೋಲುತ್ತವೆ; ಒಂದೇ ಲಕ್ಷಣದಿಂದ ಖಚಿತವಾಗುವುದಿಲ್ಲ. ಆರೋಗ್ಯ ವೃತ್ತಿಪರರು ಇತಿಹಾಸ ಪರಿಶೀಲಿಸಿ ಪರೀಕ್ಷೆಗಳ ಅಗತ್ಯವನ್ನು ನಿರ್ಧರಿಸಬಹುದು.",
    cycle:
      "ಒತ್ತಡ, ಜೀವನದ ಹಂತ, ಗರ್ಭಧಾರಣೆ, ಆರೋಗ್ಯ ಬದಲಾವಣೆಗಳು ಅಥವಾ ಹಾರ್ಮೋನ್ ಸ್ಥಿತಿಗಳಿಂದ ಚಕ್ರ ಬದಲಾಗಬಹುದು. ಬದಲಾವಣೆ ಮುಂದುವರಿದರೆ, ಚಿಂತೆ ತಂದರೆ ಅಥವಾ ಪೀರಿಯಡ್ಸ್ ಬಹಳ ಕಾಲ ನಿಂತರೆ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಚರ್ಚಿಸಿ. ಒಂದೇ ಬದಲಾವಣೆಯಿಂದ PCOS ನಿರ್ಧಾರವಾಗುವುದಿಲ್ಲ.",
    care: "ಆರೋಗ್ಯ ವೃತ್ತಿಪರರು ನಿಮ್ಮ ಚಕ್ರ ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಪರೀಕ್ಷೆ ಬೇಕೇ ಎಂದು ಚರ್ಚಿಸಬಹುದು. ತೀವ್ರ, ಹಠಾತ್ ಅಥವಾ ವೇಗವಾಗಿ ಹೆಚ್ಚಾಗುವ ಲಕ್ಷಣಗಳಿಗೆ ಬೇಗ ಆರೈಕೆ ಪಡೆಯಿರಿ.",
    lifestyle:
      "ನಿಯಮಿತ ಚಲನೆ, ಸಮತೋಲಿತ ಪೋಷಣೆ, ಸಾಕಷ್ಟು ನಿದ್ರೆ ಮತ್ತು ಒತ್ತಡ ನಿರ್ವಹಣೆ ಸಾಮಾನ್ಯ ಕ್ಷೇಮಕ್ಕೆ ನೆರವಾಗಬಹುದು. ಎಲ್ಲರಿಗೂ ಒಂದೇ ಯೋಜನೆ ಇಲ್ಲ; ಜೀವನಶೈಲಿ ಬದಲಾವಣೆಗಳು ನಿರ್ಣಯಕ್ಕೆ ಬದಲಿಯಲ್ಲ.",
    general:
      "ನಾನು ಪರ್ಯಾಯ ವಿಧಾನದಲ್ಲಿದ್ದೇನೆ; PCOS, ಪೀರಿಯಡ್ ಚಕ್ರದ ಬದಲಾವಣೆ, ಬೆಂಬಲಕಾರಿ ಅಭ್ಯಾಸಗಳು ಮತ್ತು ಆರೈಕೆ ಪಡೆಯುವ ಬಗ್ಗೆ ಸಂಗ್ರಹಿತ ಸಾಮಾನ್ಯ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನೀಡಬಹುದು. ಈ ಪ್ರಶ್ನೆಯನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಕೇಳಿ ಅಥವಾ ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಾನು ಊಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ಭಾಷೆ ಬದಲಿಸುವುದಿಲ್ಲ.",
  },
  hi: {
    pcos: "PCOS एक हार्मोनल और मेटाबॉलिक स्थिति है, जो मासिक चक्र, त्वचा/बाल, ओव्यूलेशन और स्वास्थ्य को अलग-अलग तरह से प्रभावित कर सकती है। कुछ लोग PCOD शब्द का उपयोग PCOS के लिए करते हैं; वर्तमान नैदानिक मार्गदर्शन में PCOS आम शब्द है, हालांकि उपयोग बदल सकता है। लक्षण अन्य स्थितियों से मिल सकते हैं; एक लक्षण से पुष्टि नहीं होती। स्वास्थ्यकर्मी इतिहास देखकर जाँच की ज़रूरत तय कर सकते हैं।",
    cycle:
      "तनाव, जीवन का चरण, गर्भावस्था, स्वास्थ्य में बदलाव और हार्मोनल स्थितियाँ चक्र बदल सकती हैं। बदलाव जारी रहे, चिंता हो या लंबे समय तक पीरियड न आए तो स्वास्थ्यकर्मी से बात करें। एक बदलाव से PCOS का निदान नहीं होता।",
    care: "स्वास्थ्यकर्मी आपके चक्र और लक्षणों की समीक्षा कर सकते हैं और जाँच की उपयोगिता पर चर्चा कर सकते हैं। लक्षण तेज़, अचानक या तेजी से बिगड़ें तो शीघ्र सहायता लें।",
    lifestyle:
      "नियमित गतिविधि, संतुलित पोषण, पर्याप्त नींद और तनाव-सहयोग सामान्य स्वास्थ्य में मदद कर सकते हैं। सभी के लिए एक ही योजना नहीं होती और जीवनशैली बदलाव निदान का विकल्प नहीं हैं।",
    general:
      "मैं फॉलबैक मोड में हूँ और केवल PCOS, मासिक चक्र में बदलाव, सहायक आदतों और देखभाल के बारे में चुनी हुई सामान्य जानकारी दे सकती हूँ। मैं इस प्रश्न को भरोसे से समझ नहीं पाई। इसे दूसरे शब्दों में पूछें या योग्य स्वास्थ्यकर्मी से बात करें। मैं अनुमान नहीं लगाऊँगी और भाषा नहीं बदलूँगी।",
  },
  ta: {
    pcos: "PCOS ஒரு ஹார்மோன் மற்றும் வளர்சிதை மாற்ற நிலை. இது மாதவிடாய் சுழற்சி, தோல்/முடி, அண்டவிடுப்பு மற்றும் நலனை வெவ்வேறு விதமாகப் பாதிக்கலாம். சிலர் PCOD என்ற சொல்லை PCOS-ஐக் குறிக்கப் பயன்படுத்துகிறார்கள்; தற்போதைய மருத்துவ வழிகாட்டுதலில் PCOS பொதுவாகப் பயன்படுகிறது, ஆனால் பயன்பாடு மாறலாம். அறிகுறிகள் பிற நிலைகளுடனும் ஒத்திருக்கலாம்; ஒரே அறிகுறி உறுதிப்படுத்தாது. சுகாதார நிபுணர் வரலாற்றைப் பார்த்து பரிசோதனையின் தேவையைத் தீர்மானிக்கலாம்.",
    cycle:
      "மனஅழுத்தம், வாழ்க்கை நிலை, கர்ப்பம், உடல்நல மாற்றங்கள் அல்லது ஹார்மோன் நிலைகள் சுழற்சியை மாற்றலாம். மாற்றம் தொடர்ந்தால், கவலை அளித்தால் அல்லது நீண்டகாலம் மாதவிடாய் வராவிட்டால் நிபுணரிடம் பேசுங்கள். ஒரே மாற்றம் PCOS நோயறிதல் அல்ல.",
    care: "நிபுணர் உங்கள் சுழற்சி மற்றும் அறிகுறிகளை மதிப்பிட்டு, பரிசோதனை உதவுமா எனப் பேசலாம். அறிகுறிகள் கடுமையாக, திடீரென அல்லது விரைவாக மோசமானால் உடனடி உதவி பெறுங்கள்.",
    lifestyle:
      "தொடர்ந்த இயக்கம், சமச்சீர் உணவு, போதிய தூக்கம் மற்றும் மனஅழுத்த ஆதரவு பொது நலத்திற்கு உதவலாம். அனைவருக்கும் ஒரே திட்டம் இல்லை; வாழ்க்கைமுறை மாற்றங்கள் நோயறிதலுக்குப் பதிலல்ல.",
    general:
      "நான் மாற்று முறையில் உள்ளேன்; PCOS, மாதவிடாய் மாற்றங்கள், ஆதரவான பழக்கங்கள் மற்றும் பராமரிப்பு பெறுதல் பற்றிய தொகுக்கப்பட்ட பொதுத் தகவலை மட்டுமே வழங்க முடியும். இந்தக் கேள்வியை நம்பகமாகப் புரிந்துகொள்ள முடியவில்லை. வேறு சொற்களில் கேளுங்கள் அல்லது தகுதியுள்ள நிபுணரிடம் பேசுங்கள். நான் ஊகிக்கவோ மொழியை மாற்றவோ மாட்டேன்.",
  },
};
export function fallbackAnswer(text: string, language: Language): string {
  const s = text.toLowerCase();
  const a = fallbackAnswers[language];
  if (
    /pcos|pcod|ಪಿಸಿಒಎಸ್|ಪಿಸಿಓಎಸ್|ಪಿಸಿಒಡಿ|पीसीओएस|पीसीओडी|பிசிஓஎஸ்|பிசிஓடி/.test(
      s
    )
  )
    return a.pcos;
  if (
    /period|cycle|ಪೀರಿಯಡ್|ಮುಟ್ಟ|माहवारी|पीरियड|मासिक|மாதவிடாய்|சுழற்சி/.test(s)
  )
    return a.cycle;
  if (
    /when.*(?:doctor|care|help)|consult|ವೈದ್ಯ|ಆರೈಕೆ|डॉक्टर|चिकित्स|மருத்துவர்|உதவி/.test(
      s
    )
  )
    return a.care;
  if (
    /lifestyle|habit|exercise|food|ಆಹಾರ|ವ್ಯಾಯಾಮ|ಜೀವನಶೈಲಿ|खानपान|व्यायाम|जीवनशैली|உணவு|உடற்பயிற்சி/.test(
      s
    )
  )
    return a.lifestyle;
  return a.general;
}

const symptomsTerms: Record<Language, Record<string, string[]>> = {
  en: {
    "menstrual change": ["period", "cycle", "bleeding"],
    "acne/skin": ["acne", "pimple", "oily skin"],
    pain: ["pain", "cramp", "ache"],
    "hair change": ["hair loss", "hair thinning", "facial hair"],
  },
  kn: {
    "menstrual change": ["ಪೀರಿಯಡ್", "ಮುಟ್ಟ", "ರಕ್ತಸ್ರಾವ"],
    "acne/skin": ["ಮೊಡವೆ", "ಎಣ್ಣೆಯ ಚರ್ಮ"],
    pain: ["ನೋವು", "ಸೆಳೆತ"],
    "hair change": ["ಕೂದಲು", "ಮುಖದ ಕೂದಲು"],
  },
  hi: {
    "menstrual change": ["पीरियड", "माहवारी", "रक्तस्राव"],
    "acne/skin": ["मुहाँसे", "तैलीय त्वचा"],
    pain: ["दर्द", "ऐंठन"],
    "hair change": ["बाल झड़", "चेहरे पर बाल"],
  },
  ta: {
    "menstrual change": ["மாதவிடாய்", "இரத்தப்போக்கு"],
    "acne/skin": ["முகப்பரு", "எண்ணெய்ப்பசை"],
    pain: ["வலி", "பிடிப்பு"],
    "hair change": ["முடி உதிர்", "முக முடி"],
  },
};
export function summarizeSymptoms(text: string, language: Language) {
  const s = text.toLowerCase();
  const labels: Record<Language, Record<string, string>> = {
    en: {
      "menstrual change": "menstrual changes",
      "acne/skin": "acne or skin changes",
      pain: "pain or discomfort",
      "hair change": "hair changes",
    },
    kn: {
      "menstrual change": "ಪೀರಿಯಡ್ ಬದಲಾವಣೆ",
      "acne/skin": "ಮೊಡವೆ ಅಥವಾ ಚರ್ಮದ ಬದಲಾವಣೆ",
      pain: "ನೋವು ಅಥವಾ ಅಸೌಕರ್ಯ",
      "hair change": "ಕೂದಲಿನ ಬದಲಾವಣೆ",
    },
    hi: {
      "menstrual change": "मासिक चक्र में बदलाव",
      "acne/skin": "मुहाँसे या त्वचा में बदलाव",
      pain: "दर्द या असुविधा",
      "hair change": "बालों में बदलाव",
    },
    ta: {
      "menstrual change": "மாதவிடாய் மாற்றங்கள்",
      "acne/skin": "முகப்பரு அல்லது தோல் மாற்றம்",
      pain: "வலி அல்லது அசௌகரியம்",
      "hair change": "முடி மாற்றங்கள்",
    },
  };
  const reported = Object.entries(symptomsTerms[language])
    .filter(([, terms]) => terms.some(term => s.includes(term)))
    .map(([label]) => labels[language][label]);
  const duration =
    text.match(
      /\b(?:\d+|one|two|three|four|five|several|ಒಂದು|ಎರಡು|ಮೂರು|ನಾಲ್ಕು|ಐದು|एक|दो|तीन|चार|पाँच|ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து)\s*(?:days?|weeks?|months?|years?|ನಾಳು|ದಿನ|ವಾರ|ತಿಂಗಳು|ವರ್ಷ|दिन|हफ्ते|महीने|साल|நாட்கள்?|வாரங்கள்?|மாதங்கள்?|ஆண்டுகள்?)\b/i
    )?.[0] ?? null;
  const sentences: Record<
    Language,
    {
      symptoms: string;
      duration: string;
      frequency: string;
      severity: string;
      context: string;
      notProvided: string;
      none: string;
      caution: string;
    }
  > = {
    en: {
      symptoms: "Reported symptom categories",
      duration: "Duration mentioned",
      frequency: "Frequency",
      severity: "Severity",
      context: "Other context",
      notProvided: "Not provided / not reliably extracted",
      none: "No specific symptom category could be reliably identified from these words",
      caution:
        "This basic fallback summary is not a diagnosis. Please correct it if anything is missing or misunderstood.",
    },
    kn: {
      symptoms: "ನೀವು ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳ ವರ್ಗಗಳು",
      duration: "ತಿಳಿಸಿದ ಅವಧಿ",
      frequency: "ಆವರ್ತನೆ",
      severity: "ತೀವ್ರತೆ",
      context: "ಇತರೆ ಸಂದರ್ಭ",
      notProvided: "ನೀಡಿಲ್ಲ / ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಪತ್ತೆಯಾಗಿಲ್ಲ",
      none: "ಈ ಪದಗಳಿಂದ ನಿರ್ದಿಷ್ಟ ಲಕ್ಷಣ ವರ್ಗವನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ",
      caution:
        "ಈ ಸರಳ ಪರ್ಯಾಯ ಸಾರಾಂಶವು ನಿರ್ಣಯವಲ್ಲ. ಏನಾದರೂ ತಪ್ಪಿದ್ದರೆ ಅಥವಾ ಬಿಟ್ಟಿದ್ದರೆ ದಯವಿಟ್ಟು ತಿದ್ದಿ.",
    },
    hi: {
      symptoms: "बताए गए लक्षणों की श्रेणियाँ",
      duration: "बताई गई अवधि",
      frequency: "आवृत्ति",
      severity: "तीव्रता",
      context: "अन्य संदर्भ",
      notProvided: "नहीं बताया गया / भरोसेमंद तरीके से नहीं निकाला जा सका",
      none: "इन शब्दों से किसी लक्षण श्रेणी की भरोसेमंद पहचान नहीं हो पाई",
      caution:
        "यह साधारण फॉलबैक सारांश निदान नहीं है। कुछ गलत या छूटा हो तो कृपया सुधारें।",
    },
    ta: {
      symptoms: "தெரிவிக்கப்பட்ட அறிகுறி வகைகள்",
      duration: "குறிப்பிட்ட கால அளவு",
      frequency: "அடிக்கடி நிகழ்வு",
      severity: "தீவிரம்",
      context: "பிற சூழல்",
      notProvided: "வழங்கப்படவில்லை / நம்பகமாகப் பெற முடியவில்லை",
      none: "இந்தச் சொற்களிலிருந்து அறிகுறி வகையை நம்பகமாக அடையாளம் காண முடியவில்லை",
      caution:
        "இந்த எளிய மாற்றுச் சுருக்கம் நோயறிதல் அல்ல. தவறாகவோ விடுபட்டதாகவோ இருந்தால் திருத்தவும்.",
    },
  };
  const l = sentences[language];
  const summary = `${l.symptoms}: ${reported.length ? reported.join(", ") : l.none}.\n${l.duration}: ${duration ?? l.notProvided}.\n${l.frequency}: ${l.notProvided}.\n${l.severity}: ${l.notProvided}.\n${l.context}: ${l.notProvided}.\n\n${l.caution}`;
  const nextSteps: Record<Language, string> = {
    en: "If the change continues or concerns you, consider a clinician visit and bring this original description. Seek urgent care for severe symptoms.",
    kn: "ಬದಲಾವಣೆ ಮುಂದುವರಿದರೆ ಅಥವಾ ಚಿಂತೆ ತಂದರೆ, ಈ ಮೂಲ ವಿವರಣೆಯೊಂದಿಗೆ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಭೇಟಿ ಮಾಡುವುದನ್ನು ಪರಿಗಣಿಸಿ. ತೀವ್ರ ಲಕ್ಷಣಗಳಿಗೆ ತುರ್ತು ಆರೈಕೆ ಪಡೆಯಿರಿ.",
    hi: "बदलाव जारी रहे या चिंता हो तो इस मूल विवरण के साथ स्वास्थ्यकर्मी से मिलने पर विचार करें। गंभीर लक्षणों में तुरंत सहायता लें।",
    ta: "மாற்றம் தொடர்ந்தால் அல்லது கவலை அளித்தால், இந்த அசல் விளக்கத்துடன் சுகாதார நிபுணரை அணுகுங்கள். கடுமையான அறிகுறிகளுக்கு அவசர உதவி பெறுங்கள்.",
  };
  return {
    summary,
    nextSteps: nextSteps[language],
    duration,
    reportedCategories: reported,
  };
}
