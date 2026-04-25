environment        = "prod"
photos_bucket_name = "qrme-photos-prod-jajc"
web_bucket_name    = "qrme-web-prod-jajc"

# URLs para producción (reemplazar con el dominio real después)
frontend_url          = "https://qrme-web-prod.s3.amazonaws.com"
cognito_callback_urls = ["https://qrme-web-prod.s3.amazonaws.com/auth/callback"]
cognito_logout_urls   = ["https://qrme-web-prod.s3.amazonaws.com"]
