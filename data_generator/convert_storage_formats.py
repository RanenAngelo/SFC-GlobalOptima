import sys
import os
import json
import time
import sqlite3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    RAW_DATA_DIR, SAMPLE_DATA_DIR, PARQUET_DATA_DIR, DATABASE_DIR, REPORTS_DIR
)

def convert_to_parquet_and_json(data_dir: Path, parquet_dir: Path, is_sample=False):
    parquet_dir.mkdir(parents=True, exist_ok=True)
    json_dir = data_dir / "json"
    json_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n=======================================================")
    print(f"Step 2: Converting datasets to Parquet & JSON [{data_dir.name}]")
    print(f"=======================================================")
    
    metrics = []
    
    csv_files = list(data_dir.glob("*.csv"))
    for csv_file in csv_files:
        table_name = csv_file.stem
        start_t = time.time()
        
                  
        df = pd.read_csv(csv_file, low_memory=False)
        csv_size = os.path.getsize(csv_file) / (1024 * 1024)
        
                                                    
        parquet_file = parquet_dir / f"{table_name}.parquet"
        
                                                                                
        if table_name == "orders" and "order_channel" in df.columns:
                                    
            orders_part_dir = parquet_dir / "orders_partitioned"
            df.to_parquet(orders_part_dir, engine="pyarrow", compression="snappy", partition_cols=["order_channel"])
                                                         
            df.to_parquet(parquet_file, engine="pyarrow", compression="snappy")
        elif table_name == "order_items":
                                        
            df.to_parquet(parquet_file, engine="pyarrow", compression="snappy")
        else:
            df.to_parquet(parquet_file, engine="pyarrow", compression="snappy")
            
        parquet_size = os.path.getsize(parquet_file) / (1024 * 1024)
        comp_ratio = round((1.0 - (parquet_size / max(csv_size, 0.001))) * 100, 1)
        
                                                                                        
        json_file = json_dir / f"{table_name}.json"
        if len(df) > 5000:
            df.head(1000).to_json(json_file, orient="records", indent=2)
        else:
            df.to_json(json_file, orient="records", indent=2)
            
        dur = round(time.time() - start_t, 2)
        metrics.append({
            "table": table_name,
            "row_count": len(df),
            "csv_size_mb": round(csv_size, 2),
            "parquet_size_mb": round(parquet_size, 2),
            "compression_savings_pct": comp_ratio,
            "duration_sec": dur
        })
        print(f"  [PARQUET] {table_name:<18}: CSV {csv_size:>6.2f} MB -> Parquet {parquet_size:>6.2f} MB ({comp_ratio:>5.1f}% saved) [{dur}s]")
        
    metrics_df = pd.DataFrame(metrics)
    total_csv = metrics_df["csv_size_mb"].sum()
    total_parq = metrics_df["parquet_size_mb"].sum()
    total_saved = round((1.0 - (total_parq / total_csv)) * 100, 1)
    
    print(f"=======================================================")
    print(f"Total CSV Footprint:     {total_csv:.2f} MB")
    print(f"Total Parquet Footprint: {total_parq:.2f} MB")
    print(f"Overall Space Reduction: {total_saved:.1f}%")
    print(f"=======================================================\n")
    return metrics_df

