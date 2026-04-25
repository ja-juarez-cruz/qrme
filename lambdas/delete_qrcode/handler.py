"""
QR.me — DELETE /me/qrcodes/{qrId}
Deletes a QR code owned by the authenticated user.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.auth import get_user_id
from shared.response import success, error


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    qr_id = event.get("pathParameters", {}).get("qrId")
    if not qr_id:
        return error("qrId es requerido")

    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])

    # Verify ownership
    qr_resp = qrcodes_table.get_item(Key={"qrId": qr_id})
    qr = qr_resp.get("Item")

    if not qr:
        return error("QR no encontrado", 404)
    if qr.get("userId") != user_id:
        return error("No tienes permiso para eliminar este QR", 403)

    qrcodes_table.delete_item(Key={"qrId": qr_id})

    return success({"message": "QR eliminado", "qrId": qr_id})
