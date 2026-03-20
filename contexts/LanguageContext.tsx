import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import mr from "@/locales/mr.json";

export type Lang = "en" | "mr" | "hi";

const TRANSLATIONS = { en, mr, hi };
const STORAGE_KEY = "agridas_language";

// Nested key accessor — t("home.welcomeBack")
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? path;
}

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && ["en", "mr", "hi"].includes(saved)) {
        setLangState(saved as Lang);
      }
    });
  }, []);

  const setLang = async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string): string =>
    getNestedValue(TRANSLATIONS[lang], key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);