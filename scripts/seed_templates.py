"""
QR.me — Seed script for templates.
Inserts the social-v1 template into qrme-templates.
Usage: AWS_PROFILE=jajc-dev python3 scripts/seed_templates.py
"""
import boto3
from datetime import datetime, timezone

TEMPLATES = [
    {
        "templateId": "social-v1",
        "name": "Social — Fun Card",
        "description": "Presentación divertida para eventos sociales. Muestra nombre, tagline, edad, foto, intereses y links de contacto. Optimizada para conectar personas en persona.",
        "isActive": True,
        "previewUrl": "",
        "requiredFields": ["displayName", "tagline"],
        "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
]


def seed():
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("qrme-templates")

    for template in TEMPLATES:
        table.put_item(Item=template)
        print(f"✅ Insertado: {template['templateId']} — {template['name']}")

    print(f"\n🎉 Seed completado: {len(TEMPLATES)} plantilla(s)")


if __name__ == "__main__":
    seed()
