"""
QR.me — PUT /me/qrcodes/{qrId}
Updates an existing QR code owned by the authenticated user.
"""
import json
import os
import sys
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

    qr_id = event.get("pathParameters", {}).get("qrId")
    if not qr_id:
        return error("qrId es requerido")

    # Parse body
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return error("JSON inválido")

    # Validate
    errors = validate_qrcode(body)
    if errors:
        return error("; ".join(errors))

    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])

    # Verify ownership
    qr_resp = qrcodes_table.get_item(Key={"qrId": qr_id})
    qr = qr_resp.get("Item")

    if not qr:
        return error("QR no encontrado", 404)
    if qr.get("userId") != user_id:
        return error("No tienes permiso para editar este QR", 403)

    # If templateId changed, validate new template
    new_template_id = body.get("templateId")
    if new_template_id and new_template_id != qr.get("templateId"):
        templates_table = get_table(os.environ["TEMPLATES_TABLE"])
        tmpl_resp = templates_table.get_item(Key={"templateId": new_template_id})
        template = tmpl_resp.get("Item")
        if not template or not template.get("isActive", False):
            return error("Plantilla no encontrada o no activa")

    # Build update expression
    now = datetime.now(timezone.utc).isoformat()
    allowed_fields = ["label", "tagline", "customData", "templateId"]
    update_parts = ["#updatedAt = :updatedAt"]
    attr_names = {"#updatedAt": "updatedAt"}
    attr_values = {":updatedAt": now}

    for field in allowed_fields:
        if field in body:
            placeholder = f"#{field}"
            value_placeholder = f":{field}"
            update_parts.append(f"{placeholder} = {value_placeholder}")
            attr_names[placeholder] = field
            attr_values[value_placeholder] = body[field]

    qrcodes_table.update_item(
        Key={"qrId": qr_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=attr_names,
        ExpressionAttributeValues=attr_values,
    )

    # Return updated QR
    updated = qrcodes_table.get_item(Key={"qrId": qr_id})
    return success({"qrcode": updated.get("Item")})
