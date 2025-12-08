/**
 * Admin Dashboard - Protected Page
 * Features: Sidebar navigation, role-based access, SPA-like experience
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./components/DashboardStats";
import UserManagement from "./components/UserManagement";
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

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="flex items-center justify-between px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu spacing */}
              <div className="lg:hidden w-10"></div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {activeTab === "dashboard" ? "Dashboard" : "User Management"}
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Logged in as {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
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
