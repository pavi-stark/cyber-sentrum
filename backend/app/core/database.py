import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import DATABASE_URL, BASE_DIR

Base = declarative_base()

# Resilient Database Engine: Attempts MySQL first, falls back to embedded SQLite for Cloud / Render
try:
    if "mysql" in DATABASE_URL:
        test_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 3}
        )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        print("[DB] Successfully connected to MySQL Database.")
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    sqlite_dir = BASE_DIR / "app" / "data"
    sqlite_dir.mkdir(parents=True, exist_ok=True)
    sqlite_url = f"sqlite:///{sqlite_dir / 'screening_system.db'}"
    print(f"[DB Notice] External MySQL not detected ({e}). Using embedded SQLite Database: {sqlite_url}")
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
