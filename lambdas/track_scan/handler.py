"""
QR.me — POST /track/scan/{qrId}
Atomically increments scanCount on a QR code.
No auth required (public endpoint called from QR page).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.response import success, error


def handler(event, context):
    qr_id = event.get("pathParameters", {}).get("qrId")
    if not qr_id:
        return error("qrId es requerido")

    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])

    try:
        response = qrcodes_table.update_item(
            Key={"qrId": qr_id},
            UpdateExpression="ADD scanCount :inc",
            ExpressionAttributeValues={":inc": 1},
            ConditionExpression="attribute_exists(qrId)",
            ReturnValues="UPDATED_NEW",
        )
        new_count = response["Attributes"].get("scanCount", 0)
        return success({"scanCount": new_count})

    except qrcodes_table.meta.client.exceptions.ConditionalCheckFailedException:
        return error("QR no encontrado", 404)
