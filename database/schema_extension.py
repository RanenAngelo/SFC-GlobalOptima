import sqlite3
import hashlib
import secrets
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "dineiq.db"

def hash_password(password: str) -> str:
    salt = "dineiq_salt_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def extend_database():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_registry (
        model_id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        version TEXT NOT NULL,
        framework TEXT NOT NULL,
        training_date TEXT NOT NULL,
        accuracy REAL,
        f1_score REAL,
        status TEXT NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_monitor (
        job_id TEXT PRIMARY KEY,
        job_name TEXT NOT NULL,
        job_type TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        records_processed INTEGER,
        status TEXT NOT NULL,
        execution_time_sec REAL
    );
    """)
    
    preseeded_users = [
        ("USR001", "admin", hash_password("admin123"), "System Administrator", "Administrator", "admin@dineiq.local", "2025-01-01 00:00:00"),
        ("USR002", "evaluator", hash_password("eval2026"), "Competition Evaluator", "Administrator", "evaluator@aptech.local", "2025-01-01 00:00:00"),
        ("USR003", "analyst", hash_password("analyst123"), "Lead Data Analyst", "Data Analyst", "analyst@dineiq.local", "2025-01-01 00:00:00"),
        ("USR004", "reg_manager", hash_password("regman123"), "Midwest Regional Manager", "Regional Manager", "regional@dineiq.local", "2025-01-01 00:00:00"),
        ("USR005", "rest_manager", hash_password("restman123"), "Downtown Restaurant Manager", "Restaurant Manager", "manager@dineiq.local", "2025-01-01 00:00:00"),
        ("USR006", "rest_manager_2", hash_password("restman123"), "Westside Restaurant Manager", "Restaurant Manager", "manager2@dineiq.local", "2025-01-01 00:00:00")
    ]
    
    cursor.executemany("""
    INSERT OR REPLACE INTO users (user_id, username, password_hash, full_name, role, email, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, preseeded_users)
    
    preseeded_models = [
        ("MOD-SPARK-01", "Random Forest Classifier", "1.0.0", "Apache Spark MLlib", "2025-09-25 09:11:00", 0.880, 0.880, "ACTIVE"),
        ("MOD-PY-01", "XGBoost Classifier", "1.0.0", "Python Scikit-Learn / XGBoost", "2025-09-25 09:12:00", 1.000, 1.000, "ACTIVE"),
        ("MOD-FC-01", "Gradient Boosting Demand Regressor", "1.0.0", "Python Scikit-Learn", "2025-09-25 09:16:00", 0.852, 0.852, "ACTIVE")
    ]
    
    cursor.executemany("""
    INSERT OR REPLACE INTO model_registry (model_id, model_name, version, framework, training_date, accuracy, f1_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, preseeded_models)
    
    preseeded_jobs = [
        ("JOB-01", "Dataset Generation", "Data Ingestion", "2025-09-25 08:35:00", "2025-09-25 08:47:00", 1416223, "COMPLETED", 720.0),
        ("JOB-02", "Big Data Storage & Conversion", "Storage", "2025-09-25 08:48:00", "2025-09-25 08:50:00", 1416223, "COMPLETED", 120.0),
        ("JOB-03", "Spark Data Ingestion", "PySpark", "2025-09-25 08:56:00", "2025-09-25 08:57:00", 1416223, "COMPLETED", 60.0),
        ("JOB-04", "Data Quality Assessment", "PySpark", "2025-09-25 08:59:00", "2025-09-25 09:00:00", 1416223, "COMPLETED", 75.0),
        ("JOB-05", "Data Cleaning & Quarantine", "PySpark", "2025-09-25 09:01:00", "2025-09-25 09:03:00", 1416223, "COMPLETED", 136.0),
        ("JOB-06", "Spark SQL Integration & Features", "PySpark", "2025-09-25 09:04:00", "2025-09-25 09:07:00", 1089728, "COMPLETED", 151.0),
        ("JOB-07", "Spark MLlib Model Training", "Spark MLlib", "2025-09-25 09:10:00", "2025-09-25 09:11:00", 156, "COMPLETED", 68.0),
        ("JOB-08", "Python ML Model Training", "Scikit-Learn/XGBoost", "2025-09-25 09:11:00", "2025-09-25 09:12:00", 156, "COMPLETED", 25.0)
    ]
    
    cursor.executemany("""
    INSERT OR REPLACE INTO job_monitor (job_id, job_name, job_type, started_at, completed_at, records_processed, status, execution_time_sec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, preseeded_jobs)
    
    cursor.execute("""
    INSERT INTO audit_logs (timestamp, user_id, action, module, details, status)
    VALUES ('2025-09-25 09:24:00', 'USR001', 'SYSTEM_INITIALIZATION', 'CORE', 'Database extended with RBAC, Audit, and Job Monitoring', 'SUCCESS');
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    extend_database()
