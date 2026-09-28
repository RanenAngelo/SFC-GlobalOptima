import pytest
import json
import sqlite3
from pathlib import Path
from src.app import app, hash_password, get_db

PROJECT_ROOT = Path(__file__).resolve().parent.parent

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert login.status_code == 200
        client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {login.get_json()['token']}"
        yield client

def test_auth_required_and_untrusted_user_header_rejected():
    with app.test_client() as anonymous:
        assert anonymous.get("/api/locations").status_code == 401
        assert anonymous.get("/api/locations", headers={"X-User-Id": "USR001"}).status_code == 401
        assert anonymous.post("/api/auth/register", json={"username": "promoted", "password": "x", "full_name": "No", "role": "Administrator"}).status_code == 401

def test_location_scopes_separate_manager_and_regional_data():
    manager_login = app.test_client().post("/api/auth/login", json={"username": "rest_manager", "password": "restman123"})
    regional_login = app.test_client().post("/api/auth/login", json={"username": "reg_manager", "password": "regman123"})
    assert manager_login.status_code == regional_login.status_code == 200
    manager_token = manager_login.get_json()["token"]
    regional_token = regional_login.get_json()["token"]
    manager = app.test_client()
    regional = app.test_client()
    manager.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {manager_token}"
    regional.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {regional_token}"

    manager_locations = manager.get("/api/locations").get_json()["data"]
    regional_locations = regional.get("/api/locations").get_json()["data"]
    assert [row["restaurant_id"] for row in manager_locations] == ["REST01"]
    assert {row["restaurant_id"] for row in regional_locations} == {"REST02", "REST12", "REST22"}
    assert manager.get("/api/orders?restaurant_id=REST02").status_code == 403
    assert regional.get("/api/orders?restaurant_id=REST01").status_code == 403
    manager_orders = manager.get("/api/orders?limit=100").get_json()["data"]
    regional_orders = regional.get("/api/orders?limit=100").get_json()["data"]
    assert manager_orders and regional_orders
    assert {row["restaurant_id"] for row in manager_orders} == {"REST01"}
    assert {row["restaurant_id"] for row in regional_orders}.issubset({"REST02", "REST12", "REST22"})
    manager_kpis = manager.get("/api/analytics/executive").get_json()["kpis"]
    regional_kpis = regional.get("/api/analytics/executive").get_json()["kpis"]
    assert manager_kpis["total_orders"] != regional_kpis["total_orders"]
    manager_peak = manager.get("/api/analytics/peak-period").get_json()["data"]
    regional_peak = regional.get("/api/analytics/peak-period").get_json()["data"]
    assert sum(row["orders"] for row in manager_peak["peak_hours"]) == manager_kpis["total_orders"]
    assert sum(row["orders"] for row in regional_peak["peak_hours"]) == regional_kpis["total_orders"]
    assert manager.get("/api/analytics/menu").status_code == 403
    manager_locations_analytics = manager.get("/api/analytics/locations").get_json()["data"]
    regional_locations_analytics = regional.get("/api/analytics/locations").get_json()["data"]
    assert [row["id"] for row in manager_locations_analytics["locations"]] == ["REST01"]
    assert {row["id"] for row in regional_locations_analytics["locations"]} == {"REST02", "REST12", "REST22"}
    assert manager_locations_analytics["channels"]

def test_login_accepts_seeded_email_address():
    response = app.test_client().post("/api/auth/login", json={"username": "regional@dineiq.local", "password": "regman123"})
    assert response.status_code == 200
    assert response.get_json()["user"]["role"] == "Regional Manager"

def test_fr_i_user_auth(client):
    res_bad = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res_bad.status_code == 401
    bad_data = res_bad.get_json()
    assert bad_data["status"] == "error"

    res_ok = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res_ok.status_code == 200
    ok_data = res_ok.get_json()
    assert ok_data["status"] == "success"
    assert "token" in ok_data
    assert ok_data["user"]["role"] == "Administrator"

    eval_ok = client.post("/api/auth/login", json={"username": "evaluator", "password": "eval2026"})
    assert eval_ok.status_code == 200

