# ═══════════════════════════════════════════════════════════════
# QR.me — S3 (web) + CloudFront
# ═══════════════════════════════════════════════════════════════

# ── S3 bucket (privado, solo CloudFront puede leerlo) ─────────

resource "aws_s3_bucket" "web" {
  bucket = var.web_bucket_name

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket = aws_s3_bucket.web.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Origin Access Control ─────────────────────────────────────
# Permite que CloudFront firme sus requests a S3.
# Más seguro que OAI (legacy) porque usa SigV4.

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "qrme-web-oac-${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ───────────────────────────────────

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"

  # PriceClass_100 = US, Canadá, Europa (más barato).
  # Cambia a PriceClass_All para cobertura global.
  price_class = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-web-${var.environment}"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-web-${var.environment}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cuando S3 devuelve 403/404 (ruta dinámica sin archivo estático),
  # CloudFront sirve el shell de la SPA y React maneja el routing.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/u/_/_/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/u/_/_/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado HTTPS incluido gratis con el dominio *.cloudfront.net
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = var.environment
  }
}

# ── Bucket policy: solo CloudFront puede leer los objetos ─────

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.web.arn
        }
      }
    }]
  })
}
