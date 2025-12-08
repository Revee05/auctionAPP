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
} from "lucide-react";

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
    },
    {
      title: "Active Auctions",
      value: "45",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingBag,
      color: "green",
    },
    {
      title: "Total Revenue",
      value: "$12,345",
      change: "+23.1%",
      trend: "up",
      icon: DollarSign,
      color: "purple",
    },
    {
      title: "Active Bids",
      value: "892",
      change: "-3.4%",
      trend: "down",
      icon: Activity,
      color: "orange",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "New user registered",
      user: "John Doe",
      time: "2 minutes ago",
    },
    {
      id: 2,
      action: "Auction created",
      user: "Jane Smith",
      time: "15 minutes ago",
    },
    {
      id: 3,
      action: "Bid placed",
      user: "Bob Wilson",
      time: "1 hour ago",
    },
    {
      id: 4,
      action: "Payment completed",
      user: "Alice Johnson",
      time: "2 hours ago",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-600/20 text-blue-400 border-blue-600",
      green: "bg-green-600/20 text-green-400 border-green-600",
      purple: "bg-purple-600/20 text-purple-400 border-purple-600",
      orange: "bg-orange-600/20 text-orange-400 border-orange-600",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back, {user?.name || "Admin"}!
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Here&apos;s what&apos;s happening with your auction platform today.
        </p>
      </div>

      {/* Super Admin Alert */}
      {hasRole && (
        <Card className="bg-gradient-to-r from-purple-900/40 to-purple-600/20 border-purple-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Super Admin Access</h3>
              <p className="text-purple-200 text-sm">
                You have full system access and can manage all resources
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-zinc-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors group">
              <Users className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">Add User</p>
              <p className="text-zinc-500 text-xs mt-1">Create new account</p>
            </button>
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors group">
              <ShoppingBag className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">New Auction</p>
              <p className="text-zinc-500 text-xs mt-1">Create listing</p>
            </button>
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors group">
              <DollarSign className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">View Reports</p>
              <p className="text-zinc-500 text-xs mt-1">Analytics data</p>
            </button>
            <button className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors group">
              <Activity className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white font-medium text-sm">System Logs</p>
              <p className="text-zinc-500 text-xs mt-1">View activity</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
