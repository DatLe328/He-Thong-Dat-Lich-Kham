import smtplib
from email.message import EmailMessage

from flask import current_app


def send_email(to_email, subject, body):
    if not to_email:
        return False

    server = current_app.config.get("MAIL_SERVER")
    port = current_app.config.get("MAIL_PORT", 587)
    username = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")
    sender = current_app.config.get("MAIL_DEFAULT_SENDER") or username
    use_tls = current_app.config.get("MAIL_USE_TLS", True)
    use_ssl = current_app.config.get("MAIL_USE_SSL", False)

    if current_app.config.get("TESTING") or current_app.config.get("MAIL_SUPPRESS_SEND"):
        current_app.logger.info("Suppress sending email to %s: %s", to_email, subject)
        return True

    if not server or not sender:
        current_app.logger.warning("Email is not configured. Skip sending to %s.", to_email)
        return False

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        if use_ssl:
            smtp = smtplib.SMTP_SSL(server, port, timeout=10)
        else:
            smtp = smtplib.SMTP(server, port, timeout=10)

        with smtp:
            if use_tls and not use_ssl:
                smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
        return True
    except Exception:
        current_app.logger.exception("Failed to send email to %s.", to_email)
        return False
