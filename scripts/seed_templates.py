"""
QR.me — Seed script for templates.
Usage: AWS_PROFILE=jajc-dev python3 scripts/seed_templates.py
"""
import boto3
from datetime import datetime, timezone

TEMPLATES = [
    {
        "templateId": "social-v1",
        "name": "Fun Card",
        "description": "Presentación vibrante para cualquier evento social. El clásico de QR.me.",
        "category": "social",
        "emoji": "✨",
        "taglinePlaceholder": "¡Escanéame y conectemos!",
        "isActive": True,
        "previewUrl": "",
        "requiredFields": ["displayName", "tagline"],
        "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "templateId": "social-friends-v1",
        "name": "Nuevos Amigos",
        "description": "Para conocer gente nueva y ampliar tu círculo. Ideal para eventos, viajes y cualquier lugar.",
        "category": "social",
        "emoji": "🤝",
        "taglinePlaceholder": "Siempre abierto/a a nuevas amistades",
        "isActive": True,
        "previewUrl": "",
        "requiredFields": ["displayName", "tagline"],
        "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "templateId": "social-romance-v1",
        "name": "Buscando Pareja",
        "description": "Muestra tu mejor lado y conecta con alguien especial. Perfecto para el modo dating.",
        "category": "social",
        "emoji": "💕",
        "taglinePlaceholder": "Soltero/a y listo/a para conocerte",
        "isActive": True,
        "previewUrl": "",
        "requiredFields": ["displayName", "tagline"],
        "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "templateId": "social-fiesta-v1",
        "name": "Modo Fiesta",
        "description": "El QR perfecto para compartir en eventos y fiestas. Para el que siempre busca una buena noche.",
        "category": "social",
        "emoji": "🎉",
        "taglinePlaceholder": "¿Bailamos esta noche?",
        "isActive": True,
        "previewUrl": "",
        "requiredFields": ["displayName", "tagline"],
        "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    },
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
