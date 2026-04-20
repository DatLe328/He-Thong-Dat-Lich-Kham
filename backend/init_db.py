from app import create_app
from db.db import db

try:
    from seed_data import seed_demo_data
except ImportError:
    from backend.seed_data import seed_demo_data

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    summary = seed_demo_data()

print("Database initialized successfully.")
print(f"Seeded demo data: {summary}")