"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Dynamic import untuk Canvas (SSR: false)
const Hero3D = dynamic(() => import("@/components/3d/Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
    </div>
  ),
});

/**
 * Hero Section Component
 * Layout responsive dengan 3D Canvas + Text Content
 */
export default function HeroSection() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme changes
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkTheme();

    // Observer untuk perubahan theme
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-purple-50/30 dark:from-black dark:via-zinc-950 dark:to-purple-950/20">
      {/* Container utama */}
      <div className="container mx-auto h-full px-4 py-12 lg:px-8">
        <div className="grid h-full min-h-[80vh] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          
          {/* Text Content - Kiri/Atas */}
          <div className="z-10 flex flex-col justify-center space-y-6 lg:space-y-8">
            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-200 bg-purple-50/50 px-4 py-1.5 text-sm font-medium text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
              Live Auction
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Discover{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Curated Art
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-xl">
              Bid on exclusive artworks from top creators. Join the premier
              platform where art meets innovation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Primary CTA */}
              <Button
                onClick={() => router.push("/auctions")}
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transition-all hover:shadow-purple-500/50 hover:scale-105"
              >
                <span className="relative z-10">Explore Auctions</span>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>

              {/* Secondary CTA */}
              <Button
                onClick={() => router.push("/auth/register")}
                size="lg"
                variant="outline"
                className="border-2 border-zinc-300 bg-transparent hover:border-purple-500 hover:bg-purple-50 dark:border-zinc-700 dark:hover:border-purple-500 dark:hover:bg-purple-950/30"
              >
                Get Started
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  10K+
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Artworks
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  5K+
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Artists
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  $2M+
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total Sales
                </div>
              </div>
            </div>
          </div>

          {/* 3D Canvas - Kanan/Bawah */}
          <div className="relative h-[400px] w-full lg:h-[600px]">
            {/* Glow effect background */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl" />
            
            {/* 3D Scene */}
            <Hero3D isDarkMode={isDarkMode} className="relative z-10" />
          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top gradient */}
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5" />
        
        {/* Bottom gradient */}
        <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl dark:bg-pink-500/5" />
      </div>
    </section>
  );
}
