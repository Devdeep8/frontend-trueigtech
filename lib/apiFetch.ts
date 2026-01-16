/* eslint-disable @typescript-eslint/no-unused-vars */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    // 1️⃣ Attach cookies (server-side)
    if (typeof window === "undefined") {
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
      options.headers = { ...options.headers, Cookie: cookieHeader };
    }

    let res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}${endpoint}`, {
      ...options,
      cache: "no-store",
    });

    // 2️⃣ If access token expired → call refresh
    if (res.status === 401) {
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: options.headers,
      });

      if (!refreshRes.ok) {
        // Refresh token invalid → redirect to login
        redirect("/login");
      }

      // Retry original request
      res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}${endpoint}`, {
        ...options,
        cache: "no-store",
      });
    }

    if (!res.ok) throw new Error(`API request failed: ${res.status}`);

    return res.json();
  } catch (err) {
    redirect("/login");
  }
}
