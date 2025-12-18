/**
 * Admin Dashboard - Protected Page
 * Features: Sidebar navigation, role-based access, SPA-like experience
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import useTheme from "@/hooks/useTheme";
import { SunMoon, LogOut as LogOutIcon } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./Tab/DashboardStats";
import UserManagement from "./Tab/UserManagement";
import { LogOut } from "lucide-react";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { t } = useLanguage();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats />;
      case "users":
        return <UserManagement />;
      default:
        return <DashboardStats />;
    }
  };

  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-white`}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4">
              {/* Mobile menu spacing */}
              <div className="lg:hidden w-10"></div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {activeTab === "dashboard" ? t('dashboard') : t('user_management')}
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {t('logged_in_as')} {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm font-medium"
              >
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
