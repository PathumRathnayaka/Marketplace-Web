export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface RegisterOwnerPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  businessName: string;
  verificationToken: string;
}
