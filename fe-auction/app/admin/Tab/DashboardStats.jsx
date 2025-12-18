"use client";

import { Card } from "@/components/ui/card";
import { useAuth, useRole } from "@/hooks/useAuth";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardStats() {
  const { user } = useAuth();
  const { hasRole } = useRole("SUPER_ADMIN");

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
      description: "Active accounts",
    },
    {
      title: "Active Auctions",
      value: "45",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingBag,
      color: "green",
      description: "Currently live",
    },
    {
      title: "Total Revenue",
      value: "$12,345",
      change: "+23.1%",
      trend: "up",
      icon: DollarSign,
      color: "purple",
      description: "This month",
    },
    {
      title: "Active Bids",
      value: "892",
      change: "-3.4%",
      trend: "down",
      icon: Activity,
      color: "orange",
      description: "In last 24h",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "New user registered",
      user: "John Doe",
      time: "2 minutes ago",
      type: "user"
    },
    {
      id: 2,
      action: "Auction created",
      user: "Jane Smith",
      time: "15 minutes ago",
      type: "auction"
    },
    {
      id: 3,
      action: "Bid placed",
      user: "Bob Wilson",
      time: "1 hour ago",
      type: "bid"
    },
    {
      id: 4,
      action: "Payment completed",
      user: "Alice Johnson",
      time: "2 hours ago",
      type: "payment"
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-600 to-blue-400 shadow-blue-500/20",
      green: "from-emerald-600 to-emerald-400 shadow-emerald-500/20",
      purple: "from-purple-600 to-purple-400 shadow-purple-500/20",
      orange: "from-orange-600 to-orange-400 shadow-orange-500/20",
    };
    return colors[color] || colors.blue;
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={item}>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome back, {user?.name || "Admin"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Here&apos;s a quick overview of what&apos;s happening on your platform today.
        </p>
      </motion.div>

      {/* Super Admin Alert */}
      {hasRole && (
        <motion.div variants={item}>
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-purple-900 to-indigo-900 p-6 shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shadow-inner">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Super Admin Access Active</h3>
                <p className="text-purple-100/80 text-sm mt-1">
                  You have full control over the system configuration and user management.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={item} key={index}>
              <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-zinc-900 h-full">
               <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${getColorClasses(stat.color)} opacity-10 rounded-bl-[100px]`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-linear-to-br ${getColorClasses(stat.color)} shadow-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      stat.trend === "up" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{stat.title}</h3>
                    <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{stat.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={item}>
          <Card className="h-full border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Recent Activity
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-4 relative pl-2 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800 last:before:hidden"
                  >
                    <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full shrink-0 ring-4 ring-white dark:ring-zinc-900 relative z-10"></div>
                    <div className="flex-1 -mt-1 pb-2">
                      <p className="text-zinc-900 dark:text-zinc-200 text-sm font-medium">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                          {activity.type}
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                          {activity.user} • {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <Card className="h-full border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Quick Actions</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    icon: Users, 
                    label: "Add User", 
                    desc: "Create account", 
                    bg: "bg-blue-50 dark:bg-blue-900/20", 
                    text: "text-blue-600 dark:text-blue-400" 
                  },
                  { 
                    icon: ShoppingBag, 
                    label: "New Auction", 
                    desc: "Create listing", 
                    bg: "bg-green-50 dark:bg-green-900/20", 
                    text: "text-green-600 dark:text-green-400" 
                  },
                  { 
                    icon: DollarSign, 
                    label: "View Reports", 
                    desc: "Analytics data", 
                    bg: "bg-purple-50 dark:bg-purple-900/20", 
                    text: "text-purple-600 dark:text-purple-400" 
                  },
                  { 
                    icon: Activity, 
                    label: "System Logs", 
                    desc: "View activity", 
                    bg: "bg-orange-50 dark:bg-orange-900/20", 
                    text: "text-orange-600 dark:text-orange-400" 
                  },
                ].map((action, i) => (
                  <button 
                    key={i}
                    className="flex flex-col p-4 rounded-xl bg-white dark:bg-zinc-800 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-200 group text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.bg} ${action.text} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                      {action.label}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {action.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
