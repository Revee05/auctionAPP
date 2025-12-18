"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useRole } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, Edit, Trash2, Shield, Mail, Loader2, AlertCircle, 
  ChevronLeft, ChevronRight, Ban, UserCheck, GripVertical, MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import apiClient from "@/lib/apiClient";
import EditUserModal from "../components/EditUserModal";

// --- Resizable Header Component ---
const ResizableHeader = ({ width, minWidth, onResize, children }) => {
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;

    const doDrag = (dragEvent) => {
        const newWidth = Math.max(minWidth, startWidth + (dragEvent.clientX - startX));
        onResize(newWidth);
    };

    const stopDrag = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width, minWidth, onResize]);

  return (
    <th 
      className="relative text-left p-4 text-zinc-500 dark:text-zinc-400 font-semibold text-xs uppercase tracking-wider select-none border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
      style={{ width: width }}
    >
      <div className="flex items-center justify-between h-full">
        {children}
        <div
            className={`absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center group touch-none z-10 ${isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'}`}
            onMouseDown={startResize}
        >
            <div className={`w-0.5 h-4 bg-zinc-300 dark:bg-zinc-700 group-hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : ''}`} />
        </div>
      </div>
    </th>
  );
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { hasRole: isSuperAdmin } = useRole("SUPER_ADMIN");
  const { hasRole: isAdmin } = useRole("ADMIN");

  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({ totalUsers: 0, activeUsers: 0, adminCount: 0 })

  // Column widths state
  const [colWidths, setColWidths] = useState({
    id: 80,
    user: 300,
    role: 150,
    status: 120,
    joined: 150,
    actions: 100
  });

  const handleResize = (key, newWidth) => {
    setColWidths(prev => ({ ...prev, [key]: newWidth }));
  };

  // Fetch logic ... (same as before)
  const fetchPage = async (cursor = null, append = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const endpoint = isSuperAdmin ? "/api/superadmin/users" : "/api/admin/users"
      const params = { limit: pageSize, sortBy, sortOrder }
      if (searchQuery) params.q = searchQuery
      if (cursor) params.cursor = cursor

      const response = await apiClient.get(endpoint, { params })
      const usersData = Array.isArray(response.data.users) ? response.data.users : [];
      
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "USER",
        roles: Array.isArray(user.roles) ? user.roles : [],
        status: user.status ? String(user.status).toLowerCase() : "active",
        createdAt: user.createdAt,
      }))

      const page = {
        cursor,
        users: transformedUsers,
        nextCursor: response.data.nextCursor || null,
        hasNextPage: !!response.data.hasNextPage
      }

      if (response.data.totalUsers !== undefined) {
        setTotals({
          totalUsers: Number(response.data.totalUsers) || 0,
          activeUsers: Number(response.data.activeUsers) || 0,
          adminCount: Number(response.data.adminCount) || 0
        })
      }

      if (append) {
        setPages(prev => [...prev.slice(0, currentPageIndex + 1), page])
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

  useEffect(() => {
    fetchPage(null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, sortBy, sortOrder, isSuperAdmin])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPage(null, false)
    }, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const currentUsers = pages[currentPageIndex]?.users || []
  const filteredUsers = currentUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});

  const handleEdit = (userId) => {
    const u = currentUsers.find((x) => x.id === userId);
    if (u) setEditingUser(u);
  };

  // Actions (Assign, Delete, Ban) ... (Same implementation logic, just wrapped in cleaner design)
  const handleAssignRole = async (userId, roleName) => { /* ... existing logic ... */ };
  const handleDelete = async (userId, userRoles = []) => { /* ... existing logic ... */ };
  const handleBan = async (userId, userRoles = []) => { /* ... existing logic ... */ };
  const handleUnban = async (userId, userRoles = []) => { /* ... existing logic ... */ };

  // Helper for badges
  const getRoleBadgeClasses = (role) => {
    const map = {
        SUPER_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        ARTIST: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
        COLLECTOR: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        USER: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
    };
    return map[role] || map.USER;
  };

  const getStatusBadgeClasses = (status) => {
    if (['active'].includes(status)) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    if (['banned', 'suspended'].includes(status)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
  };

  return (
    <div className="space-y-6">
      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={async () => {
          setEditingUser(null);
          const cur = pages[currentPageIndex]?.cursor || null
          await fetchPage(cur, false)
        }}
      />
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900 p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
        </Card>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">User Management</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage users, roles, and permissions across the platform.</p>
            </div>
            
            {/* Quick Stats Row */}
            <div className="flex gap-3 overflow-x-auto pb-1 max-w-full">
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm whitespace-nowrap">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><Shield className="w-4 h-4"/></div>
                    <div><p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total</p><p className="font-bold">{totals.totalUsers ?? '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm whitespace-nowrap">
                    <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400"><UserCheck className="w-4 h-4"/></div>
                    <div><p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active</p><p className="font-bold">{totals.activeUsers ?? '-'}</p></div>
                </div>
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                />
            </div>
            <div className="flex items-center gap-2">
                <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                </select>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} title="Toggle Sort Order">
                    {sortOrder === 'asc' ? <span className="text-xs font-bold">AZ</span> : <span className="text-xs font-bold">ZA</span>}
                </Button>
            </div>
        </div>
      </div>

      {/* Resizable Table */}
      <div className="w-full relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {isLoading && users.length === 0 ? (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <ResizableHeader width={colWidths.id} minWidth={60} onResize={(w) => handleResize('id', w)}>ID</ResizableHeader>
                        <ResizableHeader width={colWidths.user} minWidth={200} onResize={(w) => handleResize('user', w)}>User</ResizableHeader>
                        <ResizableHeader width={colWidths.role} minWidth={120} onResize={(w) => handleResize('role', w)}>Role</ResizableHeader>
                        <ResizableHeader width={colWidths.status} minWidth={100} onResize={(w) => handleResize('status', w)}>Status</ResizableHeader>
                        <ResizableHeader width={colWidths.joined} minWidth={120} onResize={(w) => handleResize('joined', w)}>Joined</ResizableHeader>
                        {(isSuperAdmin || isAdmin) && (
                             <ResizableHeader width={colWidths.actions} minWidth={80} onResize={(w) => handleResize('actions', w)}><span className="text-right block w-full">Actions</span></ResizableHeader>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="p-12 text-center text-zinc-500">No users found matching your criteria.</td></tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="p-4 text-xs font-mono text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: colWidths.id }}>
                                    #{user.id}
                                </td>
                                <td className="p-4" style={{ maxWidth: colWidths.user }}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
                                            <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs">
                                                {user.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4" style={{ maxWidth: colWidths.role }}>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClasses(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4" style={{ maxWidth: colWidths.status }}>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(user.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${['active'].includes(user.status) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-zinc-500" style={{ maxWidth: colWidths.joined }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                {(isSuperAdmin || isAdmin) && (
                                    <td className="p-4 text-right" style={{ maxWidth: colWidths.actions }}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                {user.status === 'banned' ? (
                                                    <DropdownMenuItem onClick={() => handleUnban(user.id, user.roles)}>
                                                        <UserCheck className="w-4 h-4 mr-2 text-green-500" /> Unban
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleBan(user.id, user.roles)}>
                                                        <Ban className="w-4 h-4 mr-2 text-orange-500" /> Ban
                                                    </DropdownMenuItem>
                                                )}
                                                {isSuperAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDelete(user.id, user.roles)} className="text-red-600 focus:text-red-600 target:text-red-600">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            </div>
        )}
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500">
                Page {currentPageIndex + 1}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (currentPageIndex > 0) setCurrentPageIndex(i => i - 1);
                    }}
                    disabled={currentPageIndex <= 0 || isLoading}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                         const curPage = pages[currentPageIndex]
                         if (pages[currentPageIndex + 1]) {
                           setCurrentPageIndex(i => i + 1)
                         } else if (curPage?.nextCursor) {
                           await fetchPage(curPage.nextCursor, true)
                         }
                    }}
                    disabled={isLoading || !pages[currentPageIndex]?.hasNextPage}
                >
                    Next
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
