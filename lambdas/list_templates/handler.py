"""
QR.me — GET /public/templates
Returns all active templates. No auth required.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.db import get_table
from shared.response import success, error


def handler(event, context):
    table = get_table(os.environ["TEMPLATES_TABLE"])

    # Scan for active templates (small table, scan is fine)
    response = table.scan(
        FilterExpression="isActive = :active",
        ExpressionAttributeValues={":active": True},
    )

    templates = response.get("Items", [])
    return success({"templates": templates})
