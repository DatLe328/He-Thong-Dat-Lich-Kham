import { ChangeEvent, startTransition, useDeferredValue } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { useDoctorDirectory } from "../context/DoctorDirectoryContext";

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { doctors, specialties, loading, error } = useDoctorDirectory();

  const selectedSpecialty = searchParams.get("specialty") ?? "Tất cả chuyên khoa";
  const keyword = searchParams.get("keyword") ?? "";
  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase());

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatched =
      selectedSpecialty === "Tất cả chuyên khoa" ||
      doctor.specialty === selectedSpecialty ||
      doctor.specialties.includes(selectedSpecialty);

    const keywordMatched =
      deferredKeyword.length === 0 ||
      doctor.name.toLowerCase().includes(deferredKeyword) ||
      doctor.specialty.toLowerCase().includes(deferredKeyword) ||
      doctor.email.toLowerCase().includes(deferredKeyword) ||
      doctor.licenseNumber.toLowerCase().includes(deferredKeyword);

    return specialtyMatched && keywordMatched;
  });

  const updateSearchParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!value || value === "Tất cả chuyên khoa") {
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
          <span className="eyebrow eyebrow--light">Kết quả tìm kiếm</span>
          <h1>Tìm bác sĩ theo chuyên khoa hoặc từ khóa</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="search-toolbar">
            <label className="field">
              <span>Chuyên khoa</span>
              <select value={selectedSpecialty} onChange={handleSpecialtyChange}>
                <option value="Tất cả chuyên khoa">Tất cả chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--wide">
              <span>Tìm theo tên bác sĩ / chuyên khoa / email / số giấy phép</span>
              <input
                type="text"
                value={keyword}
                onChange={handleKeywordChange}
                placeholder="Ví dụ: tim mạch, bác sĩ An, gmail, GP-BS..."
              />
            </label>
          </div>

          <div className="search-summary">
            <span>
              {loading
                ? "Đang tải dữ liệu từ backend..."
                : `${filteredDoctors.length} kết quả phù hợp`}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <h2>Đang tải kết quả tìm kiếm</h2>
              <p>Hệ thống đang đồng bộ danh sách bác sĩ từ backend.</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h2>Không thể tải dữ liệu tìm kiếm</h2>
              <p>{error}</p>
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="doctor-grid">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  actionLabel="Xem hồ sơ và lịch làm việc"
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Chưa tìm thấy kết quả phù hợp</h2>
              <p>
                Thử đổi chuyên khoa, rút gọn từ khóa hoặc xóa bộ lọc để xem lại
                danh sách tổng.
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
    </div>
  );
}

export default SearchResultsPage;
