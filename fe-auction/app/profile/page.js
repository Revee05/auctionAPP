"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, role, setUser, setRole } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ name: "", email: "", avatarUrl: "" }));

  const saveProfile = () => {
    if (!user) return;
    const updated = { ...user, ...form };
    setUser(updated);
    // persist in localStorage in the same shape AuthContext expects
    const payload = { user: updated, role };
    try {
      localStorage.setItem("user", JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to save user to localStorage", err);
    }
    setEditing(false);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    try {
      localStorage.removeItem("user");
    } catch (err) {}
    router.push("/");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>

      {!user ? (
        <div className="rounded-md border p-6 text-center">
          <p className="mb-3">Kamu belum login.</p>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900 p-6 rounded-lg shadow">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
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
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                  />
                  <Input
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                    placeholder="Avatar URL"
                  />
                </div>
              ) : (
                <>
                  <div className="text-lg font-semibold">{user.name}</div>
                  <div className="text-sm text-zinc-500">{user.email}</div>
                  <div className="mt-2">
                    <span className="inline-block text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                      {Array.isArray(user.roles) ? user.roles.join(", ") : user.roles}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {editing ? (
                <>
                  <Button onClick={saveProfile}>Save</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setForm({ name: user.name || "", email: user.email || "", avatarUrl: user.avatarUrl || "" });
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setForm({ name: user.name || "", email: user.email || "", avatarUrl: user.avatarUrl || "" });
                      setEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 text-sm text-zinc-500">
            <div>Role context: <span className="font-medium text-zinc-700 dark:text-zinc-200">{String(role)}</span></div>
            <div className="mt-2">Tip: Perubahan disimpan ke `localStorage` untuk simulasi sesi.</div>
          </div>
        </div>
      )}
    </div>
  );
}
