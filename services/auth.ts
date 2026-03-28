import type { User } from "../types/api";

export interface RegisterPayload {
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email_or_phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

type Provider = "google" | "apple";

type MockUserRecord = {
  user: User;
  password: string;
  provider?: Provider;
};

const mockUsers: MockUserRecord[] = [
  {
    user: {
      id: "user_demo",
      full_name: "Alex Traveler",
      email: "alex@alpharoam.com",
      phone: "+1 415 555 0199",
      is_email_verified: true,
      is_phone_verified: false,
      default_currency: "USD",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    password: "password123",
  },
];

function simulateDelay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function createTokens(userId: string) {
  return {
    accessToken: `alpha_access_${userId}`,
    refreshToken: `alpha_refresh_${userId}`,
  };
}

function buildResponse(user: User, message?: string): AuthResponse {
  const tokens = createTokens(user.id);
  return { user, ...tokens, message };
}

function findUserByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return mockUsers.find(
    (record) =>
      record.user.email?.toLowerCase() === normalized ||
      record.user.phone?.replace(/\s+/g, "") === identifier.replace(/\s+/g, "")
  );
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  if (payload.email && findUserByIdentifier(payload.email)) {
    throw new Error("An account with this email already exists.");
  }
  if (payload.phone && findUserByIdentifier(payload.phone)) {
    throw new Error("An account with this phone already exists.");
  }

  const user: User = {
    id: `user_${Date.now()}`,
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    is_email_verified: false,
    is_phone_verified: false,
    default_currency: "USD",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockUsers.unshift({ user, password: payload.password });
  return simulateDelay(buildResponse(user, "Welcome to AlphaRoam!"));
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const record = findUserByIdentifier(payload.email_or_phone);
  if (!record || record.password !== payload.password) {
    throw new Error("Invalid email/phone or password.");
  }

  return simulateDelay(buildResponse(record.user, "Welcome back!"));
}

export async function loginWithProvider(provider: Provider): Promise<AuthResponse> {
  const existing = mockUsers.find((record) => record.provider === provider);
  if (existing) {
    return simulateDelay(buildResponse(existing.user, "Welcome back!"));
  }

  const user: User = {
    id: `user_${provider}_${Date.now()}`,
    full_name: provider === "google" ? "Google Traveler" : "Apple Traveler",
    email: provider === "google" ? "traveler@alpharoam.com" : "ios@alpharoam.com",
    phone: undefined,
    is_email_verified: true,
    is_phone_verified: false,
    default_currency: "USD",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockUsers.unshift({ user, password: "", provider });
  return simulateDelay(buildResponse(user, `Signed in with ${provider}.`));
}

export async function logout(): Promise<void> {
  await simulateDelay(undefined, 300);
}

export async function getMe(): Promise<{ user: User }> {
  const record = mockUsers[0];
  return simulateDelay({ user: record.user });
}

export interface RequestResetPayload {
  email?: string;
  phone?: string;
}

export async function requestPasswordReset(
  payload: RequestResetPayload
): Promise<{ message: string }> {
  return simulateDelay({
    message: `Reset link sent to ${payload.email ?? payload.phone ?? "your contact"}.`,
  });
}

export interface VerifyOtpPayload {
  email?: string;
  phone?: string;
  code: string;
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<{ message: string; valid: boolean }> {
  return simulateDelay({ message: "Code verified", valid: true });
}

export interface ResetPasswordPayload {
  email?: string;
  phone?: string;
  code: string;
  new_password: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  return simulateDelay({ message: "Password reset successfully." });
}
