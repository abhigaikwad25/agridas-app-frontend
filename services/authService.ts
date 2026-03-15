import { BASE_URL } from "@/constants/api";

export interface LoginPayload {
  phoneno: string;
  password: string;
}

export const login = async (payload: LoginPayload) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response;
};

export interface RegisterPayload {
  phoneno: string;
  name: string;
  password: string;
  role: string;
}

export const register = async (payload: RegisterPayload) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response;
};


