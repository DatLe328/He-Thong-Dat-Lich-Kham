import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

class Config:
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD") 
    DB_HOST = os.getenv("DB_HOST") 
    DB_PORT = os.getenv("DB_PORT") 
    DB_NAME = os.getenv("DB_NAME") 
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    INIT_DB = os.getenv("INIT_DB", "false").lower() == "true"
