"use client";

import { useEffect, useState } from "react";
import { AdminUploadButton } from "./AdminUploadButton";
import api from "@/lib/axios"; // Axios instance with refresh interceptor
import GameTable from "./game-table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data.data.user); // assuming backend returns { data: { user: {...} } }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <main className="p-6">Loading dashboard...</main>;
  }

  if (!user) {
    return <main className="p-6">Unable to load user. Please refresh the page.</main>;
  }

  return (
    <main className="p-6">

      <section className="mt-4">
        <p className="text-gray-700">You are successfully logged in.</p>

        {user.role === "admin" && <AdminUploadButton />}
      </section>
      <section>
        <GameTable user={user}/>
      </section>
    </main>
  );
}
