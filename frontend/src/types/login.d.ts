export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  join_date: Date;
  last_login: Date;
  is_active: boolean;
}
