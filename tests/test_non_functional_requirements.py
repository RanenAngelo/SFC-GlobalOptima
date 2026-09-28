import time
import pytest
import sqlite3
import importlib.util
from pathlib import Path
from src.app import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert login.status_code == 200
        client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {login.get_json()['token']}"
        yield client

@pytest.mark.skipif(importlib.util.find_spec("xgboost") is None, reason="The checked-in model requires the xgboost package from requirements.txt")
def test_nfr1_sub_five_second_inference(client):
    test_payload = {
        "total_quantity_sold": 9200.0,
        "total_revenue": 184000.0,
        "unit_contribution_margin": 14.50,
        "actual_profit_margin_pct": 72.5,
        "avg_rating": 4.65,
        "total_waste_cost": 2100.0,
        "wastage_pct": 1.14,
        "repeat_purchase_rate": 28.5,
        "promotion_dependency_pct": 8.2
    }

    start = time.perf_counter()
    res = client.post("/api/analytics/predict", json=test_payload)
    elapsed = time.perf_counter() - start

    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "predicted_class" in data
    assert "model_version" in data
    assert elapsed < 5.0
    assert data["meets_nfr1_threshold"] is True

def test_nfr2_scalability_and_indexing():
    db_path = PROJECT_ROOT / "database" / "dineiq.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type = 'index'")
    indexes = [r[0] for r in cur.fetchall()]
    conn.close()

    expected_indexes = [
        "idx_orders_cust",
        "idx_orders_rest",
        "idx_orders_dt",
        "idx_order_items_ord",
        "idx_order_items_item",
        "idx_ratings_item",
        "idx_wastage_item",
        "idx_wastage_date"
    ]
    for idx in expected_indexes:
        assert idx in indexes

    parquet_dir = PROJECT_ROOT / "parquet_data" / "cleaned"
    assert (parquet_dir / "orders.parquet").exists()
    assert (parquet_dir / "order_items.parquet").exists()

def test_nfr3_usability_and_api_contract(client):
    res = client.get("/api/analytics/executive")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "kpis" in data
    assert "total_orders" in data["kpis"]

    bad_res = client.get("/api/locations/UNKNOWN_ID_9999")
    assert bad_res.status_code == 404
    bad_data = bad_res.get_json()
    assert bad_data["status"] == "error"

def test_nfr4_accuracy_thresholds():
    spark_report_path = PROJECT_ROOT / "reports" / "step12_spark_mllib_report.json"
    py_report_path = PROJECT_ROOT / "reports" / "step13_python_pipeline_report.json"
    fc_report_path = PROJECT_ROOT / "reports" / "step19_22_forecasting_report.json"

    assert spark_report_path.exists()
    assert py_report_path.exists()
    assert fc_report_path.exists()

    with open(spark_report_path, "r", encoding="utf-8") as f:
        import json
        spark_data = json.load(f)
    assert spark_data["best_f1_score"] >= 0.80
    assert spark_data["algorithms_tested"][0]["test_accuracy"] >= 0.85

    with open(py_report_path, "r", encoding="utf-8") as f:
        py_data = json.load(f)
    assert py_data["best_macro_f1"] >= 0.80
    assert py_data["algorithms_tested"][1]["test_accuracy"] >= 0.85

    with open(fc_report_path, "r", encoding="utf-8") as f:
        fc_data = json.load(f)
    improvement = fc_data["evaluation_metrics"]["improvement"]
    assert improvement["mae_reduction_pct"] > 0.0

def test_nfr5_availability_and_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database"]["status"] == "connected"
    if importlib.util.find_spec("xgboost") is None:
        assert data["model_engine"]["status"] == "unavailable"
    else:
        assert data["model_engine"]["status"] == "loaded"
