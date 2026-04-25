"""
QR.me — Shared DynamoDB client helper.
Provides a singleton DynamoDB resource to avoid re-creating on each call.
"""
import boto3
import os

_resource = None


def get_table(table_name):
    """Get a DynamoDB Table resource by name."""
    global _resource
    if _resource is None:
        _resource = boto3.resource("dynamodb")
    return _resource.Table(table_name)
