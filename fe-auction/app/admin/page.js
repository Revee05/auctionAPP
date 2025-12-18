/**
 * Admin Dashboard - Protected Page
 * Features: Sidebar navigation, role-based access, SPA-like experience
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import useTheme from "@/hooks/useTheme";
import { SunMoon, LogOut as LogOutIcon, Menu, Bell, Search } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./Tab/DashboardStats";
import UserManagement from "./Tab/UserManagement";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    <div className={`min-h-screen bg-zinc-50/50 dark:bg-black text-zinc-900 dark:text-white`}>
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-72"}
        `}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {activeTab === "dashboard" ? (t('dashboard') || "Dashboard") : (t('user_management') || "User Management")}
                </h1>
                <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  {t('logged_in_as') || "Logged in as"} <span className="font-medium text-zinc-900 dark:text-zinc-200">{user?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Search Bar - Hidden on small mobile */}
              <div className="hidden md:flex relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full text-sm w-48 focus:w-64 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>

              <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

              <button className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all text-sm font-medium shadow-2xs"
              >
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout') || "Logout"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
