"use client";

import { useState, useEffect } from "react";
import { useAuth, useRole } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Edit, Trash2, Shield, Mail, Loader2, AlertCircle, ChevronLeft, ChevronRight, Ban, UserCheck } from "lucide-react";
import apiClient from "@/lib/apiClient";
import EditUserModal from "../components/EditUserModal";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { hasRole: isSuperAdmin } = useRole("SUPER_ADMIN");
  const { hasRole: isAdmin } = useRole("ADMIN");

  const [users, setUsers] = useState([]);
  // Pagination state: pages cache and current index
  // pages: [{ cursor, users, nextCursor, hasNextPage }]
  const [pages, setPages] = useState([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('name') // 'id' or 'name'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
  // Jika SUPER_ADMIN atau ADMIN menampilkan kolom Actions (jadi total kolom = 6 setelah menambahkan ID),
  // jika bukan keduanya, kolom Actions disembunyikan (total kolom = 5).
  const columnCount = isSuperAdmin || isAdmin ? 6 : 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({ totalUsers: 0, activeUsers: 0, adminCount: 0 })

  // Fetch a page from API using cursor-based pagination
  const fetchPage = async (cursor = null, append = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = isSuperAdmin ? "/api/superadmin/users" : "/api/admin/users"
      // include server-side search param `q` so backend can return matching results
      const params = { limit: pageSize, sortBy, sortOrder }
      if (searchQuery) params.q = searchQuery
      if (cursor) params.cursor = cursor

      const response = await apiClient.get(endpoint, { params })

      // Ensure users is always an array
      const usersData = Array.isArray(response.data.users) ? response.data.users : [];
      
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles[0]
          : "USER",
        roles: Array.isArray(user.roles) ? user.roles : [],
        // Normalize status from backend enums (e.g. "ACTIVE") to lowercase keys ("active")
        status: user.status ? String(user.status).toLowerCase() : "active",
        createdAt: user.createdAt,
      }))

      const page = {
        cursor,
        users: transformedUsers,
        nextCursor: response.data.nextCursor || null,
        hasNextPage: !!response.data.hasNextPage
      }

      // update totals from server (if provided)
      if (response.data.totalUsers !== undefined) {
        setTotals({
          totalUsers: Number(response.data.totalUsers) || 0,
          activeUsers: Number(response.data.activeUsers) || 0,
          adminCount: Number(response.data.adminCount) || 0
        })
      }

      if (append) {
        setPages(prev => {
          // discard any forward cache beyond current index
          const base = prev.slice(0, currentPageIndex + 1)
          return [...base, page]
        })
        setCurrentPageIndex(i => i + 1)
      } else {
        setPages([page])
        setCurrentPageIndex(0)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setError(err.response?.data?.error || "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  // Load first page on mount and when pageSize/sort/isSuperAdmin changes
  useEffect(() => {
    fetchPage(null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, sortBy, sortOrder, isSuperAdmin])

  // When user types a search, debounce and fetch from server so we can find users
  // not yet loaded in the current page cache.
  useEffect(() => {
    const t = setTimeout(() => {
      fetchPage(null, false)
    }, 2000) // 2 seconds debounce
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const currentUsers = pages[currentPageIndex]?.users || []

  const filteredUsers = currentUsers.filter(
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
      case "ARTIST":
        return "bg-green-600/20 text-green-400 border-green-600";
      case "COLLECTOR":
        return "bg-orange-600/20 text-orange-400 border-orange-600";
      default:
        return "bg-zinc-600/20 text-zinc-400 border-zinc-600";
    }
  };

  const getStatusBadgeColor = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "active":
        return "bg-green-600/20 text-green-400 border-green-600";
      case "pending_verification":
      case "pendingverification":
      case "pending-verification":
        return "bg-yellow-600/20 text-yellow-400 border-yellow-600";
      case "suspended":
      case "deactivated":
      case "banned":
        return "bg-red-600/20 text-red-400 border-red-600";
      default:
        return "bg-zinc-600/20 text-zinc-400 border-zinc-600";
    }
  };

  // Friendly label for display (e.g. "PENDING_VERIFICATION" -> "Pending verification")
  const formatStatusLabel = (status) => {
    if (!status) return "Unknown";
    const s = String(status).toLowerCase();
    return s.replace(/[_-]/g, " ").replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  };

  const handleAssignRole = async (userId, roleName) => {
    setIsLoading(true)
    try {
      // Find current user's roles from the cached page
      const u = currentUsers.find(x => x.id === userId)
      const existingRoles = Array.isArray(u?.roles) ? u.roles : []

      // Remove any other roles (so the user effectively has a single role)
      for (const r of existingRoles) {
        if (r === roleName) continue
        try {
          await apiClient.delete(`/api/superadmin/users/${userId}/roles`, { data: { roleName: r } })
        } catch (e) {
          // Log and continue removing other roles
          console.warn('Failed to remove role', r, e?.response?.data || e.message)
        }
      }

      // Assign the desired role if not already present
      if (!existingRoles.includes(roleName)) {
        await apiClient.post(`/api/superadmin/users/${userId}/roles`, { roleName })
      }

      // Clear selected role after successful assignment
      setSelectedRoles(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      // Refresh current page after successful assignment/removal
      const cur = pages[currentPageIndex]?.cursor || null
      await fetchPage(cur, false)
    } catch (err) {
      console.error("Failed to assign role:", err);
      alert(err.response?.data?.error || "Failed to assign role");
    } finally {
      setIsLoading(false)
    }
  };

  const [editingUser, setEditingUser] = useState(null);
  // Store selected roles temporarily before assignment
  const [selectedRoles, setSelectedRoles] = useState({});

  // Open modal to edit user
  const handleEdit = (userId) => {
    const u = currentUsers.find((x) => x.id === userId);
    if (u) setEditingUser(u);
  };

  // Delete user (SUPER_ADMIN only). Frontend checks prevent deleting SUPER_ADMIN or self.
  const handleDelete = async (userId, userRoles = []) => {
    // Prevent deleting SUPER_ADMIN accounts or self from frontend
    if (userRoles.includes('SUPER_ADMIN')) {
      alert('Cannot delete a SUPER_ADMIN account')
      return
    }
    if (currentUser?.id === userId) {
      alert('You cannot delete your own account')
      return
    }

    const ok = confirm('Are you sure you want to delete this user? This action cannot be undone.')
    if (!ok) return

    setIsLoading(true)
    try {
      const resp = await apiClient.delete(`/api/superadmin/users/${userId}`)
      if (resp.status === 200) {
        // Refresh current page
        const cur = pages[currentPageIndex]?.cursor || null
        await fetchPage(cur, false)
      } else {
        alert(resp.data?.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setIsLoading(false)
    }
  }

  // Ban user (ADMIN & SUPER_ADMIN)
  const handleBan = async (userId, userRoles = []) => {
    // Prevent banning self
    if (currentUser?.id === userId) {
      alert('You cannot ban yourself')
      return
    }

    // Admin restrictions: cannot ban ADMIN or SUPER_ADMIN
    if (isAdmin && !isSuperAdmin) {
      if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
        alert('Admins cannot ban other admins or super admins')
        return
      }
    }

    // Super Admin restrictions: cannot ban other SUPER_ADMIN
    if (isSuperAdmin && userRoles.includes('SUPER_ADMIN')) {
      alert('Super admins cannot ban other super admins')
      return
    }

    const ok = confirm('Are you sure you want to ban this user?')
    if (!ok) return

    setIsLoading(true)
    try {
      const endpoint = isSuperAdmin ? `/api/superadmin/users/${userId}/ban` : `/api/admin/users/${userId}/ban`
      const resp = await apiClient.put(endpoint)
      if (resp.status === 200) {
        // Refresh current page
        const cur = pages[currentPageIndex]?.cursor || null
        await fetchPage(cur, false)
      } else {
        alert(resp.data?.error || 'Failed to ban user')
      }
    } catch (err) {
      console.error('Failed to ban user:', err)
      alert(err.response?.data?.error || 'Failed to ban user')
    } finally {
      setIsLoading(false)
    }
  }

  // Unban user (ADMIN & SUPER_ADMIN)
  const handleUnban = async (userId, userRoles = []) => {
    // Admin restrictions: cannot unban ADMIN or SUPER_ADMIN
    if (isAdmin && !isSuperAdmin) {
      if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
        alert('Admins cannot unban other admins or super admins')
        return
      }
    }

    // Super Admin restrictions: cannot unban other SUPER_ADMIN (though they shouldn't be banned)
    if (isSuperAdmin && userRoles.includes('SUPER_ADMIN')) {
      alert('Super admins cannot unban other super admins')
      return
    }

    const ok = confirm('Are you sure you want to unban this user?')
    if (!ok) return

    setIsLoading(true)
    try {
      const endpoint = isSuperAdmin ? `/api/superadmin/users/${userId}/unban` : `/api/admin/users/${userId}/unban`
      const resp = await apiClient.put(endpoint)
      if (resp.status === 200) {
        // Refresh current page
        const cur = pages[currentPageIndex]?.cursor || null
        await fetchPage(cur, false)
      } else {
        alert(resp.data?.error || 'Failed to unban user')
      }
    } catch (err) {
      console.error('Failed to unban user:', err)
      alert(err.response?.data?.error || 'Failed to unban user')
    } finally {
      setIsLoading(false)
    }
  }

  // Pagination controls
  const handleNext = async () => {
    const curPage = pages[currentPageIndex]
    if (!curPage) return
    // If we have cached next page, just move forward
    if (pages[currentPageIndex + 1]) {
      setCurrentPageIndex(i => i + 1)
      return
    }
    // Otherwise fetch using nextCursor
    if (curPage.nextCursor) {
      await fetchPage(curPage.nextCursor, true)
    }
  }

  const handlePrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(i => i - 1)
  }

  const totalLoaded = pages.reduce((s, p) => s + (p.users?.length || 0), 0)

  return (
    <div className="space-y-6">
      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={async () => {
          setEditingUser(null);
          // Refresh current page
          const cur = pages[currentPageIndex]?.cursor || null
          await fetchPage(cur, false)
        }}
      />
      {/* Error Alert */}
      {error && (
        <Card className="bg-red-900/20 border-red-500 p-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">User Management</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            Manage users and their permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 text-sm">Size:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm p-1 rounded-md border border-zinc-200 dark:border-zinc-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <label className="text-zinc-500 text-sm ml-2">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm p-1 rounded-md border border-zinc-200 dark:border-zinc-700"
            >
              <option value="id">ID</option>
              <option value="name">Name</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
              className="ml-1"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentPageIndex <= 0 || isLoading}
            className="mr-2"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-zinc-400 px-2">Page {currentPageIndex + 1}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNext}
            disabled={isLoading || !pages[currentPageIndex]?.hasNextPage}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <Input
          type="text"
          aria-label="Search users"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-10 w-full text-sm rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-800 shadow-sm"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs">Total Users</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totals.totalUsers ?? totalLoaded}</p>
              </div>
          </div>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs">Active Users</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totals.activeUsers ?? currentUsers.filter((u) => u.status === "active").length}</p>
              </div>
          </div>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs">Admins</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totals.adminCount ?? currentUsers.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                  <th className="text-left p-4 text-zinc-400 font-medium text-sm">ID</th>
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
                  <td colSpan={columnCount} className="p-8 text-center text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="p-4 text-zinc-500 text-sm">{user.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-zinc-900 dark:text-white font-medium">{user.name}</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>

                        {/* Role assignment controls - only visible to SUPER_ADMIN */}
                        {isSuperAdmin && (
                          <div className="ml-3 flex items-center gap-2">
                            <select
                              value={selectedRoles[user.id] || user.role}
                              onChange={(e) => {
                                setSelectedRoles(prev => ({
                                  ...prev,
                                  [user.id]: e.target.value
                                }));
                              }}
                              className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm p-1 rounded-md border border-zinc-200 dark:border-zinc-700"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="ARTIST">ARTIST</option>
                              <option value="COLLECTOR">COLLECTOR</option>
                            </select>
                            <Button
                              size="sm"
                              onClick={() => {
                                const roleToAssign = selectedRoles[user.id] || user.role;
                                handleAssignRole(user.id, roleToAssign);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={isLoading || (!selectedRoles[user.id] || selectedRoles[user.id] === user.role)}
                            >
                              Assign
                            </Button>
                          </div>
                        )}
                      </div>
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
                    {(isSuperAdmin || isAdmin) && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                            onClick={() => handleEdit(user.id)}
                            disabled={isLoading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {/* Ban/Unban buttons - visible for both ADMIN and SUPER_ADMIN */}
                          {user.status?.toLowerCase() === 'banned' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-400 hover:text-green-300 hover:bg-green-600/20"
                              onClick={() => handleUnban(user.id, user.roles)}
                              disabled={
                                isLoading ||
                                currentUser?.id === user.id ||
                                (!isSuperAdmin && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')))
                              }
                              title="Unban user"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-600/20"
                              onClick={() => handleBan(user.id, user.roles)}
                              disabled={
                                isLoading ||
                                currentUser?.id === user.id ||
                                (!isSuperAdmin && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN'))) ||
                                (isSuperAdmin && user.roles.includes('SUPER_ADMIN'))
                              }
                              title="Ban user"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                              onClick={() => handleDelete(user.id, user.roles)}
                              disabled={
                                isLoading ||
                                (Array.isArray(user.roles) && user.roles.includes('SUPER_ADMIN')) ||
                                currentUser?.id === user.id
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
}
