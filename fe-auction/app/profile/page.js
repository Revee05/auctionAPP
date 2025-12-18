"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
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
  const { language, setLanguage, t } = useLanguage();
  
  // Form states
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Initialize form with current language from context or user
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    avatarUrl: user?.avatarUrl || "",
    language: language || "en"
  });
  
  // Sync form language when context language changes (if not editing)
  React.useEffect(() => {
    if (!editingProfile) {
      setProfileForm(prev => ({ ...prev, language }));
    }
  }, [language, editingProfile]);
  
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

  // Update profile (name, avatar, language)
  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authService.updateProfile({
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl,
        language: profileForm.language
      });

      // Refresh user will update AuthContext -> updates LanguageContext
      await refreshUser();
      
      setSuccess(t('profile_success_update'));
      setEditingProfile(false);
    } catch (err) {
      setError(err?.message || t('profile_error_update'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Language Change
  // Updates local form AND context for immediate preview
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setProfileForm({ ...profileForm, language: newLang });
    setLanguage(newLang); // Instant preview
  };

  // Request email change
  const requestEmailChange = async () => {
    if (!emailForm.newEmail || !emailForm.password) {
      setError(t('error_fill_fields'));
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await authService.changeEmail(emailForm.newEmail, emailForm.password);
      setSuccess(result.message || t('email_success_sent'));
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
      setError(t('error_fill_fields'));
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('password_mismatch'));
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
      setSuccess(result.message || t('password_success'));
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangingPassword(false);
    } catch (err) {
      setError(err?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm(t('security_confirm_logout'))) {
      await logoutAll();
    }
  };

  const cancelAll = () => {
    setEditingProfile(false);
    setChangingEmail(false);
    setChangingPassword(false);
    // Reset form to current user values
    setProfileForm({ 
      name: user?.name || "", 
      avatarUrl: user?.avatarUrl || "",
      language: language 
    });
    // Revert language context if changed but not saved? 
    // Actually standard behavior is "Preview" stays if simpler, 
    // but to be strict "Cancel" should revert.
    if (user?.language && user.language !== language) {
        setLanguage(user.language);
    }

    setEmailForm({ newEmail: "", password: "" });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('profile_title')}</h1>
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          {t('logout')}
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
                    <div className="text-sm text-zinc-500 mt-1">{t('profile_name')}</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <div className="text-lg text-zinc-700 dark:text-zinc-300">{user?.email}</div>
                <div className="text-sm text-zinc-500 mt-1">{t('profile_email')}</div>
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
                <div className="text-sm text-zinc-500 mt-1">{t('profile_role')}</div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center text-zinc-500">🌐</div>
                <div className="flex-1">
                    {editingProfile ? (
                        <select
                            value={profileForm.language}
                            onChange={handleLanguageChange}
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none max-w-md w-full"
                        >
                            <option value="en">English (US)</option>
                            <option value="id">Bahasa Indonesia</option>
                        </select>
                    ) : (
                        <>
                            <div className="text-lg text-zinc-700 dark:text-zinc-300">
                                {language === 'id' ? 'Bahasa Indonesia' : 'English (US)'}
                            </div>
                            <div className="text-sm text-zinc-500 mt-1">{t('profile_language')}</div>
                        </>
                    )}
                </div>
            </div>

            {editingProfile && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t('profile_avatar_url')}
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
                    {loading ? "Saving..." : t('profile_save_btn')}
                  </Button>
                  <Button variant="outline" onClick={cancelAll} disabled={loading} className="w-full sm:w-auto">
                    {t('profile_cancel_btn')}
                  </Button>
                </>
              ) : (
                <Button onClick={() => { cancelAll(); setEditingProfile(true); }} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                  {t('profile_edit_btn')}
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
          {t('email_change_title')}
        </h3>
        
        {changingEmail ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {t('email_new_label')}
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
                {t('email_password_label')}
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
              📧 {t('email_verify_info')}
            </div>
            <div className="flex gap-2">
              <Button onClick={requestEmailChange} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? t('email_sending_btn') : t('email_send_btn')}
              </Button>
              <Button variant="outline" onClick={cancelAll} disabled={loading}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('email_current')}: <span className="font-medium text-zinc-900 dark:text-white">{user?.email}</span>
            </p>
            <Button onClick={() => { cancelAll(); setChangingEmail(true); }} variant="outline">
              {t('email_request_btn')}
            </Button>
          </div>
        )}
      </Card>

      {/* Change Password Card */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t('password_change_title')}
        </h3>
        
        {changingPassword ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {t('password_current')}
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
                {t('password_new')}
              </label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="max-w-md"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {t('password_hint')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {t('password_confirm')}
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
                {loading ? t('password_updating_btn') : t('password_update_btn')}
              </Button>
              <Button variant="outline" onClick={cancelAll} disabled={loading}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('password_info')}
            </p>
            <Button onClick={() => { cancelAll(); setChangingPassword(true); }} variant="outline">
              {t('password_change_btn')}
            </Button>
          </div>
        )}
      </Card>

      {/* Security Actions */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          {t('security_title')}
        </h3>
        <Button 
          variant="destructive" 
          onClick={handleLogoutAll}
          className="w-full sm:w-auto"
        >
          {t('security_logout_all')}
        </Button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          {t('security_logout_all_info')}
        </p>
      </Card>
    </div>
  );
}
