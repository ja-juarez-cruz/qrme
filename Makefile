.PHONY: help sso-dev sso-prod whoami bootstrap-dev bootstrap-prod init-dev init-prod plan-dev plan-prod deploy-dev deploy-prod seed-dev seed-prod test-backend

INFRA_DIR       = infra
PROFILE_DEV     = jajc-dev
PROFILE_PROD    = jajc-prod
FRONTEND_DIR    = qrme-frontend
BACKEND_DIR     = lambdas
WEB_BUCKET_DEV  = qrme-web-dev-jajc
WEB_BUCKET_PROD = qrme-web-prod-jajc
API_URL_DEV     = https://pxo1j6kgi7.execute-api.us-east-1.amazonaws.com/dev

help:
	@echo ''
	@echo 'QR.me — Infraestructura Multi-Cuenta'
	@echo '======================================'
	@echo '  make sso-dev          Renovar sesión SSO para jajc_dev'
	@echo '  make sso-prod         Renovar sesión SSO para jajc prod'
	@echo '  make whoami           Ver identidad activa en ambas cuentas'
	@echo '  make bootstrap-dev    Crear bucket S3 + tabla DynamoDB para estado dev (1 vez)'
	@echo '  make bootstrap-prod   Crear bucket S3 para estado prod (1 vez)'
	@echo '  make plan-dev         Ver cambios pendientes en dev'
	@echo '  make plan-prod        Ver cambios pendientes en prod'
	@echo '  make deploy-dev       Terraform apply en dev'
	@echo '  make deploy-prod      Terraform apply en prod (pide confirmación)'
	@echo '  make sync-web-dev     Build + sync frontend -> s3://$(WEB_BUCKET_DEV)'
	@echo '  make sync-web-prod    Build + sync frontend -> s3://$(WEB_BUCKET_PROD)'
	@echo '  make seed-dev         Insertar plantilla social-v1 en DynamoDB dev'
	@echo '  make seed-prod        Insertar plantilla social-v1 en DynamoDB prod'
	@echo '  make test-backend     Correr tests del backend con pytest + moto'
	@echo ''

# ── AWS SSO ──────────────────────────────────────────────────────────────────

sso-dev:
	@echo 'Iniciando sesión SSO -> jajc_dev'
	aws sso login --profile $(PROFILE_DEV)

sso-prod:
	@echo 'Iniciando sesión SSO -> jajc prod'
	aws sso login --profile $(PROFILE_PROD)

whoami:
	@echo '-- Dev (jajc_dev) --'
	@AWS_PROFILE=$(PROFILE_DEV) aws sts get-caller-identity 2>/dev/null || echo 'Sesión expirada: make sso-dev'
	@echo '-- Prod (jajc) --'
	@AWS_PROFILE=$(PROFILE_PROD) aws sts get-caller-identity 2>/dev/null || echo 'Sesión expirada: make sso-prod'

# ── Bootstrap (ejecutar 1 sola vez por ambiente) ─────────────────────────────

