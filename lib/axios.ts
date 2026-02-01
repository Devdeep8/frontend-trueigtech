import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  response => response,
  async error => {
    // Handle 401 errors (unauthorized) - redirect to login
    if (error.response?.status === 401) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Let other errors propagate normally
    return Promise.reject(error);
  }
);

export default api;