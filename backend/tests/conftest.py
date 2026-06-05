import os
import pytest
from dotenv import load_dotenv

# Load .env.test before any other imports
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.test'))

from app.core.database import engine, Base

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Setup test database (SQLite)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Remove test.db
    if os.path.exists("./test.db"):
        os.remove("./test.db")
