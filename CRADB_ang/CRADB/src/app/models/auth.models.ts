export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  UserId: number;
  EmployeeId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: string;
  Token: string;
  TokenExpiresAt: Date;
  ProfileImage?: string;
}

export interface ChangePasswordRequest {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}