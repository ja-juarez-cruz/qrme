# --------------------------------------------
# Proveedor de AWS
# Se usa el profile inyectado via AWS_PROFILE en el Makefile
# --------------------------------------------
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
  backend "s3" {}
  # Inyectado via: terraform init -backend-config=backends/dev.hcl
  #             o: terraform init -backend-config=backends/prod.hcl
}
