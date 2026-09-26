import sys
import os
import json
import time
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    PARQUET_DATA_DIR, MODELS_DIR, REPORTS_DIR,
    JAVA_HOME, HADOOP_HOME
)

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler, StringIndexer, IndexToString
from pyspark.ml.classification import RandomForestClassifier, DecisionTreeClassifier, LogisticRegression
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

def get_spark_session(app_name="DineIQ-SparkMLlib"):
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

def run_spark_mllib_pipeline():
    print("=" * 65)
    print("  DineIQ Analytics — Spark MLlib Model Development")
    print("=" * 65)
    
    start_t = time.time()
    spark = get_spark_session()
    
                                  
    data_path = str(PARQUET_DATA_DIR / "menu_classified.parquet")
    df = spark.read.parquet(data_path)
    total_records = df.count()
    print(f"Loaded {total_records} records for Spark MLlib training.")
    
                     
    feature_cols = [
        "total_quantity_sold", "total_revenue", "unit_contribution_margin",
        "actual_profit_margin_pct", "avg_rating", "total_waste_cost",
        "wastage_pct", "repeat_purchase_rate", "promotion_dependency_pct"
    ]
    
                 
    df_clean = df.na.fill(0.0, subset=feature_cols)
    
                                       
    label_indexer = StringIndexer(inputCol="performance_class", outputCol="label").fit(df_clean)
    indexed_df = label_indexer.transform(df_clean)
    label_mapping = {int(idx): val for idx, val in enumerate(label_indexer.labels)}
    print(f"Target Labels Mapped: {label_mapping}")
    
                                  
    assembler = VectorAssembler(inputCols=feature_cols, outputCol="raw_features")
    scaler = StandardScaler(inputCol="raw_features", outputCol="features", withMean=True, withStd=True)
    
                                                      
    train_df, test_df = indexed_df.randomSplit([0.80, 0.20], seed=42)
    print(f"Train Set: {train_df.count()} records | Test Set: {test_df.count()} records")
    
                                                      
    rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=30, maxDepth=6, seed=42)
    dt = DecisionTreeClassifier(featuresCol="features", labelCol="label", maxDepth=6, seed=42)
    lr = LogisticRegression(featuresCol="features", labelCol="label", maxIter=50, regParam=0.01)
    
    models = {
        "Random Forest (Spark MLlib)": rf,
        "Decision Tree (Spark MLlib)": dt,
        "Logistic Regression (Spark MLlib)": lr
    }
    
    eval_acc = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="accuracy")
    eval_f1 = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="f1")
    eval_prec = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="weightedPrecision")
    eval_rec = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="weightedRecall")
    
    benchmarks = []
    best_model_name = None
    best_f1_score = -1.0
    best_pipeline_model = None
    
    print("\n--- Training and Evaluating Spark MLlib Candidates ---")
    for name, clf in models.items():
        pipeline = Pipeline(stages=[assembler, scaler, clf])
        t0 = time.time()
        fitted_pipeline = pipeline.fit(train_df)
        train_sec = round(time.time() - t0, 3)
        
        preds = fitted_pipeline.transform(test_df)
        acc = round(eval_acc.evaluate(preds), 4)
        f1 = round(eval_f1.evaluate(preds), 4)
        prec = round(eval_prec.evaluate(preds), 4)
        rec = round(eval_rec.evaluate(preds), 4)
        
        benchmarks.append({
            "algorithm": name,
            "training_time_sec": train_sec,
            "test_accuracy": acc,
            "test_f1_score": f1,
            "test_precision": prec,
            "test_recall": rec
        })
        print(f"  {name:<35}: Acc={acc*100:>5.1f}% | F1={f1:>5.3f} | Prec={prec:>5.3f} | Rec={rec:>5.3f} [{train_sec}s]")
        
        if f1 > best_f1_score:
            best_f1_score = f1
            best_model_name = name
            best_pipeline_model = fitted_pipeline
            
    print(f"\nWinner Spark Model: {best_model_name} with F1-Score: {best_f1_score:.3f}")
    
                         
    spark_model_dir = MODELS_DIR / "spark_mllib_menu_model"
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    best_pipeline_model.write().overwrite().save(str(spark_model_dir))
    print(f"Persisted best Spark model to: {spark_model_dir}")
    
                                                                        
    full_preds = best_pipeline_model.transform(indexed_df)
    
                                                
    converter = IndexToString(inputCol="prediction", outputCol="spark_predicted_class", labels=label_indexer.labels)
    converted_preds = converter.transform(full_preds)
    
    spark_pred_pd = converted_preds.select(
        "item_id", "item_name", "category_name", "performance_class",
        "spark_predicted_class", "prediction", "label"
    ).toPandas()
    
    pred_save_path = REPORTS_DIR / "spark_model_predictions.csv"
    spark_pred_pd.to_csv(pred_save_path, index=False)
    print(f"Saved Spark model predictions to: {pred_save_path.name}")
    
                         
    report_file = REPORTS_DIR / "step12_spark_mllib_report.json"
    report_data = {
        "module": "Spark MLlib Model Development",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_records": total_records,
        "features_used": feature_cols,
        "algorithms_tested": benchmarks,
        "selected_model": best_model_name,
        "best_f1_score": best_f1_score,
        "label_mapping": label_mapping,
        "model_save_path": str(spark_model_dir)
    }
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2)
        
    print(f"\nReport written to: {report_file}")
    print("\n>>> Spark MLlib Model Development COMPLETED! <<<\n")
    spark.stop()
    return report_data

if __name__ == "__main__":
    run_spark_mllib_pipeline()
