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

  if (!session) return null;

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

function getAuthErrorMessage(payload: any, fallback: string) {
  const apiMessage =
    payload && "error" in payload ? payload.error : payload?.message;

  return apiMessage || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(readSessionFromStorage());
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));


      localStorage.setItem("userId", String(user.id));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem("userId");
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

    const mappedUser = mapApiAuthUser(payload.user, "credentials");
    setUser(mappedUser);

    // ✅ FIX
    localStorage.setItem("userId", String(mappedUser.id));
  };

  const register = async (input: RegisterInput) => {
    const response = await fetch(REGISTER_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    });

    const payload = await readAuthPayload(response);

    if (!response.ok || !payload || !("user" in payload)) {
      throw new Error(
        getAuthErrorMessage(payload, "Không thể tạo tài khoản vào lúc này.")
      );
    }

    const mappedUser = mapApiAuthUser(payload.user, "credentials");
    setUser(mappedUser);

    // ✅ FIX
    localStorage.setItem("userId", String(mappedUser.id));
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

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !("user" in payload)) {
      throw new Error(
        getAuthErrorMessage(payload, "Không thể đăng nhập bằng Google.")
      );
    }

    const mappedUser = mapApiAuthUser(payload.user, "google");
    setUser(mappedUser);

    // ✅ FIX
    localStorage.setItem("userId", String(mappedUser.id));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
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
