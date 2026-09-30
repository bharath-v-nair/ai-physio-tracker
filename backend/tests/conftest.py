import os
import tempfile

# API tests run against a throwaway SQLite database, never the development one
_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
