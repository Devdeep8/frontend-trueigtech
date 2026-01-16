"use client";

import { useEffect, useState } from "react";
import { Header } from "./header";
import api from "@/lib/axios"; // Axios instance with refresh interceptor

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    return (
      <main className="p-6">Unable to load user. Please refresh the page.</main>
    );
  }

  return (

    <div className="p-6">
    <Header data = {{user}}/>
    {children}
    </div>
      )
}
