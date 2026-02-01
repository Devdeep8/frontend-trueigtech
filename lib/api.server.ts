/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

/**
 * Server-side API wrapper with automatic token refresh
 */
export async function serverApi<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  const requestConfig: AxiosRequestConfig = {
    ...config,
    baseURL: BASE_URL,
    headers: {
      ...(config.headers || {}),
      cookie: cookieHeader,
    },
    withCredentials: true,
  };

  try {
    // Make the request
    const response = await axios(requestConfig);
    return response.data;
  } catch (error: any) {
    // If 401, try to refresh and retry
    if (error.response?.status === 401) {
      try {
        // Attempt token refresh
        await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: { cookie: cookieHeader },
            withCredentials: true,
          }
        );

        // Retry the original request
        const retryResponse = await axios(requestConfig);
        return retryResponse.data;
      } catch (refreshError) {
        // Refresh failed - user needs to login
        throw new Error("UNAUTHENTICATED");
      }
    }

    // Re-throw other errors
    throw error;
  }
}