environment        = "prod"
photos_bucket_name = "qrme-photos-prod"
web_bucket_name    = "qrme-web-prod"

cognito_callback_urls = ["https://qrme-web-prod.s3.amazonaws.com/auth/callback"]
cognito_logout_urls   = ["https://qrme-web-prod.s3.amazonaws.com"]
