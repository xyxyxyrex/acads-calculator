export interface SetPasswordInput {
  email: string;
  password: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message?: string | null;
}
