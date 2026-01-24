/* eslint-disable @typescript-eslint/no-explicit-any */
// components/FetchUsersButton.tsx
"use client";

import { useState } from "react";

export default function FetchUsersButton() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/a8c3ca38-1548-4831-92e4-3de853c887de`,
        {
          method: "GET",
          headers: {
            "User-Agent": "NextJS-Client-Component/1.0",
            "X-Request-Source": "client-component",
            "X-Trace-Id": `deva${crypto.randomUUID()}`,
            Accept: "application/json",
            "Accept-Language": "ru-RU,ru;q=0.9", // 🇷🇺 Russian
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
      }

      const json = await res.json();
      console.log("Fetched users:", json);
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={fetchUsers}
        className="px-4 py-2 bg-black text-white rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Fetch Users"}
      </button>

      {data && (
        <pre className="text-sm bg-gray-100 p-2 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
