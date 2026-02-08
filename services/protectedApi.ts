import { API } from "@/constants/api";
import { router } from "expo-router";
import { Alert } from "react-native";
import { getToken, removeToken } from "./authStorage";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = await getToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const text = await res.text(); // 👈 debug raw response
  console.log("RAW API RESPONSE:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (res.status === 401 || res.status === 403) {
    router.replace("/login");
    await removeToken();
    Alert.alert("Session Expired");
  }

  return data;
};
