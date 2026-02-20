import api from "./axios";
import { LoginPayload } from "@/types/auth.types";

export const login = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};
