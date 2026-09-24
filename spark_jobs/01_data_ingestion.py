import sys
import os
import time
import json
from pathlib import Path

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    RAW_DATA_DIR, PARQUET_DATA_DIR, REPORTS_DIR, JAVA_HOME
)

                 
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, BooleanType, TimestampType, DateType
)
from pyspark.sql import functions as F

def get_spark_session(app_name="DineIQ-DataIngestion"):
    py_executable = sys.executable
    os.environ["PYSPARK_PYTHON"] = py_executable
    os.environ["PYSPARK_DRIVER_PYTHON"] = py_executable
    if "JAVA_HOME" not in os.environ:
        os.environ["JAVA_HOME"] = JAVA_HOME

    spark = SparkSession.builder \
        .appName(app_name) \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.shuffle.partitions", "8") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.python.worker.reuse", "true") \
        .getOrCreate()
        
    spark.sparkContext.setLogLevel("ERROR")
    return spark

def get_explicit_schemas():
    schemas = {
        "menu_categories": StructType([
            StructField("category_id", StringType(), False),
            StructField("category_name", StringType(), False),
            StructField("description", StringType(), True)
        ]),
        "restaurants": StructType([
            StructField("restaurant_id", StringType(), False),
            StructField("restaurant_name", StringType(), False),
            StructField("city", StringType(), True),
            StructField("state", StringType(), True),
            StructField("zone", StringType(), True),
            StructField("seating_capacity", IntegerType(), True),
            StructField("opened_date", StringType(), True)
        ]),
        "menu_items": StructType([
            StructField("item_id", StringType(), False),
            StructField("category_id", StringType(), False),
            StructField("item_name", StringType(), False),
            StructField("base_price", DoubleType(), False),
            StructField("cost_price", DoubleType(), False),
            StructField("is_active", BooleanType(), True),
            StructField("launch_date", StringType(), True),
            StructField("case_tag", StringType(), True)
        ]),
        "customers": StructType([
            StructField("customer_id", StringType(), False),
            StructField("full_name", StringType(), False),
            StructField("email", StringType(), True),
            StructField("phone", StringType(), True),
            StructField("signup_date", StringType(), True),
            StructField("segment_label", StringType(), True),
            StructField("preferred_channel", StringType(), True)
        ]),
        "pricing_history": StructType([
            StructField("price_change_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("old_price", DoubleType(), False),
            StructField("new_price", DoubleType(), False),
            StructField("effective_date", StringType(), True),
            StructField("reason", StringType(), True)
        ]),
        "promotions": StructType([
            StructField("promo_id", StringType(), False),
            StructField("promo_name", StringType(), False),
            StructField("promo_code", StringType(), False),
            StructField("discount_pct", DoubleType(), False),
            StructField("start_date", StringType(), True),
            StructField("end_date", StringType(), True),
            StructField("target_category_id", StringType(), True),
            StructField("is_trap", BooleanType(), True)
        ]),
        "orders": StructType([
            StructField("order_id", StringType(), False),
            StructField("customer_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("order_datetime", StringType(), False),
            StructField("order_channel", StringType(), False),
            StructField("order_status", StringType(), False),
            StructField("promo_id", StringType(), True),
            StructField("subtotal", DoubleType(), True),
            StructField("discount_amount", DoubleType(), True),
            StructField("tax_amount", DoubleType(), True),
            StructField("total_amount", DoubleType(), True)
        ]),
        "order_items": StructType([
            StructField("order_item_id", StringType(), False),
            StructField("order_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("unit_price", DoubleType(), False),
            StructField("quantity", IntegerType(), False),
            StructField("line_total", DoubleType(), False),
            StructField("item_cost", DoubleType(), False),
            StructField("special_notes", StringType(), True)
        ]),
        "ratings": StructType([
            StructField("rating_id", StringType(), False),
            StructField("order_id", StringType(), True),
            StructField("customer_id", StringType(), True),
            StructField("item_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("rating", DoubleType(), False),
            StructField("review_text", StringType(), True),
            StructField("rating_date", StringType(), True)
        ]),
        "inventory": StructType([
            StructField("inventory_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("date", StringType(), False),
            StructField("starting_stock", DoubleType(), True),
            StructField("received_stock", DoubleType(), True),
            StructField("consumed_stock", DoubleType(), True),
            StructField("ending_stock", DoubleType(), True),
            StructField("unit", StringType(), True)
        ]),
        "wastage": StructType([
            StructField("wastage_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("date", StringType(), False),
            StructField("waste_quantity", DoubleType(), False),
            StructField("waste_cost", DoubleType(), False),
            StructField("waste_reason", StringType(), True)
        ])
    }
    return schemas

def run_data_ingestion():
    print("=" * 65)
    print("  DineIQ Analytics — Spark Big Data Ingestion")
    print("=" * 65)
    
    spark = get_spark_session()
    schemas = get_explicit_schemas()
    
    ingestion_metrics = []
    
    print("\n--- 1. Ingesting Tables with Explicit Schema Definition ---")
    for tbl_name, schema in schemas.items():
        csv_path = str(RAW_DATA_DIR / f"{tbl_name}.csv")
        t0 = time.time()
        
                                   
        df = spark.read \
            .option("header", "true") \
            .schema(schema) \
            .csv(csv_path)
            
        row_count = df.count()
        t1 = time.time()
        load_time_sec = round(t1 - t0, 3)
        
                                                               
        t_inf0 = time.time()
        df_inf = spark.read \
            .option("header", "true") \
            .option("inferSchema", "true") \
            .csv(csv_path)
        _ = df_inf.count()
        inf_time_sec = round(time.time() - t_inf0, 3)
        
        ingestion_metrics.append({
            "table_name": tbl_name,
            "row_count": row_count,
            "column_count": len(df.columns),
            "explicit_schema_load_sec": load_time_sec,
            "inferred_schema_load_sec": inf_time_sec,
            "speedup_factor": round(inf_time_sec / max(load_time_sec, 0.001), 2)
        })
        
        print(f"  [SPARK] {tbl_name:<18}: {row_count:>10,d} rows | Explicit: {load_time_sec:>5.2f}s vs Inferred: {inf_time_sec:>5.2f}s ({round(inf_time_sec/max(load_time_sec, 0.001), 1)}x faster)")
        
    print("\n--- 2. Large-File & Columnar Parquet Ingestion Benchmark ---")
    t0 = time.time()
    order_items_parq = spark.read.parquet(str(PARQUET_DATA_DIR / "order_items.parquet"))
    parq_count = order_items_parq.count()
    parq_load_sec = round(time.time() - t0, 3)
    print(f"  [PARQUET SCAN] order_items.parquet: {parq_count:,} rows read in {parq_load_sec:.3f} seconds!")
    
    print("\n--- 3. Partition Directory Ingestion Benchmark ---")
    t0 = time.time()
    try:
        orders_part_df = spark.read.parquet(str(PARQUET_DATA_DIR / "orders_partitioned"))
        part_count = orders_part_df.count()
        partitions_found = [row["order_channel"] for row in orders_part_df.select("order_channel").distinct().collect()]
    except Exception as e:
                                                                  
        part_files = str(PARQUET_DATA_DIR / "orders_partitioned" / "*" / "*.parquet")
        orders_part_df = spark.read.parquet(part_files)
        part_count = orders_part_df.count()
        partitions_found = [p.name.split("=")[-1] for p in (PARQUET_DATA_DIR / "orders_partitioned").glob("order_channel=*")]
        
    part_load_sec = round(time.time() - t0, 3)
    print(f"  [PARTITION SCAN] orders_partitioned: {part_count:,} rows across partitions {partitions_found} in {part_load_sec:.3f}s")
    
                        
    report_file = REPORTS_DIR / "step3_spark_ingestion_report.json"
    report_data = {
        "module": "Data Ingestion Using Apache Spark",
        "spark_version": spark.version,
        "master": spark.sparkContext.master,
        "tables_ingested": len(ingestion_metrics),
        "total_records_ingested": sum(m["row_count"] for m in ingestion_metrics),
        "ingestion_metrics": ingestion_metrics,
        "parquet_large_file_scan_sec": parq_load_sec,
        "partition_scan_sec": part_load_sec,
        "detected_partitions": partitions_found
    }
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2)
        
    print(f"\nReport written to: {report_file}")
    print("\n>>> Spark Data Ingestion COMPLETED SUCCESSFULLY! <<<\n")
    spark.stop()

if __name__ == "__main__":
    run_data_ingestion()
