from app import create_app

app = create_app(init_db=True)
print("Database initialized successfully.")