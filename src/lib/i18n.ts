// Minimal string table for user-visible UI copy that needs translation.
// We currently render English on every route — so for every key the `en`
// entry is the only one used. The other locale entries are kept here as a
// landing pad: when a locale ships, fill the blanks here and pass the
// matching code via `Astro.currentLocale` to consumers.
//
// Usage:
//   import { t } from '../../lib/i18n';
//   const label = t('gallery.seeAll', Astro.currentLocale);

export const LOCALES = ['en', 'el', 'it', 'fr', 'de', 'es'] as const;
export type Locale = typeof LOCALES[number];

type StringEntry = Record<Locale, string>;

const STRINGS = {
  'gallery.seeAll': {
    en: 'See all photos',
    el: 'Δες τα όλα',
    it: 'Vedi tutte le foto',
    fr: 'Voir toutes les photos',
    de: 'Alle Fotos anzeigen',
    es: 'Ver todas las fotos',
  },
} as const satisfies Record<string, StringEntry>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, locale: string | undefined = 'en'): string {
  const safe: Locale = (LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : 'en';
  return STRINGS[key][safe];
}
