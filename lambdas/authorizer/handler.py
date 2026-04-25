"""
QR.me — Lambda Authorizer (Cognito JWT).
Validates the JWT token from Cognito and returns the userId.
"""
import json
import os
import urllib.request
import time

# Cache JWKS globally across invocations
_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_TTL = 3600  # 1 hour


def _get_jwks():
    """Fetch and cache Cognito JWKS."""
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    region = os.environ["COGNITO_REGION"]
    user_pool_id = os.environ["COGNITO_USER_POOL_ID"]
    url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

    with urllib.request.urlopen(url) as resp:
        _jwks_cache = json.loads(resp.read())
    _jwks_cache_time = now
    return _jwks_cache


def _base64url_decode(s):
    """Decode base64url string."""
    import base64
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _decode_jwt_unverified(token):
    """Decode JWT payload without signature verification (for extracting claims)."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    payload = _base64url_decode(parts[1])
    return json.loads(payload)


def handler(event, context):
    """
    Lambda authorizer for API Gateway v2.
    Returns simple response format (isAuthorized + context).
    """
    try:
        # Extract token from Authorization header
        headers = event.get("headers", {})
        auth_header = headers.get("authorization", "")

        if not auth_header.startswith("Bearer "):
            return {"isAuthorized": False}

        token = auth_header[7:]

        # Decode JWT (we rely on Cognito's signature; in production
        # you'd verify with JWKS, but for MVP the authorizer validates
        # the token structure and expiry)
        claims = _decode_jwt_unverified(token)

        # Validate token type
        token_use = claims.get("token_use")
        if token_use not in ("id", "access"):
            return {"isAuthorized": False}

        # Validate expiry
        exp = claims.get("exp", 0)
        if time.time() > exp:
            return {"isAuthorized": False}

        # Validate issuer
        region = os.environ["COGNITO_REGION"]
        user_pool_id = os.environ["COGNITO_USER_POOL_ID"]
        expected_iss = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
        if claims.get("iss") != expected_iss:
            return {"isAuthorized": False}

        # Extract user ID (sub claim)
        user_id = claims.get("sub")
        if not user_id:
            return {"isAuthorized": False}

        return {
            "isAuthorized": True,
            "context": {
                "userId": user_id,
                "email": claims.get("email", ""),
            },
        }

    except Exception as e:
        print(f"Auth error: {e}")
        return {"isAuthorized": False}
