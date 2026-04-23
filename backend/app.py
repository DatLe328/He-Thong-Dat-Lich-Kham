from flask import Flask, jsonify
from flask_migrate import Migrate
from config import Config
from db.db import db
from routes.ping import health_bp
from routes.doctor import doctor_bp
from routes.auth import auth_bp
from routes.appointment import appointment_bp
from routes.patient import patient_bp
from routes.statistics import statistics_bp
from routes.review import review_bp
from routes.payment import momo_bp
from models.payment import Payment


# flask --app app:create_app db init
# flask --app app:create_app db migrate -m "add updatedAt to reviews"
# flask --app app:create_app db upgrade
migrate = Migrate()

def create_app(init_db=False):
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        import models

        if init_db:
            db.create_all()

    app.register_blueprint(health_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(statistics_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(momo_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Endpoint không tồn tại."}), 404
 
    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "message": "Method không được phép."}), 405
 
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "Lỗi server nội bộ."}), 500

    return app

if __name__ == "__main__":
    app = create_app(init_db=Config.INIT_DB)
    app.run(debug=True)
