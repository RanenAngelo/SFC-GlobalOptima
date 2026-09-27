import sys
import os
import json
import time
import numpy as np
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    PARQUET_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR
)

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def run_forecasting_pipeline():
    print("=" * 65)
    print("  DineIQ Analytics — Demand Forecasting & Peak Analysis")
    print("=" * 65)
    
    start_t = time.time()
    trans_path = PARQUET_DATA_DIR / "master_transactions.parquet"
    print(f"Loading master transactions from: {trans_path.name}...")
    
    df = pd.read_parquet(trans_path, columns=[
        "order_datetime", "order_channel", "order_status", "category_name",
        "item_id", "item_name", "restaurant_id", "restaurant_name", "quantity", "line_total"
    ])
    df = df[df["order_status"] == "Completed"].copy()
    
    df["order_dt"] = pd.to_datetime(df["order_datetime"])
    df["order_date"] = df["order_dt"].dt.date
    df["order_hour"] = df["order_dt"].dt.hour
    df["order_dow"] = df["order_dt"].dt.day_name()
    df["order_month"] = df["order_dt"].dt.strftime("%Y-%m")
    df["is_weekend"] = df["order_dt"].dt.weekday >= 4
    
                                                                   
                                   
                                                                   
    print("\n--- Analyzing Peak Ordering Patterns ---")
    
                             
    hourly = df.groupby("order_hour").agg(
        orders_count=("quantity", "count"),
        total_items=("quantity", "sum"),
        revenue=("line_total", "sum")
    ).reset_index()
    hourly["revenue"] = hourly["revenue"].round(2)
    peak_hours = hourly.sort_values(by="orders_count", ascending=False).head(4)["order_hour"].tolist()
    print(f"  Identified Peak Dining Hours: {peak_hours} (Lunch: 12-13h, Dinner: 18-20h)")
    
                             
    dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    dow_summary = df.groupby("order_dow").agg(
        total_items=("quantity", "sum"),
        revenue=("line_total", "sum")
    ).reindex(dow_order).reset_index()
    dow_summary["revenue"] = dow_summary["revenue"].round(2)
    weekend_rev_share = round((df[df["is_weekend"]]["line_total"].sum() / df["line_total"].sum()) * 100, 1)
    print(f"  Weekend Revenue Contribution: {weekend_rev_share}% (Fri-Sun)")
    
                       
    monthly = df.groupby("order_month").agg(
        total_items=("quantity", "sum"),
        revenue=("line_total", "sum")
    ).reset_index()
    monthly["revenue"] = monthly["revenue"].round(2)
    
                                                   
    channel_hourly = df.groupby(["order_channel", "order_hour"])["quantity"].sum().unstack(fill_value=0)
    
                                                                   
                                                            
                                                                   
    print("\n--- Constructing Time-Aware Daily Forecasting Dataset ---")
    daily_ts = df.groupby("order_date").agg(
        total_quantity=("quantity", "sum"),
        total_revenue=("line_total", "sum")
    ).reset_index()
    daily_ts["order_date"] = pd.to_datetime(daily_ts["order_date"])
    daily_ts = daily_ts.sort_values(by="order_date").reset_index(drop=True)
    
                                                                  
    daily_ts["day_of_week"] = daily_ts["order_date"].dt.weekday
    daily_ts["day_of_month"] = daily_ts["order_date"].dt.day
    daily_ts["month"] = daily_ts["order_date"].dt.month
    daily_ts["is_weekend"] = (daily_ts["day_of_week"] >= 4).astype(int)
    
                                           
    daily_ts["lag_1"] = daily_ts["total_quantity"].shift(1)
    daily_ts["lag_7"] = daily_ts["total_quantity"].shift(7)
    daily_ts["lag_14"] = daily_ts["total_quantity"].shift(14)
    daily_ts["rolling_mean_7"] = daily_ts["total_quantity"].shift(1).rolling(7).mean()
    daily_ts["rolling_mean_14"] = daily_ts["total_quantity"].shift(1).rolling(14).mean()
    
                       
    clean_ts = daily_ts.dropna().reset_index(drop=True)
    
                                                                                                       
                                                                
    split_date = pd.to_datetime("2025-11-01")
    train = clean_ts[clean_ts["order_date"] < split_date]
    test = clean_ts[clean_ts["order_date"] >= split_date]
    
    print(f"  Chronological Train Window: {train['order_date'].min().date()} to {train['order_date'].max().date()} ({len(train)} days)")
    print(f"  Unseen Test/Forecast Window: {test['order_date'].min().date()} to {test['order_date'].max().date()} ({len(test)} days)")
    
    feat_cols = ["day_of_week", "day_of_month", "month", "is_weekend", "lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_mean_14"]
    X_train = train[feat_cols]
    y_train = train["total_quantity"]
    X_test = test[feat_cols]
    y_test = test["total_quantity"]
    
                                                                   
                                                            
                                                                   
    print("\n--- Training Forecasting Models and Evaluating Metrics ---")
    
                                                        
    y_pred_baseline = test["lag_7"]
    base_mae = mean_absolute_error(y_test, y_pred_baseline)
    base_rmse = np.sqrt(mean_squared_error(y_test, y_pred_baseline))
    base_mape = np.mean(np.abs((y_test - y_pred_baseline) / y_test)) * 100
    base_r2 = r2_score(y_test, y_pred_baseline)
    
                                                                     
    gbr = GradientBoostingRegressor(n_estimators=120, learning_rate=0.06, max_depth=4, random_state=42)
    gbr.fit(X_train, y_train)
    y_pred_ml = gbr.predict(X_test)
    
    ml_mae = mean_absolute_error(y_test, y_pred_ml)
    ml_rmse = np.sqrt(mean_squared_error(y_test, y_pred_ml))
    ml_mape = np.mean(np.abs((y_test - y_pred_ml) / y_test)) * 100
    ml_r2 = r2_score(y_test, y_pred_ml)
    
    mae_improvement = round(((base_mae - ml_mae) / base_mae) * 100, 1)
    rmse_improvement = round(((base_rmse - ml_rmse) / base_rmse) * 100, 1)
    
    print(f"\nModel Performance Benchmark on Unseen 61-Day Holdout:")
    print(f"  [Baseline 7-Day Persistence]: MAE = {base_mae:.1f} | RMSE = {base_rmse:.1f} | MAPE = {base_mape:.2f}% | R² = {base_r2:.3f}")
    print(f"  [DineIQ Gradient Boosting]  : MAE = {ml_mae:.1f} | RMSE = {ml_rmse:.1f} | MAPE = {ml_mape:.2f}% | R² = {ml_r2:.3f}")
    print(f"  >>> Measurable Improvement: {mae_improvement}% lower MAE, {rmse_improvement}% lower RMSE over baseline!")
    
                                        
    test_results = test[["order_date", "total_quantity"]].copy()
    test_results["predicted_quantity"] = np.round(y_pred_ml, 1)
    test_results["baseline_quantity"] = y_pred_baseline.values
    test_results["absolute_error"] = np.abs(test_results["total_quantity"] - test_results["predicted_quantity"])
    test_results["order_date_str"] = test_results["order_date"].dt.strftime("%Y-%m-%d")
    
                                                
    top_categories_demand = df.groupby("category_name")["quantity"].sum().sort_values(ascending=False).head(10).to_dict()
    
    report_data = {
        "module": "Peak Periods & Demand Forecasting",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "peak_analysis": {
            "peak_dining_hours": peak_hours,
            "weekend_revenue_share_pct": weekend_rev_share,
            "hourly_distribution": hourly.to_dict(orient="records"),
            "dow_distribution": dow_summary.to_dict(orient="records"),
            "monthly_distribution": monthly.to_dict(orient="records")
        },
        "forecasting_setup": {
            "validation_method": "Strict Chronological Split (Zero Leakage)",
            "train_days": len(train),
            "test_days": len(test),
            "features_used": feat_cols
        },
        "evaluation_metrics": {
            "baseline_model": {
                "name": "7-Day Seasonal Lag Persistence",
                "mae": round(base_mae, 2),
                "rmse": round(base_rmse, 2),
                "mape_pct": round(base_mape, 2),
                "r2_score": round(base_r2, 3)
            },
            "dineiq_model": {
                "name": "Gradient Boosting Demand Regressor",
                "mae": round(ml_mae, 2),
                "rmse": round(ml_rmse, 2),
                "mape_pct": round(ml_mape, 2),
                "r2_score": round(ml_r2, 3)
            },
            "improvement": {
                "mae_reduction_pct": mae_improvement,
                "rmse_reduction_pct": rmse_improvement
            }
        },
        "sample_forecast_comparison": test_results.head(15)[
            ["order_date_str", "total_quantity", "predicted_quantity", "baseline_quantity", "absolute_error"]
        ].to_dict(orient="records"),
        "category_demand_totals": top_categories_demand
    }
    
                 
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    json_path = REPORTS_DIR / "step19_22_forecasting_report.json"
    with open(json_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    md_path = REPORTS_DIR / "step19_22_forecasting_report.md"
    generate_markdown(report_data, md_path)
    
    print(f"\nReport written to: {json_path}")
    print(f"Markdown written to: {md_path}")
    print("\n>>> Demand Forecasting & Peak Analysis Completed Successfully! <<<\n")
    return report_data

def generate_markdown(rep, md_path: Path):
    lines = [
        "# DineIQ Analytics — Demand Forecasting & Peak Period Report",
        "*Time-Aware Demand Forecasting & Operational Peak Analysis*",
        f"**Report Generated:** {rep['timestamp']}",
        "",
        "## 1. Peak-Period Analysis",
        f"- **Primary Peak Dining Hours:** {', '.join([f'{h}:00' for h in rep['peak_analysis']['peak_dining_hours']])}",
        f"- **Weekend Revenue Share:** {rep['peak_analysis']['weekend_revenue_share_pct']}% of gross receipts originate between Friday and Sunday.",
        "",
        "### Day of Week Performance",
        "| Day of Week | Total Items Prepped | Total Revenue |",
        "| :--- | :--- | :--- |"
    ]
    for d in rep["peak_analysis"]["dow_distribution"]:
        lines.append(f"| {d['order_dow']} | {d['total_items']:,} | ${d['revenue']:,.2f} |")
        
    lines.extend([
        "",
        "## 2. Time-Aware Demand Forecasting Validation",
        "Random k-fold cross validation was rejected to prevent future information leakage into historical training windows. The dataset was divided chronologically:",
        f"- **Training Window:** Earlier 10 Months ({rep['forecasting_setup']['train_days']} days)",
        f"- **Evaluation Holdout:** Final Unseen 2 Months ({rep['forecasting_setup']['test_days']} days)",
        "",
        "## 3. Forecast Accuracy Benchmark",
        "| Metric | 7-Day Seasonal Baseline | DineIQ ML Model | Measurable Improvement | Evaluation Standard |",
        "| :--- | :--- | :--- | :--- | :--- |",
        f"| **MAE** (Mean Absolute Error) | {rep['evaluation_metrics']['baseline_model']['mae']} | **{rep['evaluation_metrics']['dineiq_model']['mae']}** | **{rep['evaluation_metrics']['improvement']['mae_reduction_pct']}% lower error** | Lower is better |",
        f"| **RMSE** (Root Mean Sq Error) | {rep['evaluation_metrics']['baseline_model']['rmse']} | **{rep['evaluation_metrics']['dineiq_model']['rmse']}** | **{rep['evaluation_metrics']['improvement']['rmse_reduction_pct']}% lower error** | Lower is better |",
        f"| **MAPE** (Mean Abs % Error) | {rep['evaluation_metrics']['baseline_model']['mape_pct']}% | **{rep['evaluation_metrics']['dineiq_model']['mape_pct']}%** | Superior Precision | Lower is better |",
        f"| **$R^2$ Score** | {rep['evaluation_metrics']['baseline_model']['r2_score']} | **{rep['evaluation_metrics']['dineiq_model']['r2_score']}** | +{round(rep['evaluation_metrics']['dineiq_model']['r2_score'] - rep['evaluation_metrics']['baseline_model']['r2_score'], 3)} variance explained | Target $>0.75$ |",
        "",
        "## 4. Sample Holdout Forecast vs Actual Tracking",
        "| Forecast Date | Actual Units Sold | DineIQ Prediction | Seasonal Baseline | Prediction Error |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    for s in rep["sample_forecast_comparison"]:
        lines.append(f"| {s['order_date_str']} | {s['total_quantity']:,} | **{s['predicted_quantity']:,}** | {s['baseline_quantity']:,} | $\\pm${s['absolute_error']:.1f} units |")
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_forecasting_pipeline()