def test_fr_ii_rbac(client):
    login = client.post("/api/auth/login", json={"username": "analyst", "password": "analyst123"})
    assert login.status_code == 200
    token = login.get_json()["token"]

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data["user"]["role"] == "Data Analyst"
    assert "view_reports" in me_data["user"]["permissions"]

def test_fr_iii_locations_management(client):
    res = client.get("/api/locations")
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] >= 20

    new_loc = {
        "restaurant_id": "R9999",
        "restaurant_name": "Test Bistro",
        "city": "Chicago",
        "state": "IL",
        "zone": "Downtown",
        "seating_capacity": 120
    }
    post_res = client.post("/api/locations", json=new_loc)
    assert post_res.status_code == 201

    get_res = client.get("/api/locations/R9999")
    assert get_res.status_code == 200
    assert get_res.get_json()["data"]["restaurant_name"] == "Test Bistro"

    del_res = client.delete("/api/locations/R9999")
    assert del_res.status_code == 200

def test_fr_iv_menu_management(client):
    cat_res = client.get("/api/categories")
    assert cat_res.status_code == 200
    assert cat_res.get_json()["count"] >= 10

    menu_res = client.get("/api/menu-items")
    assert menu_res.status_code == 200
    assert menu_res.get_json()["count"] >= 150

    new_item = {
        "item_id": "M9999",
        "category_id": "CAT001",
        "item_name": "Test Truffle Burger",
        "base_price": 22.50,
        "cost_price": 7.00,
        "is_active": 1
    }
    post_res = client.post("/api/menu-items", json=new_item)
    assert post_res.status_code == 201

    del_res = client.delete("/api/menu-items/M9999")
    assert del_res.status_code == 200

def test_fr_v_pricing_history(client):
    res = client.get("/api/pricing-history")
    assert res.status_code == 200
    assert res.get_json()["count"] > 0

    new_hist = {
        "item_id": "M001",
        "old_price": 14.50,
        "new_price": 16.50,
        "reason": "Test Margin Adjustment"
    }
    post_res = client.post("/api/pricing-history", json=new_hist)
    assert post_res.status_code == 201

