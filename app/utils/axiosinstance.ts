import { BASE_URL } from "@/constants/api";
import { getToken, removeToken } from "@/services/authStorage";
import axios from "axios";
import { router } from "expo-router";
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken() ;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized - Logging out");
      await removeToken()
      router.replace("/login"); // redirect to login
    }

    return Promise.reject(error);
  }
);

export default api;