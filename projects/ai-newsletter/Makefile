# AI Newsletter - Development Commands
# Usage: make <target>

.PHONY: help install test coverage lint format health setup clean audit

# Default target
help:
	@echo "AI Newsletter - Available Commands"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make test       - Run unit tests"
	@echo "  make coverage   - Run tests with coverage report"
	@echo "  make lint       - Run linter (ruff)"
	@echo "  make format     - Format code (ruff)"
	@echo "  make health     - Check all service connections"
	@echo "  make audit      - Security scan dependencies"
	@echo "  make setup      - Full setup (install + pre-commit)"
	@echo "  make clean      - Remove generated files"
	@echo ""

# Install dependencies
install:
	pip install -r requirements.txt

# Run unit tests (skip integration tests)
test:
	pytest -m "not integration" -v

# Run tests with coverage
coverage:
	pytest -m "not integration" --cov=execution --cov-report=term-missing --cov-report=html
	@echo ""
	@echo "HTML report: htmlcov/index.html"

# Run integration tests (requires credentials)
test-integration:
	pytest -m "integration" -v

# Run all tests
test-all:
	pytest -v

# Lint code
lint:
	ruff check execution/ tests/

# Format code
format:
	ruff format execution/ tests/
	ruff check --fix execution/ tests/

# Check all service connections
health:
	python execution/verify_all.py --verbose

# Security audit dependencies
audit:
	pip-audit -r requirements.txt --desc on

# Full setup
setup: install
	pip install pre-commit ruff
	pre-commit install
	@echo ""
	@echo "Setup complete! Run 'make health' to verify services."

# Adapt workflows (transform to use Gemini/Jina)
adapt:
	cd execution && python workflow_adapter.py

# Import workflows to n8n
import:
	cd execution && python import_workflows.py

# Verify RSS feeds
verify-rss:
	cd execution && python verify_rss.py

# Verify data ingestion
verify-data:
	cd execution && python verify_data.py

# Clean generated files
clean:
	rm -rf .coverage coverage.xml htmlcov/ .pytest_cache/ .ruff_cache/
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
