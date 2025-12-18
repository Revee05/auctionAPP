"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { authService } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState("COLLECTOR"); // COLLECTOR or ARTIST
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authService.register({
        name,
        email,
        password,
        roleName: selectedRole,
      });

      if (result.success) {
        // capture email before clearing
        const userEmail = email;

        // Clear form
        setName("");
        setEmail("");
        setPassword("");

        // Redirect user to verify-email page with their email prefilled
        router.push(`/auth/verify-email?email=${encodeURIComponent(userEmail)}`);
        return;
      }
    } catch (err) {
      // Display detailed validation errors if available
      if (err.statusCode === 400 && err.details) {
        const errorMessages = err.details.map(d => `${d.field}: ${d.message}`).join('\n');
        setError(errorMessages || err.message || "Registration failed");
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-2">{t('register_title')}</h1>
        <p className="text-zinc-400 text-center mb-6">{t('register_subtitle')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded mb-4">
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{success}</p>
            <p className="text-sm mt-2 text-green-300">
              {t('check_inbox')}
            </p>
            <div className="mt-3">
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full border-green-700 text-green-400 hover:bg-green-900/30"
                >
                  {t('go_to_login')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              onClick={() => setSelectedRole("COLLECTOR")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "COLLECTOR"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {t('as_collector')}
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedRole("ARTIST")}
              className={`flex-1 py-2 rounded font-semibold transition ${
                selectedRole === "ARTIST"
                  ? "bg-black text-white border-2 border-purple-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {t('as_artist')}
            </Button>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              {selectedRole === "ARTIST" ? t('artist_name') : t('full_name')}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedRole === "ARTIST" ? t('your_artist_name') : "John Doe"}
              className="text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">{t('email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === "ARTIST" ? "artist@example.com" : "you@example.com"}
              className="text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">{t('password')}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-white"
              required
            />
            <p className="text-xs text-zinc-400 mt-1">
              {t('password_requirements')}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
            disabled={loading || !!success}
          >
            {loading ? t('creating_account') : `${t('register_as')} ${selectedRole === "ARTIST" ? t('as_artist').replace('Sebagai ', '').replace('As ', '') : t('as_collector').replace('Sebagai ', '').replace('As ', '')}`}
          </Button>
        </form>

        <p className="text-zinc-400 text-center mt-6">
          {t('already_have_account')}{" "}
          <Link href="/auth/login" className="text-purple-400 hover:underline">
            {t('login_here')}
          </Link>
        </p>
      </div>
    </div>
  );
}
