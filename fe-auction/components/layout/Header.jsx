"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import Link from "next/link";
import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { LogIn, Sun, Moon, Home, Gavel, Film, Video } from "lucide-react";

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  // helper: cek role dari user.roles (array)
  const hasRole = (r) => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((x) => String(x).toLowerCase() === r.toLowerCase());
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className={`flex items-center justify-between px-4 py-3 w-full relative sticky top-0 z-50 shadow-2xl backdrop-blur-sm backdrop-saturate-150 ${isDark ? 'bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 text-white border-b border-zinc-800' : 'bg-white/80 text-zinc-900 border-b border-zinc-200'}`}>
      {/* Kiri: Logo */}
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-purple-400 w-8 h-8" />
        <span className="font-bold text-lg">ArtAuction</span>
      </div>
      {/* Tengah: Navigasi (hidden on mobile, selalu di tengah) */}
      <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        <Link href="/" className="flex items-center gap-2 hover:underline">
          <Home className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
          <span>Home</span>
        </Link>
        <Link href="/auctions" className="flex items-center gap-2 hover:underline">
          <Gavel className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
          <span>Auctions</span>
        </Link>
        <Link href="/reels" className="flex items-center gap-2 hover:underline">
          <Film className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
          <span>Feeds</span>
        </Link>
        {/* RBAC: Navigasi khusus role */}
        {hasRole("artist") && (
          <Link href="/my-art" className="hover:underline">My Art</Link>
        )}
        {hasRole("collector") && (
          <Link href="/my-bids" className="hover:underline">My Bids</Link>
        )}
      </nav>
      {/* Kanan: Auth (selalu tampil di kanan) */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <Button variant="ghost" className="p-2" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        {/* Auth area: avatar dropdown (jika login) atau tombol Login */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none cursor-pointer group hover:scale-105 hover:shadow-lg active:scale-95 transition-transform duration-150">
                <Avatar className={`transition-shadow duration-150 rounded-full ring-2 ring-purple-500/50 ring-offset-1 ${isDark ? 'ring-offset-zinc-900' : 'ring-offset-white'} group-hover:shadow-[0_0_14px_rgba(139,92,246,0.9)] group-hover:ring-4 group-hover:ring-purple-400/70`}>
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                  <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`w-64 p-0 rounded-xl shadow-lg absolute right-0 ${isDark ? 'border border-zinc-800 bg-zinc-900 text-zinc-200' : 'border border-zinc-200 bg-white text-zinc-900'}`}>
              <div className={`px-5 pt-4 pb-3 flex flex-col items-center text-center ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                <Avatar className="w-12 h-12 mb-2">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                  <AvatarFallback className={`text-lg ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className={`font-semibold text-base ${isDark ? 'text-white' : 'text-zinc-900'}`}>{user.name}</span>
                <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} text-xs mb-1`}>{user.email}</span>
                <span className="text-xs font-semibold rounded px-2 py-0.5 mb-1 bg-purple-900/60 text-purple-200 tracking-wide" style={{display:'inline-block'}}>
                  {Array.isArray(user.roles) ? user.roles[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
                </span>
              </div>
              <DropdownMenuSeparator />
              {Array.isArray(user.roles) && (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN")) ? (
                <>
                  <DropdownMenuItem asChild className="px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer">
                      <Link href="/admin" className={`flex items-center gap-2 w-full ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer">
                      <Link href="/profile" className={`flex items-center gap-2 w-full ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild className="px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer">
                    <Link href="/profile" className={`flex items-center gap-2 w-full ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
                <DropdownMenuItem onClick={handleLogout} className={`px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/auth/login">
            <Button variant="ghost" className="p-2 mr-2" aria-label="Login" title="Login">
              <LogIn className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>
      {/* Mobile: gunakan Sheet (muncul dari kanan) */}
      <Sheet>
        {/* humburger menu icon */}
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden flex items-center justify-center p-2 ml-2 hover:bg-transparent focus:ring-0" aria-label="Open menu">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </SheetTrigger>
        {/* isi content dalam sheet */}
        <SheetContent side="right" className={`w-full sm:w-72 md:hidden p-4 backdrop-blur-sm shadow-2xl rounded-l-lg ${isDark ? 'bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 border-l border-zinc-800 text-white' : 'bg-white/90 border-l border-zinc-200 text-zinc-900'}`}>
          {/* Top: user or auth actions */}
          <div className={`flex items-center gap-3 px-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {user ? (
              <Link href="/profile" className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <Avatar className={`w-12 h-12 rounded-full transition-shadow duration-150 ${isDark ? 'ring-2 ring-purple-400/40 ring-offset-1 ring-offset-zinc-900' : 'ring-2 ring-purple-400/40 ring-offset-1 ring-offset-white'}`}>
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                      <AvatarFallback className={`text-lg ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-zinc-900'} truncate`}>{user.name}</span>
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} truncate`}>{user.email}</span>
                    </div>
                  </div>
                </Link>
            ) : (
                <div className="w-full">
                {/* Login tidak ditampilkan di sheet — tetap di header kanan */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-400 w-8 h-8" />
                  <span className="font-bold text-lg">ArtAuction</span>
                </div>
              </div>
            )}
          </div>

          <div className={`${isDark ? 'my-3 border-t border-zinc-200/60' : 'my-3 border-t border-zinc-800/60'}`} />

          <nav className="flex flex-col gap-1">
            <SheetClose asChild>
                <Link href="/" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'}`}>
                  <Home className={`w-5 h-5 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Home</span>
                </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link href="/auctions" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'}`}>
                <Gavel className={`w-5 h-5 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Auctions</span>
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link href="/reels" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'}`}>
                <Film className={`w-5 h-5 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} aria-hidden />
                <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Feeds</span>
              </Link>
            </SheetClose>

            {hasRole("artist") && (
              <SheetClose asChild>
                <Link href="/my-art" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'}`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /></svg>
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>My Art</span>
                </Link>
              </SheetClose>
            )}

            {hasRole("collector") && (
              <SheetClose asChild>
                <Link href="/my-bids" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'}`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4v4h8v-4c0-2.21-1.79-4-4-4z" /></svg>
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>My Bids</span>
                </Link>
              </SheetClose>
            )}
          </nav>

          <div className={`${isDark ? 'my-3 border-t border-zinc-200/60 pt-3 text-xs text-zinc-400 px-3' : 'my-3 border-t border-zinc-800/60 pt-3 text-xs text-zinc-500 px-1'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Theme</span>
              <button onClick={toggleTheme} aria-label="Toggle color theme" className="p-2 rounded-lg hover:bg-zinc-800/60">
                {isDark ? <Sun className="w-5 h-5 text-zinc-300" /> : <Moon className="w-5 h-5 text-zinc-500" />}
              </button>
            </div>
            <div className="mt-3 text-center text-zinc-500">© {new Date().getFullYear()} ArtAuction</div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export default Header;
