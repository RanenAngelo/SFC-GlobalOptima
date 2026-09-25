import os
import json
import time
import sqlite3
import hashlib
import secrets
from pathlib import Path
from flask import Flask, request, jsonify, make_response, g
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config["SECRET_KEY"] = os.environ.get("DINEIQ_SECRET_KEY") or secrets.token_hex(32)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "dineiq.db"
DB_ZIP_PATH = PROJECT_ROOT / "database" / "dineiq.db.zip"

if not DB_PATH.exists() and DB_ZIP_PATH.exists():
    import zipfile
    with zipfile.ZipFile(DB_ZIP_PATH, 'r') as zf:
        zf.extractall(PROJECT_ROOT / "database")

REPORTS_DIR = PROJECT_ROOT / "reports"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_PATH = MODELS_DIR / "python_best_model.joblib"

active_sessions = {}
cached_reports = {}

loaded_model_dict = None
if MODEL_PATH.exists():
    try:
        loaded_model_dict = joblib.load(MODEL_PATH)
    except Exception:
        loaded_model_dict = None

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def log_audit(user_id, action, module, details, status="SUCCESS"):
    try:
        conn = get_db()
        cursor = conn.cursor()
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO audit_logs (timestamp, user_id, action, module, details, status) VALUES (?, ?, ?, ?, ?, ?)",
            (ts, user_id or "ANONYMOUS", action, module, str(details), status)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def load_cached_report(filename):
    if filename in cached_reports:
        return cached_reports[filename]
    path = REPORTS_DIR / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            cached_reports[filename] = data
            return data
    return None

def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif "X-Session-Token" in request.headers:
        token = request.headers["X-Session-Token"].strip()
    session = active_sessions.get(token) if token else None
    if session:
        if session.get("expires_at", 0) < time.time():
            active_sessions.pop(token, None)
            return None
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT user_id, username, full_name, role, email FROM users WHERE user_id = ?", (session["user_id"],))
        row = cur.fetchone()
        if not row:
            conn.close()
            return None
        user = dict(row)
        try:
            cur.execute("SELECT status FROM users WHERE user_id = ?", (user["user_id"],))
            status = cur.fetchone()["status"]
        except sqlite3.OperationalError:
            status = "ACTIVE"
        if status != "ACTIVE":
            conn.close()
            active_sessions.pop(token, None)
            return None
        if user["role"] in ("Restaurant Manager", "Regional Manager"):
            cur.execute("SELECT restaurant_id FROM user_location_assignments WHERE user_id = ? ORDER BY restaurant_id", (user["user_id"],))
            user["locations"] = [r[0] for r in cur.fetchall()]
        else:
            user["locations"] = []
        conn.close()
        user["permissions"] = ROLE_PERMISSIONS.get(user["role"], [])
        return user
    return None

ROLE_PERMISSIONS = {
    "Administrator": ["*"],
    "Regional Manager": ["read", "write_locations", "view_reports", "export_data", "simulate"],
    "Restaurant Manager": ["read", "write_inventory", "write_wastage", "view_reports", "simulate"],
    "Data Analyst": ["read", "view_reports", "export_data", "simulate", "trigger_models"]
}

def user_location_scope(user=None):
    user = user or getattr(g, "current_user", None)
    if not user or user["role"] in ("Administrator", "Data Analyst"):
        return None
    return user.get("locations", [])

def check_location_access(location_id, user=None):
    scope = user_location_scope(user)
    if scope is not None and location_id not in scope:
        return False
    return True

def enforce_requested_location(location_id):
    if location_id and not check_location_access(location_id):
        return jsonify({"status": "error", "message": "Location is outside your assigned scope"}), 403
    scope = user_location_scope()
    if location_id is None and scope is not None and not scope:
        return jsonify({"status": "error", "message": "No locations are assigned to this account"}), 403
    return None

def initialize_rbac_schema():
    """Idempotent schema upgrade; keeps existing user records and passwords intact."""
    conn = get_db()
    cur = conn.cursor()
    cols = {row[1] for row in cur.execute("PRAGMA table_info(users)").fetchall()}
    if "status" not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'")
    cur.execute("""CREATE TABLE IF NOT EXISTS user_location_assignments (
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        restaurant_id TEXT NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, restaurant_id))""")
    cur.execute("SELECT user_id FROM users WHERE username = 'rest_manager_2'")
    if not cur.fetchone():
        cur.execute("""INSERT INTO users (user_id, username, password_hash, full_name, role, email, status, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', '2025-01-01 00:00:00')""",
                    ("USR006", "rest_manager_2", hash_password("restman123"), "Westside Restaurant Manager", "Restaurant Manager", "manager2@dineiq.local"))

    # Existing demo identities need an explicit, least-privilege starting scope.
    # Administrators can maintain additional assignments through deployment/admin tooling.
    cur.execute("SELECT user_id, username FROM users WHERE username IN ('rest_manager','rest_manager_2','reg_manager')")
    known = {row["username"]: row["user_id"] for row in cur.fetchall()}
    for username, location_ids in {
        "rest_manager": ["REST01"],
        "rest_manager_2": ["REST02"],
        "reg_manager": ["REST02", "REST12", "REST22"],
    }.items():
        if username in known:
            cur.execute("SELECT 1 FROM user_location_assignments WHERE user_id = ?", (known[username],))
            if not cur.fetchone():
                for location_id in location_ids:
                    cur.execute("INSERT OR IGNORE INTO user_location_assignments(user_id, restaurant_id) VALUES (?, ?)", (known[username], location_id))
    conn.commit()
    conn.close()

try:
    initialize_rbac_schema()
except sqlite3.Error:
    # The API can start while a deployment is provisioning the database; requests will fail closed.
    pass

@app.before_request
def authenticate_api_requests():
    if not request.path.startswith("/api/") or request.path == "/api/health" or request.path == "/api/auth/login" or request.method == "OPTIONS":
        return None
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Authentication required"}), 401
    g.current_user = user
    if request.path == "/api/auth/register" and user["role"] != "Administrator":
        return jsonify({"status": "error", "message": "Administrator role required"}), 403
    admin_only = request.method in ("POST", "PUT", "PATCH", "DELETE") and (
        request.path.startswith(("/api/locations", "/api/categories", "/api/menu-items", "/api/pricing-history", "/api/promotions"))
    )
    if request.path.startswith("/api/locations/") and request.method == "PUT" and user["role"] == "Regional Manager":
        admin_only = False
    if request.path == "/api/locations" and request.method == "POST" and user["role"] == "Regional Manager":
        admin_only = True
    admin_only = admin_only or request.path in ("/api/audit-logs", "/api/jobs") or request.path.startswith("/api/models")
    if admin_only and user["role"] != "Administrator":
        return jsonify({"status": "error", "message": "Administrator role required"}), 403
    operational_write = request.method in ("POST", "PUT", "PATCH", "DELETE") and request.path.startswith(("/api/orders", "/api/customers", "/api/ratings", "/api/inventory", "/api/wastage"))
    if operational_write and user["role"] not in ("Administrator", "Restaurant Manager", "Regional Manager"):
        return jsonify({"status": "error", "message": "Operational write permission required"}), 403
    if request.path == "/api/customers" and request.method != "GET" and user["role"] != "Administrator":
        return jsonify({"status": "error", "message": "Customer creation must be managed by an administrator"}), 403
    location_write_paths = ("/api/orders", "/api/ratings", "/api/inventory", "/api/wastage")
    if request.method == "POST" and request.path in location_write_paths and user_location_scope(user) is not None:
        requested_location = (request.get_json(silent=True) or {}).get("restaurant_id")
        if not requested_location:
            return jsonify({"status": "error", "message": "restaurant_id is required for this account"}), 400
        if not check_location_access(requested_location, user):
            return jsonify({"status": "error", "message": "Location is outside your assigned scope"}), 403
    if request.path.startswith("/api/export/") and "export_data" not in user.get("permissions", []) and user["role"] != "Administrator":
        return jsonify({"status": "error", "message": "Export permission required"}), 403
    export_dataset = request.path.rsplit("/", 1)[-1] if request.path.startswith("/api/export/") else ""
    if export_dataset in ("audit_logs", "model_registry") and user["role"] != "Administrator":
        return jsonify({"status": "error", "message": "Administrator role required for this dataset"}), 403
    location_report_paths = (
        "/api/analytics/customers", "/api/analytics/market-basket", "/api/analytics/forecasting",
        "/api/analytics/wastage-pricing", "/api/analytics/anomalies", "/api/analytics/recommendations",
        "/api/analytics/dual-pipeline", "/api/analytics/menu", "/api/reports/download"
    )
    if request.path.startswith(location_report_paths) and user["role"] in ("Restaurant Manager", "Regional Manager"):
        return jsonify({"status": "error", "message": "This report is not available as location-scoped data"}), 403
    return None

