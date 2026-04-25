"""
QR.me — Tests for photo upload URL generation.
"""
import json
import pytest
from moto import mock_aws
from tests.conftest import make_auth_event


@mock_aws
def test_get_photo_upload_url(dynamodb_tables, s3_bucket):
    """Should return pre-signed URL and public photo URL."""
    from get_photo_upload_url.handler import handler

    event = make_auth_event(
        user_id="user-photo-1",
        body={"contentType": "image/jpeg"},
        method="POST",
    )

    response = handler(event, None)
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    assert "uploadUrl" in body
    assert "photoUrl" in body
    assert "user-photo-1" in body["photoUrl"]
    assert body["photoUrl"].endswith(".jpg")


@mock_aws
def test_get_photo_upload_url_png(dynamodb_tables, s3_bucket):
    """Should handle PNG content type."""
    from get_photo_upload_url.handler import handler

    event = make_auth_event(
        user_id="user-photo-2",
        body={"contentType": "image/png"},
        method="POST",
    )

    response = handler(event, None)
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    assert body["photoUrl"].endswith(".png")


@mock_aws
def test_get_photo_upload_url_invalid_type(dynamodb_tables, s3_bucket):
    """Should reject invalid content types."""
    from get_photo_upload_url.handler import handler

    event = make_auth_event(
        user_id="user-photo-3",
        body={"contentType": "application/pdf"},
        method="POST",
    )

    response = handler(event, None)
    assert response["statusCode"] == 400


@mock_aws
def test_get_photo_upload_url_no_auth(dynamodb_tables, s3_bucket):
    """Should return 401 without auth."""
    from get_photo_upload_url.handler import handler

    event = {
        "requestContext": {},
        "headers": {},
        "body": "{}",
    }

    response = handler(event, None)
    assert response["statusCode"] == 401
