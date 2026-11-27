import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationES from './locales/es.json';

const PUBLIC_LANG_KEY = 'ac_public_lang';

const resources = {
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
};

function normalizeLang(lang: string | null | undefined): 'es' | 'en' | null {
  if (!lang) return null;
  const lower = lang.toLowerCase();
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return null;
}

function detectInitialLanguage(): 'es' | 'en' {
  if (typeof window !== 'undefined') {
    const queryLang = normalizeLang(new URLSearchParams(window.location.search).get('lang'));
    if (queryLang) return queryLang;

    try {
      const savedLang = normalizeLang(localStorage.getItem(PUBLIC_LANG_KEY));
      if (savedLang) return savedLang;
    } catch {
      // Ignore storage access failures in private browsing
    }

    if (typeof navigator !== 'undefined') {
      const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];
      for (const candidate of candidates) {
        const parsed = normalizeLang(candidate);
        if (parsed) return parsed;
      }
    }
  }
  return 'es';
}

const HEAD_SEO = {
  es: {
    htmlLang: 'es-MX',
    title: 'Andrés Cordero | Desarrollo de Software, Procesos, IA & QA en León, Gto. y México',
    description:
      'Ingeniero de Software, Consultor de Procesos y Líder de QA en León, Guanajuato. Desarrollo de software a medida con IA, digitalización y optimización de procesos y pruebas de software para empresas en todo México y en inglés.',
  },
  en: {
    htmlLang: 'en',
    title: 'Andrés Cordero | Custom Software, Process Digitization, AI & QA Lead in Mexico',
    description:
      'Software Engineer, Process Consultant, and QA Lead based in León, Guanajuato, México. Custom software engineering, applied AI, workflow digitization, and QA testing across Mexico and remotely in English.',
  },
} as const;

export function syncDocumentSeo(lang: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const normalized = normalizeLang(lang) || 'es';
  const meta = HEAD_SEO[normalized];

  document.documentElement.lang = meta.htmlLang;

  if (window.location.pathname.startsWith('/admin')) return;

  document.title = meta.title;

  const setMetaContent = (selector: string, content: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  };

  setMetaContent('meta[name="description"]', meta.description);
  setMetaContent('meta[property="og:title"]', meta.title);
  setMetaContent('meta[property="og:description"]', meta.description);
  setMetaContent('meta[name="twitter:title"]', meta.title);
  setMetaContent('meta[name="twitter:description"]', meta.description);
}

const initialLanguage = detectInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

syncDocumentSeo(initialLanguage);

i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLang(lng) || 'es';
  try {
    localStorage.setItem(PUBLIC_LANG_KEY, normalized);
  } catch {
    // Ignore storage access failures in private browsing
  }
  syncDocumentSeo(normalized);
});

export default i18n;