@app.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"status": "error", "error_code": 400, "message": str(e.description if hasattr(e, "description") else "Bad Request")}), 400

@app.errorhandler(401)
def handle_unauthorized(e):
    return jsonify({"status": "error", "error_code": 401, "message": "Unauthorized access. Valid credentials required."}), 401

@app.errorhandler(403)
def handle_forbidden(e):
    return jsonify({"status": "error", "error_code": 403, "message": "Forbidden. Insufficient role permissions."}), 403

@app.errorhandler(404)
def handle_not_found(e):
    return jsonify({"status": "error", "error_code": 404, "message": "Requested resource was not found."}), 404

@app.errorhandler(500)
def handle_server_error(e):
    return jsonify({"status": "error", "error_code": 500, "message": "Internal server processing failure."}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    db_ok = False
    table_count = 0
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table'")
        table_count = cur.fetchone()[0]
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    return jsonify({
        "status": "healthy" if db_ok else "degraded",
        "service": "DineIQ Analytics Enterprise REST API",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "database": {
            "status": "connected" if db_ok else "error",
            "tables": table_count
        },
        "model_engine": {
            "status": "loaded" if loaded_model_dict is not None else "unavailable",
            "model_name": loaded_model_dict.get("model_name", "N/A") if loaded_model_dict else "None"
        },
        "uptime_sla_target": ">=99.0%"
    }), 200

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id, username, password_hash, full_name, role, email, status FROM users WHERE username = ? OR email = ?", (username, username))
    row = cur.fetchone()
    valid_password = False
    if row:
        stored = row["password_hash"]
        try:
            valid_password = check_password_hash(stored, password)
        except (ValueError, TypeError):
            valid_password = False
        # Upgrade legacy fixed-salt SHA256 hashes on successful authentication.
        if not valid_password:
            legacy = hashlib.sha256(("dineiq_salt_2026" + password).encode("utf-8")).hexdigest()
            valid_password = secrets.compare_digest(stored, legacy)
            if valid_password:
                cur.execute("UPDATE users SET password_hash = ? WHERE user_id = ?", (hash_password(password), row["user_id"]))
                conn.commit()
    if not row or not valid_password or row["status"] != "ACTIVE":
        conn.close()
        log_audit(username, "AUTH_LOGIN_FAILED", "AUTH", f"Failed login attempt for username: {username}", "FAILED")
        return jsonify({"status": "error", "message": "Invalid username or password"}), 401

    token = secrets.token_hex(24)
    user_info = {
        "user_id": row["user_id"],
        "username": row["username"],
        "full_name": row["full_name"],
        "role": row["role"],
        "email": row["email"],
        "permissions": ROLE_PERMISSIONS.get(row["role"], [])
    }
    active_sessions[token] = {"user_id": row["user_id"], "expires_at": time.time() + 8 * 60 * 60}
    if row["role"] in ("Restaurant Manager", "Regional Manager"):
        cur.execute("SELECT restaurant_id FROM user_location_assignments WHERE user_id = ? ORDER BY restaurant_id", (row["user_id"],))
        user_info["locations"] = [r[0] for r in cur.fetchall()]
    else:
        user_info["locations"] = []
    conn.close()

    log_audit(row["user_id"], "AUTH_LOGIN_SUCCESS", "AUTH", f"User {username} successfully logged in", "SUCCESS")
    return jsonify({
        "status": "success",
        "token": token,
        "user": user_info
    }), 200

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "Restaurant Manager").strip()
    email = data.get("email", "").strip()
    location_ids = data.get("locations", [])

    if not username or not password or not full_name:
        return jsonify({"status": "error", "message": "Username, password, and full_name are required"}), 400

    valid_roles = ["Administrator", "Regional Manager", "Restaurant Manager", "Data Analyst"]
    if role not in valid_roles:
        return jsonify({"status": "error", "message": f"Role must be one of {valid_roles}"}), 400

    user_id = f"USR{int(time.time()*1000)%1000000:06d}"
    hashed = hash_password(password)
    created_at = time.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (user_id, username, password_hash, full_name, role, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, username, hashed, full_name, role, email, created_at)
        )
        for location_id in location_ids:
            if not cur.execute("SELECT 1 FROM restaurants WHERE restaurant_id = ?", (location_id,)).fetchone():
                conn.rollback()
                conn.close()
                return jsonify({"status": "error", "message": f"Unknown location: {location_id}"}), 400
            cur.execute("INSERT INTO user_location_assignments(user_id, restaurant_id) VALUES (?, ?)", (user_id, location_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    conn.close()

    log_audit(user_id, "USER_REGISTERED", "AUTH", f"Registered new user {username} with role {role}", "SUCCESS")
    return jsonify({
        "status": "success",
        "message": "User registered successfully",
        "user_id": user_id
    }), 201

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    return jsonify({"status": "success", "user": user}), 200

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else request.headers.get("X-Session-Token", "").strip()
    active_sessions.pop(token, None)
    return jsonify({"status": "success"}), 200

@app.route("/api/locations", methods=["GET", "POST"])
def handle_locations():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        zone = request.args.get("zone")
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                cur.execute("SELECT * FROM restaurants WHERE 1=0")
            elif zone:
                cur.execute(f"SELECT * FROM restaurants WHERE zone = ? AND restaurant_id IN ({','.join('?' for _ in scope)}) ORDER BY restaurant_id", [zone, *scope])
            else:
                cur.execute(f"SELECT * FROM restaurants WHERE restaurant_id IN ({','.join('?' for _ in scope)}) ORDER BY restaurant_id", scope)
        elif zone:
            cur.execute("SELECT * FROM restaurants WHERE zone = ? ORDER BY restaurant_id", (zone,))
        else:
            cur.execute("SELECT * FROM restaurants ORDER BY restaurant_id")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    user = get_current_user()
    data = request.get_json(silent=True) or {}
    rest_id = data.get("restaurant_id", f"R{int(time.time())%100000:05d}")
    name = data.get("restaurant_name", "").strip()
    city = data.get("city", "").strip()
    state = data.get("state", "").strip()
    zone = data.get("zone", "Downtown").strip()
    capacity = int(data.get("seating_capacity", 100))
    opened = data.get("opened_date", time.strftime("%Y-%m-%d"))

    if not name or not city:
        conn.close()
        return jsonify({"status": "error", "message": "restaurant_name and city are required"}), 400

    cur.execute(
        "INSERT INTO restaurants (restaurant_id, restaurant_name, city, state, zone, seating_capacity, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (rest_id, name, city, state, zone, capacity, opened)
    )
    conn.commit()
    conn.close()
    log_audit(user.get("user_id") if user else None, "CREATE_LOCATION", "MANAGEMENT", f"Created location {rest_id}: {name}")
    return jsonify({"status": "success", "restaurant_id": rest_id, "message": "Location created successfully"}), 201

@app.route("/api/locations/<location_id>", methods=["GET", "PUT", "DELETE"])
def handle_location_by_id(location_id):
    if not check_location_access(location_id):
        return jsonify({"status": "error", "message": "Location is outside your assigned scope"}), 403
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM restaurants WHERE restaurant_id = ?", (location_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"status": "error", "message": "Location not found"}), 404

    if request.method == "GET":
        conn.close()
        return jsonify({"status": "success", "data": dict(row)}), 200

    user = get_current_user()
    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        name = data.get("restaurant_name", row["restaurant_name"])
        city = data.get("city", row["city"])
        state = data.get("state", row["state"])
        zone = data.get("zone", row["zone"])
        capacity = int(data.get("seating_capacity", row["seating_capacity"]))
        cur.execute(
            "UPDATE restaurants SET restaurant_name = ?, city = ?, state = ?, zone = ?, seating_capacity = ? WHERE restaurant_id = ?",
            (name, city, state, zone, capacity, location_id)
        )
        conn.commit()
        conn.close()
        log_audit(user.get("user_id") if user else None, "UPDATE_LOCATION", "MANAGEMENT", f"Updated location {location_id}")
        return jsonify({"status": "success", "message": "Location updated"}), 200

    if request.method == "DELETE":
        cur.execute("DELETE FROM restaurants WHERE restaurant_id = ?", (location_id,))
        conn.commit()
        conn.close()
        log_audit(user.get("user_id") if user else None, "DELETE_LOCATION", "MANAGEMENT", f"Deleted location {location_id}")
        return jsonify({"status": "success", "message": "Location deleted"}), 200

@app.route("/api/categories", methods=["GET", "POST"])
def handle_categories():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        cur.execute("SELECT * FROM menu_categories ORDER BY category_id")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    cat_id = data.get("category_id", f"CAT{int(time.time())%1000:03d}")
    name = data.get("category_name", "").strip()
    desc = data.get("description", "").strip()
    if not name:
        conn.close()
        return jsonify({"status": "error", "message": "category_name is required"}), 400

    cur.execute("INSERT INTO menu_categories (category_id, category_name, description) VALUES (?, ?, ?)", (cat_id, name, desc))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "category_id": cat_id, "message": "Category created"}), 201

