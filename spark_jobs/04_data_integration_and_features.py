import sys
import os
import json
import time
from pathlib import Path
import pandas as pd

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    PARQUET_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR,
    JAVA_HOME, HADOOP_HOME
)

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

def get_spark_session(app_name="DineIQ-Integration-Features-EDA"):
    py_executable = sys.executable
    os.environ["PYSPARK_PYTHON"] = py_executable
    os.environ["PYSPARK_DRIVER_PYTHON"] = py_executable
    os.environ["JAVA_HOME"] = JAVA_HOME
    os.environ["HADOOP_HOME"] = HADOOP_HOME

    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.shuffle.partitions", "8") \
        .getOrCreate()
        
    spark.sparkContext.setLogLevel("ERROR")
    return spark

def run_pipeline():
    print("=" * 65)
    print("  DineIQ Analytics — Steps 6, 7 & 8: Integration, Features & EDA")
    print("=" * 65)
    
    start_t = time.time()
    spark = get_spark_session()
    
    cleaned_parq = PARQUET_DATA_DIR / "cleaned"
    features_dir = PROCESSED_DATA_DIR / "features"
    features_dir.mkdir(parents=True, exist_ok=True)
    
                                                                   
                                          
                                                                   
    print("\n--- Registering Cleaned Tables and Performing Spark SQL Joins ---")
    tables = [
        "menu_categories", "restaurants", "menu_items", "customers",
        "pricing_history", "promotions", "orders", "order_items",
        "ratings", "inventory", "wastage"
    ]
    for tbl in tables:
        df = spark.read.parquet(str(cleaned_parq / f"{tbl}.parquet"))
        df.createOrReplaceTempView(tbl)
        print(f"  Registered Spark View: `{tbl}` ({df.count():,d} rows)")
        
                                      
    sql_path = PROJECT_ROOT / "spark_sql" / "01_data_integration.sql"
    with open(sql_path, "r") as f:
        sql_content = f.read()
    spark.sql(sql_content)
    
    master_df = spark.sql("SELECT * FROM v_master_transactions")
    master_count = master_df.count()
    print(f"  Master Transaction View created successfully! Count: {master_count:,d} lines")
    
                                            
    master_parq_path = PARQUET_DATA_DIR / "master_transactions.parquet"
    master_df.write.mode("overwrite").parquet(str(master_parq_path))
    print(f"  Persisted master dataset -> {master_parq_path.name}")
    
                                                                   
                                 
                                                                   
    print("\n--- Computing Menu Item & Customer Features ---")
    feat_sql_path = PROJECT_ROOT / "spark_sql" / "02_feature_engineering.sql"
    with open(feat_sql_path, "r") as f:
        feat_sql_content = f.read()
    spark.sql(feat_sql_content)
    
    menu_features_df = spark.sql("SELECT * FROM v_menu_item_features")
    menu_feat_count = menu_features_df.count()
    print(f"  Menu Item Features generated: {menu_feat_count} dishes")
    
                        
    menu_feat_parq = PARQUET_DATA_DIR / "menu_item_features.parquet"
    menu_features_df.write.mode("overwrite").parquet(str(menu_feat_parq))
    menu_feat_pd = menu_features_df.toPandas()
    menu_feat_pd.to_csv(features_dir / "menu_item_features.csv", index=False)
    
                                      
    print("  Computing Customer RFM (Recency, Frequency, Monetary) Features...")
    rfm_sql = """
    WITH cust_orders AS (
        SELECT
            customer_id,
            COUNT(DISTINCT order_id) AS frequency,
            ROUND(SUM(total_amount), 2) AS monetary_value,
            ROUND(AVG(total_amount), 2) AS avg_order_value,
            MAX(order_datetime) AS last_order_dt,
            MIN(order_datetime) AS first_order_dt
        FROM orders
        WHERE order_status = 'Completed'
        GROUP BY customer_id
    )
    SELECT
        c.customer_id,
        c.full_name,
        c.segment_label,
        c.preferred_channel,
        COALESCE(co.frequency, 0) AS frequency,
        COALESCE(co.monetary_value, 0.0) AS monetary_value,
        COALESCE(co.avg_order_value, 0.0) AS avg_order_value,
        co.last_order_dt,
        DATEDIFF('2025-12-31', SUBSTRING(co.last_order_dt, 1, 10)) AS recency_days
    FROM customers c
    LEFT JOIN cust_orders co ON c.customer_id = co.customer_id
    """
    customer_rfm_df = spark.sql(rfm_sql)
    customer_rfm_df.write.mode("overwrite").parquet(str(PARQUET_DATA_DIR / "customer_rfm_features.parquet"))
    customer_rfm_pd = customer_rfm_df.toPandas()
    customer_rfm_pd.to_csv(features_dir / "customer_rfm_features.csv", index=False)
    print(f"  Customer RFM Features computed: {len(customer_rfm_pd):,d} customer profiles")
    
                                                                   
                                             
                                                                   
    print("\n--- Executing Exploratory Data Analysis (EDA) ---")
    
                                      
    top_selling = menu_feat_pd.sort_values(by="total_quantity_sold", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "total_quantity_sold", "total_revenue", "actual_profit_margin_pct", "case_tag"]
    ].to_dict(orient="records")
    
    lowest_selling = menu_feat_pd.sort_values(by="total_quantity_sold", ascending=True).head(10)[
        ["item_id", "item_name", "category_name", "total_quantity_sold", "total_revenue", "actual_profit_margin_pct", "case_tag"]
    ].to_dict(orient="records")
    
                                                
    top_revenue = menu_feat_pd.sort_values(by="total_revenue", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "total_revenue", "total_profit", "actual_profit_margin_pct"]
    ].to_dict(orient="records")
    
    top_profit = menu_feat_pd.sort_values(by="total_profit", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "total_profit", "total_revenue", "actual_profit_margin_pct"]
    ].to_dict(orient="records")
    
                                                      
    highest_margin = menu_feat_pd.sort_values(by="actual_profit_margin_pct", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "base_price", "cost_price", "actual_profit_margin_pct", "case_tag"]
    ].to_dict(orient="records")
    
    lowest_margin = menu_feat_pd.sort_values(by="actual_profit_margin_pct", ascending=True).head(10)[
        ["item_id", "item_name", "category_name", "base_price", "cost_price", "actual_profit_margin_pct", "case_tag"]
    ].to_dict(orient="records")
    
                            
    high_wastage = menu_feat_pd.sort_values(by="total_waste_cost", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "total_waste_qty", "total_waste_cost", "wastage_pct", "case_tag"]
    ].to_dict(orient="records")
    
                                          
    best_rated = menu_feat_pd[menu_feat_pd["rating_count"] >= 100].sort_values(by="avg_rating", ascending=False).head(10)[
        ["item_id", "item_name", "category_name", "avg_rating", "rating_count", "actual_profit_margin_pct", "case_tag"]
    ].to_dict(orient="records")
    
    poorly_rated = menu_feat_pd[menu_feat_pd["rating_count"] >= 100].sort_values(by="avg_rating", ascending=True).head(10)[
        ["item_id", "item_name", "category_name", "avg_rating", "rating_count", "total_quantity_sold", "case_tag"]
    ].to_dict(orient="records")
    
                                
    cat_summary = spark.sql("""
        SELECT
            cat.category_name,
            COUNT(DISTINCT oi.order_id) AS order_count,
            SUM(oi.quantity) AS total_qty,
            ROUND(SUM(oi.line_total), 2) AS category_revenue,
            ROUND(SUM(oi.line_total - oi.item_cost), 2) AS category_profit
        FROM v_master_transactions oi
        INNER JOIN menu_categories cat ON oi.category_id = cat.category_id
        WHERE oi.order_status = 'Completed'
        GROUP BY cat.category_name
        ORDER BY category_revenue DESC
    """).toPandas().to_dict(orient="records")
    
                                        
    hourly_trends = spark.sql("""
        SELECT
            order_hour,
            COUNT(DISTINCT order_id) AS total_orders,
            ROUND(SUM(line_total), 2) AS total_sales
        FROM v_master_transactions
        WHERE order_status = 'Completed'
        GROUP BY order_hour
        ORDER BY order_hour ASC
    """).toPandas().to_dict(orient="records")
    
                                      
    channel_mix = spark.sql("""
        SELECT
            order_channel,
            COUNT(DISTINCT order_id) AS orders_count,
            ROUND(SUM(line_total), 2) AS total_revenue,
            ROUND(AVG(line_total), 2) AS avg_item_price
        FROM v_master_transactions
        WHERE order_status = 'Completed'
        GROUP BY order_channel
        ORDER BY total_revenue DESC
    """).toPandas().to_dict(orient="records")
    
                                      
    location_sales = spark.sql("""
        SELECT
            restaurant_id,
            restaurant_name,
            city,
            zone,
            COUNT(DISTINCT order_id) AS orders_count,
            ROUND(SUM(line_total), 2) AS total_revenue,
            ROUND(SUM(line_total - oi.item_cost), 2) AS total_profit
        FROM v_master_transactions oi
        WHERE order_status = 'Completed'
        GROUP BY restaurant_id, restaurant_name, city, zone
        ORDER BY total_revenue DESC
    """).toPandas().to_dict(orient="records")
    
                               
    eda_results = {
        "execution_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_dishes_analyzed": len(menu_feat_pd),
        "total_customers_analyzed": len(customer_rfm_pd),
        "top_selling_dishes": top_selling,
        "lowest_selling_dishes": lowest_selling,
        "highest_revenue_dishes": top_revenue,
        "highest_profit_dishes": top_profit,
        "highest_margin_dishes": highest_margin,
        "lowest_margin_dishes": lowest_margin,
        "high_wastage_dishes": high_wastage,
        "best_rated_dishes": best_rated,
        "poorly_rated_dishes": poorly_rated,
        "popular_categories": cat_summary,
        "peak_ordering_hours": hourly_trends,
        "channel_mix": channel_mix,
        "location_performance": location_sales
    }
    
                  
    json_path = REPORTS_DIR / "step8_eda_summary_report.json"
    with open(json_path, "w") as f:
        json.dump(eda_results, f, indent=2)
        
    md_path = REPORTS_DIR / "step8_eda_summary_report.md"
    generate_eda_markdown(eda_results, md_path)
    
    dur = round(time.time() - start_t, 2)
    print(f"\nEDA JSON Report: {json_path}")
    print(f"EDA Markdown Report: {md_path}")
    print(f"\n>>> Data Integration, Feature Engineering & EDA Completed Successfully in {dur}s! <<<\n")
    spark.stop()
    return eda_results

