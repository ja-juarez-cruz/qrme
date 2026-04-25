bucket         = "qrme-tfstate-prod"
key            = "qrme/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "qrme-tfstate-locks-prod"
encrypt        = true
