"""
QR.me — GET /me/qrcodes
Lists all QR codes belonging to the authenticated user (1:N).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.auth import get_user_id
from shared.response import success, error
from boto3.dynamodb.conditions import Key


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    table = get_table(os.environ["QRCODES_TABLE"])

    response = table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
    )

    qrcodes = response.get("Items", [])

    # Sort by createdAt descending
    qrcodes.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

    return success({"qrcodes": qrcodes})
