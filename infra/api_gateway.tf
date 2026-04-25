# ═══════════════════════════════════════════════════════════════
# QR.me — API Gateway HTTP API
# ═══════════════════════════════════════════════════════════════

resource "aws_apigatewayv2_api" "main" {
  name          = "qrme-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    expose_headers = ["Content-Type"]
    max_age        = 300
  }

  tags = {
    Name = "qrme-api"
  }
}

# Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = { Name = "qrme-api-stage" }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/qrme-api-${var.environment}"
  retention_in_days = 7

  tags = { Name = "qrme-api-logs" }
}

# ========================================
# AUTHORIZER (Cognito JWT via Lambda)
# ========================================
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.authorizer.invoke_arn
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt-authorizer"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# ========================================
# INTEGRATIONS + ROUTES + PERMISSIONS
# ========================================

# -------------------------------------------------------------------
# GET /me/profile
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "get_my_profile" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_my_profile.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_my_profile" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /me/profile"
  target             = "integrations/${aws_apigatewayv2_integration.get_my_profile.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_get_my_profile" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_my_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# PUT /me/profile
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "upsert_profile" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.upsert_profile.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upsert_profile" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /me/profile"
  target             = "integrations/${aws_apigatewayv2_integration.upsert_profile.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_upsert_profile" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upsert_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# GET /public/templates (sin auth)
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "list_templates" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.list_templates.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "list_templates" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /public/templates"
  target    = "integrations/${aws_apigatewayv2_integration.list_templates.id}"
}

resource "aws_lambda_permission" "apigw_list_templates" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_templates.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# GET /me/qrcodes
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "list_qrcodes" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.list_qrcodes.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "list_qrcodes" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /me/qrcodes"
  target             = "integrations/${aws_apigatewayv2_integration.list_qrcodes.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_list_qrcodes" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_qrcodes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# POST /me/qrcodes
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "create_qrcode" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.create_qrcode.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_qrcode" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /me/qrcodes"
  target             = "integrations/${aws_apigatewayv2_integration.create_qrcode.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_create_qrcode" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_qrcode.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# PUT /me/qrcodes/{qrId}
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "update_qrcode" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_qrcode.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "update_qrcode" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /me/qrcodes/{qrId}"
  target             = "integrations/${aws_apigatewayv2_integration.update_qrcode.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_update_qrcode" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_qrcode.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# DELETE /me/qrcodes/{qrId}
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "delete_qrcode" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_qrcode.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "delete_qrcode" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /me/qrcodes/{qrId}"
  target             = "integrations/${aws_apigatewayv2_integration.delete_qrcode.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_delete_qrcode" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_qrcode.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# GET /public/qr/{slug}/{qrId} (sin auth, usado por ISR)
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "get_public_qr" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_public_qr.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_public_qr" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /public/qr/{slug}/{qrId}"
  target    = "integrations/${aws_apigatewayv2_integration.get_public_qr.id}"
}

resource "aws_lambda_permission" "apigw_get_public_qr" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_public_qr.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# POST /me/profile/photo-url
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "get_photo_upload_url" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_photo_upload_url.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_photo_upload_url" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /me/profile/photo-url"
  target             = "integrations/${aws_apigatewayv2_integration.get_photo_upload_url.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw_get_photo_upload_url" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_photo_upload_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


# -------------------------------------------------------------------
# POST /track/scan/{qrId} (sin auth)
# -------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "track_scan" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.track_scan.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "track_scan" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /track/scan/{qrId}"
  target    = "integrations/${aws_apigatewayv2_integration.track_scan.id}"
}

resource "aws_lambda_permission" "apigw_track_scan" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.track_scan.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
