"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { 
  Home, 
  Users, 
  Shield, 
  UserCog, 
  User, 
  LucideIcon
} from "lucide-react";

// --- Types & Interfaces ---

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

type NavItem = {
  label: string;
  href: string | ((userId?: string) => string); // Allow function for dynamic routes
  order: number;
  icon: LucideIcon;
  requiredPermission?: string;
};

// --- Constants & Config ---

// Configuration for navigation items (Used by both Sidebar and Header)
const NAV_ITEMS: NavItem[] = [
  {
    label: "Game",
    href: "/dashboard",
    order: 1,
    icon: Home,
    requiredPermission: "game.read",
  },
  {
    label: "Users",
    href: "/dashboard/user-managment",
    order: 2,
    icon: Users,
    requiredPermission: "user.read",
  },
  {
    label: "Permissions",
    href: "/dashboard/permission",
    order: 3,
    icon: Shield,
    requiredPermission: "permission.read",
  },
  {
    label: "Roles",
    href: "/dashboard/role",
    order: 4,
    icon: UserCog,
    requiredPermission: "role.read",
  },
  {
    label: "My Profile",
    href: (userId) => `/dashboard/profile/${userId}`, // Dynamic profile route
    order: 30,
    icon: User,
  },
];

// --- Helper Functions ---

// Check if user has specific permission
const hasPermission = (user: User | null, permissionKey: string): boolean => {
  if (!user?.userRole?.permissions) return false;
  return user.userRole.permissions.some(
    (permission) => permission.key === permissionKey
  );
};

// Get the href for a nav item (handle both static and dynamic routes)
const getNavItemHref = (item: NavItem, userId?: string): string => {
  if (typeof item.href === "function") {
    return item.href(userId);
  }
  return item.href;
};

// --- Sub-Components ---

// 1. The Left Sidebar Component
export function AppSidebar({ user }: { user: User | null }) {
  const pathname = usePathname();

  // Filter items based on permissions
  const navItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(user, item.requiredPermission);
  }).sort((a, b) => a.order - b.order);

  // Helper function to check if a nav item is active
  const isActive = (item: NavItem) => {
    const href = getNavItemHref(item, user?.id);
    
    if (href === "/dashboard") {
      return pathname === href;
    }
    
    // For profile routes, check if current path matches the dynamic route
    if (typeof item.href === "function") {
      return pathname === href;
    }
    
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3 bg-secondary">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold truncate">
            {user?.name || "Guest"}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.userRole?.name || "No Role"}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const href = getNavItemHref(item, user?.id);
              const active = isActive(item);
              
              return (
                <SidebarMenuItem key={typeof item.href === "function" ? "profile" : item.href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}