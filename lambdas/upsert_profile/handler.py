"""
QR.me — PUT /me/profile
Creates or updates the authenticated user's profile.
Also ensures a user record exists with a slug.
"""
import json
import os
import sys
import re
from datetime import datetime, timezone
from shared.db import get_table
from shared.auth import get_user_id
from shared.response import success, error
from shared.validators import validate_profile, is_valid_slug


def _generate_slug(display_name, email):
    """Generate a URL-friendly slug from display name or email."""
    base = display_name if display_name else email.split("@")[0]
    slug = base.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    if len(slug) < 3:
        slug = slug + "-user"
    return slug[:64]


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    # Parse body
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return error("JSON inválido")

    # Validate profile fields
    errors = validate_profile(body)
    if errors:
        return error("; ".join(errors))

    now = datetime.now(timezone.utc).isoformat()

    # Ensure user record exists
    users_table = get_table(os.environ["USERS_TABLE"])
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")

    if not user:
        # Get email from authorizer context
        email = ""
        try:
            email = event["requestContext"]["authorizer"]["lambda"].get("email", "")
        except (KeyError, TypeError):
            pass

        display_name = body.get("displayName", "")
        slug = _generate_slug(display_name, email)

        # Check slug uniqueness — append suffix if needed
        from boto3.dynamodb.conditions import Key as DDBKey
        existing = users_table.query(
            IndexName="slug-index",
            KeyConditionExpression=DDBKey("slug").eq(slug),
            Limit=1,
        )
        if existing.get("Items"):
            import uuid
            slug = f"{slug}-{str(uuid.uuid4())[:4]}"

        users_table.put_item(Item={
            "userId": user_id,
            "email": email,
            "slug": slug,
            "createdAt": now,
        })
    else:
        slug = user.get("slug", "")

    # Upsert profile
    profiles_table = get_table(os.environ["PROFILES_TABLE"])
    profile_item = {
        "userId": user_id,
        "updatedAt": now,
    }

    # Allowed fields
    allowed = ["displayName", "age", "bio", "interests", "photoUrl", "socialLinks"]
    for field in allowed:
        if field in body:
            profile_item[field] = body[field]

    profiles_table.put_item(Item=profile_item)

    return success({
        "message": "Perfil actualizado",
        "slug": slug,
        "profile": profile_item,
    })
