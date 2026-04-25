"""
QR.me — Tests for profile lambdas (get_my_profile, upsert_profile).
"""
import json
import pytest
from moto import mock_aws
from tests.conftest import make_auth_event


@mock_aws
def test_upsert_profile_creates_user_and_profile(dynamodb_tables):
    """First profile upsert should create both user and profile records."""
    from upsert_profile.handler import handler

    event = make_auth_event(
        user_id="user-001",
        email="maria@example.com",
        body={
            "displayName": "María García",
            "age": 25,
            "bio": "Soy muy divertida 🎉",
            "interests": ["música", "viajes", "cocina"],
            "socialLinks": {"instagram": "@mariagarcia"},
        },
        method="PUT",
    )

    response = handler(event, None)
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    assert body["slug"].startswith("mar")
    assert body["profile"]["displayName"] == "María García"
    assert body["profile"]["age"] == 25


@mock_aws
def test_upsert_profile_updates_existing(dynamodb_tables):
    """Subsequent upserts should update existing profile without changing slug."""
    from upsert_profile.handler import handler

    # First upsert
    event1 = make_auth_event(
        user_id="user-002",
        email="carlos@example.com",
        body={"displayName": "Carlos", "bio": "Hola"},
        method="PUT",
    )
    resp1 = handler(event1, None)
    slug1 = json.loads(resp1["body"])["slug"]

    # Second upsert
    event2 = make_auth_event(
        user_id="user-002",
        body={"displayName": "Carlos López", "bio": "Actualizado"},
        method="PUT",
    )
    resp2 = handler(event2, None)
    slug2 = json.loads(resp2["body"])["slug"]

    assert slug1 == slug2  # Slug doesn't change


@mock_aws
def test_upsert_profile_validates_bio_length(dynamodb_tables):
    """Bio exceeding 500 chars should be rejected."""
    from upsert_profile.handler import handler

    event = make_auth_event(
        user_id="user-003",
        body={"displayName": "Test", "bio": "x" * 501},
        method="PUT",
    )

    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "500" in json.loads(response["body"])["error"]


@mock_aws
def test_get_my_profile_returns_data(dynamodb_tables):
    """Should return user + profile after upsert."""
    from upsert_profile.handler import handler as upsert
    from get_my_profile.handler import handler as get_profile

    # Create profile first
    upsert_event = make_auth_event(
        user_id="user-004",
        email="ana@example.com",
        body={"displayName": "Ana", "age": 30},
        method="PUT",
    )
    upsert(upsert_event, None)

    # Get profile
    get_event = make_auth_event(user_id="user-004")
    response = get_profile(get_event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["user"]["slug"] is not None
    assert body["profile"]["displayName"] == "Ana"


@mock_aws
def test_get_my_profile_no_profile(dynamodb_tables):
    """Should return None for profile if not created yet."""
    from get_my_profile.handler import handler

    event = make_auth_event(user_id="nonexistent-user")
    response = handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["user"] is None
    assert body["profile"] is None
