import axios from "axios";
import { HOST } from "@/utils/constants";

export const apiClient = axios.create({
  baseURL: HOST,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/Dashboard")
    ) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("auth-storage");
      window.location.replace(
        `/Auth/Login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
