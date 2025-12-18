"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const THEME_KEY = "theme"; // values: 'dark' | 'light'

export function useTheme() {
  // Start with "light" for SSR consistency - prevents hydration mismatch
  const [theme, setThemeState] = useState("light");
  const mountedRef = useRef(false);

  const applyDark = useCallback((isDark) => {
    if (typeof document !== "undefined") {
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, []);

  // Read from localStorage and apply theme only after mount (client-side only)
  useEffect(() => {
    mountedRef.current = true;

    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
        applyDark(stored === "dark");
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [applyDark]);

  // Apply theme changes after initial mount
  useEffect(() => {
    if (!mountedRef.current) return;
    applyDark(theme === "dark");
  }, [theme, applyDark]);

  // Accept either a value or an updater function to stay compatible with toggleTheme
  const setTheme = useCallback((valueOrUpdater) => {
    setThemeState((prev) => {
      const next =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(prev)
          : valueOrUpdater;
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
