# ═══════════════════════════════════════════════════════════════
# QR.me — Cognito User Pool + App Client
# ═══════════════════════════════════════════════════════════════

resource "aws_cognito_user_pool" "main" {
  name = "qrme-user-pool-${var.environment}"

  # Login con email
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Política de contraseña
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Schema: email obligatorio
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Verificación por email
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "QR.me — Código de verificación"
    email_message        = "Tu código de verificación es {####}"
  }

  tags = {
    Name        = "qrme-user-pool"
    Environment = var.environment
  }
}

# App Client (para el frontend)
resource "aws_cognito_user_pool_client" "main" {
  name         = "qrme-web-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth flows
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls

  # Token validity
  access_token_validity  = 1   # 1 hora
  id_token_validity      = 1   # 1 hora
  refresh_token_validity = 30  # 30 días

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # No usar secret (SPA público)
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
  ]
}

# Dominio para Hosted UI
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "qrme-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}
