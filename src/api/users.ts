import type { User, UserLoginResponse } from "../types";
import { fetchWithRetry } from "./fetchWithRetry";

const BASE_URL = "https://fake-users-api.vercel.app";

export const getUsers = () => fetchWithRetry<User[]>(`${BASE_URL}/users`);

export const getUserLogins = (userId: number) =>
  fetchWithRetry<UserLoginResponse>(
    `${BASE_URL}/users/${userId}/relationships/logins`,
  );
