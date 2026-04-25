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
  hash_key     = "userId"


  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "slug"
    type = "S"
  }

  global_secondary_index {
    name            = "slug-index"
    hash_key        = "slug"
    projection_type = "ALL"
  }

  tags = {
    Name        = "qrme-users"
    Environment = var.environment
  }
}


# -------------------------------------------------------------------
# Tabla: qrme-profiles
# PK: userId (referencia a qrme-users)
# Un registro por usuario con info base del perfil
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "profiles" {
  name         = "qrme-profiles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"


  attribute {
    name = "userId"
    type = "S"
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
  hash_key     = "qrId"


  attribute {
    name = "qrId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "qrme-qrcodes"
    Environment = var.environment
  }
}


# -------------------------------------------------------------------
# Tabla: qrme-templates
# PK: templateId (ej. social-v1)
# Catálogo de plantillas disponibles
# -------------------------------------------------------------------
resource "aws_dynamodb_table" "templates" {
  name         = "qrme-templates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "templateId"


  attribute {
    name = "templateId"
    type = "S"
  }

  tags = {
    Name        = "qrme-templates"
    Environment = var.environment
  }
}
