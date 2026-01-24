"use client";

import { useEffect, useState } from "react";
import { AdminUploadButton } from "./AdminUploadButton";
import api from "@/lib/axios";
import GameGrid from "./game-grid";

interface Permission {
  id: string;
  key: string;
  description: string;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userRole: UserRole;
}

const hasPermission = (user: User | null, permissionKey: string): boolean => {
  if (!user?.userRole?.permissions) return false;
  return user.userRole.permissions.some(
    (permission) => permission.key === permissionKey
  );
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data.data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <main className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-muted-foreground animate-pulse">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Unable to load user. Please refresh the page.
        </div>
      </main>
    );
  }

  const canCreateGames = hasPermission(user, "game.create");
  const canReadGames = hasPermission(user, "game.read");

  return (
    <main className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Game Library</h2>
          <p className="text-muted-foreground">
            Manage and play available games.
          </p>
        </div>
        
        {canCreateGames && <AdminUploadButton />}
      </section>

      {/* Game Grid Section */}
      <section>
        {canReadGames ? (
          <GameGrid user={user} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <div>
              <h3 className="text-lg font-medium">Access Denied</h3>
              <p className="text-muted-foreground">
                You don&apos;t have permission to view games.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}