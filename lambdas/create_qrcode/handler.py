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
import boto3
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

    # Parse and validate qrType
    qr_type = body.get("type", "template") # 'template' or 'redirect'
    redirect_url = body.get("redirectUrl", "")
    html_content = body.get("htmlContent", "")
    
    # Required: templateId (only for template type)
    template_id = body.get("templateId")
    if qr_type == "template" and not template_id:
        return error("templateId es requerido para plantillas")
    if qr_type == "redirect" and not redirect_url:
        return error("redirectUrl es requerido para redirecciones")

    # Validate templateId exists if it's a template
    if qr_type == "template":
        templates_table = get_table(os.environ["TEMPLATES_TABLE"])
        tmpl_resp = templates_table.get_item(Key={"templateId": template_id})
        template = tmpl_resp.get("Item")

        if not template:
            return error("Plantilla no encontrada", 404)
        if not template.get("isActive", False):
            return error("Plantilla no está activa")
    else:
        template_id = "redirect" # Placeholder for DynamoDB if we want to query by it

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
    
    s3_key = None
    if qr_type == "template" and html_content:
        # Upload HTML to S3
        s3_client = boto3.client("s3")
        s3_key = f"public-qrs/{qr_id}.html"
        try:
            s3_client.put_object(
                Bucket=os.environ["WEB_BUCKET"],
                Key=s3_key,
                Body=html_content.encode('utf-8'),
                ContentType="text/html",
                # ACL="public-read" # Uncomment if bucket allows public ACLs, otherwise we read via next.js or cloudfront
            )
        except Exception as e:
            print("Error uploading to S3:", e)
            return error("Error guardando la plantilla en S3", 500)

    now = datetime.now(timezone.utc).isoformat()

    qr_item = {
        "qrId": qr_id,
        "userId": user_id,
        "slug": slug,
        "type": qr_type,
        "templateId": template_id,
        "label": body.get("label", ""),
        "tagline": body.get("tagline", ""),
        "customData": body.get("customData", {}),
        "targetUrl": target_url, # URL that the QR will scan
        "redirectUrl": redirect_url, # External URL if type == redirect
        "s3Key": s3_key, # S3 file if type == template
        "scanCount": 0,
        "createdAt": now,
    }

    qrcodes_table = get_table(os.environ["QRCODES_TABLE"])
    qrcodes_table.put_item(Item=qr_item)

    return success({"qrcode": qr_item}, 201)

