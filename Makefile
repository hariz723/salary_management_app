.PHONY: help up up-d down down-v logs logs-backend logs-frontend logs-db restart ps test test-docker lint lint-backend lint-frontend lint-docker format clean

.DEFAULT_GOAL := help

help:
	@echo "Available targets: up, up-d, down, down-v, logs, logs-backend, logs-frontend, logs-db, restart, ps, test, test-docker, lint, lint-backend, lint-frontend, lint-docker, format, clean"

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
	ruff check backend/

lint-frontend:
	cd frontend && npm run lint

lint-docker:
	docker compose exec backend ruff check .
	docker compose exec frontend npm run lint

format:
	ruff format backend/
	ruff check --fix backend/
	cd frontend && npm run lint:fix

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "test_salary_app.db" -delete
	@echo "Cleaned temporary files."
