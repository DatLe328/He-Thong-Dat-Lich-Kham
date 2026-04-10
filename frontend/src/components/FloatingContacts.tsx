import { siteInfo } from "../data/site";

function FloatingContacts() {
  return (
    <div className="floating-contacts" aria-label="Kênh liên hệ nhanh">
      <a
        href={`tel:${siteInfo.phoneRaw}`}
        className="floating-contact floating-contact--hotline"
      >
        <span className="floating-contact__icon">LH</span>
        <span>
          <strong>Liên hệ</strong>
          <small>{siteInfo.phoneDisplay}</small>
        </span>
      </a>

      <a
        href={siteInfo.zaloUrl}
        target="_blank"
        rel="noreferrer"
        className="floating-contact floating-contact--zalo"
      >
        <span className="floating-contact__icon">ZL</span>
        <span>
          <strong>Zalo</strong>
          <small>{siteInfo.zaloDisplay}</small>
        </span>
      </a>
    </div>
  );
}

export default FloatingContacts;

