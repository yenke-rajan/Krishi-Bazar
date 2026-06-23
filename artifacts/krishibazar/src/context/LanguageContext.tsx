import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18n from '../i18n';

type Language = 'en' | 'np';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('kb_lang') as Language;
    if (saved && (saved === 'en' || saved === 'np')) {
      setLanguage(saved);
      i18n.changeLanguage(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const next = language === 'en' ? 'np' : 'en';
    setLanguage(next);
    localStorage.setItem('kb_lang', next);
    i18n.changeLanguage(next);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};