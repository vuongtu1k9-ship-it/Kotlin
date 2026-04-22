import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const apexDetector = {
  name: 'apex',
  lookup() {
    if (typeof window === 'undefined') return undefined;
    const host = window.location.hostname;
    if (host === 'cotuong.xyz' || host === 'www.cotuong.xyz' || host === 'dev.cotuong.xyz' || host === 'auth.cotuong.xyz') {
      return 'vi';
    }
    return undefined;
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    supportedLngs: ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'de', 'ru', 'fr', 'es', 'km', 'id', 'ms', 'it', 'nl', 'fi', 'zh-TW', 'ar', 'my'],
    fallbackLng: {
      'zh-CN': ['zh'],
      'zh-HK': ['zh-TW', 'zh'],
      'zh-MO': ['zh-TW', 'zh'],
      'zh-TW': ['zh-TW', 'zh'],
      'ja-JP': ['ja'],
      'ko-KR': ['ko'],
      'default': ['vi']
    },
    detection: {
      order: ['apex', 'cookie', 'localStorage', 'subdomain', 'navigator', 'htmlTag', 'path'],
      lookupFromSubdomainIndex: 0,
      caches: ['localStorage', 'cookie'],
      cookieOptions: { domain: '.cotuong.xyz', path: '/', sameSite: 'lax' },
    },
  });

i18n.services.languageDetector.addDetector(apexDetector);

// Force re-detection now that we added 'apex'
const detectedLng = i18n.services.languageDetector.detect();
if (detectedLng && i18n.language !== detectedLng) {
  i18n.changeLanguage(detectedLng);
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
