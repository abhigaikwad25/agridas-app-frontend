import { API } from "@/constants/api";

export interface LoginPayload {
  phoneno: string;
  password: string;
}

export const login = async (payload: LoginPayload) => {
  const response = await fetc(`${API.BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response;
};