def generate_eda_markdown(eda, md_path: Path):
    lines = [
        "# DineIQ Analytics — Exploratory Data Analysis (EDA) Report",
        "*Enterprise Data Integration & Comprehensive Exploratory Intelligence*",
        f"**Audit Execution Time:** {eda['execution_time']}",
        "",
        "## 1. Top Selling vs Lowest Selling Dishes",
        "",
        "### Top 5 Dishes by Volume",
        "| Dish Name | Category | Units Sold | Revenue | Profit Margin % | Tag |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ]
    for d in eda["top_selling_dishes"][:5]:
        lines.append(f"| {d['item_name']} | {d['category_name']} | {d['total_quantity_sold']:,} | ${d['total_revenue']:,.2f} | {d['actual_profit_margin_pct']}% | `{d['case_tag']}` |")
        
    lines.extend([
        "",
        "### Lowest 5 Dishes by Volume",
        "| Dish Name | Category | Units Sold | Revenue | Profit Margin % | Tag |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ] )
    for d in eda["lowest_selling_dishes"][:5]:
        lines.append(f"| {d['item_name']} | {d['category_name']} | {d['total_quantity_sold']:,} | ${d['total_revenue']:,.2f} | {d['actual_profit_margin_pct']}% | `{d['case_tag']}` |")
        
    lines.extend([
        "",
        "## 2. Highest Profit Dishes vs High Wastage Dishes",
        "",
        "### Top 5 Most Profitable Dishes",
        "| Dish Name | Category | Total Profit | Total Revenue | Profit Margin % |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    for d in eda["highest_profit_dishes"][:5]:
        lines.append(f"| {d['item_name']} | {d['category_name']} | ${d['total_profit']:,.2f} | ${d['total_revenue']:,.2f} | {d['actual_profit_margin_pct']}% |")
        
    lines.extend([
        "",
        "### Top 5 High Wastage Cost Dishes",
        "| Dish Name | Category | Waste Quantity | Waste Cost | Wastage % | Tag |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for d in eda["high_wastage_dishes"][:5]:
        lines.append(f"| {d['item_name']} | {d['category_name']} | {d['total_waste_qty']:,.1f} | ${d['total_waste_cost']:,.2f} | {d['wastage_pct']}% | `{d['case_tag']}` |")
        
    lines.extend([
        "",
        "## 3. Popular Menu Categories",
        "| Category | Completed Orders | Total Items Sold | Revenue | Total Profit |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    for c in eda["popular_categories"]:
        lines.append(f"| {c['category_name']} | {c['order_count']:,} | {c['total_qty']:,} | ${c['category_revenue']:,.2f} | ${c['category_profit']:,.2f} |")
        
    lines.extend([
        "",
        "## 4. Ordering Channel Share",
        "| Channel | Total Orders | Total Revenue | Avg Item Price |",
        "| :--- | :--- | :--- | :--- |"
    ])
    for ch in eda["channel_mix"]:
        lines.append(f"| {ch['order_channel']} | {ch['orders_count']:,} | ${ch['total_revenue']:,.2f} | ${ch['avg_item_price']:.2f} |")
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_pipeline()
