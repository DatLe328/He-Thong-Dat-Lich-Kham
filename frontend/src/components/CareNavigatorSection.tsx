import { FormEvent, useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { chatbotQuickPrompts } from "../data/triage";
import { useClinic } from "../context/ClinicContext";
import { doctors, specialties } from "../data/doctors";
import { getClinicSuggestions, getRecommendedDoctors } from "../utils/clinic";
import DoctorAvatar from "./DoctorAvatar";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

function CareNavigatorSection() {
  const { appointments, scheduleOverrides } = useClinic();
  const [symptomText, setSymptomText] = useState("");
  const [preferredSpecialty, setPreferredSpecialty] = useState("Tất cả chuyên khoa");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Xin chào, bạn có thể mô tả triệu chứng để tôi gợi ý đúng chuyên khoa và bác sĩ còn lịch phù hợp.",
    },
  ]);

  const deferredSymptomText = useDeferredValue(symptomText);
  const recommendationBundle = getRecommendedDoctors(
    doctors,
    appointments,
    scheduleOverrides,
    deferredSymptomText,
    preferredSpecialty
  );
  const topRecommendations = deferredSymptomText.trim()
    ? recommendationBundle.recommendations.slice(0, 3)
    : [];
  const clinicSuggestions = getClinicSuggestions(topRecommendations);

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = chatInput.trim();

    if (!trimmedInput) {
      return;
    }

    const result = getRecommendedDoctors(
      doctors,
      appointments,
      scheduleOverrides,
      trimmedInput,
      "Tất cả chuyên khoa"
    );
    const topDoctor = result.recommendations[0];
    const assistantReply = [
      `Nhóm triệu chứng phù hợp nhất: ${result.classification.groupLabel}.`,
      `Chuyên khoa nên ưu tiên: ${result.classification.suggestedSpecialty}.`,
      topDoctor
        ? `Bác sĩ nên xem trước: ${topDoctor.doctor.name} tại ${topDoctor.doctor.clinic}.`
        : "Hiện chưa có bác sĩ phù hợp, bạn có thể để lại triệu chứng chi tiết hơn.",
      result.classification.carePath,
    ].join(" ");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${crypto.randomUUID()}`,
        role: "user",
        content: trimmedInput,
      },
      {
        id: `assistant-${crypto.randomUUID()}`,
        role: "assistant",
        content: assistantReply,
      },
    ]);
    setChatInput("");
  };

  return (
    <section className="section section--muted">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tư vấn đặt lịch</span>
            <h2>Gợi ý bác sĩ và phòng khám theo triệu chứng</h2>
          </div>
        </div>

        <div className="care-navigator">
          <article className="content-card care-navigator__panel">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="eyebrow">Phân loại triệu chứng</span>
                <h3>Nhập mô tả để nhận gợi ý nhanh</h3>
              </div>
            </div>

            <div className="care-triage-grid">
              <label className="field">
                <span>Mô tả triệu chứng</span>
                <textarea
                  value={symptomText}
                  onChange={(event) => setSymptomText(event.target.value)}
                  placeholder="Ví dụ: Tôi bị đau ngực nhẹ, tim đập nhanh và chóng mặt khi leo cầu thang..."
                  rows={5}
                />
              </label>

              <label className="field">
                <span>Ưu tiên chuyên khoa</span>
                <select
                  value={preferredSpecialty}
                  onChange={(event) => setPreferredSpecialty(event.target.value)}
                >
                  {specialties.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="triage-result">
              <div className="triage-result__header">
                <div>
                  <span className="eyebrow">Kết quả định hướng</span>
                  <strong>{recommendationBundle.classification.groupLabel}</strong>
                </div>
                <span
                  className={`urgency-badge urgency-badge--${recommendationBundle.classification.urgency}`}
                >
                  {recommendationBundle.classification.urgency === "high"
                    ? "Ưu tiên sớm"
                    : recommendationBundle.classification.urgency === "medium"
                      ? "Theo dõi sát"
                      : "Tư vấn ban đầu"}
                </span>
              </div>

              <p>{recommendationBundle.classification.note}</p>
              <div className="tag-row">
                <span className="tag">
                  Chuyên khoa phù hợp: {recommendationBundle.classification.suggestedSpecialty}
                </span>
                {recommendationBundle.classification.matchedKeywords.map((keyword) => (
                  <span key={keyword} className="tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {topRecommendations.length > 0 ? (
              <div className="recommendation-list">
                {topRecommendations.map((item) => (
                  <article key={item.doctor.id} className="recommendation-card">
                    <div className="recommendation-card__header">
                      <DoctorAvatar name={item.doctor.name} />
                      <div>
                        <strong>{item.doctor.name}</strong>
                        <p>
                          {item.doctor.specialty} • {item.doctor.clinic}
                        </p>
                      </div>
                    </div>

                    <div className="tag-row">
                      {item.reasons.slice(0, 3).map((reason) => (
                        <span key={reason} className="tag">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="recommendation-card__actions">
                      <Link to={`/doctors/${item.doctor.id}`} className="text-link">
                        Xem hồ sơ
                      </Link>
                      <Link
                        to={`/appointments/book?doctorId=${item.doctor.id}`}
                        className="button button--primary button--compact"
                      >
                        Đặt lịch ngay
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-inline">
                <p>
                  Mô tả triệu chứng để hệ thống gợi ý bác sĩ, phòng khám và khung giờ
                  phù hợp hơn.
                </p>
              </div>
            )}

            {clinicSuggestions.length > 0 ? (
              <div className="clinic-suggestions">
                <strong>Phòng khám nên ưu tiên</strong>
                <div className="tag-row">
                  {clinicSuggestions.map((item) => (
                    <span key={item.doctor.clinic} className="tag">
                      {item.doctor.clinic}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          <article className="content-card care-navigator__panel">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="eyebrow">Chatbot hỗ trợ</span>
                <h3>Định hướng đặt lịch đúng chuyên khoa</h3>
              </div>
            </div>

            <div className="chatbot-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble chat-bubble--${message.role}`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="quick-prompt-row">
              {chatbotQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-prompt"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="chatbot-form" onSubmit={handleChatSubmit}>
              <label className="field field--wide">
                <span>Nội dung cần tư vấn</span>
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  rows={4}
                  placeholder="Nhập triệu chứng hoặc câu hỏi của bạn..."
                />
              </label>

              <button type="submit" className="button button--dark button--block">
                Gửi câu hỏi
              </button>
            </form>
          </article>
        </div>
      </div>
    </section>
  );
}

export default CareNavigatorSection;
