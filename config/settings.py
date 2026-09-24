import os
from pathlib import Path

            
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_GENERATOR_DIR = PROJECT_ROOT / "data_generator"
RAW_DATA_DIR = PROJECT_ROOT / "raw_data"
PROCESSED_DATA_DIR = PROJECT_ROOT / "processed_data"
QUARANTINE_DIR = PROCESSED_DATA_DIR / "quarantine"
PARQUET_DATA_DIR = PROJECT_ROOT / "parquet_data"
SPARK_JOBS_DIR = PROJECT_ROOT / "spark_jobs"
SPARK_SQL_DIR = PROJECT_ROOT / "spark_sql"
PYTHON_PIPELINE_DIR = PROJECT_ROOT / "python_pipeline"
MODELS_DIR = PROJECT_ROOT / "models"
DATABASE_DIR = PROJECT_ROOT / "database"
REPORTS_DIR = PROJECT_ROOT / "reports"
SAMPLE_DATA_DIR = PROJECT_ROOT / "sample_data"
TESTS_DIR = PROJECT_ROOT / "tests"
SRC_DIR = PROJECT_ROOT / "src"

                                                  
TARGET_ORDER_ITEMS = 1_000_000
TARGET_ORDERS = 100_000
TARGET_CUSTOMERS = 50_000
TARGET_MENU_ITEMS = 160                
TARGET_CATEGORIES = 12               
TARGET_RESTAURANTS = 25              
TARGET_RATINGS = 105_000                  
TARGET_WASTAGE_RECORDS = 55_000            
TRANSACTION_MONTHS = 12                                 

                                                    
SAMPLE_ORDER_ITEMS = 25_000
SAMPLE_ORDERS = 5_000
SAMPLE_CUSTOMERS = 2_000
SAMPLE_RATINGS = 4_000
SAMPLE_WASTAGE_RECORDS = 2_000

                 
TABLE_FILES = {
    "customers": "customers.csv",
    "orders": "orders.csv",
    "order_items": "order_items.csv",
    "menu_items": "menu_items.csv",
    "menu_categories": "menu_categories.csv",
    "restaurants": "restaurants.csv",
    "pricing_history": "pricing_history.csv",
    "promotions": "promotions.csv",
    "ratings": "ratings.csv",
    "inventory": "inventory.csv",
    "wastage": "wastage.csv",
}

                                            
CLASS_PROFIT_DRIVER = "Profit Driver"
CLASS_VOLUME_DRIVER = "Volume Driver"
CLASS_HIDDEN_OPPORTUNITY = "Hidden Opportunity"
CLASS_LOW_PERFORMER = "Low Performer"
PERFORMANCE_CLASSES = [CLASS_PROFIT_DRIVER, CLASS_VOLUME_DRIVER, CLASS_HIDDEN_OPPORTUNITY, CLASS_LOW_PERFORMER]

                   
SEGMENT_HIGH_VALUE_LOYAL = "High-Value Loyal"
SEGMENT_FREQUENT = "Frequent Customer"
SEGMENT_PROMO_DRIVEN = "Promotion-Driven"
SEGMENT_AT_RISK = "At-Risk"
SEGMENT_NEW = "New Customer"
SEGMENT_OCCASIONAL = "Occasional Customer"
CUSTOMER_SEGMENTS = [
    SEGMENT_HIGH_VALUE_LOYAL,
    SEGMENT_FREQUENT,
    SEGMENT_PROMO_DRIVEN,
    SEGMENT_AT_RISK,
    SEGMENT_NEW,
    SEGMENT_OCCASIONAL
]

                   
CHANNELS = ["Dine-in", "Takeaway", "Restaurant Website", "Third-party Delivery"]

                           
JAVA_HOME = os.environ.get("JAVA_HOME", r"C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot")
HADOOP_HOME = os.environ.get("HADOOP_HOME", r"C:\hadoop")
os.environ["JAVA_HOME"] = JAVA_HOME
os.environ["HADOOP_HOME"] = HADOOP_HOME
if r"C:\hadoop\bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = r"C:\hadoop\bin;" + os.environ.get("PATH", "")
os.environ["PYSPARK_SUBMIT_ARGS"] = "--driver-memory 4g --executor-memory 4g pyspark-shell"
