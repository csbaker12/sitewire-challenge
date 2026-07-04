import { DateTime } from "luxon";
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface UserLogin {
  login_time: string;
  ip_v4: string;
}

export interface UserLoginResponse {
  user_id: number;
  logins: UserLogin[];
}

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  lastLoginTime?: DateTime;
  lastLoginIp?: string;
  inactive: boolean;
  loginStatus: LoginStatus;
}

export enum LoginStatus {
  Pending = "pending",
  Loaded = "loaded",
  Failed = "failed",
}