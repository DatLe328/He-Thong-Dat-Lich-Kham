import { ChangeEvent, startTransition, useDeferredValue } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CareNavigatorSection from "../components/CareNavigatorSection";
import DoctorCard from "../components/DoctorCard";
import { doctors, specialties } from "../data/doctors";

function DoctorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialty = searchParams.get("specialty") ?? "Tất cả chuyên khoa";
  const keyword = searchParams.get("keyword") ?? "";
  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase());

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatched =
      selectedSpecialty === "Tất cả chuyên khoa" ||
      doctor.specialty === selectedSpecialty;

    const keywordMatched =
      deferredKeyword.length === 0 ||
      doctor.name.toLowerCase().includes(deferredKeyword) ||
      doctor.clinic.toLowerCase().includes(deferredKeyword) ||
      doctor.location.toLowerCase().includes(deferredKeyword) ||
      doctor.licenseNumber.toLowerCase().includes(deferredKeyword);

    return specialtyMatched && keywordMatched;
  });

  const updateSearchParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    startTransition(() => {
      setSearchParams(nextParams, { replace: true });
    });
  };

  const handleSpecialtyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateSearchParam("specialty", event.target.value);
  };

  const handleKeywordChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateSearchParam("keyword", event.target.value);
  };

  return (
    <div className="page">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow">Tra cứu chuyên khoa</span>
          <h1>Tìm bác sĩ theo chuyên khoa</h1>
          <p>
            Lọc nhanh theo chuyên khoa, tìm theo tên bác sĩ hoặc cơ sở khám,
            sau đó xem chi tiết hồ sơ và lịch làm việc.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="search-toolbar">
            <label className="field">
              <span>Chuyên khoa</span>
              <select value={selectedSpecialty} onChange={handleSpecialtyChange}>
                {specialties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--wide">
              <span>Tìm theo tên bác sĩ / phòng khám / địa chỉ / số giấy phép</span>
              <input
                type="text"
                value={keyword}
                onChange={handleKeywordChange}
                placeholder="Ví dụ: tim mạch, SkinLab, Trần Minh An, GP-BS..."
              />
            </label>
          </div>

          <div className="search-summary">
            <strong>{filteredDoctors.length}</strong> bác sĩ phù hợp
            <Link to="/auth?tab=register" className="text-link">
              Tạo tài khoản để lưu thông tin khám
            </Link>
          </div>

          {filteredDoctors.length > 0 ? (
            <div className="doctor-grid">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Chưa tìm thấy bác sĩ phù hợp</h3>
              <p>
                Vui lòng thử đổi chuyên khoa, rút gọn từ khóa tìm kiếm hoặc xem
                lại danh sách tổng.
              </p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  startTransition(() => {
                    setSearchParams({}, { replace: true });
                  });
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>

      <CareNavigatorSection />
    </div>
  );
}

export default DoctorsPage;
