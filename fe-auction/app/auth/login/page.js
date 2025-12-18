"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showResendLink, setShowResendLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  // Check for suspended account message from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authError = sessionStorage.getItem('auth_error');
      if (authError) {
        setError(authError);
        sessionStorage.removeItem('auth_error');
      }
    }
  }, []);

  // Check for email change success message
  useEffect(() => {
    const emailChanged = searchParams.get('emailChanged');
    const newEmail = searchParams.get('email');
    
    if (emailChanged === '1' && newEmail) {
      setSuccessMessage(`Email successfully changed to ${newEmail}. Please login with your new email.`);
      setEmail(newEmail);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setShowResendLink(false);
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect based on user role
        const roles = result.user.roles || [];
        
        if (roles.includes("SUPER_ADMIN")) {
          router.push("/admin");
        } else if (roles.includes("ADMIN")) {
          router.push("/admin");
        } else if (roles.includes("ARTIST")) {
          router.push("/auctions");
        } else if (roles.includes("COLLECTOR")) {
          router.push("/auctions");
        } else {
          router.push("/");
        }
      } else {
        const errorMessage = result.error || "Login failed";
        setError(errorMessage);
        
        // Check if it's email not verified error from the error message
        if (errorMessage.includes("verify your email") || errorMessage.includes("EMAIL_NOT_VERIFIED")) {
          setShowResendLink(true);
        }
        
        // Don't show resend link for suspended/banned accounts
        if (errorMessage.includes("suspended") || errorMessage.includes("banned")) {
          setShowResendLink(false);
        }
      }
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      
      // Check if it's email not verified error
      if (err.code === "EMAIL_NOT_VERIFIED" || errorMessage.includes("verify your email")) {
        setShowResendLink(true);
      }
      
      // Don't show resend link for suspended/banned accounts
      if (errorMessage.includes("suspended") || errorMessage.includes("banned")) {
        setShowResendLink(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-2">{t('login_title')}</h1>
        <p className="text-zinc-400 text-center mb-6">{t('login_subtitle')}</p>

        {successMessage && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-2 rounded mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded mb-4">
            {error}
            {showResendLink && (
              <p className="mt-2 text-sm">
                <Link
                  href={`/auth/resend-verification?email=${encodeURIComponent(email)}`}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  {t('resend_verification')}
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">{t('email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
          </div>
          <Button 
            type="submit" 
            className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
            disabled={loading}
          >
            {loading ? t('logging_in') : t('login')}
          </Button>
        </form>

        <p className="text-zinc-400 text-center mt-6">
          {t('dont_have_account')}{" "}
          <Link href="/auth/register" className="text-purple-400 hover:underline">
            {t('register_here')}
          </Link>
        </p>
      </div>
    </div>
  );
}
