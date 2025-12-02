"use client";

import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext({ user: null, role: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // TODO: Replace with real fetch from backend (token/session)
    // Simulasi: ambil user dari localStorage atau API
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored) {
      setUser(stored.user);
      setRole(stored.role);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, setUser, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}
