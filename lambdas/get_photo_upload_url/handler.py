"""
QR.me — POST /me/profile/photo-url
Generates a pre-signed S3 URL for uploading a profile photo.
"""
import json
import os
import sys
import uuid
import boto3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.auth import get_user_id
from shared.response import success, error


def handler(event, context):
    user_id = get_user_id(event)
    if not user_id:
        return error("No autorizado", 401)

    # Parse optional content type
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        body = {}

    content_type = body.get("contentType", "image/jpeg")
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if content_type not in allowed_types:
        return error(f"Tipo de archivo no permitido. Usa: {', '.join(allowed_types)}")

    # File extension mapping
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    ext = ext_map.get(content_type, "jpg")

    # Generate unique key
    file_key = f"avatars/{user_id}/{uuid.uuid4().hex[:8]}.{ext}"

    bucket = os.environ["PHOTOS_BUCKET"]
    region = os.environ.get("PHOTOS_REGION", "us-east-1")

    # Generate pre-signed URL (15 min expiry)
    s3_client = boto3.client("s3", region_name=region)
    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket,
            "Key": file_key,
            "ContentType": content_type,
        },
        ExpiresIn=900,
    )

    # Public URL for reading the photo
    photo_url = f"https://{bucket}.s3.{region}.amazonaws.com/{file_key}"

    return success({
        "uploadUrl": upload_url,
        "photoUrl": photo_url,
        "key": file_key,
    })
