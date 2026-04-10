import { SymptomProfile } from "../types";

export const symptomProfiles: SymptomProfile[] = [
  {
    id: "tim-mach",
    label: "Nhóm triệu chứng tim mạch",
    specialty: "Tim mạch",
    keywords: [
      "đau ngực",
      "tim đập nhanh",
      "hồi hộp",
      "khó thở",
      "cao huyết áp",
      "tăng huyết áp",
      "choáng váng"
    ],
    note:
      "Các dấu hiệu liên quan đến tim mạch nên được ưu tiên bác sĩ tim mạch để đánh giá sớm nguy cơ huyết áp hoặc rối loạn nhịp.",
    carePath:
      "Ưu tiên bác sĩ tim mạch, chọn khung giờ còn trống gần nhất và chuẩn bị sẵn kết quả đo huyết áp nếu có.",
    urgency: "high"
  },
  {
    id: "da-lieu",
    label: "Nhóm triệu chứng da liễu",
    specialty: "Da liễu",
    keywords: [
      "mụn",
      "ngứa",
      "nổi mẩn",
      "dị ứng da",
      "mề đay",
      "da khô",
      "kích ứng",
      "thâm mụn"
    ],
    note:
      "Triệu chứng trên da phù hợp bác sĩ da liễu để được định hướng điều trị và chăm sóc hàng rào bảo vệ da đúng cách.",
    carePath:
      "Nên chọn bác sĩ da liễu, mô tả vị trí tổn thương, thời gian xuất hiện và các sản phẩm đã sử dụng gần đây.",
    urgency: "medium"
  },
  {
    id: "tai-mui-hong",
    label: "Nhóm triệu chứng tai mũi họng",
    specialty: "Tai mũi họng",
    keywords: [
      "đau họng",
      "nghẹt mũi",
      "viêm xoang",
      "ho",
      "sổ mũi",
      "ù tai",
      "khàn tiếng"
    ],
    note:
      "Các biểu hiện vùng tai mũi họng thường cần thăm khám chuyên khoa để phân biệt viêm cấp, dị ứng hay kích ứng kéo dài.",
    carePath:
      "Ưu tiên bác sĩ tai mũi họng, chọn khung giờ thuận tiện và ghi chú nếu triệu chứng tái diễn theo mùa.",
    urgency: "medium"
  },
  {
    id: "nhi-khoa",
    label: "Nhóm triệu chứng nhi khoa",
    specialty: "Nhi khoa",
    keywords: [
      "trẻ",
      "bé",
      "sốt",
      "biếng ăn",
      "ho ở trẻ",
      "nôn",
      "tiêu chảy",
      "quấy khóc"
    ],
    note:
      "Triệu chứng xảy ra ở trẻ em nên được ưu tiên bác sĩ nhi khoa để theo dõi theo độ tuổi và thể trạng.",
    carePath:
      "Chọn bác sĩ nhi khoa, chuẩn bị thông tin nhiệt độ, cân nặng và các thuốc bé đã dùng gần đây.",
    urgency: "high"
  },
  {
    id: "san-phu-khoa",
    label: "Nhóm triệu chứng sản phụ khoa",
    specialty: "Sản phụ khoa",
    keywords: [
      "đau bụng kinh",
      "rong kinh",
      "viêm phụ khoa",
      "khí hư",
      "thai",
      "trễ kinh",
      "tiền hôn nhân"
    ],
    note:
      "Các biểu hiện phụ khoa và sức khỏe sinh sản nên được tư vấn đúng chuyên khoa để đảm bảo riêng tư và theo dõi phù hợp.",
    carePath:
      "Ưu tiên bác sĩ sản phụ khoa, có thể ghi chú chu kỳ kinh gần nhất hoặc kết quả khám trước đó để hỗ trợ đánh giá.",
    urgency: "medium"
  },
  {
    id: "noi-tong-quat",
    label: "Nhóm triệu chứng nội tổng quát",
    specialty: "Nội tổng quát",
    keywords: [
      "mệt mỏi",
      "đau đầu",
      "chóng mặt",
      "rối loạn tiêu hóa",
      "đầy bụng",
      "khó ngủ",
      "không rõ chuyên khoa"
    ],
    note:
      "Nếu triệu chứng chưa rõ chuyên khoa, bác sĩ nội tổng quát là lựa chọn phù hợp để sàng lọc và định hướng tiếp theo.",
    carePath:
      "Đặt lịch với bác sĩ nội tổng quát để sàng lọc ban đầu, sau đó có thể chuyển tiếp sang chuyên khoa phù hợp nếu cần.",
    urgency: "low"
  }
];

export const chatbotQuickPrompts = [
  "Tôi bị đau ngực và khó thở nhẹ, nên khám chuyên khoa nào?",
  "Bé sốt về đêm và biếng ăn, cần đặt lịch với bác sĩ nào?",
  "Da nổi mẩn ngứa sau khi dùng mỹ phẩm, nên làm gì trước?"
];
