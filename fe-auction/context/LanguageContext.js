"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  
  // State for language
  const [language, setLanguageState] = useState('en');
  
  // Initialize language based on priority
  // Priority: User DB -> LocalStorage -> Default (en)
  useEffect(() => {
    let activeLang = 'en';

    // 1. Check User DB
    if (user?.language) {
      activeLang = user.language;
    } 
    // 2. Check LocalStorage if user not logged in or no language in DB
    else {
      const storedLang = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
      if (storedLang && ['en', 'id'].includes(storedLang)) {
        activeLang = storedLang;
      }
    }

    setLanguageState(activeLang);
  }, [user]);

  /**
   * Set Language
   * Updates state and localStorage only.
   * Does NOT automatically save to DB (user must click Save).
   * @param {string} lang - 'en' or 'id'
   */
  const setLanguage = (lang) => {
    if (!['en', 'id'].includes(lang)) return;
    
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  /**
   * Translate function
   * @param {string} key - key from translations.js
   * @returns {string} translated text
   */
  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
