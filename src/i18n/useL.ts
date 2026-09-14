import { useLanguage } from './LanguageContext';

/** Raccourci pour les libellés bilingues inline : L('Texte FR', 'EN text'). */
export function useL() {
  const { language } = useLanguage();
  return (fr: string, en: string) => (language === 'fr' ? fr : en);
}

export const nf = (n: number, lang: 'fr' | 'en', digits = 0) =>
  n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