@app.route("/api/menu-items", methods=["GET", "POST"])
def handle_menu_items():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        category_id = request.args.get("category_id")
        is_active = request.args.get("is_active")
        query = "SELECT m.*, c.category_name FROM menu_items m LEFT JOIN menu_categories c ON m.category_id = c.category_id WHERE 1=1"
        params = []
        if category_id:
            query += " AND m.category_id = ?"
            params.append(category_id)
        if is_active is not None:
            query += " AND m.is_active = ?"
            params.append(int(is_active))
        query += " ORDER BY m.item_id"
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    user = get_current_user()
    data = request.get_json(silent=True) or {}
    item_id = data.get("item_id", f"M{int(time.time())%10000:04d}")
    cat_id = data.get("category_id", "CAT001")
    name = data.get("item_name", "").strip()
    price = float(data.get("base_price", 0.0))
    cost = float(data.get("cost_price", 0.0))
    active = int(data.get("is_active", 1))
    launch = data.get("launch_date", time.strftime("%Y-%m-%d"))
    tag = data.get("case_tag", "STANDARD")

    if not name or price <= 0:
        conn.close()
        return jsonify({"status": "error", "message": "Valid item_name and positive base_price required"}), 400

    cur.execute(
        "INSERT INTO menu_items (item_id, category_id, item_name, base_price, cost_price, is_active, launch_date, case_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (item_id, cat_id, name, price, cost, active, launch, tag)
    )
    conn.commit()
    conn.close()
    log_audit(user.get("user_id") if user else None, "CREATE_MENU_ITEM", "MANAGEMENT", f"Created menu item {item_id}: {name}")
    return jsonify({"status": "success", "item_id": item_id, "message": "Menu item created"}), 201

@app.route("/api/menu-items/<item_id>", methods=["GET", "PUT", "DELETE"])
def handle_menu_item_by_id(item_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT m.*, c.category_name FROM menu_items m LEFT JOIN menu_categories c ON m.category_id = c.category_id WHERE m.item_id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"status": "error", "message": "Menu item not found"}), 404

    if request.method == "GET":
        conn.close()
        return jsonify({"status": "success", "data": dict(row)}), 200

    user = get_current_user()
    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        name = data.get("item_name", row["item_name"])
        cat_id = data.get("category_id", row["category_id"])
        new_price = float(data.get("base_price", row["base_price"]))
        old_price = row["base_price"]
        cost = float(data.get("cost_price", row["cost_price"]))
        active = int(data.get("is_active", row["is_active"]))
        tag = data.get("case_tag", row["case_tag"])

        cur.execute(
            "UPDATE menu_items SET item_name = ?, category_id = ?, base_price = ?, cost_price = ?, is_active = ?, case_tag = ? WHERE item_id = ?",
            (name, cat_id, new_price, cost, active, tag, item_id)
        )
        if abs(new_price - old_price) > 0.001:
            chg_id = f"PC{int(time.time()*1000)%1000000:06d}"
            today = time.strftime("%Y-%m-%d")
            reason = data.get("price_change_reason", "Management repricing adjustment")
            cur.execute(
                "INSERT INTO pricing_history (price_change_id, item_id, old_price, new_price, effective_date, reason) VALUES (?, ?, ?, ?, ?, ?)",
                (chg_id, item_id, old_price, new_price, today, reason)
            )
        conn.commit()
        conn.close()
        log_audit(user.get("user_id") if user else None, "UPDATE_MENU_ITEM", "MANAGEMENT", f"Updated menu item {item_id}")
        return jsonify({"status": "success", "message": "Menu item updated"}), 200

    if request.method == "DELETE":
        cur.execute("DELETE FROM menu_items WHERE item_id = ?", (item_id,))
        conn.commit()
        conn.close()
        log_audit(user.get("user_id") if user else None, "DELETE_MENU_ITEM", "MANAGEMENT", f"Deleted menu item {item_id}")
        return jsonify({"status": "success", "message": "Menu item deleted"}), 200

@app.route("/api/pricing-history", methods=["GET", "POST"])
def handle_pricing_history():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        item_id = request.args.get("item_id")
        if item_id:
            cur.execute("SELECT p.*, m.item_name FROM pricing_history p LEFT JOIN menu_items m ON p.item_id = m.item_id WHERE p.item_id = ? ORDER BY p.effective_date DESC", (item_id,))
        else:
            cur.execute("SELECT p.*, m.item_name FROM pricing_history p LEFT JOIN menu_items m ON p.item_id = m.item_id ORDER BY p.effective_date DESC LIMIT 100")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    item_id = data.get("item_id")
    old_price = float(data.get("old_price", 0.0))
    new_price = float(data.get("new_price", 0.0))
    eff_date = data.get("effective_date", time.strftime("%Y-%m-%d"))
    reason = data.get("reason", "Strategic adjustment")

    if not item_id or new_price <= 0:
        conn.close()
        return jsonify({"status": "error", "message": "item_id and positive new_price required"}), 400

    chg_id = f"PC{int(time.time()*1000)%1000000:06d}"
    cur.execute(
        "INSERT INTO pricing_history (price_change_id, item_id, old_price, new_price, effective_date, reason) VALUES (?, ?, ?, ?, ?, ?)",
        (chg_id, item_id, old_price, new_price, eff_date, reason)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "price_change_id": chg_id, "message": "Price history recorded"}), 201

