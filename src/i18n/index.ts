import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en.json";
import tr from "./tr.json";

const RESOURCES = {
  en: { translation: en },
  tr: { translation: tr },
};

const LANGUAGE_KEY = "user-language";

// Detect language manually to support Async Storage & Device Locale
const getLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
  } catch (error) {
    console.log("Error reading language from storage", error);
  }

  const deviceLocales = Localization.getLocales();
  const deviceLanguage = deviceLocales[0]?.languageCode;
  return deviceLanguage || "en";
};

// Initialize i18next
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: RESOURCES,
  lng: "en", // Default initial value, updated async below
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false, // Avoid suspense issues in some RN environments
  },
});

// Async update language
getLanguage().then((lang) => {
  i18n.changeLanguage(lang);
});

export const setLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
