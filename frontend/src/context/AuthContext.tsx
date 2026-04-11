import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AuthUser,
  LoginInput,
  RegisterInput,
  StoredAuthUser,
} from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  users: StoredAuthUser[];
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
};

const USERS_STORAGE_KEY = "front-clinic-users";
const SESSION_STORAGE_KEY = "front-clinic-session";

const defaultUsers: StoredAuthUser[] = [
  {
    id: "default-user",
    name: "Khách Hàng Medigo",
    email: "khachhang@medigoclinic.vn",
    username: "khachhang",
    phone: "0909686868",
    password: "123456",
    provider: "credentials",
    role: "user"
  },
  {
      id: "default-doctor",
      name: "Bác sĩ A",
      email: "bacsi@medigoclinic.com",
      username: "bacsi",
      phone: "0999999999",
      password: "123456",
      provider: "credentials",
      role: "doctor"
}
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUsersFromStorage() {
  const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!savedUsers) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    return JSON.parse(savedUsers) as StoredAuthUser[];
  } catch {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
}

function readSessionFromStorage(users: StoredAuthUser[]) {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!session) {
    return null;
  }

  try {
    const parsed = JSON.parse(session) as AuthUser;
    return users.find((user) => user.id === parsed.id) ?? parsed;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function parseGoogleCredential(credential: string) {
  try {
    const payload = credential.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredAuthUser[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUsers = readUsersFromStorage();
    setUsers(storedUsers);
    setUser(readSessionFromStorage(storedUsers));
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [user]);

  const login = async (input: LoginInput) => {
    const normalizedIdentifier = input.identifier.trim().toLowerCase();
    const foundUser = users.find((item) => {
      const emailMatched = item.email.toLowerCase() === normalizedIdentifier;
      const usernameMatched =
        item.username?.toLowerCase() === normalizedIdentifier;
      const phoneMatched = item.phone?.trim() === input.identifier.trim();

      return emailMatched || usernameMatched || phoneMatched;
    });

    if (!foundUser || foundUser.password !== input.password) {
      throw new Error("Tài khoản hoặc mật khẩu không đúng.");
    }

    const sessionUser: AuthUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      username: foundUser.username,
      phone: foundUser.phone,
      provider: foundUser.provider,
      avatar: foundUser.avatar,

    };

    setUser(sessionUser);
  };

  const register = async (input: RegisterInput) => {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();
    const phone = input.phone.trim();

    if (input.password !== input.confirmPassword) {
      throw new Error("Mật khẩu xác nhận chưa khớp.");
    }

    if (input.password.length < 6) {
      throw new Error("Mật khẩu cần tối thiểu 6 ký tự.");
    }

    const emailExisted = users.some((item) => item.email.toLowerCase() === email);
    const usernameExisted = users.some(
      (item) => item.username?.toLowerCase() === username
    );
    const phoneExisted = users.some((item) => item.phone?.trim() === phone);

    if (emailExisted) {
      throw new Error("Email này đã được đăng ký.");
    }

    if (usernameExisted) {
      throw new Error("Tên đăng nhập này đã tồn tại.");
    }

    if (phoneExisted) {
      throw new Error("Số điện thoại này đã được sử dụng.");
    }

    const newUser: StoredAuthUser = {
      id: `user-${crypto.randomUUID()}`,
      name: input.username.trim(),
      email,
      username,
      phone,
      password: input.password,
      provider: "credentials",
    };

    setUsers((currentUsers) => [...currentUsers, newUser]);
    setUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      phone: newUser.phone,
      provider: newUser.provider,
    });
  };

  const loginWithGoogle = async (credential: string) => {
    const googleProfile = parseGoogleCredential(credential);

    if (!googleProfile?.email || !googleProfile.name) {
      throw new Error("Không thể đọc thông tin đăng nhập từ Google.");
    }

    const existedUser = users.find(
      (item) => item.email.toLowerCase() === googleProfile.email.toLowerCase()
    );

    if (existedUser) {
      setUser({
        id: existedUser.id,
        name: existedUser.name,
        email: existedUser.email,
        username: existedUser.username,
        phone: existedUser.phone,
        provider: "google",
        avatar: googleProfile.picture,
      });
      return;
    }

    const googleUser: StoredAuthUser = {
      id: `google-${googleProfile.sub}`,
      name: googleProfile.name,
      email: googleProfile.email,
      provider: "google",
      avatar: googleProfile.picture,
    };

    setUsers((currentUsers) => [...currentUsers, googleUser]);
    setUser({
      id: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      provider: googleUser.provider,
      avatar: googleUser.avatar,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, users, login, register, loginWithGoogle, logout }}
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
