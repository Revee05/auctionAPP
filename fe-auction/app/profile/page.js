"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authService } from "@/lib/services/authService";
import { User, Mail, Lock, LogOut, Shield } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout, logoutAll, refreshUser } = useAuth();
  
  // Form states
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    avatarUrl: user?.avatarUrl || ""
  });
  
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update profile (name, avatar)
  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authService.updateProfile({
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl,
      });

      await refreshUser();
      
      setSuccess("Profile updated successfully!");
      setEditingProfile(false);
    } catch (err) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Request email change
  const requestEmailChange = async () => {
    if (!emailForm.newEmail || !emailForm.password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await authService.changeEmail(emailForm.newEmail, emailForm.password);
      setSuccess(result.message || "Verification email sent! Please check your new email inbox.");
      setEmailForm({ newEmail: "", password: "" });
      setChangingEmail(false);
    } catch (err) {
      setError(err?.message || "Failed to change email");
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await authService.changePassword(
        passwordForm.currentPassword, 
        passwordForm.newPassword
      );
      setSuccess(result.message || "Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangingPassword(false);
    } catch (err) {
      setError(err?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm("Are you sure you want to logout from all devices?")) {
      await logoutAll();
    }
  };

  const cancelAll = () => {
    setEditingProfile(false);
    setChangingEmail(false);
    setChangingPassword(false);
    setProfileForm({ name: user?.name || "", avatarUrl: user?.avatarUrl || "" });
    setEmailForm({ newEmail: "", password: "" });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Profile Information Card */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-zinc-200 dark:border-zinc-700 mx-auto sm:mx-0">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name} />
            <AvatarFallback className="flex items-center justify-center text-2xl bg-purple-600 text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <User className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                {editingProfile ? (
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Full name"
                    className="max-w-md"
                  />
                ) : (
                  <>
                    <div className="text-xl font-semibold text-zinc-900 dark:text-white">{user?.name}</div>
                    <div className="text-sm text-zinc-500 mt-1">Name</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <div className="text-lg text-zinc-700 dark:text-zinc-300">{user?.email}</div>
                <div className="text-sm text-zinc-500 mt-1">Email Address</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(user?.roles) && user.roles.map(role => (
                    <span 
                      key={role}
                      className="inline-block text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium"
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-zinc-500 mt-1">Role</div>
              </div>
            </div>

            {editingProfile && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Avatar URL (optional)
                </label>
                <Input
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="max-w-md"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 items-center sm:items-start">
              {editingProfile ? (
                <>
                  <Button onClick={saveProfile} disabled={loading} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={cancelAll} disabled={loading} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => { cancelAll(); setEditingProfile(true); }} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Change Email Card */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Change Email Address
        </h3>
        
        {changingEmail ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                New Email Address
              </label>
              <Input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                placeholder="newemail@example.com"
                className="max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Password (for verification)
              </label>
              <Input
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded text-sm text-blue-800 dark:text-blue-200">
              📧 A verification link will be sent to your new email address. You&apos;ll need to verify it before the change takes effect.
            </div>
            <div className="flex gap-2">
              <Button onClick={requestEmailChange} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? "Sending..." : "Send Verification Email"}
              </Button>
              <Button variant="outline" onClick={cancelAll} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Current email: <span className="font-medium text-zinc-900 dark:text-white">{user?.email}</span>
            </p>
            <Button onClick={() => { cancelAll(); setChangingEmail(true); }} variant="outline">
              Request Email Change
            </Button>
          </div>
        )}
      </Card>

      {/* Change Password Card */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        
        {changingPassword ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="max-w-md"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={updatePassword} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? "Updating..." : "Update Password"}
              </Button>
              <Button variant="outline" onClick={cancelAll} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Keep your account secure by using a strong password
            </p>
            <Button onClick={() => { cancelAll(); setChangingPassword(true); }} variant="outline">
              Change Password
            </Button>
          </div>
        )}
      </Card>

      {/* Security Actions */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Security Actions
        </h3>
        <Button 
          variant="destructive" 
          onClick={handleLogoutAll}
          className="w-full sm:w-auto"
        >
          Logout from All Devices
        </Button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          This will end all active sessions on all devices
        </p>
      </Card>
    </div>
  );
}
