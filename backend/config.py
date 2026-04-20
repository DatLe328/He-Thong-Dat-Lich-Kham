import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()


def _env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name, default):
    value = os.getenv(name)
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default


class Config:
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD") 
    DB_HOST = os.getenv("DB_HOST") 
    DB_PORT = os.getenv("DB_PORT") 
    DB_NAME = os.getenv("DB_NAME") 
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID")
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = _env_int("MAIL_PORT", 587)
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER") or MAIL_USERNAME
    MAIL_USE_TLS = _env_bool("MAIL_USE_TLS", True)
    MAIL_USE_SSL = _env_bool("MAIL_USE_SSL", False)
    MAIL_SUPPRESS_SEND = _env_bool("MAIL_SUPPRESS_SEND", False)

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
