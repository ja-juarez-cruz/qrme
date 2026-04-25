# ─── General ─────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "Región AWS"
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente de deployment: dev o prod"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Debe ser 'dev' o 'prod'."
  }
}

variable "project_name" {
  description = "Nombre del proyecto (usado como prefijo en recursos)"
  type        = string
  default     = "qrme"
}

variable "frontend_url" {
  description = "URL del frontend (para CORS)"
  type        = string
  default     = "http://localhost:3000"
}

variable "tags" {
  description = "Tags comunes a aplicar a todos los recursos"
  type        = map(string)
  default = {
    Project   = "QRme"
    ManagedBy = "Terraform"
  }
}

# ─── Cognito ─────────────────────────────────────────────────────────────────

variable "cognito_callback_urls" {
  description = "URLs de callback para Cognito OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]
}

variable "cognito_logout_urls" {
  description = "URLs de logout para Cognito"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# ─── S3 ──────────────────────────────────────────────────────────────────────

variable "photos_bucket_name" {
  description = "Nombre del bucket S3 para fotos de perfil"
  type        = string
}
