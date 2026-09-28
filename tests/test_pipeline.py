import sys
import os
import json
import pytest
import pandas as pd
import numpy as np
from pathlib import Path

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    RAW_DATA_DIR, PARQUET_DATA_DIR, PROCESSED_DATA_DIR,
    QUARANTINE_DIR, REPORTS_DIR, DATABASE_DIR,
    CLASS_PROFIT_DRIVER, CLASS_VOLUME_DRIVER, CLASS_HIDDEN_OPPORTUNITY, CLASS_LOW_PERFORMER
)

class TestDineIQBigDataPipeline:
    
    def test_step1_dataset_generation_scale(self):
        orders_csv = RAW_DATA_DIR / "orders.csv"
        order_items_csv = RAW_DATA_DIR / "order_items.csv"
        customers_csv = RAW_DATA_DIR / "customers.csv"
        menu_items_csv = RAW_DATA_DIR / "menu_items.csv"
        
        assert orders_csv.exists(), "orders.csv must exist in raw_data"
        assert order_items_csv.exists(), "order_items.csv must exist in raw_data"
        
                                    
        df_orders = pd.read_csv(orders_csv, usecols=["order_id"])
        df_items = pd.read_csv(order_items_csv, usecols=["order_item_id"])
        df_cust = pd.read_csv(customers_csv, usecols=["customer_id"])
        df_menu = pd.read_csv(menu_items_csv, usecols=["item_id"])
        
        assert len(df_orders) >= 100_000, f"Expected >= 100k orders, got {len(df_orders)}"
        assert len(df_items) >= 1_000_000, f"Expected >= 1M order items, got {len(df_items)}"
        assert len(df_cust) >= 50_000, f"Expected >= 50k customers, got {len(df_cust)}"
        assert len(df_menu) >= 150, f"Expected >= 150 menu items, got {len(df_menu)}"

    def test_step2_big_data_storage(self):
        parq_items = PARQUET_DATA_DIR / "order_items.parquet"
        db_file = DATABASE_DIR / "dineiq.db"
        
        assert parq_items.exists(), "order_items.parquet must exist"
        assert db_file.exists(), "Relational SQLite database must exist"
        assert os.path.getsize(parq_items) > 5 * 1024 * 1024, "Parquet file must be properly populated"

    def test_step4_and_5_data_quality_and_cleaning(self):
        neg_quarantine = QUARANTINE_DIR / "quarantined_negative_quantities.csv"
        waste_quarantine = QUARANTINE_DIR / "quarantined_impossible_wastage.csv"
        cleaned_items_parq = PARQUET_DATA_DIR / "cleaned" / "order_items.parquet"
        
        assert neg_quarantine.exists(), "Negative quantities quarantine file must exist"
        assert waste_quarantine.exists(), "Impossible wastage quarantine file must exist"
        
                                                                      
        df_cleaned = pd.read_parquet(cleaned_items_parq, columns=["quantity"])
        assert (df_cleaned["quantity"] < 0).sum() == 0, "Cleaned dataset must contain zero negative quantities"

    def test_step6_and_7_data_integration_and_features(self):
        master_parq = PARQUET_DATA_DIR / "master_transactions.parquet"
        menu_feat_parq = PARQUET_DATA_DIR / "menu_item_features.parquet"
        cust_rfm_parq = PARQUET_DATA_DIR / "customer_rfm_features.parquet"
        
        assert master_parq.exists(), "master_transactions.parquet must exist"
        assert menu_feat_parq.exists(), "menu_item_features.parquet must exist"
        assert cust_rfm_parq.exists(), "customer_rfm_features.parquet must exist"
        
        df_menu_feat = pd.read_parquet(menu_feat_parq)
        assert len(df_menu_feat) >= 150
        assert "actual_profit_margin_pct" in df_menu_feat.columns
        assert "repeat_purchase_rate" in df_menu_feat.columns
        assert "wastage_pct" in df_menu_feat.columns

    def test_step10_and_11_menu_classification_and_tricky_cases(self):
        classified_parq = PARQUET_DATA_DIR / "menu_classified.parquet"
        assert classified_parq.exists(), "menu_classified.parquet must exist"
        
        df = pd.read_parquet(classified_parq)
        classes = set(df["performance_class"].unique())
        expected_classes = {CLASS_PROFIT_DRIVER, CLASS_VOLUME_DRIVER, CLASS_HIDDEN_OPPORTUNITY, CLASS_LOW_PERFORMER}
        assert expected_classes.issubset(classes), "All 4 menu performance classes must be populated"
        
                                                                                      
        loss_maker = df[df["case_tag"] == "TRICKY_LOSS_MAKER"]
        assert len(loss_maker) > 0
        assert loss_maker.iloc[0]["performance_class"] == CLASS_LOW_PERFORMER

    def test_step14_dual_pipeline_verification(self):
        report_file = REPORTS_DIR / "dual_pipeline_verification_report.json"
        assert report_file.exists(), "Dual pipeline verification report must exist"
        
        with open(report_file, "r") as f:
            data = json.load(f)
            
        assert data["total_records_evaluated"] >= 100, "Must evaluate >= 100 records"
        assert data["overall_agreement_pct"] >= 85.0, "Agreement percentage must exceed 85%"
        assert len(data["disagreements"]) > 0, "Must have explainable disagreement cases documented"

    def test_step17_and_18_market_basket(self):
        report_file = REPORTS_DIR / "step17_18_market_basket_report.json"
        assert report_file.exists(), "Market basket report must exist"
        
        with open(report_file, "r") as f:
            data = json.load(f)
            
        assert len(data["curated_combo_meals"]) >= 5
        for combo in data["curated_combo_meals"]:
            assert combo["lift"] > 1.0, "Combos must be backed by positive association lift"

    def test_step21_and_22_forecasting_evaluation(self):
        report_file = REPORTS_DIR / "step19_22_forecasting_report.json"
        assert report_file.exists(), "Forecasting report must exist"
        
        with open(report_file, "r") as f:
            data = json.load(f)
            
        mae_imp = data["evaluation_metrics"]["improvement"]["mae_reduction_pct"]
        assert mae_imp > 0.0, "Forecast ML model must demonstrate lower MAE than baseline persistence"

    def test_step37_to_41_recommendations_and_whatif(self):
        report_file = REPORTS_DIR / "step37_41_recommendations_and_whatif_report.json"
        assert report_file.exists(), "Recommendations report must exist"
        
        with open(report_file, "r") as f:
            data = json.load(f)
            
        assert len(data["recommendations"]) >= 5
        for rec in data["recommendations"]:
            assert len(rec["evidence"]) >= 2, "Every recommendation must have explicit analytical evidence"
            assert rec["priority"] in ["Critical", "High", "Medium", "Low"]
            
        assert len(data["what_if_scenarios"]) >= 3
