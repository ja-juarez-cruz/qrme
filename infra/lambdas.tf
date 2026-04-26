# ═══════════════════════════════════════════════════════════════
# QR.me — Lambda Functions + IAM
# ═══════════════════════════════════════════════════════════════

# -------------------------------------------------------------------
# Rol IAM para todas las Lambdas
# -------------------------------------------------------------------
resource "aws_iam_role" "lambda_exec_role" {
  name = "qrme-lambda-exec-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# -------------------------------------------------------------------
# Política DynamoDB: acceso a las 4 tablas + GSIs
# -------------------------------------------------------------------
resource "aws_iam_policy" "dynamodb_rw_policy" {
  name        = "qrme-dynamodb-rw-${var.environment}"
  description = "Acceso lectura/escritura a tablas DynamoDB de QR.me"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          aws_dynamodb_table.profiles.arn,
          "${aws_dynamodb_table.profiles.arn}/index/*",
          aws_dynamodb_table.qrcodes.arn,
          "${aws_dynamodb_table.qrcodes.arn}/index/*",
          aws_dynamodb_table.templates.arn,
          "${aws_dynamodb_table.templates.arn}/index/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.dynamodb_rw_policy.arn
}

# -------------------------------------------------------------------
# Política S3: pre-signed URLs para fotos
# -------------------------------------------------------------------
resource "aws_iam_role_policy" "lambda_s3_photos" {
  name = "qrme-lambda-s3-photos-${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.photos.arn}/avatars/*"
      }
    ]
  })
}

