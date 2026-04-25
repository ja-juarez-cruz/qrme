"""
QR.me — POST /me/qrcodes
Creates a new QR code. Validates templateId exists and is active.
Generates targetUrl as {BASE_URL}/u/{slug}/{qrId}.
"""
import json
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.auth import get_user_id
from shared.response import success, error
from shared.validators import validate_qrcode


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    # Parse body
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return error("JSON inválido")

    # Required: templateId
    template_id = body.get("templateId")
    if not template_id:
        return error("templateId es requerido")

    # Validate QR fields
    errors = validate_qrcode(body)
    if errors:
        return error("; ".join(errors))

    # Validate templateId exists and is active
    templates_table = get_table(os.environ["TEMPLATES_TABLE"])
    tmpl_resp = templates_table.get_item(Key={"templateId": template_id})
    template = tmpl_resp.get("Item")

    if not template:
        return error("Plantilla no encontrada", 404)
    if not template.get("isActive", False):
        return error("Plantilla no está activa")

    # Get user's slug
    users_table = get_table(os.environ["USERS_TABLE"])
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")

    if not user:
        return error("Usuario no encontrado. Crea tu perfil primero.", 404)

    slug = user.get("slug", "")
    qr_id = str(uuid.uuid4())[:8]
    base_url = os.environ.get("BASE_URL", "https://qrme.vercel.app")
    target_url = f"{base_url}/u/{slug}/{qr_id}"

    now = datetime.now(timezone.utc).isoformat()

    qr_item = {
        "qrId": qr_id,
        "userId": user_id,
        "slug": slug,
        "templateId": template_id,
        "label": body.get("label", ""),
        "tagline": body.get("tagline", ""),
        "customData": body.get("customData", {}),
        "targetUrl": target_url,
        "scanCount": 0,
        "createdAt": now,
    }

    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])
    qrcodes_table.put_item(Item=qr_item)

    return success({"qrcode": qr_item}, 201)
