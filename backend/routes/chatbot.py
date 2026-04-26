from datetime import datetime
import json
import unicodedata

import requests
from flask import Blueprint, current_app, jsonify, request

from db.db import db
from models.appointment import Appointment
from models.doctor import Doctor
from models.patient import Patient
from models.schedule import Schedule


chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/chatbot")


def _ok(data=None, message="OK", code=200):
    return jsonify({"success": True, "message": message, "data": data}), code


def _err(message, code=400):
    return jsonify({"success": False, "message": message}), code


def _safe_user_question(question: str) -> str:
    # Keep user text short to reduce prompt injection surface.
    question = (question or "").strip()
    return question[:1200]


def _safe_history(history: object, limit: int = 6) -> list[dict]:
    if not isinstance(history, list):
        return []

    rows = []
    for item in history[-limit:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role not in {"user", "bot", "assistant"} or not content:
            continue
        rows.append({"role": role, "content": content[:1200]})
    return rows


def _normalize_for_match(value: str) -> str:
    text = (value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.split())


def _find_mentioned_doctor(question: str, history: list[dict], doctors: list[dict]):
    merged_text = " ".join([question] + [item.get("content", "") for item in history])
    normalized_text = _normalize_for_match(merged_text)

    if not normalized_text:
        return None

    for doctor in doctors:
        doctor_id = doctor.get("doctorId")
        doctor_name = str(doctor.get("name") or "")
        if not doctor_id or not doctor_name:
            continue

        normalized_name = _normalize_for_match(doctor_name)
        if normalized_name and normalized_name in normalized_text:
            return doctor

        if f"bac si #{doctor_id}" in normalized_text:
            return doctor

    return None


def _build_booking_suggestion(doctor: dict | None):
    if not doctor:
        return None

    doctor_id = doctor.get("doctorId")
    doctor_name = doctor.get("name") or f"Bac si #{doctor_id}"
    if not doctor_id:
        return None

    return {
        "doctorId": doctor_id,
        "doctorName": doctor_name,
        "doctorPath": f"/doctors/{doctor_id}",
    }


def _resolve_provider(requested_provider: str | None) -> str:
    provider = (requested_provider or current_app.config.get("LLM_PROVIDER", "ollama") or "ollama").strip().lower()
    if provider not in {"ollama", "openai"}:
        return "ollama"
    return provider


def _doctor_context(max_doctors: int = 10):
    doctors = (
        db.session.query(Doctor)
        .order_by(Doctor.rating.desc(), Doctor.doctorID.asc())
        .limit(max_doctors)
        .all()
    )

    rows = []
    for doctor in doctors:
        user = doctor.user
        clinic = doctor.clinic
        name = ""
        if user:
            name = f"{(user.lastName or '').strip()} {(user.firstName or '').strip()}".strip()
        if not name:
            name = f"Bac si #{doctor.doctorID}"

        rows.append(
            {
                "doctorId": doctor.doctorID,
                "name": name,
                "specialization": doctor.specialization or "Chua cap nhat",
                "rating": doctor.rating,
                "clinic": clinic.name if clinic else "Khong co",
                "clinicPhone": clinic.phone if clinic else None,
            }
        )

    return rows


def _patient_appointments_context(user_id: int | None, limit: int = 10):
    if not user_id:
        return []

    patient = Patient.query.filter_by(userID=user_id).first()
    if not patient:
        return []

    appointments = (
        Appointment.query.filter_by(patientId=patient.patientID)
        .order_by(Appointment.appointmentDate.desc())
        .limit(limit)
        .all()
    )

    rows = []
    for appt in appointments:
        doctor = appt.doctor
        doctor_name = None
        if doctor and doctor.user:
            doctor_name = f"{(doctor.user.lastName or '').strip()} {(doctor.user.firstName or '').strip()}".strip()

        schedule: Schedule | None = appt.schedule
        rows.append(
            {
                "appointmentId": appt.appointmentId,
                "doctorId": appt.doctorId,
                "doctorName": doctor_name or (f"Bac si #{appt.doctorId}" if appt.doctorId else "Khong ro"),
                "clinicId": appt.clinicId,
                "appointmentDate": appt.appointmentDate.isoformat() if appt.appointmentDate else None,
                "status": appt.status.value if appt.status else "Khong ro",
                "reason": appt.reason,
                "schedule": {
                    "workDate": schedule.workDate.isoformat() if schedule and schedule.workDate else None,
                    "startTime": schedule.startTime.strftime("%H:%M") if schedule and schedule.startTime else None,
                    "endTime": schedule.endTime.strftime("%H:%M") if schedule and schedule.endTime else None,
                },
            }
        )

    return rows


def _build_system_prompt() -> str:
    return (
        "Ban la tro ly tu van cho he thong dat lich kham. "
        "Duoc phep tra loi cac cau xa giao co ban nhu chao hoi va gioi thieu ban than. "
        "Chi duoc tra loi cac chu de lien quan den: suc khoe, trieu chung thong thuong, "
        "benh vien/phong kham, bac si, chuyen khoa, lich hen kham, quy trinh dat lich. "
        "Neu cau hoi ngoai pham vi, tu choi lich su va huong nguoi dung quay lai chu de y te. "
        "Khong dua ra chan doan cuoi cung. Luon khuyen benh nhan gap bac si khi co dau hieu nguy hiem. "
        "Khong bịa dat du lieu ngoai context backend cung cap. "
        "Tra loi ngan gon, ro rang, bang tieng Viet."
    )


def _build_scope_prompt(question: str) -> str:
    return (
        "Hay phan tich cau hoi cua nguoi dung va phan loai y dinh. "
        "Chi tra ve JSON hop le, khong them chu thich, khong markdown. "
        "Dinh dang bat buoc: "
        "{\"in_scope\": true/false, \"intent\": \"...\", \"reason\": \"...\"}. "
        "intent phai la mot trong cac gia tri: "
        "greeting, assistant_identity, doctor_info, appointment_info, booking_guidance, health_general, out_of_scope. "
        "greeting va assistant_identity duoc coi la in_scope=true. "
        "Cau hoi in_scope=true neu lien quan den suc khoe, trieu chung, bac si, "
        "benh vien, phong kham, chuyen khoa, xet nghiem, lich hen, quy trinh dat lich, hoac cham soc benh nhan. "
        "Neu khong chac chan, hay dat intent=out_of_scope va in_scope=false. "
        f"Cau hoi: {question}"
    )


def _call_ollama(system_prompt: str, prompt: str, json_mode: bool = False):
    ollama_url = current_app.config.get("OLLAMA_URL", "http://localhost:11434")
    ollama_model = current_app.config.get("OLLAMA_MODEL", "llama3.1")
    timeout_seconds = int(current_app.config.get("OLLAMA_TIMEOUT", 30))

    payload = {
        "model": ollama_model,
        "system": system_prompt,
        "prompt": prompt,
        "stream": False,
    }
    if json_mode:
        payload["format"] = "json"

    response = requests.post(
        f"{ollama_url.rstrip('/')}/api/generate",
        json=payload,
        timeout=timeout_seconds,
    )
    response.raise_for_status()

    response_payload = response.json()
    return (response_payload.get("response") or "").strip()


def _call_openai(system_prompt: str, prompt: str, json_mode: bool = False):
    api_key = (current_app.config.get("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY chua duoc cau hinh.")

    endpoint = current_app.config.get("OPENAI_URL", "https://api.openai.com/v1/chat/completions")
    model = current_app.config.get("OPENAI_MODEL", "gpt-4o-mini")
    timeout_seconds = int(current_app.config.get("OPENAI_TIMEOUT", 30))

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout_seconds,
    )
    response.raise_for_status()

    response_payload = response.json()
    choices = response_payload.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    return (message.get("content") or "").strip()


def _call_llm(provider: str, system_prompt: str, prompt: str, json_mode: bool = False):
    if provider == "openai":
        return _call_openai(system_prompt, prompt, json_mode=json_mode)
    return _call_ollama(system_prompt, prompt, json_mode=json_mode)


def _build_answer_prompt(question: str, context: dict, intent: str, reason: str):
    return (
        "[THOI GIAN HE THONG]\n"
        f"{datetime.utcnow().isoformat()}Z\n\n"
        "[PHAN LOAI CAU HOI]\n"
        f"intent={intent}\n"
        f"reason={reason or 'N/A'}\n\n"
        "[CONTEXT BACKEND]\n"
        f"{context}\n\n"
        "[CAU HOI BENH NHAN]\n"
        f"{question}\n\n"
        "[YEU CAU TRA LOI]\n"
        "- Uu tien thong tin tu context backend neu co.\n"
        "- Co the dung [CHAT_HISTORY] de hieu cau hoi tiep theo trong cung mot hoi thoai.\n"
        "- Neu khong du du lieu cu the, noi ro va huong dan buoc tiep theo.\n"
        "- Neu intent la greeting hoac assistant_identity thi tra loi ngan gon, than thien, khong can liet ke context.\n"
        "- Khong tra loi ngoai pham vi y te/phong kham/bac si/lich hen."
    )


def _generate_answer(provider: str, question: str, context: dict, intent: str, reason: str):
    answer = _call_llm(
        provider=provider,
        system_prompt=_build_system_prompt(),
        prompt=_build_answer_prompt(question, context, intent, reason),
        json_mode=False,
    )
    if not answer:
        return "Toi chua tao duoc cau tra loi phu hop. Ban vui long thu lai voi cau hoi cu the hon."
    return answer


def _classify_scope(provider: str, question: str) -> tuple[bool, str, str]:
    raw_output = _call_llm(
        provider=provider,
        system_prompt=(
            "Ban la bo phan phan loai pham vi cau hoi. "
            "Chi tra ve JSON hop le theo dung dinh dang da yeu cau."
        ),
        prompt=_build_scope_prompt(question),
        json_mode=True,
    ) or "{}"

    try:
        result = json.loads(raw_output)
    except json.JSONDecodeError:
        return False, "out_of_scope", "Khong the xac dinh pham vi cau hoi."

    in_scope = bool(result.get("in_scope"))
    intent = str(result.get("intent") or "out_of_scope").strip() or "out_of_scope"
    reason = str(result.get("reason") or "")
    return in_scope, intent, reason


@chatbot_bp.route("/ask", methods=["POST"])
def ask_chatbot():
    body = request.get_json(silent=True) or {}
    question = _safe_user_question(body.get("question", ""))
    user_id = body.get("userId")
    provider = _resolve_provider(body.get("provider"))
    history = _safe_history(body.get("history"))

    if not question:
        return _err("Thiếu question.")

    try:
        in_scope, intent, reason = _classify_scope(provider, question)
    except requests.RequestException:
        return _err(
            f"Khong ket noi duoc {provider} de kiem tra pham vi cau hoi.",
            503,
        )
    except ValueError as exc:
        return _err(str(exc), 500)
    except Exception as exc:
        return _err(f"Loi kiem tra pham vi: {exc}", 500)

    if not in_scope:
        return _ok(
            {
                "answer": (
                    "Xin loi, toi chi ho tro cau hoi lien quan den suc khoe, bac si, "
                    "benh vien/phong kham va lich hen kham."
                ),
                "scope": "out-of-scope",
                "intent": intent,
                "reason": reason or "Cau hoi khong thuoc pham vi ho tro.",
                "provider": provider,
            },
            message="Cau hoi ngoai pham vi ho tro.",
        )

    try:
        top_doctors = _doctor_context(max_doctors=10)
        context = {
            "chatHistory": history,
            "topDoctors": top_doctors,
            "patientAppointments": _patient_appointments_context(user_id=user_id, limit=10),
        }
        mentioned_doctor = _find_mentioned_doctor(question, history, top_doctors)
        booking_suggestion = _build_booking_suggestion(mentioned_doctor)
        answer = _generate_answer(provider, question, context, intent, reason)
        return _ok(
            {
                "answer": answer,
                "scope": "in-scope",
                "intent": intent,
                "provider": provider,
                "bookingSuggestion": booking_suggestion,
            }
        )
    except requests.RequestException:
        return _err(
            f"Khong ket noi duoc {provider}. Vui long kiem tra cau hinh va thu lai.",
            503,
        )
    except ValueError as exc:
        return _err(str(exc), 500)
    except Exception as exc:
        return _err(f"Loi chatbot: {exc}", 500)
