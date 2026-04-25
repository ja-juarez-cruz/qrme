.PHONY: help sso-dev sso-prod whoami init-dev init-prod plan-dev plan-prod deploy-dev deploy-prod seed-dev seed-prod test-backend

INFRA_DIR       = infra
PROFILE_DEV     = jajc-dev
PROFILE_PROD    = jajc-prod
FRONTEND_DIR    = qrme-frontend
BACKEND_DIR     = lambdas

help:
	@echo ''
	@echo 'QR.me — Infraestructura Multi-Cuenta'
	@echo '======================================'
	@echo '  make sso-dev          Renovar sesión SSO para jajc_dev'
	@echo '  make sso-prod         Renovar sesión SSO para jajc prod'
	@echo '  make whoami           Ver identidad activa en ambas cuentas'
	@echo '  make plan-dev         Ver cambios pendientes en dev'
	@echo '  make plan-prod        Ver cambios pendientes en prod'
	@echo '  make deploy-dev       Terraform apply en dev'
	@echo '  make deploy-prod      Terraform apply en prod (pide confirmación)'
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
