/* eslint-disable @typescript-eslint/no-explicit-any */
import UserTable from "./userTable";
import { getServerApi } from "@/lib/server";

export default async function UserPage() {
  // Get the server instance with cookies attached
  const api = await getServerApi();

  // 1. Run all requests independently using allSettled
  // This ensures if ONE request fails (e.g., Roles permission denied), 
  // the OTHER requests (e.g., Users) still load.
  const results = await Promise.allSettled([
    api.get("/api/auth/me"),         // Index 0: Current User
    api.get("/api/users/all?page=1&limit=10"), // Index 1: Users List
    api.get("/api/roles/all"),        // Index 2: Roles List
  ]);

  // ================= 1. AUTH CHECK =================
  // If we can't get the current user, they are effectively logged out
  if (results[0].status === "rejected") {
    console.error("Auth check failed:", results[0].reason);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-red-600">Session Expired</h2>
          <p className="text-sm text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }
  const currentUser = results[0].value.data.data.user;

  // ================= 2. USERS PERMISSION CHECK =================
  // Check if the request failed due to 403 (Forbidden)
  if (results[1].status === "rejected") {
    const error = results[1].reason as any;
    
    // If specifically 403, show a nice "Access Denied" message
    if (error.response?.status === 403) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-2 p-6">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You do not have permission to view or manage users. 
            <br />Please contact your administrator.
          </p>
        </div>
      );
    }

    // If it's a different error (500, network, etc)
    console.error("Failed to fetch users:", error);
    return (
      <main className="p-6">
        <p className="text-red-500">
          An error occurred while loading users. Please try again later.
        </p>
      </main>
    );
  }
  const users = results[1].value.data.data.users;

  // ================= 3. ROLES PERMISSION CHECK (Graceful) =================
  // If the user cannot read roles (403), we just pass an empty array.
  // The UserTable will still render, but "Create User" or "Change Role" 
  // buttons will be disabled/hidden because we have no roles to assign.
  let roles: any[] = [];
  if (results[2].status === "fulfilled") {
    roles = results[2].value.data.data.roles || [];
  } else {
    // Optional: Log that roles were skipped, but don't crash the page
    console.warn("Roles data skipped (likely due to permission).");
  }

  return (
    <main className="p-4">
      <UserTable 
        initialUsers={users} 
        roles={roles} 
        currentUser={currentUser} 
      />
    </main>
  );
}