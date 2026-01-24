/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ReactNode, useState } from "react";
import api from "@/lib/axios";
import { handleApiError, handleApiSuccess } from "@/lib/toastError";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";

// ================= TYPES =================
type Permission = {
  key: ReactNode;
  id: string;
  name: string;
  description?: string;
};

type UserRole = {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
};

type User = {
  userRole: UserRole;
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  created_at: string;
};

type Role = {
  id: string;
  name: string;
};

interface UserTableProps {
  initialUsers: User[];
  roles: Role[];
  currentUser: any;
}

// Helper to check permissions
const hasPermission = (user: any, key: string) => {
  return user?.userRole?.permissions?.some((p: Permission) => p.key === key);
};

export default function UserTable({
  initialUsers,
  roles,
  currentUser,
}: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const [page, setPage] = useState(1);
  const limit = 10;

  // --- EDIT USER STATE ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- CREATE USER STATE ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("");
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  // Check permissions
  const canCreate = hasPermission(currentUser, "user.create");
  const canUpdate = hasPermission(currentUser, "user.update");
  const canDelete = hasPermission(currentUser, "user.delete");
  const canRead = hasPermission(currentUser, "user.read");

  // --- OPTIMISTIC & API ACTIONS ---

  // 1. TOGGLE ACTIVE
  const handleToggleActive = (id: string) => {
    if (!canUpdate) return;

    // 1. Optimistic: Update UI
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, isActive: !u.isActive } : u
      )
    );

    // 2. API Call
    api
      .patch(`/api/users/toggle/${id}`)
      .catch((err) => {
        // 3. Revert on error
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, isActive: !u.isActive } : u
          )
        );
        handleApiError(err);
      });
  };

  // 2. CHANGE ROLE
  const handleRoleChange = (userId: string, newRoleId: string, newRoleName: string) => {
    if (!canUpdate) return;

    // Snapshot for revert
    const previousUsers = [...users];

    // 1. Optimistic: Update UI (update userRole object)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, userRole: { ...u.userRole, id: newRoleId, name: newRoleName } }
          : u
      )
    );

    // 2. API Call
    api
      .patch(`/api/users/update/${userId}`, { roleId: newRoleId })
      .catch((err) => {
        // 3. Revert on error
        setUsers(previousUsers);
        handleApiError(err);
      });
  };

  // 3. EDIT PROFILE
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsSavingEdit(true);
    
    // Snapshot for revert
    const previousUsers = [...users];

    // 1. Optimistic: Update UI
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: editName, email: editEmail }
          : u
      )
    );

    try {
      // 2. API Call
      await api.patch(`/api/users/update/${editingUser.id}`, {
        name: editName,
        email: editEmail,
      });
      handleApiSuccess("User profile updated successfully");
      closeEditDialog();
    } catch (err: any) {
      // 3. Revert on error
      setUsers(previousUsers);
      handleApiError(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. DELETE USER
  const handleDeleteUser = (id: string) => {
    if (!canDelete) return;
    if (!confirm("Are you sure you want to delete this user?")) return;

    // Snapshot for revert
    const previousUsers = [...users];

    // 1. Optimistic: Update UI (Filter out user)
    setUsers((prev) => prev.filter((u) => u.id !== id));

    api
      .delete(`/api/users/delete/${id}`)
      .then(() => {
        handleApiSuccess("User deleted successfully");
      })
      .catch((err) => {
        // 3. Revert on error
        setUsers(previousUsers);
        handleApiError(err);
      });
  };

  // 5. CREATE USER
  const handleSaveCreate = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      handleApiError("Please fill in all fields");
      return;
    }

    setIsSavingCreate(true);
    try {
      // 1. API Call
      const res = await api.post(`/api/users/create`, {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        roleId: newUserRole,
      });
      
      // 2. Optimistic: Add to top of list (Using dummy user created from response or inputs)
      // Note: We assume API returns the created user or we create a temporary one
      const createdUser = res.data?.data?.user || {
        id: "temp-" + Date.now(),
        name: newUserName,
        email: newUserEmail,
        isActive: true,
        created_at: new Date().toISOString(),
        userRole: roles.find(r => r.id === newUserRole) || { name: "Loading...", permissions: [] }
      };
      
      setUsers((prev) => [createdUser, ...prev]);
      
      handleApiSuccess("User created successfully");
      setIsCreateDialogOpen(false);
      
      // Clear form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsSavingCreate(false);
    }
  };

  const handleForceLogout = async (id: string) => {
    if (!canUpdate) return;
    try {
      await api.post(`/api/users/logout/${id}`);
      handleApiSuccess("User logged out successfully");
    } catch (err: any) {
      handleApiError(err);
    }
  };

  // --- DIALOG HANDLERS ---
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setIsEditDialogOpen(false);
    setEditName("");
    setEditEmail("");
  };

  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  if (!canRead)
    return (
      <p className="p-4 text-red-500">You do not have permission to view users.</p>
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>

        {/* CREATE USER BUTTON */}
        {canCreate && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Create User
          </Button>
        )}
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>

              <TableCell>
                <Badge
                  variant={
                    user.userRole.name === "super_admin" ? "default" : "secondary"
                  }
                >
                  {user.userRole.name}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.userRole.permissions && user.userRole.permissions.length > 0 ? (
                    user.userRole.permissions.map((permission) => (
                      <Badge
                        key={permission.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {permission.key}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No permissions
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>

              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {/* Update Actions */}
                    {canUpdate && (
                      <>
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Profile
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* CHANGE ROLE SUBMENU */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Change Role <ChevronsUpDown className="ml-auto h-4 w-4" />
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {roles.map((role) => (
                              <DropdownMenuItem
                                key={role.id}
                                onClick={() =>
                                  handleRoleChange(user.id, role.id, role.name)
                                }
                                disabled={user.userRole.id === role.id}
                              >
                                {role.name}
                                {user.userRole.id === role.id && " (Current)"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                          {user.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleForceLogout(user.id)}>
                          <LogOut className="mr-2 h-4 w-4" /> Force Logout
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Delete Action */}
                    {canDelete && (
                      <>
                        {canUpdate && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </>
                    )}

                    {!canUpdate && !canDelete && (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No actions allowed
                      </p>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE USER DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">
                Email
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role" className="text-right">
                Role
              </Label>
              <Select onValueChange={setNewUserRole} value={newUserRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCreate} disabled={isSavingCreate}>
              {isSavingCreate ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAGINATION */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">Page {page}</span>

        <Button
          variant="outline"
          disabled={users.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}