import { useState } from "react";

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
            <div className="chatbot-message chatbot-message--bot">
              Xin chào, mình có thể hỗ trợ bạn tìm bác sĩ, xem lịch trống hoặc hướng dẫn đặt lịch khám.
            </div>
          </div>

          <form
            className="chatbot-window__composer"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="text"
              aria-label="Nhập tin nhắn"
              placeholder="Nhập câu hỏi của bạn..."
            />
            <button type="button" aria-label="Gửi tin nhắn">
              Gửi
            </button>
          </form>
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
