#!/bin/sh
set -e

echo "Starting ACME Salary Management Backend..."
echo "Database Connection: $DATABASE_URL"

# Seed default users, exchange rates, bands, and 10,000 employees if empty
python scripts/seed_data.py

echo "Starting FastAPI server on 0.0.0.0:8000..."
if [ "$BACKEND_RELOAD" = "true" ]; then
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
