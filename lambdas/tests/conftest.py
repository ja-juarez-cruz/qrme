"""
QR.me — Pytest fixtures for Lambda tests.
Sets up mocked DynamoDB tables and S3 buckets using moto.
"""
import os
import sys
import json
import pytest
import boto3
from moto import mock_aws

# Add layer/python to path for shared imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "layer", "python"))


@pytest.fixture(autouse=True)
def aws_env():
    """Set up environment variables for all tests."""
    env_vars = {
        "AWS_DEFAULT_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "testing",
        "AWS_SECRET_ACCESS_KEY": "testing",
        "AWS_SECURITY_TOKEN": "testing",
        "AWS_SESSION_TOKEN": "testing",
        "USERS_TABLE": "qrme-users",
        "PROFILES_TABLE": "qrme-profiles",
        "QRCODES_TABLE": "qrme-qrcodes",
        "TEMPLATES_TABLE": "qrme-templates",
        "PHOTOS_BUCKET": "qrme-photos-test",
        "PHOTOS_REGION": "us-east-1",
        "BASE_URL": "https://qrme.test",
        "COGNITO_USER_POOL_ID": "us-east-1_testpool",
        "COGNITO_REGION": "us-east-1",
    }
    for key, value in env_vars.items():
        os.environ[key] = value
    yield
    for key in env_vars:
        os.environ.pop(key, None)


@pytest.fixture
def dynamodb_tables():
    """Create all DynamoDB tables for testing."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        # Users table
        dynamodb.create_table(
            TableName="qrme-users",
            KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "slug", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[{
                "IndexName": "slug-index",
                "KeySchema": [{"AttributeName": "slug", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }],
            BillingMode="PAY_PER_REQUEST",
        )

        # Profiles table
        dynamodb.create_table(
            TableName="qrme-profiles",
            KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # QR codes table
        dynamodb.create_table(
            TableName="qrme-qrcodes",
            KeySchema=[{"AttributeName": "qrId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "qrId", "AttributeType": "S"},
                {"AttributeName": "userId", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[{
                "IndexName": "userId-index",
                "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }],
            BillingMode="PAY_PER_REQUEST",
        )

        # Templates table
        dynamodb.create_table(
            TableName="qrme-templates",
            KeySchema=[{"AttributeName": "templateId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "templateId", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # Seed social-v1 template
        templates = dynamodb.Table("qrme-templates")
        templates.put_item(Item={
            "templateId": "social-v1",
            "name": "Social — Fun Card",
            "description": "Fun social card",
            "isActive": True,
            "requiredFields": ["displayName", "tagline"],
            "optionalFields": ["age", "bio", "interests", "photoUrl", "socialLinks"],
            "createdAt": "2025-01-01T00:00:00+00:00",
        })

        yield dynamodb


@pytest.fixture
def s3_bucket():
    """Create S3 bucket for photos."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket="qrme-photos-test")
        yield s3


def make_auth_event(user_id="user-123", email="test@example.com", body=None,
                    path_params=None, method="GET"):
    """Helper to create an API Gateway v2 event with auth context."""
    event = {
        "requestContext": {
            "authorizer": {
                "lambda": {
                    "userId": user_id,
                    "email": email,
                }
            },
            "http": {
                "method": method,
            }
        },
        "headers": {},
        "pathParameters": path_params or {},
    }
    if body is not None:
        event["body"] = json.dumps(body)
    return event


def make_public_event(path_params=None, method="GET"):
    """Helper to create a public (no auth) API Gateway v2 event."""
    return {
        "requestContext": {
            "http": {"method": method},
        },
        "headers": {},
        "pathParameters": path_params or {},
    }
