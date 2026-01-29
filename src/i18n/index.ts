import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

// Import all locale files
import ar from './locales/ar.json';
import az from './locales/az.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import de from './locales/de.json';
import el from './locales/el.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import hr from './locales/hr.json';
import id from './locales/id.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import nl from './locales/nl.json';
import no from './locales/no.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ro from './locales/ro.json';
import ru from './locales/ru.json';
import sv from './locales/sv.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import uk from './locales/uk.json';
import ur from './locales/ur.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';

const i18n = new I18n({
  ar,
  az,
  cs,
  da,
  de,
  el,
  en,
  es,
  fi,
  fr,
  hi,
  hr,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  ur,
  vi,
  zh,
});

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Function to change locale
export const changeLocale = (locale: string) => {
  i18n.locale = locale;
};

// Function to get current locale
export const getCurrentLocale = () => {
  return i18n.locale;
};

export default i18n;
