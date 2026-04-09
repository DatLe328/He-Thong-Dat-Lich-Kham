from flask import Flask
from config import Config
from db.db import db
from routes.ping import health_bp
from routes.doctor import doctor_bp

def create_app(init_db=False):
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    with app.app_context():
        import models
        if init_db:
            db.drop_all()
            db.create_all()

    app.register_blueprint(health_bp)
    app.register_blueprint(doctor_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)