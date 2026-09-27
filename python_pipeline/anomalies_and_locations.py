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

def run_anomalies_and_locations():
    print("=" * 65)
    print("  DineIQ Analytics — Anomalies, Locations & Channel Economics")
    print("=" * 65)
    
    start_t = time.time()
    cleaned_parq = PARQUET_DATA_DIR / "cleaned"
    
                                                                   
                                                               
                                                                   
    print("\n--- Auditing Customer Ratings & Anomaly Patterns ---")
    ratings_df = pd.read_parquet(cleaned_parq / "ratings.parquet")
    menu_df = pd.read_parquet(cleaned_parq / "menu_items.parquet")
    
                      
    r_merged = ratings_df.merge(menu_df[["item_id", "item_name", "case_tag"]], on="item_id")
    r_merged["rating_dt"] = pd.to_datetime(r_merged["rating_date"])
    r_merged["rating_day"] = r_merged["rating_dt"].dt.date
    
                                                                            
    daily_item_ratings = r_merged.groupby(["item_id", "item_name", "rating_day", "rating"]).size().reset_index(name="count")
    rating_spikes = daily_item_ratings[daily_item_ratings["count"] >= 15].sort_values(by="count", ascending=False)
    
                                                                                                              
    item_rating_summary = r_merged.groupby(["item_id", "item_name", "case_tag"]).agg(
        avg_rating=("rating", "mean"),
        review_count=("rating_id", "count"),
        std_rating=("rating", "std")
    ).reset_index()
    item_rating_summary["avg_rating"] = item_rating_summary["avg_rating"].round(2)
    item_rating_summary["std_rating"] = item_rating_summary["std_rating"].round(2)
    
    flagged_rating_anomalies = []
                                                                 
    for _, r in rating_spikes.head(8).iterrows():
        flagged_rating_anomalies.append({
            "type": "REVIEW_CLUSTER_SPIKE",
            "item_id": r["item_id"],
            "item_name": r["item_name"],
            "date": str(r["rating_day"]),
            "rating_value": r["rating"],
            "review_burst_count": int(r["count"]),
            "diagnosis": f"Unusual burst of {r['count']} identical {r['rating']}-star ratings in a single 24h window."
        })
        
    print(f"  Ratings Analyzed: {len(r_merged):,d} records | Flagged Anomaly Clusters: {len(flagged_rating_anomalies)}")
    
                                                                   
                                      
                                                                   
    print("\n--- Sales Anomaly & Outlier Transaction Detection ---")
    orders_df = pd.read_parquet(cleaned_parq / "orders.parquet")
    completed_orders = orders_df[orders_df["order_status"] == "Completed"].copy()
    
                                                    
    q1 = completed_orders["total_amount"].quantile(0.25)
    q3 = completed_orders["total_amount"].quantile(0.75)
    iqr = q3 - q1
    high_threshold = round(q3 + (2.5 * iqr), 2)
    
    abnormal_high_orders = completed_orders[completed_orders["total_amount"] > high_threshold].sort_values(
        by="total_amount", ascending=False
    ).head(15)[["order_id", "customer_id", "restaurant_id", "order_datetime", "subtotal", "discount_amount", "total_amount"]]
    
                                       
    abnormal_zero_orders = completed_orders[completed_orders["total_amount"] <= 0.0]
    
    sales_anomalies = []
    for _, o in abnormal_high_orders.head(6).iterrows():
        sales_anomalies.append({
            "anomaly_type": "ABNORMAL_HIGH_BASKET_VALUE",
            "order_id": o["order_id"],
            "customer_id": o["customer_id"],
            "restaurant_id": o["restaurant_id"],
            "order_datetime": o["order_datetime"],
            "total_amount": o["total_amount"],
            "diagnosis": f"Order total (${o['total_amount']:,.2f}) exceeds 2.5x IQR threshold (${high_threshold:,.2f}). Potential catering or corporate banquet."
        })
    print(f"  Sales Anomalies Flagged: {len(abnormal_high_orders)} extreme baskets (> ${high_threshold:,.2f})")
    
                                                                   
                                         
                                                                   
    print("\n--- Multi-Factor Slow-Moving Dish Detection ---")
    menu_classified_df = pd.read_parquet(PARQUET_DATA_DIR / "menu_classified.parquet")
    
                                                                                                            
    vol_p20 = menu_classified_df["total_quantity_sold"].quantile(0.20)
    
    slow_movers_df = menu_classified_df[
        (menu_classified_df["total_quantity_sold"] <= vol_p20) &
        (menu_classified_df["performance_class"] == "Low Performer")
    ].sort_values(by="total_quantity_sold", ascending=True)
    
    slow_movers_list = []
    for _, sm in slow_movers_df.head(10).iterrows():
        slow_movers_list.append({
            "item_id": sm["item_id"],
            "item_name": sm["item_name"],
            "category_name": sm["category_name"],
            "units_sold": int(sm["total_quantity_sold"]),
            "revenue": float(sm["total_revenue"]),
            "wastage_cost": float(sm["total_waste_cost"]),
            "repeat_rate_pct": float(sm["repeat_purchase_rate"]),
            "case_tag": sm.get("case_tag", "NORMAL"),
            "corrective_action": "Deprecate from active menu to eliminate inventory holding cost."
        })
    print(f"  Slow-Moving Dishes Detected: {len(slow_movers_df)} items flagged.")
    
                                                                   
                                                                        
                                                                   
    print("\n--- Multi-Location Performance & Divergence ---")
    master_df = pd.read_parquet(PARQUET_DATA_DIR / "master_transactions.parquet", columns=[
        "restaurant_id", "restaurant_name", "city", "zone", "order_id", "line_total", "item_cost", "item_id", "item_name", "order_status"
    ])
    master_clean = master_df[master_df["order_status"] == "Completed"]
    
                       
    loc_summary = master_clean.groupby(["restaurant_id", "restaurant_name", "city", "zone"]).agg(
        orders_count=("order_id", "nunique"),
        total_revenue=("line_total", "sum"),
        total_profit=("line_total", lambda s: (s - master_clean.loc[s.index, "item_cost"]).sum())
    ).reset_index()
    loc_summary["avg_order_value"] = (loc_summary["total_revenue"] / loc_summary["orders_count"]).round(2)
    loc_summary["total_revenue"] = loc_summary["total_revenue"].round(2)
    loc_summary["total_profit"] = loc_summary["total_profit"].round(2)
    loc_summary = loc_summary.sort_values(by="total_revenue", ascending=False)
    
    top_store = loc_summary.iloc[0]
    bottom_store = loc_summary.iloc[-1]
    print(f"  Flagship Store: {top_store['restaurant_name']} (${top_store['total_revenue']:,.2f} Revenue | ${top_store['total_profit']:,.2f} Profit)")
    print(f"  Lowest Store  : {bottom_store['restaurant_name']} (${bottom_store['total_revenue']:,.2f} Revenue | ${bottom_store['total_profit']:,.2f} Profit)")
    
                                                                                    
    item_loc = master_clean.groupby(["restaurant_name", "item_id", "item_name"])["line_total"].sum().unstack(level=0, fill_value=0)
    
                                                                   
                                                    
                                                                   
    print("\n--- Ordering Channel Economic Analysis ---")
    orders_clean = completed_orders.copy()
    channel_comp = orders_clean.groupby("order_channel").agg(
        total_orders=("order_id", "count"),
        total_gross_revenue=("subtotal", "sum"),
        total_discounts_granted=("discount_amount", "sum"),
        total_net_revenue=("total_amount", "sum"),
        average_order_value=("total_amount", "mean")
    ).reset_index()
    
    channel_comp["total_gross_revenue"] = channel_comp["total_gross_revenue"].round(2)
    channel_comp["total_discounts_granted"] = channel_comp["total_discounts_granted"].round(2)
    channel_comp["total_net_revenue"] = channel_comp["total_net_revenue"].round(2)
    channel_comp["average_order_value"] = channel_comp["average_order_value"].round(2)
    channel_comp["discount_rate_pct"] = round((channel_comp["total_discounts_granted"] / channel_comp["total_gross_revenue"]) * 100, 1)
    
    print("Channel Economics Breakdown:")
    for _, ch in channel_comp.iterrows():
        print(f"  {ch['order_channel']:<25}: Orders={ch['total_orders']:>6,d} | Net Rev=${ch['total_net_revenue']:>11,.2f} | AOV=${ch['average_order_value']:>5.2f} | Disc={ch['discount_rate_pct']:>4.1f}%")
        
                 
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_data = {
        "module": "Anomalies, Slow Movers, Location & Channel Intelligence",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "rating_anomalies": flagged_rating_anomalies,
        "sales_anomalies": sales_anomalies,
        "slow_moving_dishes": slow_movers_list,
        "location_intelligence": {
            "top_performing_location": top_store.to_dict(),
            "lowest_performing_location": bottom_store.to_dict(),
            "all_locations_summary": loc_summary.to_dict(orient="records")
        },
        "channel_analysis": channel_comp.to_dict(orient="records")
    }
    
    json_path = REPORTS_DIR / "step29_35_anomalies_locations_channels_report.json"
    with open(json_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    md_path = REPORTS_DIR / "step29_35_anomalies_locations_channels_report.md"
    generate_markdown(report_data, md_path)
    
    print(f"\nReport written to: {json_path}")
    print(f"Markdown written to: {md_path}")
    print("\n>>> Anomalies & Locations Execution Completed Successfully! <<<\n")
    return report_data

def generate_markdown(rep, md_path: Path):
    lines = [
        "# DineIQ Analytics — Anomalies, Locations & Channel Economics Report",
        "*Multi-Location Surveillance, Rating Audits & Channel Analytics*",
        f"**Report Generated:** {rep['timestamp']}",
        "",
        "## 1. Rating & Sales Anomaly Detection",
        "### Detected Rating Bursts & Clusters",
        "| Dish Name | Date | Rating Score | Cluster Volume | Audit Flag |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ]
    for ra in rep["rating_anomalies"][:5]:
        lines.append(f"| **{ra['item_name']}** | {ra['date']} | {ra['rating_value']} Stars | {ra['review_burst_count']} reviews | `{ra['type']}` |")
        
    lines.extend([
        "",
        "### Abnormally High Sales Baskets (> 2.5x IQR)",
        "| Order ID | Customer ID | Store ID | Order Date | Basket Total | Audit Diagnosis |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for sa in rep["sales_anomalies"][:5]:
        lines.append(f"| `{sa['order_id']}` | `{sa['customer_id']}` | `{sa['restaurant_id']}` | {sa['order_datetime']} | **${sa['total_amount']:,.2f}** | {sa['diagnosis']} |")
        
    lines.extend([
        "",
        "## 2. Slow-Moving Dish Detection",
        "Dishes flagged by multi-factor screening (Bottom 20% volume, high waste, weak repeat purchase loyalty):",
        "",
        "| Dish Name | Category | Units Sold | Revenue | Waste Loss | Repeat Loyalty % | Corrective Action |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for sm in rep["slow_moving_dishes"][:6]:
        lines.append(f"| **{sm['item_name']}** | {sm['category_name']} | {sm['units_sold']} | ${sm['revenue']:,.2f} | ${sm['wastage_cost']:,.2f} | {sm['repeat_rate_pct']:.1f}% | {sm['corrective_action']} |")
        
    lines.extend([
        "",
        "## 3. Multi-Location Comparative Intelligence",
        "| Restaurant Location | City | Zone | Orders Count | Net Revenue | Total Profit | AOV |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for loc in rep["location_intelligence"]["all_locations_summary"][:8]:
        lines.append(f"| **{loc['restaurant_name']}** | {loc['city']} | {loc['zone']} | {loc['orders_count']:,} | ${loc['total_revenue']:,.2f} | ${loc['total_profit']:,.2f} | ${loc['avg_order_value']:.2f} |")
        
    lines.extend([
        "",
        "## 4. Ordering Channel Comparative Economics",
        "| Channel | Completed Orders | Net Revenue | Avg Order Value | Promo Discount Rate |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    for ch in rep["channel_analysis"]:
        lines.append(f"| **{ch['order_channel']}** | {ch['total_orders']:,} | ${ch['total_net_revenue']:,.2f} | **${ch['average_order_value']:.2f}** | {ch['discount_rate_pct']}% |")
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_anomalies_and_locations()
