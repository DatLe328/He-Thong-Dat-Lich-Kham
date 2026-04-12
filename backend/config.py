import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_USER = os.getenv("DB_USER") or "root"
    DB_PASSWORD = os.getenv("DB_PASSWORD") or "Abc123"
    DB_HOST = os.getenv("DB_HOST") or "localhost"
    DB_PORT = os.getenv("DB_PORT") or "3306"
    DB_NAME = os.getenv("DB_NAME") or "clinic_db"

    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False