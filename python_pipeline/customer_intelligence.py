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
    PARQUET_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR,
    CUSTOMER_SEGMENTS, SEGMENT_HIGH_VALUE_LOYAL, SEGMENT_FREQUENT,
    SEGMENT_PROMO_DRIVEN, SEGMENT_AT_RISK, SEGMENT_NEW, SEGMENT_OCCASIONAL
)

def run_customer_intelligence():
    print("=" * 65)
    print("  DineIQ Analytics — Customer Intelligence & Churn Analysis")
    print("=" * 65)
    
    start_t = time.time()
    rfm_path = PARQUET_DATA_DIR / "customer_rfm_features.parquet"
    df = pd.read_parquet(rfm_path)
    print(f"Loaded {len(df):,d} customer profiles from: {rfm_path.name}")
    
                                                                           
    df["recency_days"] = df["recency_days"].fillna(365).astype(int)
    df["frequency"] = df["frequency"].fillna(0).astype(int)
    df["monetary_value"] = df["monetary_value"].fillna(0.0)
    df["avg_order_value"] = df["avg_order_value"].fillna(0.0)
    
                                                                       
    df["R_Score"] = pd.qcut(df["recency_days"].rank(method="first"), 5, labels=[5, 4, 3, 2, 1]).astype(int)
                                                                         
    df["F_Score"] = pd.qcut(df["frequency"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]).astype(int)
                                                                       
    df["M_Score"] = pd.qcut(df["monetary_value"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]).astype(int)
    
    df["RFM_Composite"] = df["R_Score"].astype(str) + df["F_Score"].astype(str) + df["M_Score"].astype(str)
    df["RFM_Index"] = (df["R_Score"] * 0.25) + (df["F_Score"] * 0.35) + (df["M_Score"] * 0.40)
    
                                                                   
                                               
                                                                   
    print("\n--- Assigning Behavioral Customer Segments ---")
    def assign_segment(row):
        r, f, m = row["R_Score"], row["F_Score"], row["M_Score"]
        monetary = row["monetary_value"]
        freq = row["frequency"]
        
                                                              
        if r >= 4 and f >= 4 and m >= 4:
            return SEGMENT_HIGH_VALUE_LOYAL
                                                                                              
        if r <= 2 and (f >= 3 or m >= 3):
            return SEGMENT_AT_RISK
                                                  
        if f >= 4:
            return SEGMENT_FREQUENT
                                                    
        if r >= 4 and f <= 2:
            return SEGMENT_NEW
                                                     
        if row.get("segment_label") == "Promotion-Driven":
            return SEGMENT_PROMO_DRIVEN
                              
        return SEGMENT_OCCASIONAL
        
    df["computed_segment"] = df.apply(assign_segment, axis=1)
    seg_breakdown = df["computed_segment"].value_counts().to_dict()
    
    print("Customer Segmentation Distribution:")
    for seg, cnt in seg_breakdown.items():
        print(f"  {seg:<22}: {cnt:>6,d} customers ({cnt/len(df)*100:>5.1f}%)")
        
                                                                   
                                                 
                                                                   
    print("\n--- Evaluating Churn Risk ---")
                                                                                                           
    def calculate_churn_risk(row):
        rec_days = row["recency_days"]
        r = row["R_Score"]
        f = row["F_Score"]
        
        if rec_days > 180 or (r == 1 and f >= 3):
            return "CRITICAL_CHURN_RISK"
        elif rec_days > 90 or (r == 2 and f >= 3):
            return "HIGH_CHURN_RISK"
        elif rec_days > 45:
            return "MODERATE_CHURN_RISK"
        else:
            return "ACTIVE_ENGAGED"
            
    df["churn_risk_level"] = df.apply(calculate_churn_risk, axis=1)
    churn_breakdown = df["churn_risk_level"].value_counts().to_dict()
    
    print("Churn Risk Levels:")
    for risk, cnt in churn_breakdown.items():
        print(f"  {risk:<22}: {cnt:>6,d} customers ({cnt/len(df)*100:>5.1f}%)")
        
                                 
    high_value_churners = df[(df["churn_risk_level"].isin(["CRITICAL_CHURN_RISK", "HIGH_CHURN_RISK"])) & (df["monetary_value"] >= 500.0)].sort_values(by="monetary_value", ascending=False).head(15)[
        ["customer_id", "full_name", "monetary_value", "frequency", "recency_days", "churn_risk_level"]
    ].to_dict(orient="records")
    
                                   
    save_parq = PARQUET_DATA_DIR / "customer_intelligence.parquet"
    df.to_parquet(save_parq, index=False)
    
    save_csv = PROCESSED_DATA_DIR / "features" / "customer_intelligence.csv"
    df.head(5000).to_csv(save_csv, index=False)                             
    
                     
    report_data = {
        "module": "Customer Intelligence & Churn Analysis",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_customers": len(df),
        "rfm_summary": {
            "avg_recency_days": round(float(df["recency_days"].mean()), 1),
            "avg_frequency_orders": round(float(df["frequency"].mean()), 2),
            "avg_monetary_spend": round(float(df["monetary_value"].mean()), 2),
            "avg_order_value": round(float(df["avg_order_value"].mean()), 2)
        },
        "segment_distribution": seg_breakdown,
        "churn_risk_distribution": churn_breakdown,
        "top_at_risk_high_value_customers": high_value_churners
    }
    
    json_path = REPORTS_DIR / "step15_16_36_customer_intelligence_report.json"
    with open(json_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    md_path = REPORTS_DIR / "step15_16_36_customer_intelligence_report.md"
    generate_markdown(report_data, md_path)
    
    print(f"\nReport written to: {json_path}")
    print(f"Markdown written to: {md_path}")
    print("\n>>> Customer Intelligence Execution Completed Successfully! <<<\n")
    return report_data

def generate_markdown(rep, md_path: Path):
    lines = [
        "# DineIQ Analytics — Customer Intelligence, RFM & Churn Report",
        "*Enterprise Behavioral Segmentation & Predictive Churn Surveillance*",
        f"**Audit Execution Time:** {rep['timestamp']}",
        "",
        "## 1. Portfolio RFM Overview",
        f"- **Total Customer Profiles:** {rep['total_customers']:,}",
        f"- **Average Recency:** {rep['rfm_summary']['avg_recency_days']} days",
        f"- **Average Completed Orders:** {rep['rfm_summary']['avg_frequency_orders']} visits/year",
        f"- **Average Annual Spend:** ${rep['rfm_summary']['avg_monetary_spend']:,.2f}",
        f"- **Average Order Value (AOV):** ${rep['rfm_summary']['avg_order_value']:.2f}",
        "",
        "## 2. Behavioral Customer Segmentation",
        "| Customer Segment | Total Members | % of Customer Base | Actionable Engagement Strategy |",
        "| :--- | :--- | :--- | :--- |"
    ]
    strategies = {
        SEGMENT_HIGH_VALUE_LOYAL: "VIP concierge, chef tasting previews, exclusive reservations.",
        SEGMENT_FREQUENT: "Tiered loyalty point multipliers, mid-week dining incentives.",
        SEGMENT_PROMO_DRIVEN: "Bundle meals, conditional threshold discounts ($10 off $50+).",
        SEGMENT_AT_RISK: "Win-back personalized re-engagement campaigns, complimentary dessert voucher.",
        SEGMENT_NEW: "Second-visit bonus reward within 14 days of signup.",
        SEGMENT_OCCASIONAL: "Seasonal event invitations, holiday booking reminders."
    }
    for seg, cnt in rep["segment_distribution"].items():
        pct = round((cnt / rep["total_customers"]) * 100, 1)
        strat = strategies.get(seg, "Targeted engagement.")
        lines.append(f"| **{seg}** | {cnt:,} | {pct}% | {strat} |")
        
    lines.extend([
        "",
        "## 3. Customer Churn-Risk Distribution",
        "| Churn Risk Tier | Customer Count | Risk Profile & Description |",
        "| :--- | :--- | :--- |"
    ])
    for risk, cnt in rep["churn_risk_distribution"].items():
        lines.append(f"| `{risk}` | {cnt:,} | Recency gap analysis flagged for proactive retention |")
        
    lines.extend([
        "",
        "## 4. Top At-Risk High-Value Customers (Critical Retention Priority)",
        "| Customer ID | Name | Lifetime Spend | Completed Orders | Days Since Last Order | Churn Level |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for c in rep["top_at_risk_high_value_customers"]:
        lines.append(f"| `{c['customer_id']}` | {c['full_name']} | ${c['monetary_value']:,.2f} | {c['frequency']} | {c['recency_days']} days | `{c['churn_risk_level']}` |")
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_customer_intelligence()
