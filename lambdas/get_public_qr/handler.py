"""
QR.me — GET /public/qr/{slug}/{qrId}
Returns combined QR data + profile + template info for public rendering.
No auth required. Used by Next.js ISR.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.response import success, error
from boto3.dynamodb.conditions import Key


def handler(event, context):
    params = event.get("pathParameters", {})
    slug = params.get("slug")
    qr_id = params.get("qrId")

    if not slug or not qr_id:
        return error("slug y qrId son requeridos")

    # Get QR code
    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])
    qr_resp = qrcodes_table.get_item(Key={"qrId": qr_id})
    qr = qr_resp.get("Item")

    if not qr:
        return error("QR no encontrado", 404)

    # Verify slug matches
    if qr.get("slug") != slug:
        return error("QR no encontrado", 404)

    user_id = qr.get("userId")

    # Get user record
    users_table = get_table(os.environ["USERS_TABLE"])
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")

    # Get profile
    profiles_table = get_table(os.environ["PROFILES_TABLE"])
    profile_resp = profiles_table.get_item(Key={"userId": user_id})
    profile = profile_resp.get("Item")

    if not profile:
        return error("Perfil no encontrado", 404)

    # Remove sensitive data
    if user:
        user.pop("email", None)

    return success({
        "qr": qr,
        "profile": profile,
        "user": user,
    })
