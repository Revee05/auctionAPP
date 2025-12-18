"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Users, LayoutDashboard, Menu, X, Gavel, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SidebarContent({ activeTab, onTabClick, collapsed, onCollapse }) {
  const { t } = useLanguage();
  
  const menuItems = [
    {
      id: "dashboard",
      label: t('dashboard') || "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: t('user_management') || "User Management",
      icon: Users,
    },
    // Adding placeholder items to make it look more populated for the demo
    {
      id: "auctions",
      label: "Auctions",
      icon: Gavel,
      disabled: true,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      disabled: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      disabled: true,
    },
  ];

  return (
    <div className={`relative flex flex-col h-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border-r border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-full"}`}>
      {/* Logo / Header */}
      <div className={`p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center ${collapsed ? "justify-center px-4" : "justify-between gap-4 px-6"}`}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="overflow-hidden whitespace-nowrap"
            >
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Admin
              </h2>
            </motion.div>
          )}
        </div>

        {/* Collapse / Expand Toggle moved to header for desktop */}
        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className="hidden lg:inline-flex absolute -right-8 top-6 w-9 h-9 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl transition-transform duration-150 transform hover:-translate-x-1 z-[80] ring-2 ring-white dark:ring-zinc-900"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabClick(item.id)}
              disabled={item.disabled}
              title={collapsed ? item.label : undefined}
              className={`
                relative group flex items-center ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"} w-full rounded-xl text-sm font-medium transition-all duration-300
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : item.disabled
                    ? "opacity-50 cursor-not-allowed text-zinc-400 hover:bg-transparent"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"}`} />
              
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex items-center flex-1 overflow-hidden"
                >
                  <span className="truncate">{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
                      Soon
                    </span>
                  )}
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
        {!onCollapse ? (
          // Mobile Footer
          <div className={`px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800`}>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Auction Admin</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-zinc-500">v1.0.0</p>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        ) : (
          // Desktop Footer - compact info only (toggle moved to header)
          <div className="px-3 py-2 rounded-md bg-transparent text-zinc-500 dark:text-zinc-400 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">v1.0.0</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange, mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Always visible on large screens */}
      {/* Width is controlled by CSS classes passed down or conditional inline styles if needed, but here we just toggle the width class on the container */}
      <motion.div 
        animate={{ width: collapsed ? 72 : 288 }} 
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:block h-screen fixed left-0 top-0 z-50 overflow-visible"
      >
        <SidebarContent 
            activeTab={activeTab} 
            onTabClick={handleTabClick} 
            collapsed={collapsed}
            onCollapse={setCollapsed}
        />
      </motion.div>

      {/* Mobile Sidebar - Sheet component */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-80 p-0 border-r-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
            <SidebarContent activeTab={activeTab} onTabClick={handleTabClick} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
