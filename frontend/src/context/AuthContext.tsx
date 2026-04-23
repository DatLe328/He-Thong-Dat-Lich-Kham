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
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const CURRENT_AUTH_ENDPOINT = "/api/auth/me";
const LOGIN_AUTH_ENDPOINT = "/api/auth/login";
const REGISTER_AUTH_ENDPOINT = "/api/auth/register";
const GOOGLE_AUTH_ENDPOINT = "/api/auth/google";
const LOGOUT_AUTH_ENDPOINT = "/api/auth/logout";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      try {
        const response = await fetch(CURRENT_AUTH_ENDPOINT, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        });

        const payload = await readAuthPayload(response);

        if (cancelled) return;

        if (response.ok && payload && "user" in payload) {
          setUser(mapApiAuthUser(payload.user, payload.user.provider ?? "credentials"));
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (input: LoginInput) => {
    const response = await fetch(LOGIN_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
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
  };

  const register = async (input: RegisterInput) => {
    const response = await fetch(REGISTER_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
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
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await fetch(GOOGLE_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
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
  };

  const logout = async () => {
    try {
      await fetch(LOGOUT_AUTH_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, loginWithGoogle, logout }}
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