@app.route("/api/customers", methods=["GET", "POST"])
def handle_customers():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        segment = request.args.get("segment")
        limit = min(int(request.args.get("limit", 100)), 500)
        offset = int(request.args.get("offset", 0))
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                cur.execute("SELECT * FROM customers WHERE 1=0")
            else:
                marks = ",".join("?" for _ in scope)
                query = f"SELECT DISTINCT c.* FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.restaurant_id IN ({marks})"
                params = list(scope)
                if segment:
                    query += " AND c.segment_label = ?"
                    params.append(segment)
                query += " ORDER BY c.customer_id LIMIT ? OFFSET ?"
                cur.execute(query, [*params, limit, offset])
        elif segment:
            cur.execute("SELECT * FROM customers WHERE segment_label = ? LIMIT ? OFFSET ?", (segment, limit, offset))
        else:
            cur.execute("SELECT * FROM customers LIMIT ? OFFSET ?", (limit, offset))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    cust_id = data.get("customer_id", f"CUST{int(time.time())%1000000:06d}")
    name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    signup = data.get("signup_date", time.strftime("%Y-%m-%d"))
    segment = data.get("segment_label", "Standard")
    channel = data.get("preferred_channel", "Dine-in")

    if not name:
        conn.close()
        return jsonify({"status": "error", "message": "full_name is required"}), 400

    cur.execute(
        "INSERT INTO customers (customer_id, full_name, email, phone, signup_date, segment_label, preferred_channel) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (cust_id, name, email, phone, signup, segment, channel)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "customer_id": cust_id, "message": "Customer created"}), 201

@app.route("/api/orders", methods=["GET", "POST"])
def handle_orders():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        rest_id = request.args.get("restaurant_id")
        cust_id = request.args.get("customer_id")
        limit = min(int(request.args.get("limit", 50)), 200)
        offset = int(request.args.get("offset", 0))
        query = "SELECT * FROM orders WHERE 1=1"
        params = []
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                query += " AND 1=0"
            else:
                query += f" AND restaurant_id IN ({','.join('?' for _ in scope)})"
                params.extend(scope)
        if rest_id:
            denied = enforce_requested_location(rest_id)
            if denied:
                conn.close()
                return denied
            query += " AND restaurant_id = ?"
            params.append(rest_id)
        if cust_id:
            query += " AND customer_id = ?"
            params.append(cust_id)
        query += " ORDER BY order_datetime DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cur.execute(query, params)
        orders = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(orders), "data": orders}), 200

    data = request.get_json(silent=True) or {}
    order_id = data.get("order_id", f"ORD{int(time.time()*1000)%100000000:08d}")
    cust_id = data.get("customer_id")
    rest_id = data.get("restaurant_id")
    if rest_id is None and user_location_scope() is not None:
        conn.close()
        return jsonify({"status": "error", "message": "restaurant_id is required for this account"}), 400
    denied = enforce_requested_location(rest_id)
    if denied:
        conn.close()
        return denied
    if cust_id and user_location_scope() is not None:
        cur.execute("SELECT 1 FROM orders WHERE customer_id = ? AND restaurant_id = ? LIMIT 1", (cust_id, rest_id))
        if not cur.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Customer is not associated with this location"}), 403
    dt = data.get("order_datetime", time.strftime("%Y-%m-%d %H:%M:%S"))
    channel = data.get("order_channel", "Dine-in")
    status = data.get("order_status", "Completed")
    promo_id = data.get("promo_id")
    subtotal = float(data.get("subtotal", 0.0))
    discount = float(data.get("discount_amount", 0.0))
    tax = float(data.get("tax_amount", 0.0))
    total = float(data.get("total_amount", subtotal - discount + tax))
    items = data.get("items", [])

    cur.execute(
        "INSERT INTO orders (order_id, customer_id, restaurant_id, order_datetime, order_channel, order_status, promo_id, subtotal, discount_amount, tax_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_id, cust_id, rest_id, dt, channel, status, promo_id, subtotal, discount, tax, total)
    )

    for item in items:
        oi_id = f"OI{int(time.time()*10000)%1000000000:09d}"
        it_id = item.get("item_id")
        u_price = float(item.get("unit_price", 0.0))
        qty = int(item.get("quantity", 1))
        lt = float(item.get("line_total", u_price * qty))
        cost = float(item.get("item_cost", 0.0))
        cur.execute(
            "INSERT INTO order_items (order_item_id, order_id, item_id, unit_price, quantity, line_total, item_cost, special_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (oi_id, order_id, it_id, u_price, qty, lt, cost, item.get("special_notes", ""))
        )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "order_id": order_id, "message": "Order created"}), 201