bootstrap-dev:
	@echo 'Creando backend S3 + DynamoDB para dev...'
	@AWS_PROFILE=$(PROFILE_DEV) aws s3api head-bucket --bucket qrme-tfstate-dev 2>/dev/null && \
		echo 'Bucket qrme-tfstate-dev ya existe, omitiendo.' || \
		( \
			AWS_PROFILE=$(PROFILE_DEV) aws s3api create-bucket --bucket qrme-tfstate-dev --region us-east-1 && \
			AWS_PROFILE=$(PROFILE_DEV) aws s3api put-bucket-versioning --bucket qrme-tfstate-dev \
				--versioning-configuration Status=Enabled && \
			AWS_PROFILE=$(PROFILE_DEV) aws s3api put-bucket-encryption --bucket qrme-tfstate-dev \
				--server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' && \
			AWS_PROFILE=$(PROFILE_DEV) aws s3api put-public-access-block --bucket qrme-tfstate-dev \
				--public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" && \
			echo 'Bucket qrme-tfstate-dev creado.' \
		)
	@AWS_PROFILE=$(PROFILE_DEV) aws dynamodb describe-table --table-name qrme-tfstate-locks-dev --region us-east-1 2>/dev/null && \
		echo 'Tabla qrme-tfstate-locks-dev ya existe, omitiendo.' || \
		( \
			AWS_PROFILE=$(PROFILE_DEV) aws dynamodb create-table \
				--table-name qrme-tfstate-locks-dev \
				--attribute-definitions AttributeName=LockID,AttributeType=S \
				--key-schema AttributeName=LockID,KeyType=HASH \
				--billing-mode PAY_PER_REQUEST \
				--region us-east-1 && \
			echo 'Tabla qrme-tfstate-locks-dev creada.' \
		)
	@echo 'Bootstrap dev completado.'

bootstrap-prod:
	@echo 'Creando backend S3 + DynamoDB para prod...'
	@AWS_PROFILE=$(PROFILE_PROD) aws s3api head-bucket --bucket qrme-tfstate-prod 2>/dev/null && \
		echo 'Bucket qrme-tfstate-prod ya existe, omitiendo.' || \
		( \
			AWS_PROFILE=$(PROFILE_PROD) aws s3api create-bucket --bucket qrme-tfstate-prod --region us-east-1 && \
			AWS_PROFILE=$(PROFILE_PROD) aws s3api put-bucket-versioning --bucket qrme-tfstate-prod \
				--versioning-configuration Status=Enabled && \
			AWS_PROFILE=$(PROFILE_PROD) aws s3api put-bucket-encryption --bucket qrme-tfstate-prod \
				--server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' && \
			AWS_PROFILE=$(PROFILE_PROD) aws s3api put-public-access-block --bucket qrme-tfstate-prod \
				--public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" && \
			echo 'Bucket qrme-tfstate-prod creado.' \
		)
	@AWS_PROFILE=$(PROFILE_PROD) aws dynamodb describe-table --table-name qrme-tfstate-locks-prod --region us-east-1 2>/dev/null && \
		echo 'Tabla qrme-tfstate-locks-prod ya existe, omitiendo.' || \
		( \
			AWS_PROFILE=$(PROFILE_PROD) aws dynamodb create-table \
				--table-name qrme-tfstate-locks-prod \
				--attribute-definitions AttributeName=LockID,AttributeType=S \
				--key-schema AttributeName=LockID,KeyType=HASH \
				--billing-mode PAY_PER_REQUEST \
				--region us-east-1 && \
			echo 'Tabla qrme-tfstate-locks-prod creada.' \
		)
	@echo 'Bootstrap prod completado.'

# ── Terraform ────────────────────────────────────────────────────────────────

init-dev:
	@echo 'Init Terraform -> jajc_dev'
	AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) init -backend-config=backends/dev.hcl -reconfigure

init-prod:
	@echo 'Init Terraform -> jajc prod'
	AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) init -backend-config=backends/prod.hcl -reconfigure

plan-dev: init-dev
	AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) plan -var-file=envs/dev.tfvars

plan-prod: init-prod
	@echo '--- PRODUCCIÓN ---'
	AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) plan -var-file=envs/prod.tfvars

deploy-dev: init-dev
	AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) apply -var-file=envs/dev.tfvars -auto-approve

deploy-prod: init-prod
	@echo ''
	@echo 'PRODUCCIÓN — usuarios reales'
	@echo ''
	@read -p 'Escribe "prod" para confirmar: ' confirm; \
	if [ "$$confirm" != "prod" ]; then echo 'Cancelado.'; exit 1; fi
	AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) apply -var-file=envs/prod.tfvars

# ── Frontend ─────────────────────────────────────────────────────────────────

