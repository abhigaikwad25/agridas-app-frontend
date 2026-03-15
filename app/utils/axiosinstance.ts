import axios from "axios"
import { BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");

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

      await AsyncStorage.removeItem("token");

      router.replace("/login"); // redirect to login
    }

    return Promise.reject(error);
  }
);

export default api;