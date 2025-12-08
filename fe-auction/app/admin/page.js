/**
 * Example: Protected Dashboard Page
 * Demonstrates role-based access control
 */

"use client";

import { useAuth, useRole } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const { hasRole } = useRole("SUPER_ADMIN");

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 mt-2">
              Welcome back, {user?.name}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Super Admin Only Section */}
        {hasRole && (
          <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-2">Super Admin Tools</h2>
            <p className="text-zinc-400">
              This section is only visible to super admins.
            </p>
          </div>
        )}

        {/* Regular Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Users" value="1,234" />
          <StatCard title="Active Auctions" value="45" />
          <StatCard title="Revenue" value="$12,345" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-zinc-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
