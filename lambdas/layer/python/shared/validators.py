"""
QR.me — Shared input validators.
"""
import re

SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$")


def is_valid_slug(slug):
    """Validate slug: lowercase alphanumeric + hyphens, 3-64 chars."""
    return bool(SLUG_PATTERN.match(slug))


def validate_profile(data):
    """Validate profile fields. Returns list of errors (empty = valid)."""
    errors = []
    if "displayName" in data:
        name = data["displayName"]
        if not isinstance(name, str) or len(name) < 1 or len(name) > 100:
            errors.append("displayName debe tener entre 1 y 100 caracteres")

    if "bio" in data:
        bio = data["bio"]
        if not isinstance(bio, str) or len(bio) > 500:
            errors.append("bio no puede exceder 500 caracteres")

    if "age" in data:
        age = data["age"]
        if not isinstance(age, (int, float)) or age < 13 or age > 120:
            errors.append("age debe ser un número entre 13 y 120")

    if "interests" in data:
        interests = data["interests"]
        if not isinstance(interests, list) or len(interests) > 20:
            errors.append("interests debe ser una lista de máximo 20 elementos")

    return errors


def validate_qrcode(data):
    """Validate QR code fields. Returns list of errors (empty = valid)."""
    errors = []

    if "label" in data:
        label = data["label"]
        if not isinstance(label, str) or len(label) < 1 or len(label) > 100:
            errors.append("label debe tener entre 1 y 100 caracteres")

    if "tagline" in data:
        tagline = data["tagline"]
        if not isinstance(tagline, str) or len(tagline) > 200:
            errors.append("tagline no puede exceder 200 caracteres")

    return errors
