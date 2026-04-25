"""
QR.me — Shared auth helpers.
Extracts user ID from API Gateway v2 authorizer context.
"""


def get_user_id(event):
    """
    Extract userId from the Lambda authorizer context.
    API Gateway v2 payload format 2.0 puts authorizer data in
    event['requestContext']['authorizer']['lambda'].
    """
    try:
        return event["requestContext"]["authorizer"]["lambda"]["userId"]
    except (KeyError, TypeError):
        return None
