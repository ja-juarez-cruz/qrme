# ═══════════════════════════════════════════════════════════════
# QR.me — S3 Bucket para fotos de perfil
# ═══════════════════════════════════════════════════════════════

resource "aws_s3_bucket" "photos" {
  bucket = var.photos_bucket_name

  tags = {
    Name        = "qrme-photos"
    Environment = var.environment
  }
}

# Desactivar block public access para /avatars/*
resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Política para lectura pública en /avatars/*
resource "aws_s3_bucket_policy" "photos_public_read" {
  bucket = aws_s3_bucket.photos.id

  depends_on = [aws_s3_bucket_public_access_block.photos]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadAvatars"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.photos.arn}/avatars/*"
      }
    ]
  })
}

# CORS para upload directo desde el browser
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = [
      "https://${aws_cloudfront_distribution.web.domain_name}",
      "http://localhost:3000"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}
