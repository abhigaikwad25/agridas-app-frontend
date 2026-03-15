import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/app/utils/axiosinstance";
import { BASE_URL } from "@/constants/api";

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem("authToken", token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("authToken");
};

export const removeToken = async () => {
  await AsyncStorage.removeItem("authToken");
};


export const setLocationList = async () => {
  try {
    const token = await getToken();
    console.log("token for fetching loc list" , token)
    const res = await api.get(`${BASE_URL}/location/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = JSON.stringify(res.data);
    await AsyncStorage.setItem("locationList", data);
    return res.data;
  } catch (error) {
    console.log("Error fetching location list:", error);
  }
};

export const getLocationList = async () => {
  try {
    const stored = await AsyncStorage.getItem("locationList");

    if (stored) {
      return JSON.parse(stored);
    }
    const data = await setLocationList();
    return data || [];
  } catch (error) {
    console.log("Error reading locations:", error);
    return [];
  }
};