def test_fr_vi_customer_management(client):
    res = client.get("/api/customers?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["data"]) == 10
    assert "full_name" in data["data"][0]

def test_fr_vii_order_management(client):
    res = client.get("/api/orders?limit=5")
    assert res.status_code == 200
    orders = res.get_json()["data"]
    assert len(orders) == 5

    first_ord_id = orders[0]["order_id"]
    det_res = client.get(f"/api/orders/{first_ord_id}")
    assert det_res.status_code == 200
    det_data = det_res.get_json()["data"]
    assert "items" in det_data
    assert len(det_data["items"]) > 0

def test_fr_viii_promotion_management(client):
    res = client.get("/api/promotions")
    assert res.status_code == 200
    promos = res.get_json()["data"]
    assert len(promos) >= 10
    trap_promos = [p for p in promos if p["is_trap"] == 1]
    assert len(trap_promos) == 2

def test_fr_ix_rating_management(client):
    res = client.get("/api/ratings?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["data"]) == 10

def test_fr_x_inventory_management(client):
    res = client.get("/api/inventory?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["data"]) == 10

def test_fr_xi_wastage_management(client):
    res = client.get("/api/wastage?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["data"]) == 10
    item = data["data"][0]
    assert "waste_quantity" in item
    assert "waste_cost" in item
    assert "waste_reason" in item

def test_fr_xii_to_xix_big_data_storage_and_features():
    orders_csv = PROJECT_ROOT / "raw_data" / "orders.csv"
    items_csv = PROJECT_ROOT / "raw_data" / "order_items.csv"
    assert orders_csv.exists()
    assert items_csv.exists()

    master_parquet = PROJECT_ROOT / "parquet_data" / "master_transactions.parquet"
    assert master_parquet.exists()

def test_fr_xx_xxi_menu_analytics(client):
    res = client.get("/api/analytics/menu")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["total_dishes"] == 156
    breakdown = data["classification_breakdown"]
    assert breakdown["Profit Driver"] == 22
    assert breakdown["Volume Driver"] == 41
    assert breakdown["Hidden Opportunity"] == 41
    assert breakdown["Low Performer"] == 52

    tricky = data["tricky_cases_diagnostics"]
    assert len(tricky) == 10

def test_fr_xxii_to_xxiv_customer_intelligence(client):
    res = client.get("/api/analytics/customers")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "rfm_summary" in data
    assert "segment_distribution" in data
    assert "churn_risk_distribution" in data

def test_fr_xxv_to_xxvii_market_basket(client):
    res = client.get("/api/analytics/market-basket")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "total_rules_mined" in data
    assert "curated_combo_meals" in data
    assert "digital_cross_sell_prompts" in data

def test_fr_xxviii_xxix_forecasting(client):
    res = client.get("/api/analytics/forecasting")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "evaluation_metrics" in data
    assert data["evaluation_metrics"]["dineiq_model"]["mae"] < 350.0
    assert data["evaluation_metrics"]["improvement"]["mae_reduction_pct"] > 0

def test_fr_xxx_to_xxxiv_wastage_and_promo_traps(client):
    res = client.get("/api/analytics/wastage-pricing")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "wastage_analytics" in data
    assert "price_intelligence" in data
    assert "promotion_evaluations" in data
    traps = [p for p in data["promotion_evaluations"] if "PROMOTION TRAP" in p["audit_diagnosis"]]
    assert len(traps) == 2
    assert len(data["wastage_analytics"]["critical_risk_dishes"]) >= 10

def test_fr_xxxv_to_xl_anomalies_and_locations(client):
    res = client.get("/api/analytics/anomalies")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "sales_anomalies" in data
    assert "rating_anomalies" in data

    loc_res = client.get("/api/analytics/locations")
    assert loc_res.status_code == 200

def test_fr_xlii_to_xlvi_dual_pipeline(client):
    res = client.get("/api/analytics/dual-pipeline")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["total_records_evaluated"] == 156
    assert data["match_count"] == 153
    assert data["mismatch_count"] == 3
    assert data["overall_agreement_pct"] == 98.08
    assert len(data["disagreements"]) == 3

def test_fr_xlvii_to_li_recommendations_and_whatif(client):
    rec_res = client.get("/api/analytics/recommendations")
    assert rec_res.status_code == 200
    recs = rec_res.get_json()["data"]
    assert len(recs) == 10

    sim_res = client.post("/api/analytics/what-if", json={
        "price_change_pct": 5.0,
        "cost_change_pct": 0.0,
        "volume_change_pct": 0.0,
        "elasticity": -1.2
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.get_json()["scenario"]
    assert "projected" in sim_data
    assert "impact" in sim_data

def test_fr_lviii_search(client):
    res = client.get("/api/search?q=Burger&entity=menu_items")
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] > 0

def test_fr_lix_lx_export_and_reports(client):
    exp_res = client.get("/api/export/menu_items?format=csv")
    assert exp_res.status_code == 200
    assert "text/csv" in exp_res.content_type

    rep_res = client.get("/api/reports/download/step9_10_11_menu_classification_report")
    assert rep_res.status_code == 200

def test_fr_lxi_to_lxv_governance_and_monitoring(client):
    models_res = client.get("/api/models")
    assert models_res.status_code == 200
    assert models_res.get_json()["count"] >= 3

    audit_res = client.get("/api/audit-logs")
    assert audit_res.status_code == 200
    assert audit_res.get_json()["count"] > 0

    jobs_res = client.get("/api/jobs")
    assert jobs_res.status_code == 200
    assert jobs_res.get_json()["count"] >= 8
