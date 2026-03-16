# NovaLens - Quality Gate Makefile
# Usage: make q.check (run all quality checks)

.PHONY: q.check q.lint q.typecheck q.test q.build q.format q.e2e

# Run all quality checks
q.check: q.lint q.typecheck q.test q.build
	@echo "All quality gates passed."

# Lint
q.lint:
	@echo "=== Lint ==="
	cd frontend && npm run lint
	cd backend && npm run lint

# Type check
q.typecheck:
	@echo "=== TypeCheck ==="
	cd frontend && npm run typecheck
	cd backend && npm run typecheck

# Unit tests
q.test:
	@echo "=== Unit Tests ==="
	cd frontend && npm run test
	cd backend && npm run test

# Build
q.build:
	@echo "=== Build ==="
	cd frontend && npm run build
	cd backend && npm run build

# Format check
q.format:
	@echo "=== Format Check ==="
	cd frontend && npm run format:check

# E2E tests (requires running dev server)
q.e2e:
	@echo "=== E2E Tests ==="
	cd frontend && npm run test:e2e

# Coverage
q.coverage:
	@echo "=== Coverage ==="
	cd frontend && npm run test:coverage

# CDK synth (validate infrastructure)
q.infra:
	@echo "=== CDK Synth ==="
	cd infra && npx cdk synth

# Full quality gate (including E2E)
q.full: q.check q.e2e q.infra
	@echo "Full quality gate passed."
