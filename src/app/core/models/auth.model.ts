export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'SALES_REP';
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface UserProfileResponse {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    is_active: boolean;
  };
}

export interface RegisterRequest {
  company_name: string;
  slug: string;
  admin_full_name: string;
  admin_email: string;
  admin_password: string;
}

