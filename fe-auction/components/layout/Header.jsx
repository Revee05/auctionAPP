"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
function Header() {
  const { user, role, setUser, setRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Simulasi logout
  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("user");
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 text-white w-full relative sticky top-0 z-50 shadow">
      {/* Kiri: Logo */}
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-purple-400 w-8 h-8" />
        <span className="font-bold text-lg">ArtAuction</span>
      </div>
      {/* Tengah: Navigasi (hidden on mobile, selalu di tengah) */}
      <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        <Link href="/" className="flex items-center gap-1 hover:underline">
          <span>Home</span>
        </Link>
        <Link href="/auctions" className="flex items-center gap-1 hover:underline">
          <span>Auctions</span>
        </Link>
        <Link href="/reels" className="flex items-center gap-1 hover:underline">
          <span>Reels</span>
        </Link>
        {/* RBAC: Navigasi khusus role */}
        {role === "superadmin" && (
          <Link href="/admin" className="hover:underline">Admin Panel</Link>
        )}
        {role === "artist" && (
          <Link href="/my-art" className="hover:underline">My Art</Link>
        )}
        {role === "collector" && (
          <Link href="/my-bids" className="hover:underline">My Bids</Link>
        )}
      </nav>
      {/* Kanan: Auth (selalu tampil di kanan) */}
      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar>
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                  <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0 rounded-xl shadow-lg border border-zinc-800 bg-zinc-900 absolute right-0">
              <div className="px-5 pt-4 pb-3 flex flex-col items-center text-center">
                <Avatar className="w-12 h-12 mb-2">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                  <AvatarFallback className="text-lg bg-zinc-800 text-zinc-300">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-base text-white">{user.name}</span>
                <span className="text-xs text-zinc-400 mb-1">{user.email}</span>
                <span className="text-xs font-semibold rounded px-2 py-0.5 mb-1 bg-purple-900/60 text-purple-200 tracking-wide" style={{display:'inline-block'}}>
                  {Array.isArray(user.roles) ? user.roles[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
                </span>
              </div>
              <DropdownMenuSeparator />
              {(Array.isArray(user.roles) && (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN"))) ? (
                <DropdownMenuItem asChild className="px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer">
                  <Link href="/dashboard" className="flex items-center gap-2 w-full text-zinc-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild className="px-5 py-3 hover:bg-zinc-800/80 transition rounded-none cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-2 w-full text-zinc-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="px-5 py-3 text-red-400 hover:bg-zinc-800/80 transition rounded-none cursor-pointer flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="ghost" className="mr-2 cursor-pointer">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="secondary" size="lg" className="cursor-pointer">Register</Button>
            </Link>
          </>
        )}
      </div>
      {/* Hamburger menu button (mobile only) */}
      <Button
        className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 ml-2"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open menu"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-900 border-t border-zinc-800 flex flex-col gap-2 py-4 z-50 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-2 px-4">
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
              <Link href="/auctions">Auctions</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
              <Link href="/reels">Reels</Link>
            </Button>
            {role === "superadmin" && (
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
                <Link href="/admin">Admin Panel</Link>
              </Button>
            )}
            {role === "artist" && (
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
                <Link href="/my-art">My Art</Link>
              </Button>
            )}
            {role === "collector" && (
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMenuOpen(false)}>
                <Link href="/my-bids">My Bids</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
