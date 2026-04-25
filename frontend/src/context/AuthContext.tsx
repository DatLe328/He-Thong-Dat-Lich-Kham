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
  logout: () => Promise<void>;
};

const LOGIN_AUTH_ENDPOINT = "/api/auth/login";
const REGISTER_AUTH_ENDPOINT = "/api/auth/register";
const GOOGLE_AUTH_ENDPOINT = "/api/auth/google";
const CURRENT_AUTH_ENDPOINT = "/api/auth/me";
const LOGOUT_AUTH_ENDPOINT = "/api/auth/logout";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapApiAuthUser(
  apiUser: ApiAuthUser,
  fallbackProvider: AuthUser["provider"]
) {
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

function getAuthErrorMessage(payload: unknown, fallback: string) {
  const apiMessage =
    payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: string }).error
      : payload && typeof payload === "object" && "message" in payload
        ? (payload as { message?: string }).message
        : undefined;

  return apiMessage || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const response = await fetch(CURRENT_AUTH_ENDPOINT, {
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        });

        const payload = await readAuthPayload(response);

        if (!response.ok || !payload || !("user" in payload)) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        if (!cancelled) {
          setUser(
            mapApiAuthUser(
              payload.user,
              payload.user.provider ?? "credentials"
            )
          );
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    };

    restoreSession();

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
      credentials: "include",
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
    const response = await fetch(REGISTER_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
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
      credentials: "include",
      body: JSON.stringify({ credential }),
    });

    const payload = await readAuthPayload(response);

    if (!response.ok || !payload || !("user" in payload)) {
      throw new Error(
        getAuthErrorMessage(payload, "Không thể đăng nhập bằng Google.")
      );
    }

    setUser(mapApiAuthUser(payload.user, "google"));
  };

  const logout = async () => {
    try {
      await fetch(LOGOUT_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
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
