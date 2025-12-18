"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { authService } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // Pre-fill email from URL query params if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authService.resendVerification(email);
      
      setSuccess(result.message || "Verification email sent! Please check your inbox.");
      setEmail(""); // Clear form after success
    } catch (err) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-2">{t('resend_verification_title')}</h1>
        <p className="text-zinc-400 text-center mb-6">
          {t('resend_verification_subtitle')}
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{success}</p>
            <p className="text-sm mt-2 text-green-300">
              {t('check_spam')}
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

        {!success && (
          <>
            <form onSubmit={handleResend} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
                disabled={loading}
              >
                {loading ? t('sending') : t('send_verification_email')}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-zinc-400 text-sm">
                {t('remember_verification')}{" "}
                <Link href="/auth/verify-email" className="text-purple-400 hover:underline">
                  {t('verify_now')}
                </Link>
              </p>
              <p className="text-zinc-400 text-sm">
                <Link href="/auth/login" className="text-purple-400 hover:underline">
                  {t('back_to_login')}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
