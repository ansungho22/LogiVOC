#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
# (We handle test failures manually to ensure cleanup)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting Backend Server..."
cd "$ROOT_DIR/backend"

# Load test environment variables
set -a
source .env.test
# Ensure the frontend dev server port is allowed in CORS
export CORS_ORIGINS="http://localhost:5174,http://127.0.0.1:5174"
set +a

# Clean up previous test database if exists
rm -f test.db

# Force the environment by replacing .env
if [ -f .env ]; then
  mv .env .env.backup
fi
cp .env.test .env

# Initialize Test DB
uv run python -c "
from app.database import Base, engine
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print('Test DB initialized')
"

# Terminate any process occupying port 8088
echo "Cleaning up port 8088..."
lsof -ti:8088 | xargs kill -9 2>/dev/null || true

# Run backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8088 --log-level debug > backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for Backend Server to start..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8088/health > /dev/null; then
    echo "Backend Server is up."
    break
  fi
  sleep 1
done

echo "Starting Frontend Server..."
cd "$ROOT_DIR/frontend"
echo "Cleaning up port 5174..."
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
VITE_API_URL="http://127.0.0.1:8088" npm run dev -- --port 5174 --strictPort &
VITE_PID=$!

echo "Waiting for Frontend Server to start..."
sleep 5

echo "Running E2E Tests..."
set +e
npx playwright test --workers=1
TEST_EXIT_CODE=$?
set -e

echo "Cleaning up processes..."
kill $VITE_PID 2>/dev/null || true
kill $BACKEND_PID 2>/dev/null || true

# Wait for processes to exit
wait $VITE_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true

echo "E2E Tests completed with exit code: $TEST_EXIT_CODE"

cd "$ROOT_DIR/backend"
if [ -f .env.backup ]; then
  mv .env.backup .env
else
  rm -f .env
fi

exit $TEST_EXIT_CODE
