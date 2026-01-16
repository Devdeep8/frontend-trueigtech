/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios"; // axios instance with withCredentials: true
import { useRouter } from "next/navigation";
const handleLogout = async () => {
  try {
    await api.post("/api/auth/logout"); // backend: localhost:6001/api/auth/logout
    window.location.href = "/login";    // redirect after logout
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

export function Header({ data }: any) {
    const router = useRouter()
  return (
    <header className="flex items-center justify-between border-b pb-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {data?.user.name}</h1>
        <p className="text-sm text-gray-500">Role: {data?.user?.role}</p>
      </div>
      <div className=" flex gap-3 ">

      <Button className="cursor-pointer" size={"default"} value={"outline"}
       onClick={() => router.push('/dashboard/')}>
        Game Managmenet
      </Button>
      <Button className="cursor-pointer" size={"default"} value={"outline"}
       onClick={() => router.push('/dashboard/user-managment')}>
        User Managment
      </Button>

        <Button className="px-4 py-2 bg-destructive hover:bg-destructive/70 cursor-pointer text-white rounded"
          onClick={handleLogout}
>
          Logout
        </Button>
    </div>
    </header>
  );
}
