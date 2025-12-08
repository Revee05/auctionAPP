"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";

export default function EditUserModal({ open, user, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPassword("");
    }
  }, [user]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      // Use admin update endpoint (server enforces permissions)
      const payload = { name, email };
      if (password && password.length > 0) payload.password = password;

      const resp = await apiClient.put(`/api/admin/users/${user.id}`, payload);
      if (resp.status === 200) {
        onSaved && onSaved(resp.data.user || resp.data);
      } else {
        setError(resp.data?.error || "Failed to save user")
      }
    } catch (err) {
      console.error("Edit user failed:", err);
      setError(err.response?.data?.error || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isSaving && onClose && onClose()}
      />
      <Card className="relative z-10 w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Edit User</h3>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-zinc-700 dark:text-zinc-300">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-700 dark:text-zinc-300">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-700 dark:text-zinc-300">Password (leave blank to keep)</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => onClose && onClose()} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
