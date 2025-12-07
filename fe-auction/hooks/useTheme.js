"use client";

import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "theme"; // values: 'dark' | 'light'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === "dark" || v === "light" ? v : "light";
    } catch (e) {
      return "light";
    }
  });

  const applyDark = useCallback((isDark) => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    let mql;

    // Apply explicit dark/light only (no 'system' support)
    if (theme === "dark") applyDark(true);
    else applyDark(false);
    return undefined;
  }, [theme, applyDark]);

  // Accept either a value or an updater function to stay compatible with toggleTheme
  const setTheme = useCallback((valueOrUpdater) => {
    setThemeState((prev) => {
      const next = typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const isDark = theme === "dark";

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  };
}

export default useTheme;
