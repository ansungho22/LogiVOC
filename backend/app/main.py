import os
from dotenv import load_dotenv
if os.getenv("TESTING") == "True":
    load_dotenv(".env.test", override=True)
else:
    load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from . import models

# Create tables (for MVP only, normally use alembic)
Base.metadata.create_all(bind=engine)

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from .core.rate_limit import limiter

app = FastAPI(title="OmniLog AI API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .api.routers import router as api_router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
