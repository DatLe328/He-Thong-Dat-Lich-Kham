from flask import Flask, jsonify
from flask_migrate import Migrate
from config import Config
from db.db import db

# Blueprints
from routes.ping import health_bp
from routes.doctor import doctor_bp
from routes.auth import auth_bp
from routes.appointment import appointment_bp
from routes.patient import patient_bp
from routes.statistics import statistics_bp
from routes.review import review_bp
from routes.payment import momo_bp

import os

migrate = Migrate()


# =========================
# SCHEDULER INIT
# =========================
def init_scheduler(app):
    """Khởi động scheduler an toàn."""
    try:
        from scheduler import start_scheduler
        start_scheduler(app)
    except ImportError:
        app.logger.error("Không tìm thấy file scheduler.py")


# =========================
# CREATE APP
# =========================
def create_app(init_db=False):
    app = Flask(__name__)
    app.config.from_object(Config)

    # 1. Khởi tạo DB & Migration
    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        import models
        if init_db:
            db.create_all()

    # 2. Đăng ký Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(statistics_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(momo_bp)

    # 3. Xử lý lỗi toàn cục
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Endpoint không tồn tại"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "message": "Phương thức không được phép"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "Lỗi hệ thống nội bộ"}), 500

    # 4. Kích hoạt Scheduler (Chỉ chạy ở tiến trình chính)
    def start_safe_scheduler(app):
        # Nếu ở mode debug, Werkzeug tạo ra 1 child process để reload code.
        # Chúng ta chỉ cho scheduler chạy ở process chính (WERKZEUG_RUN_MAIN == true).
        if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
            return
        init_scheduler(app)

    start_safe_scheduler(app)

    return app



if __name__ == "__main__":
    # Lấy flag init_db từ Config nếu có
    should_init = getattr(Config, "INIT_DB", False)
    app = create_app(init_db=should_init)

    # Chạy server
    app.run(

        debug=True,
        use_reloader=False
    )