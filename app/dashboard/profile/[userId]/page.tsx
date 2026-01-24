"use client";

import { use, useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleApiError, handleApiSuccess } from "@/lib/toastError";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params);
  console.log(userId)

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/api/users/${userId}`);
        console.log(res.data.data)
        setForm({
          name: res.data.data.user.name,
          email: res.data.data.user.email,
        });
      } catch (err) {
        handleApiError(err);
      }
    };

    fetchUser();
  }, [userId]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await api.patch(`/api/users/${userId}`, {
        name: form.name,
      });
      handleApiSuccess("Profile updated successfully");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-semibold">My Profile</h2>

      <Input
        placeholder="Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <Input
        placeholder="Email"
        value={form.email}
        disabled
      />

      <Button onClick={handleUpdate} disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </Button>
    </div>
  );
}