sync-web-dev:
	@echo 'Build + sync frontend -> dev'
	$(eval CF_ID_DEV := $(shell AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) output -raw cloudfront_distribution_id))
	$(eval CF_DOMAIN_DEV := $(shell AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) output -raw cloudfront_domain))
	cd $(FRONTEND_DIR) && \
		NEXT_PUBLIC_API_URL=$(API_URL_DEV) \
		NEXT_PUBLIC_COGNITO_USER_POOL_ID=$$(AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) output -raw cognito_user_pool_id) \
		NEXT_PUBLIC_COGNITO_CLIENT_ID=$$(AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) output -raw cognito_client_id) \
		NEXT_PUBLIC_COGNITO_DOMAIN=$$(AWS_PROFILE=$(PROFILE_DEV) terraform -chdir=$(INFRA_DIR) output -raw cognito_domain) \
		npm run build
	AWS_PROFILE=$(PROFILE_DEV) aws s3 sync $(FRONTEND_DIR)/out/ s3://$(WEB_BUCKET_DEV) --delete
	AWS_PROFILE=$(PROFILE_DEV) aws cloudfront create-invalidation \
		--distribution-id $(CF_ID_DEV) --paths "/*" --output text
	@printf '\n'
	@printf '======================================\n'
	@printf '  Deploy Dev completado\n'
	@printf '======================================\n'
	@printf '\n'
	@printf '  Frontend:    $(CF_DOMAIN_DEV)\n'
	@printf '  API Gateway: $(API_URL_DEV)\n'
	@printf '  S3 bucket:   $(WEB_BUCKET_DEV)\n'
	@printf '  CF dist ID:  $(CF_ID_DEV)\n'
	@printf '\n'

sync-web-prod:
	@echo 'Build + sync frontend -> prod'
	$(eval CF_ID_PROD := $(shell AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw cloudfront_distribution_id))
	$(eval CF_DOMAIN_PROD := $(shell AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw cloudfront_domain))
	$(eval API_URL_PROD := $(shell AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw api_gateway_url))
	cd $(FRONTEND_DIR) && \
		NEXT_PUBLIC_API_URL=$(API_URL_PROD) \
		NEXT_PUBLIC_COGNITO_USER_POOL_ID=$$(AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw cognito_user_pool_id) \
		NEXT_PUBLIC_COGNITO_CLIENT_ID=$$(AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw cognito_client_id) \
		NEXT_PUBLIC_COGNITO_DOMAIN=$$(AWS_PROFILE=$(PROFILE_PROD) terraform -chdir=$(INFRA_DIR) output -raw cognito_domain) \
		npm run build
	AWS_PROFILE=$(PROFILE_PROD) aws s3 sync $(FRONTEND_DIR)/out/ s3://$(WEB_BUCKET_PROD) --delete
	AWS_PROFILE=$(PROFILE_PROD) aws cloudfront create-invalidation \
		--distribution-id $(CF_ID_PROD) --paths "/*" --output text
	@printf '\n'
	@printf '======================================\n'
	@printf '  Deploy Prod completado\n'
	@printf '======================================\n'
	@printf '\n'
	@printf '  Frontend:    $(CF_DOMAIN_PROD)\n'
	@printf '  API Gateway: $(API_URL_PROD)\n'
	@printf '  S3 bucket:   $(WEB_BUCKET_PROD)\n'
	@printf '  CF dist ID:  $(CF_ID_PROD)\n'
	@printf '\n'

# ── Seed ─────────────────────────────────────────────────────────────────────

seed-dev:
	@echo 'Seed plantilla social-v1 -> dev'
	AWS_PROFILE=$(PROFILE_DEV) python3 scripts/seed_templates.py

seed-prod:
	@echo 'Seed plantilla social-v1 -> prod'
	AWS_PROFILE=$(PROFILE_PROD) python3 scripts/seed_templates.py

# ── Backend tests ────────────────────────────────────────────────────────────

test-backend:
	@echo 'Running backend tests...'
	cd $(BACKEND_DIR) && python3 -m pytest tests/ -v --cov=. --cov-report=term-missing