@app.route("/api/orders/<order_id>", methods=["GET"])
def handle_order_by_id(order_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    ord_row = cur.fetchone()
    if not ord_row:
        conn.close()
        return jsonify({"status": "error", "message": "Order not found"}), 404
    if not check_location_access(ord_row["restaurant_id"]):
        conn.close()
        return jsonify({"status": "error", "message": "Order is outside your assigned scope"}), 403
    cur.execute("SELECT oi.*, m.item_name FROM order_items oi LEFT JOIN menu_items m ON oi.item_id = m.item_id WHERE oi.order_id = ?", (order_id,))
    items = [dict(r) for r in cur.fetchall()]
    conn.close()
    res = dict(ord_row)
    res["items"] = items
    return jsonify({"status": "success", "data": res}), 200

@app.route("/api/promotions", methods=["GET", "POST"])
def handle_promotions():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        cur.execute("SELECT * FROM promotions ORDER BY promo_id")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    p_id = data.get("promo_id", f"PR{int(time.time())%10000:04d}")
    name = data.get("promo_name", "").strip()
    code = data.get("promo_code", "").strip()
    disc = float(data.get("discount_pct", 0.0))
    s_date = data.get("start_date", time.strftime("%Y-%m-%d"))
    e_date = data.get("end_date", time.strftime("%Y-%m-%d"))
    t_cat = data.get("target_category_id", "CAT001")
    trap = int(data.get("is_trap", 0))

    cur.execute(
        "INSERT INTO promotions (promo_id, promo_name, promo_code, discount_pct, start_date, end_date, target_category_id, is_trap) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (p_id, name, code, disc, s_date, e_date, t_cat, trap)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "promo_id": p_id, "message": "Promotion created"}), 201

@app.route("/api/ratings", methods=["GET", "POST"])
def handle_ratings():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        item_id = request.args.get("item_id")
        rest_id = request.args.get("restaurant_id")
        limit = min(int(request.args.get("limit", 100)), 500)
        query = "SELECT r.*, m.item_name FROM ratings r LEFT JOIN menu_items m ON r.item_id = m.item_id WHERE 1=1"
        params = []
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                query += " AND 1=0"
            else:
                query += f" AND r.restaurant_id IN ({','.join('?' for _ in scope)})"
                params.extend(scope)
        if item_id:
            query += " AND r.item_id = ?"
            params.append(item_id)
        if rest_id:
            denied = enforce_requested_location(rest_id)
            if denied:
                conn.close()
                return denied
            query += " AND r.restaurant_id = ?"
            params.append(rest_id)
        query += " ORDER BY r.rating_date DESC LIMIT ?"
        params.append(limit)
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    r_id = data.get("rating_id", f"RAT{int(time.time()*1000)%100000000:08d}")
    o_id = data.get("order_id")
    c_id = data.get("customer_id")
    i_id = data.get("item_id")
    rest_id = data.get("restaurant_id")
    denied = enforce_requested_location(rest_id)
    if denied:
        conn.close()
        return denied
    score = float(data.get("rating", 5.0))
    review = data.get("review_text", "")
    r_date = data.get("rating_date", time.strftime("%Y-%m-%d"))

    if user_location_scope() is not None and o_id:
        cur.execute("SELECT restaurant_id FROM orders WHERE order_id = ?", (o_id,))
        linked_order = cur.fetchone()
        if not linked_order or linked_order["restaurant_id"] != rest_id:
            conn.close()
            return jsonify({"status": "error", "message": "Rating order does not belong to this location"}), 403

    if score < 1.0 or score > 5.0:
        conn.close()
        return jsonify({"status": "error", "message": "Rating must be between 1.0 and 5.0"}), 400

    cur.execute(
        "INSERT INTO ratings (rating_id, order_id, customer_id, item_id, restaurant_id, rating, review_text, rating_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (r_id, o_id, c_id, i_id, rest_id, score, review, r_date)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "rating_id": r_id, "message": "Rating submitted"}), 201

@app.route("/api/inventory", methods=["GET", "POST"])
def handle_inventory():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        rest_id = request.args.get("restaurant_id")
        item_id = request.args.get("item_id")
        limit = min(int(request.args.get("limit", 100)), 500)
        query = "SELECT inv.*, m.item_name FROM inventory inv LEFT JOIN menu_items m ON inv.item_id = m.item_id WHERE 1=1"
        params = []
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                query += " AND 1=0"
            else:
                query += f" AND inv.restaurant_id IN ({','.join('?' for _ in scope)})"
                params.extend(scope)
        if rest_id:
            denied = enforce_requested_location(rest_id)
            if denied:
                conn.close()
                return denied
            query += " AND inv.restaurant_id = ?"
            params.append(rest_id)
        if item_id:
            query += " AND inv.item_id = ?"
            params.append(item_id)
        query += " ORDER BY inv.date DESC LIMIT ?"
        params.append(limit)
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    inv_id = data.get("inventory_id", f"INV{int(time.time()*1000)%10000000:07d}")
    rest_id = data.get("restaurant_id")
    denied = enforce_requested_location(rest_id)
    if denied:
        conn.close()
        return denied
    item_id = data.get("item_id")
    dt = data.get("date", time.strftime("%Y-%m-%d"))
    s_stock = float(data.get("starting_stock", 0.0))
    r_stock = float(data.get("received_stock", 0.0))
    c_stock = float(data.get("consumed_stock", 0.0))
    e_stock = float(data.get("ending_stock", s_stock + r_stock - c_stock))
    unit = data.get("unit", "portions")

    cur.execute(
        "INSERT INTO inventory (inventory_id, restaurant_id, item_id, date, starting_stock, received_stock, consumed_stock, ending_stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (inv_id, rest_id, item_id, dt, s_stock, r_stock, c_stock, e_stock, unit)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "inventory_id": inv_id, "message": "Inventory record added"}), 201

@app.route("/api/wastage", methods=["GET", "POST"])
def handle_wastage():
    conn = get_db()
    cur = conn.cursor()
    if request.method == "GET":
        rest_id = request.args.get("restaurant_id")
        item_id = request.args.get("item_id")
        reason = request.args.get("reason")
        limit = min(int(request.args.get("limit", 100)), 500)
        query = "SELECT w.*, m.item_name FROM wastage w LEFT JOIN menu_items m ON w.item_id = m.item_id WHERE 1=1"
        params = []
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                query += " AND 1=0"
            else:
                query += f" AND w.restaurant_id IN ({','.join('?' for _ in scope)})"
                params.extend(scope)
        if rest_id:
            denied = enforce_requested_location(rest_id)
            if denied:
                conn.close()
                return denied
            query += " AND w.restaurant_id = ?"
            params.append(rest_id)
        if item_id:
            query += " AND w.item_id = ?"
            params.append(item_id)
        if reason:
            query += " AND w.waste_reason = ?"
            params.append(reason)
        query += " ORDER BY w.date DESC LIMIT ?"
        params.append(limit)
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

    data = request.get_json(silent=True) or {}
    w_id = data.get("wastage_id", f"WST{int(time.time()*1000)%10000000:07d}")
    rest_id = data.get("restaurant_id")
    denied = enforce_requested_location(rest_id)
    if denied:
        conn.close()
        return denied
    item_id = data.get("item_id")
    dt = data.get("date", time.strftime("%Y-%m-%d"))
    qty = float(data.get("waste_quantity", 0.0))
    cost = float(data.get("waste_cost", 0.0))
    reason = data.get("waste_reason", "Spoilage")

    if qty <= 0:
        conn.close()
        return jsonify({"status": "error", "message": "waste_quantity must be positive"}), 400

    cur.execute(
        "INSERT INTO wastage (wastage_id, restaurant_id, item_id, date, waste_quantity, waste_cost, waste_reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (w_id, rest_id, item_id, dt, qty, cost, reason)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "wastage_id": w_id, "message": "Wastage logged"}), 201

_exec_cache = {}

@app.route("/api/analytics/executive", methods=["GET"])
def get_executive_kpis():
    scope = user_location_scope()
    requested = request.args.get("location") or request.args.get("restaurant_id")
    denied = enforce_requested_location(requested)
    if denied:
        return denied
    date_from, date_to = request.args.get("dateFrom"), request.args.get("dateTo")
    cache_key = (requested, date_from, date_to, tuple(scope or []))
    now = time.time()
    if cache_key in _exec_cache:
        cached_data, cached_time = _exec_cache[cache_key]
        if now - cached_time < 60:
            return jsonify(cached_data), 200

    conn = get_db()
    cur = conn.cursor()
    locations = [requested] if requested else scope
    where, params = "", []
    if locations is not None:
        if not locations:
            where, params = " AND 1=0", []
        else:
            where, params = f" AND restaurant_id IN ({','.join('?' for _ in locations)})", list(locations)
    date_sql = ""
    date_params = []
    if date_from:
        date_sql += " AND date(order_datetime) >= date(?)"
        date_params.append(date_from)
    if date_to:
        date_sql += " AND date(order_datetime) <= date(?)"
        date_params.append(date_to)
    cur.execute(f"SELECT COUNT(*) AS orders, COALESCE(SUM(total_amount),0) AS revenue, COALESCE(AVG(total_amount),0) AS avg_check, COUNT(DISTINCT customer_id) AS customers FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {where} {date_sql}", [*params, *date_params])
    order_kpis = dict(cur.fetchone())
    cur.execute(f"SELECT COALESCE(SUM(oi.item_cost * oi.quantity),0) FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in locations) + ')') if locations is not None and locations else (' AND 1=0' if locations == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')}", [*(locations or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    total_cost = cur.fetchone()[0]
    waste_where, waste_params = "", []
    if locations is not None:
        if not locations:
            waste_where = " AND 1=0"
        else:
            waste_where = f" AND restaurant_id IN ({','.join('?' for _ in locations)})"
            waste_params.extend(locations)
    if date_from:
        waste_where += " AND date(date) >= date(?)"
        waste_params.append(date_from)
    if date_to:
        waste_where += " AND date(date) <= date(?)"
        waste_params.append(date_to)
    cur.execute(f"SELECT COALESCE(SUM(waste_cost),0) AS waste_cost FROM wastage WHERE 1=1 {waste_where}", waste_params)
    waste_cost = cur.fetchone()["waste_cost"]
    cur.execute(f"SELECT COUNT(DISTINCT restaurant_id) FROM restaurants WHERE 1=1 {(' AND restaurant_id IN (' + ','.join('?' for _ in locations) + ')') if locations is not None and locations else (' AND 1=0' if locations == [] else '')}", list(locations or []))
    location_count = cur.fetchone()[0]
    cur.execute(f"SELECT date(order_datetime) AS day, SUM(total_amount) AS revenue, COUNT(*) AS orders FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {where} {date_sql} GROUP BY date(order_datetime) ORDER BY day", [*params, *date_params])
    trends = [dict(r) for r in cur.fetchall()]

    cur.execute(f"SELECT COUNT(*) FROM (SELECT customer_id FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {where} {date_sql} GROUP BY customer_id HAVING COUNT(*) > 1)", [*params, *date_params])
    repeat_customers = cur.fetchone()[0]

    cat_loc_sql = (" AND o.restaurant_id IN (" + ",".join("?" for _ in locations) + ")") if locations is not None and locations else (" AND 1=0" if locations == [] else "")
    cur.execute(f"""
        SELECT mc.category_name AS name,
               COALESCE(SUM(oi.line_total), 0) AS revenue,
               COALESCE(SUM(oi.line_total - (oi.item_cost * oi.quantity)), 0) AS profit,
               COUNT(DISTINCT oi.order_id) AS orders
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN menu_items mi ON mi.item_id = oi.item_id
        JOIN menu_categories mc ON mc.category_id = mi.category_id
        WHERE lower(o.order_status) NOT IN ('cancelled','canceled')
        {cat_loc_sql}
        {(" AND date(o.order_datetime) >= date(?)" if date_from else "")}
        {(" AND date(o.order_datetime) <= date(?)" if date_to else "")}
        GROUP BY mc.category_name
        ORDER BY revenue DESC
    """, [*(locations or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    by_category = [
        {
            "name": r[0],
            "revenue": round(r[1], 2),
            "profit": round(r[2], 2),
            "margin": round((r[2] / r[1] * 100) if r[1] > 0 else 0, 1),
            "orders": r[3],
        }
        for r in cur.fetchall()
    ]

    conn.close()
    result = {
        "status": "success",
        "kpis": {
            "total_orders": order_kpis["orders"],
            "total_gross_revenue": round(order_kpis["revenue"], 2),
            "total_profit": round(order_kpis["revenue"] - total_cost, 2),
            "average_check_size": round(order_kpis["avg_check"], 2),
            "total_active_customers": order_kpis["customers"],
            "total_repeat_customers": repeat_customers,
            "total_locations": location_count,
            "total_audited_wastage_cost": round(waste_cost, 2),
        },
        "trends": trends,
        "by_category": by_category,
    }
    _exec_cache[cache_key] = (result, now)
    return jsonify(result), 200

@app.route("/api/analytics/menu", methods=["GET"])
def get_menu_analytics():
    data = load_cached_report("step9_10_11_menu_classification_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Menu classification data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/peak-period", methods=["GET"])
def get_peak_period_analytics():
    requested = request.args.get("location") or request.args.get("restaurant_id")
    denied = enforce_requested_location(requested)
    if denied:
        return denied
    locations = [requested] if requested else user_location_scope()
    location_sql, params = "", []
    if locations is not None:
        if not locations:
            location_sql, params = " AND 1=0", []
        else:
            location_sql, params = f" AND restaurant_id IN ({','.join('?' for _ in locations)})", list(locations)
    date_sql = ""
    date_params = []
    if request.args.get("dateFrom"):
        date_sql += " AND date(order_datetime) >= date(?)"
        date_params.append(request.args["dateFrom"])
    if request.args.get("dateTo"):
        date_sql += " AND date(order_datetime) <= date(?)"
        date_params.append(request.args["dateTo"])
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT CAST(strftime('%w', order_datetime) AS INTEGER) AS day, CAST(strftime('%H', order_datetime) AS INTEGER) AS hour, COUNT(*) AS orders FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {location_sql} {date_sql} GROUP BY day, hour ORDER BY day, hour", [*params, *date_params])
    heatmap = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT CAST(strftime('%H', order_datetime) AS INTEGER) AS hour, COUNT(*) AS orders FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {location_sql} {date_sql} GROUP BY hour ORDER BY hour", [*params, *date_params])
    peak_hours = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT CAST(strftime('%w', order_datetime) AS INTEGER) AS day, COUNT(*) AS orders FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {location_sql} {date_sql} GROUP BY day ORDER BY day", [*params, *date_params])
    peak_days = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT strftime('%Y-%m', order_datetime) AS month, COUNT(*) AS orders, SUM(total_amount) AS revenue FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {location_sql} {date_sql} GROUP BY month ORDER BY month", [*params, *date_params])
    monthly = [dict(row) for row in cur.fetchall()]
    conn.close()
    weekend_orders = sum(row["orders"] for row in peak_days if row["day"] in (0, 6))
    weekday_orders = sum(row["orders"] for row in peak_days if row["day"] in (1, 2, 3, 4, 5))
    day_counts = {row["day"]: row["orders"] for row in peak_days}
    return jsonify({"status": "success", "data": {
        "heatmap": heatmap, "peak_hours": peak_hours, "peak_days": peak_days,
        "weekend_ratio": weekend_orders / weekday_orders if weekday_orders else 0,
        "monthly": monthly, "location_specific_peak": [], "channel_peaks": [],
        "weekday_orders": weekday_orders, "weekend_orders": weekend_orders,
        "narrative": {"happened": "Peak periods are calculated from completed order records in your authorized scope.", "why": "Counts are grouped by the recorded order date and hour.", "next": "Use the date and location filters to compare trading periods."}
    }}), 200

@app.route("/api/analytics/customers", methods=["GET"])
def get_customer_analytics():
    data = load_cached_report("step15_16_36_customer_intelligence_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Customer intelligence data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/market-basket", methods=["GET"])
def get_market_basket_analytics():
    data = load_cached_report("step17_18_market_basket_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Market basket data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/forecasting", methods=["GET"])
def get_forecasting_analytics():
    data = load_cached_report("step19_22_forecasting_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Forecasting data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/wastage-pricing", methods=["GET"])
def get_wastage_pricing_analytics():
    data = load_cached_report("step23_28_wastage_pricing_promo_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Wastage and pricing data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/anomalies", methods=["GET"])
def get_anomalies_analytics():
    data = load_cached_report("step29_35_anomalies_locations_channels_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Anomalies data not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

_locations_cache = {}

@app.route("/api/analytics/locations", methods=["GET"])
def get_locations_analytics():
    requested = request.args.get("location") or request.args.get("restaurant_id")
    denied = enforce_requested_location(requested)
    if denied:
        return denied
    scope = user_location_scope()
    date_from = request.args.get("dateFrom")
    date_to = request.args.get("dateTo")
    cache_key = (requested, date_from, date_to, tuple(scope or []))
    now = time.time()
    if cache_key in _locations_cache:
        cached_data, cached_time = _locations_cache[cache_key]
        if now - cached_time < 120:
            return jsonify(cached_data), 200
    selected = [requested] if requested else scope
    location_clause, location_params = "", []
    if selected is not None:
        if not selected:
            location_clause, location_params = " AND 1=0", []
        else:
            location_clause = f" AND restaurant_id IN ({','.join('?' for _ in selected)})"
            location_params = list(selected)
    date_clause, date_params = "", []
    if date_from:
        date_clause += " AND date(order_datetime) >= date(?)"
        date_params.append(date_from)
    if date_to:
        date_clause += " AND date(order_datetime) <= date(?)"
        date_params.append(date_to)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT restaurant_id, restaurant_name, city FROM restaurants WHERE 1=1 {(' AND restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} ORDER BY restaurant_id", list(selected or []))
    restaurants = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT restaurant_id, COUNT(*) AS orders, SUM(total_amount) AS revenue, AVG(total_amount) AS aov, COUNT(DISTINCT customer_id) AS customers, SUM(subtotal) AS subtotal, SUM(discount_amount) AS discounts, SUM(CASE WHEN promo_id IS NOT NULL AND promo_id != '' THEN 1 ELSE 0 END) AS promo_orders FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') {location_clause} {date_clause} GROUP BY restaurant_id", [*location_params, *date_params])
    order_stats = {row["restaurant_id"]: dict(row) for row in cur.fetchall()}
    cur.execute(f"SELECT restaurant_id, COUNT(*) AS repeats FROM (SELECT restaurant_id, customer_id FROM orders WHERE lower(order_status) NOT IN ('cancelled','canceled') AND customer_id IS NOT NULL {location_clause} {date_clause} GROUP BY restaurant_id, customer_id HAVING COUNT(*) > 1) GROUP BY restaurant_id", [*location_params, *date_params])
    repeat_customers = {row["restaurant_id"]: row["repeats"] for row in cur.fetchall()}
    cur.execute(f"SELECT o.restaurant_id, SUM(oi.line_total) AS sales, SUM(oi.item_cost * oi.quantity) AS cost FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY o.restaurant_id", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    margin_stats = {row["restaurant_id"]: dict(row) for row in cur.fetchall()}
    cur.execute(f"SELECT restaurant_id, AVG(rating) AS rating FROM ratings WHERE 1=1 {(' AND restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(rating_date) >= date(?)' if date_from else '')} {(' AND date(rating_date) <= date(?)' if date_to else '')} GROUP BY restaurant_id", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    ratings = {row["restaurant_id"]: row["rating"] for row in cur.fetchall()}
    cur.execute(f"SELECT restaurant_id, SUM(waste_quantity) AS waste_qty, SUM(waste_cost) AS waste_cost FROM wastage WHERE 1=1 {(' AND restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(date) >= date(?)' if date_from else '')} {(' AND date(date) <= date(?)' if date_to else '')} GROUP BY restaurant_id", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    waste = {row["restaurant_id"]: dict(row) for row in cur.fetchall()}
    cur.execute(f"SELECT restaurant_id, SUM(consumed_stock) AS consumed FROM inventory WHERE 1=1 {(' AND restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(date) >= date(?)' if date_from else '')} {(' AND date(date) <= date(?)' if date_to else '')} GROUP BY restaurant_id", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    consumed = {row["restaurant_id"]: row["consumed"] or 0 for row in cur.fetchall()}
    locations = []
    for restaurant in restaurants:
        rid = restaurant["restaurant_id"]
        stats = order_stats.get(rid, {})
        margin = margin_stats.get(rid, {})
        waste_stats = waste.get(rid, {})
        revenue = stats.get("revenue") or 0
        cost = margin.get("cost") or 0
        total_orders = stats.get("orders") or 0
        locations.append({"id": rid, "name": restaurant["restaurant_name"], "city": restaurant["city"], "revenue": revenue,
            "profit": revenue - cost, "marginPct": ((revenue - cost) / revenue * 100) if revenue else 0,
            "aov": stats.get("aov") or 0, "customers": stats.get("customers") or 0,
            "repeatRatePct": ((repeat_customers.get(rid, 0) / stats.get("customers", 0) * 100) if stats.get("customers") else 0), "wastagePct": ((waste_stats.get("waste_qty") or 0) / consumed[rid] * 100) if consumed.get(rid) else 0,
            "rating": ratings.get(rid) or 0, "promoEffectivenessPct": ((stats.get("promo_orders") or 0) / total_orders * 100) if total_orders else 0,
            "menuMix": {}})
    cur.execute(f"SELECT o.order_channel AS channel, COUNT(*) AS orders, AVG(o.total_amount) AS aov, SUM(o.subtotal) AS subtotal, SUM(o.discount_amount) AS discounts FROM orders o WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY channel", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    channels_raw = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT o.order_channel AS channel, CAST(strftime('%H', o.order_datetime) AS INTEGER) AS hour, COUNT(*) AS order_count FROM orders o WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY channel, hour ORDER BY channel, order_count DESC", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    channel_hours = [dict(row) for row in cur.fetchall()]
    cur.execute(f"SELECT o.order_channel AS channel, AVG(order_qty) AS basket FROM (SELECT o.order_id, o.order_channel, SUM(oi.quantity) AS order_qty FROM orders o JOIN order_items oi ON oi.order_id=o.order_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY o.order_id) o GROUP BY channel", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    baskets = {row["channel"]: row["basket"] or 0 for row in cur.fetchall()}
    cur.execute(f"SELECT o.order_channel AS channel, SUM(oi.line_total) AS sales, SUM(oi.item_cost * oi.quantity) AS cost FROM orders o JOIN order_items oi ON oi.order_id=o.order_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY channel", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    channel_margins = {row["channel"]: dict(row) for row in cur.fetchall()}
    channel_map = {}
    for row in channels_raw:
        channel = row["channel"] or "Unknown"
        channel_map[channel] = {"channel": channel, "orders": row["orders"], "aov": row["aov"] or 0, "discountPct": ((row["discounts"] or 0) / row["subtotal"] * 100) if row["subtotal"] else 0, "peakHour": 0, "topCategories": []}
    peak_seen = set()
    for row in channel_hours:
        channel = row["channel"] or "Unknown"
        if channel in channel_map and channel not in peak_seen:
            channel_map[channel]["peakHour"] = row["hour"] or 0
            peak_seen.add(channel)
    channels = []
    for channel, stats in channel_map.items():
        margin = channel_margins.get(channel, {})
        sales, channel_cost = margin.get("sales") or 0, margin.get("cost") or 0
        channels.append({**stats, "basketSize": baskets.get(channel, 0), "marginPct": ((sales - channel_cost) / sales * 100) if sales else 0})
    cur.execute(f"SELECT o.order_channel AS channel, mc.category_name AS category, SUM(oi.quantity) AS quantity FROM orders o JOIN order_items oi ON oi.order_id=o.order_id JOIN menu_items m ON m.item_id=oi.item_id JOIN menu_categories mc ON mc.category_id=m.category_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {(' AND o.restaurant_id IN (' + ','.join('?' for _ in selected) + ')') if selected is not None and selected else (' AND 1=0' if selected == [] else '')} {(' AND date(o.order_datetime) >= date(?)' if date_from else '')} {(' AND date(o.order_datetime) <= date(?)' if date_to else '')} GROUP BY channel, category ORDER BY channel, quantity DESC", [*(selected or []), *([date_from] if date_from else []), *([date_to] if date_to else [])])
    category_rows = [dict(row) for row in cur.fetchall()]
    categories_by_channel = {}
    for row in category_rows:
        group = categories_by_channel.setdefault(row["channel"] or "Unknown", [])
        if len(group) < 3:
            group.append(row["category"])
    for channel in channels:
        channel["topCategories"] = categories_by_channel.get(channel["channel"], [])
    locations.sort(key=lambda row: row["revenue"], reverse=True)
    conn.close()
    payload = {"status": "success", "data": {"locations": locations, "channels": channels, "locationMenuClasses": [], "narrative": {"happened": "Location and channel results are aggregated from order, inventory, wastage, and rating records in your authorized scope.", "why": "Each row is computed from the selected date range and assigned locations.", "next": "Use the global filters to compare locations and channels."}}}
    _locations_cache[cache_key] = (payload, now)
    return jsonify(payload), 200

@app.route("/api/analytics/recommendations", methods=["GET"])
def get_recommendations_analytics():
    data = load_cached_report("step37_41_recommendations_and_whatif_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Recommendations data not found"}), 404
    return jsonify({"status": "success", "data": data.get("recommendations", [])}), 200

@app.route("/api/analytics/dual-pipeline", methods=["GET"])
def get_dual_pipeline_analytics():
    data = load_cached_report("dual_pipeline_verification_report.json")
    if not data:
        return jsonify({"status": "error", "message": "Dual pipeline report not found"}), 404
    return jsonify({"status": "success", "data": data}), 200

@app.route("/api/analytics/what-if", methods=["POST"])
def simulate_what_if():
    body = request.get_json(silent=True) or {}
    price_change_pct = float(body.get("price_change_pct", 0.0))
    cost_change_pct = float(body.get("cost_change_pct", 0.0))
    volume_change_pct = float(body.get("volume_change_pct", 0.0))
    elasticity_coefficient = float(body.get("elasticity", -1.2))

    requested = body.get("location") or body.get("restaurant_id")
    denied = enforce_requested_location(requested)
    if denied:
        return denied
    locations = [requested] if requested else user_location_scope()
    scope_sql, scope_params = "", []
    if locations is not None:
        if not locations:
            scope_sql, scope_params = " AND 1=0", []
        else:
            scope_sql, scope_params = f" AND o.restaurant_id IN ({','.join('?' for _ in locations)})", list(locations)
    date_sql, date_params = "", []
    if body.get("date_from"):
        date_sql += " AND date(o.order_datetime) >= date(?)"
        date_params.append(body["date_from"])
    if body.get("date_to"):
        date_sql += " AND date(o.order_datetime) <= date(?)"
        date_params.append(body["date_to"])
    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"SELECT COALESCE(SUM(o.total_amount),0) FROM orders o WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {scope_sql} {date_sql}", [*scope_params, *date_params])
    base_revenue = cur.fetchone()[0]
    cur.execute(f"SELECT COALESCE(SUM(oi.item_cost * oi.quantity),0) FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE lower(o.order_status) NOT IN ('cancelled','canceled') {scope_sql} {date_sql}", [*scope_params, *date_params])
    base_cost = cur.fetchone()[0]
    conn.close()
    base_profit = base_revenue - base_cost

    volume_impact = volume_change_pct + (price_change_pct * elasticity_coefficient)
    new_volume_factor = max(0.1, 1.0 + (volume_impact / 100.0))

    new_revenue = base_revenue * (1.0 + (price_change_pct / 100.0)) * new_volume_factor
    new_cost = base_cost * (1.0 + (cost_change_pct / 100.0)) * new_volume_factor
    new_profit = new_revenue - new_cost

    profit_delta = new_profit - base_profit
    profit_delta_pct = (profit_delta / base_profit) * 100.0 if base_profit else 0.0

    user = get_current_user()
    log_audit(user.get("user_id") if user else None, "SIMULATE_WHAT_IF", "ANALYTICS", f"Simulated price {price_change_pct}%, vol {volume_impact:.2f}%, delta ${profit_delta:,.2f}")

    return jsonify({
        "status": "success",
        "scenario": {
            "inputs": {
                "price_change_pct": price_change_pct,
                "cost_change_pct": cost_change_pct,
                "volume_change_pct": volume_change_pct,
                "elasticity_applied": elasticity_coefficient
            },
            "baseline": {
                "revenue": base_revenue,
                "cost": base_cost,
                "profit": base_profit,
                "margin_pct": round((base_profit / base_revenue) * 100.0, 2) if base_revenue else 0.0
            },
            "projected": {
                "revenue": round(new_revenue, 2),
                "cost": round(new_cost, 2),
                "profit": round(new_profit, 2),
                "margin_pct": round((new_profit / new_revenue) * 100.0, 2) if new_revenue else 0.0
            },
            "impact": {
                "net_profit_delta": round(profit_delta, 2),
                "profit_growth_pct": round(profit_delta_pct, 2),
                "effective_volume_factor": round(new_volume_factor, 4)
            }
        }
    }), 200

@app.route("/api/analytics/predict", methods=["POST"])
def live_predict():
    start_time = time.time()
    if loaded_model_dict is None:
        return jsonify({"status": "error", "message": "Model engine not loaded"}), 500

    data = request.get_json(silent=True) or {}
    feature_cols = loaded_model_dict["feature_cols"]
    scaler = loaded_model_dict["scaler"]
    classifier = loaded_model_dict["classifier"]
    class_mapping = loaded_model_dict["class_mapping"]
    version = loaded_model_dict.get("version", "1.0.0")

    vals = []
    for col in feature_cols:
        val = data.get(col)
        if val is None:
            defaults = {
                "total_quantity_sold": 5000.0,
                "total_revenue": 100000.0,
                "unit_contribution_margin": 15.0,
                "actual_profit_margin_pct": 65.0,
                "avg_rating": 4.0,
                "total_waste_cost": 2500.0,
                "wastage_pct": 2.5,
                "repeat_purchase_rate": 20.0,
                "promotion_dependency_pct": 10.0
            }
            val = defaults.get(col, 0.0)
        vals.append(float(val))

    arr = np.array([vals])
    scaled = scaler.transform(arr)
    pred_idx = int(classifier.predict(scaled)[0])
    probs = classifier.predict_proba(scaled)[0].tolist()

    pred_class = class_mapping.get(pred_idx, "Unknown")
    latency_ms = round((time.time() - start_time) * 1000.0, 2)

    user = get_current_user()
    log_audit(user.get("user_id") if user else None, "LIVE_PREDICTION", "ML_MODEL", f"Predicted {pred_class} in {latency_ms}ms (v{version})")

    return jsonify({
        "status": "success",
        "predicted_class": pred_class,
        "class_index": pred_idx,
        "probabilities": {class_mapping.get(i, str(i)): round(p, 4) for i, p in enumerate(probs)},
        "model_id": "MOD-PY-01",
        "model_version": version,
        "latency_ms": latency_ms,
        "meets_nfr1_threshold": latency_ms < 5000.0
    }), 200

@app.route("/api/search", methods=["GET"])
def handle_search():
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    entity = request.args.get("entity", "menu_items").strip()
    limit = min(int(request.args.get("limit", 20)), 100)

    conn = get_db()
    cur = conn.cursor()

    if entity == "menu_items":
        query = "SELECT m.*, c.category_name FROM menu_items m LEFT JOIN menu_categories c ON m.category_id = c.category_id WHERE 1=1"
        params = []
        if q:
            query += " AND (m.item_name LIKE ? OR m.item_id LIKE ?)"
            params.extend([f"%{q}%", f"%{q}%"])
        if category:
            query += " AND (m.category_id = ? OR c.category_name LIKE ?)"
            params.extend([category, f"%{category}%"])
        query += " LIMIT ?"
        params.append(limit)
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "entity": "menu_items", "count": len(rows), "data": rows}), 200

    elif entity == "restaurants":
        query = "SELECT * FROM restaurants WHERE 1=1"
        params = []
        scope = user_location_scope()
        if scope is not None:
            if not scope:
                query += " AND 1=0"
            else:
                query += f" AND restaurant_id IN ({','.join('?' for _ in scope)})"
                params.extend(scope)
        if q:
            query += " AND (restaurant_name LIKE ? OR city LIKE ? OR zone LIKE ?)"
            params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        query += " LIMIT ?"
        params.append(limit)
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({"status": "success", "entity": "restaurants", "count": len(rows), "data": rows}), 200

    conn.close()
    return jsonify({"status": "error", "message": f"Entity {entity} not supported for search"}), 400

@app.route("/api/export/<dataset>", methods=["GET"])
def handle_export(dataset):
    allowed_tables = ["menu_items", "restaurants", "menu_categories", "promotions", "pricing_history", "model_registry", "audit_logs"]
    if dataset not in allowed_tables:
        return jsonify({"status": "error", "message": f"Dataset must be one of {allowed_tables}"}), 400

    fmt = request.args.get("format", "csv").lower()
    conn = get_db()
    cur = conn.cursor()
    if dataset == "restaurants" and user_location_scope() is not None:
        scope = user_location_scope()
        if scope:
            cur.execute(f"SELECT * FROM restaurants WHERE restaurant_id IN ({','.join('?' for _ in scope)}) LIMIT 1000", scope)
        else:
            cur.execute("SELECT * FROM restaurants WHERE 1=0")
    else:
        cur.execute(f"SELECT * FROM {dataset} LIMIT 1000")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    user = get_current_user()
    log_audit(user.get("user_id") if user else None, "EXPORT_DATA", "SYSTEM", f"Exported {dataset} in {fmt} format")

    if fmt == "json":
        return jsonify({"status": "success", "dataset": dataset, "count": len(rows), "data": rows}), 200

    if len(rows) == 0:
        csv_text = ""
    else:
        df = pd.DataFrame(rows)
        csv_text = df.to_csv(index=False)

    resp = make_response(csv_text)
    resp.headers["Content-Disposition"] = f"attachment; filename=dineiq_{dataset}_export.csv"
    resp.headers["Content-Type"] = "text/csv"
    return resp

@app.route("/api/reports/download/<report_name>", methods=["GET"])
def download_report(report_name):
    filename = f"{report_name}.json"
    path = REPORTS_DIR / filename
    if not path.exists():
        filename = f"{report_name}.md"
        path = REPORTS_DIR / filename
    if not path.exists():
        return jsonify({"status": "error", "message": f"Report '{report_name}' not found"}), 404

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    resp = make_response(content)
    resp.headers["Content-Disposition"] = f"attachment; filename={path.name}"
    resp.headers["Content-Type"] = "application/json" if path.name.endswith(".json") else "text/markdown"
    return resp

@app.route("/api/models", methods=["GET"])
def list_models():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM model_registry ORDER BY model_id")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

@app.route("/api/audit-logs", methods=["GET"])
def list_audit_logs():
    limit = min(int(request.args.get("limit", 100)), 500)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

@app.route("/api/jobs", methods=["GET"])
def list_jobs():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM job_monitor ORDER BY started_at DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"status": "success", "count": len(rows), "data": rows}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
