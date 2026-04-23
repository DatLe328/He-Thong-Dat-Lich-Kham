import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  content: string;
};

const CHATBOT_ENDPOINT = "/api/chatbot/ask";

function readStoredUserId() {
  const rawUserId = localStorage.getItem("userId");

  if (!rawUserId) {
    return null;
  }

  const parsedUserId = Number(rawUserId);
  return Number.isFinite(parsedUserId) ? parsedUserId : null;
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      className="chatbot-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.75 16.25H5.5A2.5 2.5 0 0 1 3 13.75v-6.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 0 1 2.5 2.5v6.5a2.5 2.5 0 0 1-2.5 2.5h-6.1l-4.3 3.25a.75.75 0 0 1-1.2-.6v-2.65H5.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Xin chào, mình có thể hỗ trợ bạn tìm bác sĩ, xem lịch trống hoặc tư vấn các câu hỏi liên quan đến sức khỏe và đặt lịch khám.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || isSending) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsSending(true);
    setError("");

    try {
      const response = await fetch(CHATBOT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question,
          userId: readStoredUserId(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { answer?: string }; message?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Không thể nhận phản hồi từ chatbot.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot`,
          role: "bot",
          content: payload.data?.answer?.trim() || "Mình chưa có câu trả lời phù hợp.",
        },
      ]);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Không thể kết nối tới chatbot.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot-error`,
          role: "bot",
          content: message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chatbot-widget" aria-label="Chatbot hỗ trợ đặt lịch">
      {isOpen ? (
        <div className="chatbot-window" role="dialog" aria-label="Cửa sổ chatbot">
          <header className="chatbot-window__header">
            <div className="chatbot-window__title">
              <span className="chatbot-window__avatar">
                <ChatIcon />
              </span>
              <div>
                <strong>Trợ lý đặt lịch</strong>
                <small>Đang sẵn sàng hỗ trợ</small>
              </div>
            </div>

            <button
              type="button"
              className="chatbot-window__close"
              aria-label="Đóng chatbot"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chatbot-window__body">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message chatbot-message--${message.role}`}
              >
                {message.content}
              </div>
            ))}

            {isSending ? (
              <div className="chatbot-message chatbot-message--bot">
                Đang tìm câu trả lời phù hợp...
              </div>
            ) : null}

            <div ref={endOfMessagesRef} />
          </div>

          <form className="chatbot-window__composer" onSubmit={handleSubmit}>
            <input
              type="text"
              aria-label="Nhập tin nhắn"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
            />
            <button type="submit" aria-label="Gửi tin nhắn" disabled={isSending}>
              {isSending ? "Đang gửi..." : "Gửi"}
            </button>
          </form>

          {error ? <div className="chatbot-window__error">{error}</div> : null}
        </div>
      ) : null}

      <button
        type="button"
        className="chatbot-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <ChatIcon />
        <span>Chat</span>
      </button>
    </section>
  );
}

export default ChatbotWidget;
