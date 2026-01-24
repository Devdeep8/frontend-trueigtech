"use client";


import { Button } from "@/components/ui/button";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LogOut,
  User,
} from "lucide-react";
import api from "@/lib/axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userRole?: {
    name: string;
    permissions: { key: string }[];
  };
}


const handleLogout = async () => {
  try {
    await api.post("/api/auth/logout");
    window.location.href = "/login";
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

export function DashboardHeader({ user }: { user: User | null }) {


  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      {/* Sidebar Trigger (Hamburger menu for mobile) */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {/* Divider on desktop */}
        <div className="h-4 w-px bg-border md:hidden" />
      </div>

      {/* Left: Welcome Message */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold leading-none">
          {getGreeting()}, {user?.name || "User"}
        </h1>
        {user?.userRole?.name && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {user.userRole.name}
          </p>
        )}
      </div>

      {/* Right: Navigation & Actions */}
      <div className="ml-auto flex items-center gap-6">
        {/* Desktop Horizontal Nav */}
        

        {/* User Badge (Desktop only) */}
     
        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}