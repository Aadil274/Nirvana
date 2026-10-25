export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'marshal' | 'admin' | string;
  ward_id: string;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuthResponse {
  status: string;
  message?: string;
  user: AuthUser;
  token: string;
  verification_token?: string;
}
