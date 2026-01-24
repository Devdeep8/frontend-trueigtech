import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorResponse {
  message?: string;
  error?: string;
}

export const handleApiError = (error: unknown) => {
  const axiosError = error as AxiosError<ErrorResponse>;
  const status = axiosError?.response?.status;
  const errorMessage =
    axiosError?.response?.data?.message ||
    axiosError?.response?.data?.error ||
    "An error occurred";

  switch (status) {
    case 400:
      toast.error(`Bad Request: ${errorMessage}`);
      break;
    case 401:
      toast.error("Unauthorized: Please login again");
      break;
    case 403:
      toast.error("Forbidden: You don't have permission to perform this action");
      break;
    case 404:
      toast.error("Not Found: Resource does not exist");
      break;
    case 409:
      toast.error(`Conflict: ${errorMessage}`);
      break;
    case 422:
      toast.error(`Validation Error: ${errorMessage}`);
      break;
    case 500:
      toast.error("Server Error: Something went wrong on the server");
      break;
    case 503:
      toast.error("Service Unavailable: Server is under maintenance");
      break;
    default:
      toast.error(errorMessage || "An unexpected error occurred");
  }
};

export const handleApiSuccess = (message: string = "Operation successful") => {
  toast.success(message);
};

export const handleApiInfo = (message: string) => {
  toast.info(message);
};
