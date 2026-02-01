/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { handleApiError, handleApiSuccess } from "@/lib/toastError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, ShieldCheck, } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ================= TYPES =================
type Permission = {
  id: string | number; // ID can be string or number
  key: string;
  action?: string;
  description: string;
};

type GroupedPermissions = Record<string, Permission[]>;

type Role = {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[]; // Comes from /with-permissions
};

// ================= PAGE =================
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<GroupedPermissions>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]); 

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD DATA ---------------- */
  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Roles WITH permissions (to display in grid)
      // 2. Fetch Permissions Grouped (for the create/edit checkbox list)
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/api/roles/with-permissions"), 
        api.get("/api/permissions/group"),
      ]);

      console.log(rolesRes.data.data, permsRes.data.data)

      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const resetForm = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setSelectedPermissions([]);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    
    // Extract permission KEYS from the role object
    if (role.permissions) {
      const keys = role.permissions.map((p) => p.key);
      setSelectedPermissions(keys);
    } else {
      setSelectedPermissions([]);
    }
  };

  const togglePermission = (key: string, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, key] : prev.filter((p) => p !== key)
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);

    // 1. Flatten all permissions to search for IDs
    const allPermissions = Object.values(permissions).flat();

    // 2. Map UI Keys (e.g., "user.create") to Database IDs
    const selectedPermissionIds = selectedPermissions
      .map((key) => {
        const found = allPermissions.find((p) => p.key === key);
        return found?.id;
      })
      .filter((id) => id !== undefined);

    // Snapshot for optimistic revert
    const previousRoles = [...roles];

    try {
      if (editingRole) {
        // --- OPTIMISTIC UPDATE ---
        setRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id
              ? { ...r, name, description, permissions: selectedPermissions.map(k => ({id: 1, key: k})) as any } // Temporary optimistic perm display
              : r
          )
        );

        // --- API CALL ---
        await api.put(`/api/roles/${editingRole.id}`, {
          name,
          description,
          permissions: selectedPermissionIds,
        });
        
        handleApiSuccess("Role updated successfully");
      } else {
        // --- OPTIMISTIC CREATE ---
        const tempRole = {
            id: "temp-" + Date.now(),
            name,
            description,
            permissions: selectedPermissions.map(k => ({id: 1, key: k})) as any // Temporary optimistic perm display
        };
        setRoles(prev => [tempRole, ...prev]);

        // --- API CALL ---
        await api.post(`/api/roles/create-with-permissions`, {
          data: {
            name: name,
            description: description,
          },
          permissions: selectedPermissionIds,
        });
        
        handleApiSuccess("Role created successfully");
      }

      resetForm();
      loadData(); // Reload to get fresh data from server
    } catch (error) {
      // Revert optimistic update on error
      setRoles(previousRoles);
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Create roles and assign permissions securely.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" /> New Role
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle className="text-xl" id="dialog-title">
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Moderator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  placeholder="Brief description of access level"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* PERMISSION GROUPS */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Assign Permissions</Label>
                <ScrollArea className="h-75 pr-4 rounded-md border p-4">
                  <div className="space-y-6">
                    {Object.entries(permissions).map(([group, perms]) => (
                      <div key={group}>
                        <h4 className="mb-3 text-sm font-medium text-primary flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          {group.toUpperCase()}
                        </h4>
                        <div className="space-y-3 pl-2">
                          {perms.map((perm) => (
                            <div
                              key={perm.key}
                              className="flex items-start space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                            >
                              <Checkbox
                                id={perm.key}
                                checked={selectedPermissions.includes(perm.key)}
                                onCheckedChange={(v) =>
                                  togglePermission(perm.key, Boolean(v))
                                }
                                className="mt-0.5"
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={perm.key}
                                  className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {perm.key}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ROLE LIST */}
      {loading ? (
         <div className="p-4 text-center">Loading roles...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="flex flex-col transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium capitalize">
                  {role.name}
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEdit(role)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {role.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Permissions</span>
                  <Badge variant={"secondary"} className="gap-1">
                    {role.permissions?.length || 0} assigned
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}