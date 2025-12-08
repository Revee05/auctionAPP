"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout, logoutAll, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Call your update profile endpoint (adjust to your actual API)
      await apiClient.put("/api/users/profile", {
        name: form.name,
        avatarUrl: form.avatarUrl,
      });

      // Refresh user data from server
      await refreshUser();
      
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm("Are you sure you want to logout from all devices?")) {
      await logoutAll();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white/80 dark:bg-zinc-900 p-6 rounded-lg shadow">
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name} />
            <AvatarFallback className="text-2xl">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {editing ? (
              <div className="grid gap-2">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
                <Input
                  value={form.email}
                  disabled
                  placeholder="Email (cannot be changed)"
                  className="opacity-60 cursor-not-allowed"
                />
                <Input
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="Avatar URL"
                />
              </div>
            ) : (
              <>
                <div className="text-lg font-semibold">{user?.name}</div>
                <div className="text-sm text-zinc-500">{user?.email}</div>
                <div className="mt-2">
                  <span className="inline-block text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {Array.isArray(user?.roles) 
                      ? user.roles.join(", ").replace(/_/g, ' ')
                      : user?.roles || 'No role'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {editing ? (
              <>
                <Button onClick={saveProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: user?.name || "",
                      email: user?.email || "",
                      avatarUrl: user?.avatarUrl || ""
                    });
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setForm({
                      name: user?.name || "",
                      email: user?.email || "",
                      avatarUrl: user?.avatarUrl || ""
                    });
                    setEditing(true);
                  }}
                >
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleLogoutAll}
                  className="text-xs"
                >
                  Logout All Devices
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
