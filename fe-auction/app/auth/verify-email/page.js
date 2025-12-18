"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { authService } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("verifying"); // verifying | pending | success | error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // verifyEmail is executed inside the effect to avoid missing dependency warnings

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    // If token present -> perform verification
    if (token) {
      // Perform verification inside an async IIFE to satisfy hooks dependency rules
      (async () => {
        try {
          console.log('verify-email: calling authService.verifyEmail with token', token);
          const result = await authService.verifyEmail(token);
          console.log('verify-email: verification result', result);
          setStatus("success");
          setMessage(result.message || "Email verified successfully!");
          setEmail(result.email);
          // Redirect to login after short delay so user sees success message
          setTimeout(() => {
            console.log('verify-email: redirecting to /auth/login');
            // use replace to avoid adding history entry
            router.replace('/auth/login');
          }, 800);
        } catch (error) {
          console.error('verify-email: verification error', error);
          setStatus("error");
          setMessage(error.message || "Verification failed. The link may be invalid or expired.");
        }
      })();
      return;
    }

    // If no token but email param present -> show pending UI
    if (emailParam) {
      setTimeout(() => {
        setStatus("pending");
        setEmail(decodeURIComponent(emailParam));
        setMessage("We've sent a verification link to your email. Please check your inbox.");
      }, 0);
      return;
    }

    // No token and no email -> show invalid link error
    setTimeout(() => {
      setStatus("error");
      setMessage("Invalid verification link. Token is missing.");
    }, 0);
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg text-center">
        {status === "verifying" && (
          <>
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-400"></div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('verifying_email')}</h1>
            <p className="text-zinc-400">{t('verifying_wait')}</p>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-900/20 border-2 border-yellow-400 rounded-full">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('verify_your_email')}</h1>
            <p className="text-zinc-400 mb-6">{message || t('verification_sent')}</p>
            {email && (
              <p className="text-zinc-500 text-sm mb-6">{t('sent_to')} {email}</p>
            )}
            <div className="space-y-3">
              <Link href={`/auth/resend-verification?email=${encodeURIComponent(email || "")}`}>
                <Button
                  className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
                >
                  {t('resend_verification_email')}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                >
                  {t('back_to_login')}
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/20 border-2 border-green-400 rounded-full">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('email_verified')}</h1>
            <p className="text-zinc-400 mb-6">{message}</p>
            {email && (
              <p className="text-zinc-500 text-sm mb-6">{t('verified')} {email}</p>
            )}
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
            >
              {t('continue_to_login')}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 border-2 border-red-400 rounded-full">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('verification_failed')}</h1>
            <p className="text-zinc-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/auth/resend-verification">
                <Button
                  className="w-full bg-purple-400 hover:bg-purple-500 text-black font-semibold"
                >
                  {t('resend_verification_email')}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                >
                  {t('back_to_login')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
