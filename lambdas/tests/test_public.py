"""
QR.me — Tests for public endpoints (list_templates, get_public_qr, track_scan).
"""
import json
import pytest
from moto import mock_aws
from tests.conftest import make_auth_event, make_public_event


@mock_aws
def test_list_templates(dynamodb_tables):
    """Should return active templates."""
    from list_templates.handler import handler

    event = make_public_event()
    response = handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    templates = body["templates"]
    assert len(templates) >= 1
    assert templates[0]["templateId"] == "social-v1"
    assert templates[0]["isActive"] is True


@mock_aws
def test_get_public_qr(dynamodb_tables):
    """Should return combined QR + profile data."""
    # Setup user + profile + QR
    from upsert_profile.handler import handler as upsert
    from create_qrcode.handler import handler as create_qr
    from get_public_qr.handler import handler

    upsert_event = make_auth_event(
        user_id="user-pub-1",
        email="pub@test.com",
        body={"displayName": "Public User", "age": 22, "bio": "Hey!"},
        method="PUT",
    )
    upsert_resp = upsert(upsert_event, None)
    slug = json.loads(upsert_resp["body"])["slug"]

    create_event = make_auth_event(
        user_id="user-pub-1",
        body={"templateId": "social-v1", "label": "Pub QR", "tagline": "Scan me!"},
        method="POST",
    )
    create_resp = create_qr(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Get public QR
    public_event = make_public_event(path_params={"slug": slug, "qrId": qr_id})
    response = handler(public_event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["qr"]["tagline"] == "Scan me!"
    assert body["profile"]["displayName"] == "Public User"
    # Email should be stripped
    assert "email" not in body.get("user", {})


@mock_aws
def test_get_public_qr_wrong_slug(dynamodb_tables):
    """Should return 404 for wrong slug."""
    from upsert_profile.handler import handler as upsert
    from create_qrcode.handler import handler as create_qr
    from get_public_qr.handler import handler

    upsert_event = make_auth_event(
        user_id="user-pub-2",
        email="wrong@test.com",
        body={"displayName": "Slug Test"},
        method="PUT",
    )
    upsert(upsert_event, None)

    create_event = make_auth_event(
        user_id="user-pub-2",
        body={"templateId": "social-v1", "label": "Test"},
        method="POST",
    )
    create_resp = create_qr(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Wrong slug
    event = make_public_event(path_params={"slug": "wrong-slug", "qrId": qr_id})
    response = handler(event, None)
    assert response["statusCode"] == 404


@mock_aws
def test_track_scan(dynamodb_tables):
    """Should atomically increment scanCount."""
    from upsert_profile.handler import handler as upsert
    from create_qrcode.handler import handler as create_qr
    from track_scan.handler import handler

    # Setup
    upsert(make_auth_event(
        user_id="user-scan",
        email="scan@test.com",
        body={"displayName": "Scanner"},
        method="PUT",
    ), None)

    create_resp = create_qr(make_auth_event(
        user_id="user-scan",
        body={"templateId": "social-v1", "label": "Scan Me"},
        method="POST",
    ), None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Scan 3 times
    for i in range(3):
        event = make_public_event(path_params={"qrId": qr_id})
        event["body"] = None
        response = handler(event, None)
        assert response["statusCode"] == 200

    body = json.loads(response["body"])
    assert body["scanCount"] == 3


@mock_aws
def test_track_scan_nonexistent_qr(dynamodb_tables):
    """Should return 404 for non-existent QR."""
    from track_scan.handler import handler

    event = make_public_event(path_params={"qrId": "nonexistent-qr"})
    response = handler(event, None)
    assert response["statusCode"] == 404