# -------------------------------------------------------------------
# Política S3: escribir HTMLs generados
# -------------------------------------------------------------------
resource "aws_iam_role_policy" "lambda_s3_web" {
  name = "qrme-lambda-s3-web-${var.environment}"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.web.arn}/*"
      }
    ]
  })
}


# ═══════════════════════════════════════════════════════════════
# ZIPS DE LAS LAMBDAS
# Los zips se generan en infra/build/
# ═══════════════════════════════════════════════════════════════

data "archive_file" "authorizer" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/authorizer"
  output_path = "${path.module}/build/authorizer.zip"
}

data "archive_file" "get_my_profile" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/get_my_profile"
  output_path = "${path.module}/build/get_my_profile.zip"
}

data "archive_file" "upsert_profile" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/upsert_profile"
  output_path = "${path.module}/build/upsert_profile.zip"
}

data "archive_file" "list_templates" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/list_templates"
  output_path = "${path.module}/build/list_templates.zip"
}

data "archive_file" "list_qrcodes" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/list_qrcodes"
  output_path = "${path.module}/build/list_qrcodes.zip"
}

data "archive_file" "create_qrcode" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/create_qrcode"
  output_path = "${path.module}/build/create_qrcode.zip"
}

data "archive_file" "update_qrcode" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/update_qrcode"
  output_path = "${path.module}/build/update_qrcode.zip"
}

data "archive_file" "delete_qrcode" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/delete_qrcode"
  output_path = "${path.module}/build/delete_qrcode.zip"
}

data "archive_file" "get_public_qr" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/get_public_qr"
  output_path = "${path.module}/build/get_public_qr.zip"
}

data "archive_file" "get_photo_upload_url" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/get_photo_upload_url"
  output_path = "${path.module}/build/get_photo_upload_url.zip"
}

data "archive_file" "track_scan" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/track_scan"
  output_path = "${path.module}/build/track_scan.zip"
}



# ═══════════════════════════════════════════════════════════════
# SHARED LAYER
# ═══════════════════════════════════════════════════════════════

data "archive_file" "shared_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/layer"
  output_path = "${path.module}/build/shared_layer.zip"
}

resource "aws_lambda_layer_version" "shared" {
  filename            = data.archive_file.shared_layer.output_path
  layer_name          = "qrme-shared-layer-${var.environment}"
  source_code_hash    = data.archive_file.shared_layer.output_base64sha256
  compatible_runtimes = ["python3.12"]
}

# ═══════════════════════════════════════════════════════════════
# LAMBDA FUNCTIONS
# ═══════════════════════════════════════════════════════════════

# -------------------------------------------------------------------
# Lambda: AUTHORIZER (Cognito JWT)
# -------------------------------------------------------------------
resource "aws_lambda_function" "authorizer" {
  filename         = data.archive_file.authorizer.output_path
  function_name    = "qrme-authorizer-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.authorizer.output_base64sha256
  runtime          = "python3.12"
  timeout          = 10
  memory_size      = 128
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      COGNITO_REGION       = var.aws_region
    }
  }

  tags = { Name = "qrme-authorizer", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: GET MY PROFILE
# -------------------------------------------------------------------
resource "aws_lambda_function" "get_my_profile" {
  filename         = data.archive_file.get_my_profile.output_path
  function_name    = "qrme-get-my-profile-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.get_my_profile.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      PROFILES_TABLE = aws_dynamodb_table.profiles.name
      USERS_TABLE    = aws_dynamodb_table.users.name
    }
  }

  tags = { Name = "qrme-get-my-profile", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: UPSERT PROFILE
# -------------------------------------------------------------------
resource "aws_lambda_function" "upsert_profile" {
  filename         = data.archive_file.upsert_profile.output_path
  function_name    = "qrme-upsert-profile-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.upsert_profile.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      PROFILES_TABLE = aws_dynamodb_table.profiles.name
      USERS_TABLE    = aws_dynamodb_table.users.name
    }
  }

  tags = { Name = "qrme-upsert-profile", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: LIST TEMPLATES (público, sin auth)
# -------------------------------------------------------------------
resource "aws_lambda_function" "list_templates" {
  filename         = data.archive_file.list_templates.output_path
  function_name    = "qrme-list-templates-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.list_templates.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      TEMPLATES_TABLE = aws_dynamodb_table.templates.name
    }
  }

  tags = { Name = "qrme-list-templates", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: LIST QRCODES
# -------------------------------------------------------------------
resource "aws_lambda_function" "list_qrcodes" {
  filename         = data.archive_file.list_qrcodes.output_path
  function_name    = "qrme-list-qrcodes-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.list_qrcodes.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE = aws_dynamodb_table.qrcodes.name
    }
  }

  tags = { Name = "qrme-list-qrcodes", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: CREATE QRCODE
# -------------------------------------------------------------------
resource "aws_lambda_function" "create_qrcode" {
  filename         = data.archive_file.create_qrcode.output_path
  function_name    = "qrme-create-qrcode-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.create_qrcode.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE   = aws_dynamodb_table.qrcodes.name
      TEMPLATES_TABLE = aws_dynamodb_table.templates.name
      USERS_TABLE     = aws_dynamodb_table.users.name
      BASE_URL        = "https://${aws_cloudfront_distribution.web.domain_name}"
      WEB_BUCKET      = aws_s3_bucket.web.id
    }
  }

  tags = { Name = "qrme-create-qrcode", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: UPDATE QRCODE
# -------------------------------------------------------------------
resource "aws_lambda_function" "update_qrcode" {
  filename         = data.archive_file.update_qrcode.output_path
  function_name    = "qrme-update-qrcode-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.update_qrcode.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE   = aws_dynamodb_table.qrcodes.name
      TEMPLATES_TABLE = aws_dynamodb_table.templates.name
    }
  }

  tags = { Name = "qrme-update-qrcode", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: DELETE QRCODE
# -------------------------------------------------------------------
resource "aws_lambda_function" "delete_qrcode" {
  filename         = data.archive_file.delete_qrcode.output_path
  function_name    = "qrme-delete-qrcode-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.delete_qrcode.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE = aws_dynamodb_table.qrcodes.name
    }
  }

  tags = { Name = "qrme-delete-qrcode", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: GET PUBLIC QR (sin auth, usado por ISR)
# -------------------------------------------------------------------
resource "aws_lambda_function" "get_public_qr" {
  filename         = data.archive_file.get_public_qr.output_path
  function_name    = "qrme-get-public-qr-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.get_public_qr.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE  = aws_dynamodb_table.qrcodes.name
      PROFILES_TABLE = aws_dynamodb_table.profiles.name
      USERS_TABLE    = aws_dynamodb_table.users.name
    }
  }

  tags = { Name = "qrme-get-public-qr", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: GET PHOTO UPLOAD URL (pre-signed S3)
# -------------------------------------------------------------------
resource "aws_lambda_function" "get_photo_upload_url" {
  filename         = data.archive_file.get_photo_upload_url.output_path
  function_name    = "qrme-get-photo-upload-url-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.get_photo_upload_url.output_base64sha256
  runtime          = "python3.12"
  timeout          = 15
  memory_size      = 256
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      PHOTOS_BUCKET = aws_s3_bucket.photos.id
      PHOTOS_REGION = var.aws_region
    }
  }

  tags = { Name = "qrme-get-photo-upload-url", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}

# -------------------------------------------------------------------
# Lambda: TRACK SCAN (DynamoDB atomic ADD)
# -------------------------------------------------------------------
resource "aws_lambda_function" "track_scan" {
  filename         = data.archive_file.track_scan.output_path
  function_name    = "qrme-track-scan-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.handler"
  source_code_hash = data.archive_file.track_scan.output_base64sha256
  runtime          = "python3.12"
  timeout          = 10
  memory_size      = 128
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      QRCODES_TABLE = aws_dynamodb_table.qrcodes.name
    }
  }

  tags = { Name = "qrme-track-scan", Environment = var.environment }
  lifecycle { create_before_destroy = true }
}
