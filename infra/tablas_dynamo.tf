# ═══════════════════════════════════════════════════════════════
# QR.me — DynamoDB Tables
# ═══════════════════════════════════════════════════════════════

# -------------------------------------------------------------------
# Tabla: qrme-users
# PK: userId (Cognito sub)
# GSI: slug-index (slug → buscar usuario por slug)
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "users" {
  name         = "qrme-users"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "slug"
    type = "S"
  }

  key_schema {
    attribute_name = "userId"
    key_type       = "HASH"
  }

  global_secondary_index {
    name            = "slug-index"
    projection_type = "ALL"

    key_schema {
      attribute_name = "slug"
      key_type       = "HASH"
    }
  }

  tags = {
    Name        = "qrme-users"
    Environment = var.environment
  }
}


# -------------------------------------------------------------------
# Tabla: qrme-profiles
# PK: userId (referencia a qrme-users)
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "profiles" {
  name         = "qrme-profiles"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "userId"
    type = "S"
  }

  key_schema {
    attribute_name = "userId"
    key_type       = "HASH"
  }

  tags = {
    Name        = "qrme-profiles"
    Environment = var.environment
  }
}


# -------------------------------------------------------------------
# Tabla: qrme-qrcodes
# PK: qrId (UUID del QR)
# GSI: userId-index (userId → listar QRs del usuario, relación 1:N)
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "qrcodes" {
  name         = "qrme-qrcodes"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "qrId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  key_schema {
    attribute_name = "qrId"
    key_type       = "HASH"
  }

  global_secondary_index {
    name            = "userId-index"
    projection_type = "ALL"

    key_schema {
      attribute_name = "userId"
      key_type       = "HASH"
    }
  }

  tags = {
    Name        = "qrme-qrcodes"
    Environment = var.environment
  }
}


# -------------------------------------------------------------------
# Tabla: qrme-templates
# PK: templateId (ej. social-v1)
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "templates" {
  name         = "qrme-templates"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "templateId"
    type = "S"
  }

  key_schema {
    attribute_name = "templateId"
    key_type       = "HASH"
  }

  tags = {
    Name        = "qrme-templates"
    Environment = var.environment
  }
}
