"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Users, LayoutDashboard, Menu, X } from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
  },
];

function SidebarContent({ activeTab, onTabClick }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      {/* Logo / Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Panel</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Auction Management</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                    : "text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2024 Auction App</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block w-64 h-screen fixed left-0 top-0">
        <SidebarContent activeTab={activeTab} onTabClick={handleTabClick} />
      </div>

      {/* Mobile Sidebar - Sheet component */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className="fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-white hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-zinc-950">
            <SidebarContent activeTab={activeTab} onTabClick={handleTabClick} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
