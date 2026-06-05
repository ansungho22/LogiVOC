#!/bin/bash
cd backend
export CELERY_TASK_ALWAYS_EAGER=True
./.venv/bin/uvicorn app.main:app --port 8000 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

sleep 5

cd ../frontend
npx playwright test tests/security.spec.ts
PLAYWRIGHT_EXIT_CODE=$?

kill $BACKEND_PID
exit $PLAYWRIGHT_EXIT_CODE
