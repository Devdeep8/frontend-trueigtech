/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  created_at: string;
};

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  // 🔹 Fetch users (FORMAT YOU ASKED)
  const fetchUsers = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        `/api/users/all?page=${pageNumber}&limit=${limit}`
      );

      setUsers(res.data.data.users);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) setError("Unauthorized");
      else if (status === 403) setError("Forbidden – Admin access required");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // 🔹 Actions
  const handleToggleActive = async (id: string) => {
    await api.patch(`/api/users/toggle/${id}`);
    fetchUsers(page);
  };

  const handleRoleChange = async (id: string, role: "admin" | "user") => {
    await api.patch(`/api/users/update/${id}`, { role });
    fetchUsers(page);
  };

  const handleForceLogout = async (id: string) => {
    await api.post(`/api/users/logout/${id}`);
  };

  if (loading) return <p className="p-4">Loading users...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">User Management</h1>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
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
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                >
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
                    <DropdownMenuItem
                      onClick={() =>
                        handleRoleChange(
                          user.id,
                          user.role === "admin" ? "user" : "admin"
                        )
                      }
                    >
                      Change Role {user.role == "user" ? "Admin" : "User"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleToggleActive(user.id)}
                    >
                      Toggle Active
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleForceLogout(user.id)}
                    >
                      Force Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* PAGINATION */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Page {page}
        </span>

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
