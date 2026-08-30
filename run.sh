#!/usr/bin/env bash
set -e

if [ ! -f "backend/salary_app.db" ]; then
    echo "[1/3] Database not found. Seeding 10,000 employees..."
    python3 backend/scripts/seed_data.py
else
    echo "[1/3] Existing database found."
fi

echo "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[3/3] Starting React / Vite Frontend on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Application is live!"
echo "👉 Frontend: http://localhost:5173"
echo "👉 Backend Swagger Docs: http://127.0.0.1:8000/docs"
echo "👉 Demo Credentials: hr.manager@acme.com / Password123"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