def populate_sqlite_database(data_dir: Path, db_path: Path):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
        
    print(f"Populating Relational Database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
                                                          
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")
    
                              
    ddl_statements = [
        """
        CREATE TABLE IF NOT EXISTS menu_categories (
            category_id TEXT PRIMARY KEY,
            category_name TEXT NOT NULL,
            description TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS restaurants (
            restaurant_id TEXT PRIMARY KEY,
            restaurant_name TEXT NOT NULL,
            city TEXT,
            state TEXT,
            zone TEXT,
            seating_capacity INTEGER,
            opened_date TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS menu_items (
            item_id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            base_price REAL NOT NULL,
            cost_price REAL NOT NULL,
            is_active BOOLEAN,
            launch_date TEXT,
            case_tag TEXT,
            FOREIGN KEY (category_id) REFERENCES menu_categories (category_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS customers (
            customer_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            signup_date TEXT,
            segment_label TEXT,
            preferred_channel TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS promotions (
            promo_id TEXT PRIMARY KEY,
            promo_name TEXT NOT NULL,
            promo_code TEXT NOT NULL,
            discount_pct REAL NOT NULL,
            start_date TEXT,
            end_date TEXT,
            target_category_id TEXT,
            is_trap BOOLEAN
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS pricing_history (
            price_change_id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            old_price REAL NOT NULL,
            new_price REAL NOT NULL,
            effective_date TEXT,
            reason TEXT,
            FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            restaurant_id TEXT NOT NULL,
            order_datetime TEXT NOT NULL,
            order_channel TEXT NOT NULL,
            order_status TEXT NOT NULL,
            promo_id TEXT,
            subtotal REAL,
            discount_amount REAL,
            tax_amount REAL,
            total_amount REAL,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
            FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS order_items (
            order_item_id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            line_total REAL NOT NULL,
            item_cost REAL NOT NULL,
            special_notes TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ratings (
            rating_id TEXT PRIMARY KEY,
            order_id TEXT,
            customer_id TEXT,
            item_id TEXT,
            restaurant_id TEXT,
            rating REAL,
            review_text TEXT,
            rating_date TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS inventory (
            inventory_id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            date TEXT NOT NULL,
            starting_stock REAL,
            received_stock REAL,
            consumed_stock REAL,
            ending_stock REAL,
            unit TEXT,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id),
            FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS wastage (
            wastage_id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            date TEXT NOT NULL,
            waste_quantity REAL NOT NULL,
            waste_cost REAL NOT NULL,
            waste_reason TEXT,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id),
            FOREIGN KEY (item_id) REFERENCES menu_items (item_id)
        );
        """
    ]
    
    for ddl in ddl_statements:
        cursor.execute(ddl)
        
                         
    for csv_file in data_dir.glob("*.csv"):
        tbl = csv_file.stem
        print(f"  Inserting {tbl} into SQLite...")
        chunksize = 50000
        for chunk in pd.read_csv(csv_file, chunksize=chunksize, low_memory=False):
            chunk = chunk.where(pd.notnull(chunk), None)
            cols = list(chunk.columns)
            placeholders = ",".join(["?"] * len(cols))
            sql = f"INSERT OR IGNORE INTO {tbl} ({','.join(cols)}) VALUES ({placeholders})"
            cursor.executemany(sql, chunk.values.tolist())
            
                                           
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_orders_cust ON orders(customer_id);",
        "CREATE INDEX IF NOT EXISTS idx_orders_rest ON orders(restaurant_id);",
        "CREATE INDEX IF NOT EXISTS idx_orders_dt ON orders(order_datetime);",
        "CREATE INDEX IF NOT EXISTS idx_order_items_ord ON order_items(order_id);",
        "CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id);",
        "CREATE INDEX IF NOT EXISTS idx_ratings_item ON ratings(item_id);",
        "CREATE INDEX IF NOT EXISTS idx_wastage_item ON wastage(item_id);",
        "CREATE INDEX IF NOT EXISTS idx_wastage_date ON wastage(date);"
    ]
    for idx_sql in indexes:
        cursor.execute(idx_sql)
        
    conn.commit()
    conn.close()
    
    db_size = os.path.getsize(db_path) / (1024 * 1024)
    print(f"Relational Database populated successfully! Size: {db_size:.2f} MB")
    return db_size

def run_step_2():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
                                                
    metrics_df = convert_to_parquet_and_json(RAW_DATA_DIR, PARQUET_DATA_DIR)
    
                                                       
    db_file = DATABASE_DIR / "dineiq.db"
    db_size = populate_sqlite_database(RAW_DATA_DIR, db_file)
    
                                       
    report_path = REPORTS_DIR / "step2_big_data_storage_report.json"
    report_data = {
        "step": "Step 2: Big Data Storage",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "formats_supported": ["CSV", "JSON", "Parquet (Snappy Columnar)", "SQLite (Relational with Indexes)"],
        "storage_metrics": metrics_df.to_dict(orient="records"),
        "database_file": str(db_file),
        "database_size_mb": round(db_size, 2),
        "parquet_directory": str(PARQUET_DATA_DIR)
    }
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    print(f"Storage benchmark report generated at: {report_path}")
    print("\n>>> Step 2: Big Data Storage COMPLETED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    run_step_2()
