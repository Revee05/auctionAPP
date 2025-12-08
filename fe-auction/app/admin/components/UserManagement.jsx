"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Edit, Trash2, Shield, Mail } from "lucide-react";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - Replace with actual API call
  const [users] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "ADMIN",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "USER",
      status: "active",
      createdAt: "2024-02-20",
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "USER",
      status: "inactive",
      createdAt: "2024-03-10",
    },
  ]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-600/20 text-purple-400 border-purple-600";
      case "ADMIN":
        return "bg-blue-600/20 text-blue-400 border-blue-600";
      default:
        return "bg-zinc-600/20 text-zinc-400 border-zinc-600";
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === "active"
      ? "bg-green-600/20 text-green-400 border-green-600"
      : "bg-red-600/20 text-red-400 border-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Manage users and their permissions
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.status === "active").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs">Admins</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.role !== "USER").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium text-sm">
                  User
                </th>
                <th className="text-left p-4 text-zinc-400 font-medium text-sm">
                  Role
                </th>
                <th className="text-left p-4 text-zinc-400 font-medium text-sm">
                  Status
                </th>
                <th className="text-left p-4 text-zinc-400 font-medium text-sm">
                  Joined
                </th>
                <th className="text-right p-4 text-zinc-400 font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-zinc-800 border border-zinc-700">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-zinc-500 text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
