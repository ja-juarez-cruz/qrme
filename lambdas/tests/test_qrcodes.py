"""
QR.me — Tests for QR code lambdas (create, list, update, delete).
"""
import json
import pytest
from moto import mock_aws
from tests.conftest import make_auth_event


def _setup_user(dynamodb_tables, user_id="user-100", email="qr@test.com"):
    """Helper: create a user + profile so QR operations work."""
    from upsert_profile.handler import handler
    event = make_auth_event(
        user_id=user_id, email=email,
        body={"displayName": "QR User", "age": 20},
        method="PUT",
    )
    resp = handler(event, None)
    return json.loads(resp["body"])["slug"]


@mock_aws
def test_create_qrcode(dynamodb_tables):
    """Should create a QR code with valid templateId."""
    slug = _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler

    event = make_auth_event(
        user_id="user-100",
        body={
            "templateId": "social-v1",
            "label": "Mi camiseta fiesta",
            "tagline": "Soltera disponible 💃",
        },
        method="POST",
    )

    response = handler(event, None)
    assert response["statusCode"] == 201

    body = json.loads(response["body"])
    qr = body["qrcode"]
    assert qr["templateId"] == "social-v1"
    assert qr["tagline"] == "Soltera disponible 💃"
    assert slug in qr["targetUrl"]
    assert qr["scanCount"] == 0


@mock_aws
def test_create_qrcode_invalid_template(dynamodb_tables):
    """Should reject QR creation with non-existent templateId."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler

    event = make_auth_event(
        user_id="user-100",
        body={"templateId": "nonexistent-template", "label": "Test"},
        method="POST",
    )

    response = handler(event, None)
    assert response["statusCode"] == 404


@mock_aws
def test_list_qrcodes(dynamodb_tables):
    """Should list all QRs for the user."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler as create
    from list_qrcodes.handler import handler as list_qrs

    # Create 2 QRs
    for i in range(2):
        event = make_auth_event(
            user_id="user-100",
            body={"templateId": "social-v1", "label": f"QR {i}"},
            method="POST",
        )
        create(event, None)

    # List
    list_event = make_auth_event(user_id="user-100")
    response = list_qrs(list_event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert len(body["qrcodes"]) == 2


@mock_aws
def test_update_qrcode(dynamodb_tables):
    """Should update QR fields."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler as create
    from update_qrcode.handler import handler as update

    # Create QR
    create_event = make_auth_event(
        user_id="user-100",
        body={"templateId": "social-v1", "label": "Original", "tagline": "Old"},
        method="POST",
    )
    create_resp = create(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Update
    update_event = make_auth_event(
        user_id="user-100",
        body={"tagline": "Nuevo tagline 🎯"},
        path_params={"qrId": qr_id},
        method="PUT",
    )
    response = update(update_event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["qrcode"]["tagline"] == "Nuevo tagline 🎯"


@mock_aws
def test_update_qrcode_wrong_owner(dynamodb_tables):
    """Should reject update from non-owner."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler as create
    from update_qrcode.handler import handler as update

    # Create QR as user-100
    create_event = make_auth_event(
        user_id="user-100",
        body={"templateId": "social-v1", "label": "Mine"},
        method="POST",
    )
    create_resp = create(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Try updating as different user
    update_event = make_auth_event(
        user_id="hacker-999",
        body={"tagline": "Hacked!"},
        path_params={"qrId": qr_id},
        method="PUT",
    )
    response = update(update_event, None)
    assert response["statusCode"] == 403


@mock_aws
def test_delete_qrcode(dynamodb_tables):
    """Should delete QR owned by user."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler as create
    from delete_qrcode.handler import handler as delete
    from list_qrcodes.handler import handler as list_qrs

    # Create QR
    create_event = make_auth_event(
        user_id="user-100",
        body={"templateId": "social-v1", "label": "To delete"},
        method="POST",
    )
    create_resp = create(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Delete
    delete_event = make_auth_event(
        user_id="user-100",
        path_params={"qrId": qr_id},
        method="DELETE",
    )
    response = delete(delete_event, None)
    assert response["statusCode"] == 200

    # Verify deleted
    list_event = make_auth_event(user_id="user-100")
    list_resp = list_qrs(list_event, None)
    assert len(json.loads(list_resp["body"])["qrcodes"]) == 0


@mock_aws
def test_delete_qrcode_wrong_owner(dynamodb_tables):
    """Should reject deletion from non-owner."""
    _setup_user(dynamodb_tables)
    from create_qrcode.handler import handler as create
    from delete_qrcode.handler import handler as delete

    # Create as user-100
    create_event = make_auth_event(
        user_id="user-100",
        body={"templateId": "social-v1", "label": "Protected"},
        method="POST",
    )
    create_resp = create(create_event, None)
    qr_id = json.loads(create_resp["body"])["qrcode"]["qrId"]

    # Try deleting as different user
    delete_event = make_auth_event(
        user_id="hacker-999",
        path_params={"qrId": qr_id},
        method="DELETE",
    )
    response = delete(delete_event, None)
    assert response["statusCode"] == 403
