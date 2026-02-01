/* eslint-disable react-hooks/set-state-in-effect */
"use client";


import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { handleApiError, handleApiSuccess } from "@/lib/toastError";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Permission = {
  id: string;
  key: string;
};

type Role = {
  id: string;
  name: string;
  permissions: Permission[];
};

export default function RolesWithPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  /* ---------------- FETCH DATA ---------------- */

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/api/roles/with-permissions"),
        api.get("/api/permissions/all"),
      ]);

      setRoles(rolesRes.data.data);
      setAllPermissions(permsRes.data.data.permissions ?? permsRes.data.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- HELPERS ---------------- */

  const hasPermission = (role: Role, permissionId: string) =>
    role.permissions.some((p) => p.id === permissionId);

  const togglePermission = async (
    roleId: string,
    permissionId: string,
    checked: boolean
  ) => {
    try {
      if (checked) {
        await api.post(`/api/roles/${roleId}/permissions`, {
          permissionId,
        });
        handleApiSuccess("Permission added successfully");
      } else {
        await api.delete(
          `/api/roles/${roleId}/permissions/${permissionId}`
        );
        handleApiSuccess("Permission removed successfully");
      }

      fetchData(); // refresh UI
    } catch (error) {
      handleApiError(error);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Role & Permission Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage role-based access control
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {roles.map((role) => {
          const isEditing = editingRoleId === role.id;
          const isSuperAdmin = role.name === "super_admin";

          return (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize">
                  {role.name}
                </CardTitle>

                {!isSuperAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingRoleId(
                        isEditing ? null : role.id
                      )
                    }
                  >
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                {/* READ MODE */}
                {!isEditing && (
                  <>
                    {role.permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No permissions assigned
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => (
                          <Badge
                            key={perm.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {perm.key}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* EDIT MODE */}
                {isEditing && (
                  <div className="space-y-2">
                    {allPermissions.map((perm) => {
                      const checked = hasPermission(role, perm.id);

                      return (
                        <div
                          key={perm.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              togglePermission(
                                role.id,
                                perm.id,
                                Boolean(value)
                              )
                            }
                          />
                          <span className="text-sm">
                            {perm.key}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isSuperAdmin && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Super admin always has all permissions
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
