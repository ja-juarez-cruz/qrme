output "api_gateway_url" {
  description = "URL base del API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "cognito_user_pool_id" {
  description = "ID del Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "ID del Cognito App Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_domain" {
  description = "Dominio del Cognito Hosted UI"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "photos_bucket_name" {
  description = "Nombre del bucket S3 para fotos"
  value       = aws_s3_bucket.photos.id
}

output "photos_bucket_url" {
  description = "URL base del bucket de fotos"
  value       = "https://${aws_s3_bucket.photos.bucket}.s3.${var.aws_region}.amazonaws.com"
}
