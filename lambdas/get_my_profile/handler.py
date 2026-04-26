"""
QR.me — GET /me/profile
Returns the authenticated user's profile + user record.
"""
import json
import os
import sys

from shared.db import get_table
from shared.auth import get_user_id
from shared.response import success, error


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    # Get user record
    users_table = get_table(os.environ["USERS_TABLE"])
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")

    # Get profile
    profiles_table = get_table(os.environ["PROFILES_TABLE"])
    profile_resp = profiles_table.get_item(Key={"userId": user_id})
    profile = profile_resp.get("Item")

    return success({
        "user": user,
        "profile": profile,
    })
