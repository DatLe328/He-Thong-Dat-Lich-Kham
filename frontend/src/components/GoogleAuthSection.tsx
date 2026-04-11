import { CredentialResponse, GoogleLogin } from "@react-oauth/google";

type GoogleAuthSectionProps = {
  mode: "login" | "register";
  onSuccess: (credential: string) => Promise<void>;
  onError?: (message: string) => void;
};

function GoogleAuthSection({
  mode,
  onSuccess,
  onError,
}: GoogleAuthSectionProps) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google không trả về thông tin xác thực.");
      return;
    }

    try {
      await onSuccess(response.credential);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Không thể tiếp tục với Google."
      );
    }
  };

  if (!googleClientId) {
    return (
      <button
        type="button"
        className="google-auth__button"
        onClick={() =>
          onError?.(
            "Đăng nhập bằng Google đang được cập nhật. Vui lòng sử dụng email hoặc số điện thoại trong lúc này."
          )
        }
      >
        <span className="google-auth__mark">G</span>
        <span>
          {mode === "login"
            ? "Tiếp tục với Google"
            : "Đăng ký nhanh với Google"}
        </span>
      </button>
    );
  }

  return (
    <div className="google-auth">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => onError?.("Không thể tiếp tục với Google.")}
        text={mode === "login" ? "signin_with" : "signup_with"}
        theme="outline"
        shape="pill"
        locale="vi"
      />
    </div>
  );
}

export default GoogleAuthSection;
