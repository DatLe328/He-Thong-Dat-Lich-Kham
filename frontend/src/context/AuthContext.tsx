import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ApiAuthResponse,
  ApiAuthUser,
  AuthUser,
  LoginInput,
  RegisterInput,
} from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
};

const SESSION_STORAGE_KEY = "front-clinic-session";
const LOGIN_AUTH_ENDPOINT = "/api/auth/login";
const REGISTER_AUTH_ENDPOINT = "/api/auth/register";
const GOOGLE_AUTH_ENDPOINT = "/api/auth/google";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapApiAuthUser(apiUser: ApiAuthUser, fallbackProvider: AuthUser["provider"]) {
  const fullName = [apiUser.firstName, apiUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: apiUser.id ?? String(apiUser.userID ?? apiUser.email),
    name: apiUser.name || fullName || apiUser.email,
    email: apiUser.email,
    phone: apiUser.phone ?? undefined,
    role: apiUser.role,
    provider: apiUser.provider ?? fallbackProvider,
    avatar: apiUser.avatar,
    gender: apiUser.gender ?? undefined,
    dateOfBirth: apiUser.dateOfBirth ?? undefined,
    address: apiUser.address ?? undefined,
  } satisfies AuthUser;
}

function readSessionFromStorage() {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session) as AuthUser;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

async function readAuthPayload(response: Response) {
  return (await response.json().catch(() => null)) as
    | ApiAuthResponse
    | { error?: string; message?: string }
    | null;
}

function getAuthErrorMessage(
  payload: Awaited<ReturnType<typeof readAuthPayload>>,
  fallback: string
) {
  const apiMessage =
    payload && "error" in payload ? payload.error : payload?.message;

  switch (apiMessage) {
    case "Missing credentials":
      return "Vui lòng nhập email hoặc số điện thoại và mật khẩu.";
    case "User not found":
    case "Wrong password":
      return "Tài khoản hoặc mật khẩu không đúng.";
    case "Missing required fields":
      return "Vui lòng nhập đầy đủ thông tin đăng ký.";
    case "Missing confirmPassword":
      return "Vui lòng nhập xác nhận mật khẩu.";
    case "Passwords do not match":
      return "Mật khẩu xác nhận chưa khớp.";
    case "Email already exists":
      return "Email này đã được đăng ký.";
    case "Phone already exists":
      return "Số điện thoại này đã được sử dụng.";
    case "Invalid dateOfBirth":
      return "Ngày sinh không hợp lệ.";
    default:
      return apiMessage || fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(readSessionFromStorage());
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [user]);

  const login = async (input: LoginInput) => {
    const response = await fetch(LOGIN_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        identifier: input.identifier.trim().toLowerCase(),
        password: input.password,
      }),
    });

    const payload = await readAuthPayload(response);

    if (!response.ok || !payload || !("user" in payload)) {
      throw new Error(
        getAuthErrorMessage(payload, "Không thể đăng nhập vào hệ thống.")
      );
    }

    setUser(mapApiAuthUser(payload.user, "credentials"));
  };

  const register = async (input: RegisterInput) => {
    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone.trim();
    const gender = input.gender.trim();
    const dateOfBirth = input.dateOfBirth.trim();
    const address = input.address.trim();

    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !gender ||
      !dateOfBirth ||
      !address
    ) {
      throw new Error("Vui lòng nhập đầy đủ thông tin đăng ký.");
    }

    if (input.password !== input.confirmPassword) {
      throw new Error("Mật khẩu xác nhận chưa khớp.");
    }

    if (input.password.length < 6) {
      throw new Error("Mật khẩu cần tối thiểu 6 ký tự.");
    }

    const response = await fetch(REGISTER_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth,
        address,
        password: input.password,
        confirmPassword: input.confirmPassword,
      }),
    });

    const payload = await readAuthPayload(response);

    if (!response.ok || !payload || !("user" in payload)) {
      throw new Error(
        getAuthErrorMessage(payload, "Không thể tạo tài khoản vào lúc này.")
      );
    }

    setUser(mapApiAuthUser(payload.user, "credentials"));
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await fetch(GOOGLE_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ credential }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ApiAuthResponse
      | { error?: string }
      | null;

    if (!response.ok || !payload || !("user" in payload)) {
      const errorMessage =
        payload && "error" in payload ? payload.error : undefined;

      throw new Error(
        errorMessage ?? "Không thể đăng nhập bằng Google vào lúc này."
      );
    }

    setUser(mapApiAuthUser(payload.user, "google"));
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
