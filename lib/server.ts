import axios from "axios";
import { cookies } from "next/headers";

// Create a base server instance
const serverApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  // No interceptors needed here as we don't handle window.location on server
});

// Helper to get an instance with current cookies attached
export const getServerApi = async() => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString(); // Converts all cookies to "key=value; key2=value2" string

  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
    headers: {
      Cookie: cookieHeader, // Forward cookies to your backend
    },
  });
};

export default serverApi;