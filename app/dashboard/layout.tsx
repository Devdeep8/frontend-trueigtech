"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios"; // Axios instance with refresh interceptor
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { User } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/header";

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
        setUser(res.data.data.user); // Adjust path based on your API response
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6 text-center">
        <div>
          <h2 className="text-lg font-semibold">Unable to load user</h2>
          <p className="text-muted-foreground">Please refresh the page or log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left Sidebar */}
        < AppSidebar user={user} />
        
        {/* Main Content Area (Header + Children) */}
        <SidebarInset className="flex-1 flex flex-col">
          <DashboardHeader user={user} />
          
          {/* Page Content - Scrollable area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


