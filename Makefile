.PHONY: help up up-d down down-v logs logs-backend logs-frontend logs-db restart ps test test-docker lint lint-backend lint-frontend lint-docker format clean

.DEFAULT_GOAL := help

help:
	@echo "=============================================================================="
	@echo "  ACME Salary Management System - Makefile Instructions & Command Guide      "
	@echo "=============================================================================="
	@echo "Usage: make [target]"
	@echo ""
	@echo "Docker Compose Commands:"
	@echo "  up              Build and start all services (Postgres + Backend + Frontend)"
	@echo "  up-d            Build and start all services in detached (background) mode"
	@echo "  down            Stop all running containers"
	@echo "  down-v          Stop all containers and delete database volume (fresh start)"
	@echo "  logs            Tail logs for all containers"
	@echo "  logs-backend    Tail logs for FastAPI backend container"
	@echo "  logs-frontend   Tail logs for React frontend container"
	@echo "  logs-db         Tail logs for PostgreSQL database container"
	@echo "  restart         Restart all running containers"
	@echo "  ps              Display running container status and port mappings"
	@echo ""
	@echo "Testing & Quality Assurance:"
	@echo "  test            Run Pytest test suite inside the backend Docker container"
	@echo "  lint            Run all linters (Backend Ruff + Frontend ESLint)"
	@echo "  lint-backend    Lint backend Python codebase with Ruff"
	@echo "  lint-frontend   Lint frontend TypeScript/React codebase with ESLint"
	@echo "  lint-docker     Run linters inside the running Docker containers"
	@echo "  format          Automatically fix lint violations and format codebase"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean           Remove temporary cache, pyc, and test database files"
	@echo "=============================================================================="

up:
	docker compose up --build

up-d:
	docker compose up -d --build

down:
	docker compose down

down-v:
	docker compose down -v

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

restart:
	docker compose restart

ps:
	docker compose ps

test:
	docker compose exec backend pytest backend/

lint: lint-backend lint-frontend

lint-backend:
	python3 -m ruff check backend/ || ruff check backend/

lint-frontend:
	cd frontend && npm run lint

lint-docker:
	docker compose exec backend ruff check .
	docker compose exec frontend npm run lint

format:
	python3 -m ruff format backend/ || ruff format backend/
	python3 -m ruff check --fix backend/ || ruff check --fix backend/
	cd frontend && npm run lint:fix

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "test_salary_app.db" -delete
	@echo "Cleaned temporary files."
