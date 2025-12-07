"use client";

import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "theme"; // values: 'dark' | 'light' | 'system'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v || "system";
    } catch (e) {
      return "system";
    }
  });

  const applyDark = useCallback((isDark) => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    let mql;

    const resolveSystem = () => {
      try {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch (e) {
        return false;
      }
    };

    const apply = () => {
      if (theme === "dark") applyDark(true);
      else if (theme === "light") applyDark(false);
      else applyDark(resolveSystem());
    };

    apply();

    if (theme === "system") {
      try {
        mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => applyDark(e.matches);
        if (mql?.addEventListener) mql.addEventListener("change", handler);
        else if (mql?.addListener) mql.addListener(handler);
        return () => {
          if (mql?.removeEventListener) mql.removeEventListener("change", handler);
          else if (mql?.removeListener) mql.removeListener(handler);
        };
      } catch (e) {
        // ignore
      }
    }
    // no cleanup here beyond media listener
    return undefined;
  }, [theme, applyDark]);

  const setTheme = useCallback((value) => {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) {
      // ignore
    }
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      return next;
    });
  }, [setTheme]);

  const isDark = theme === "dark" || (theme === "system" && (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches));

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  };
}

export default useTheme;
