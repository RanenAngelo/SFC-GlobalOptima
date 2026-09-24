import sys
import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    PARQUET_DATA_DIR, MODELS_DIR, REPORTS_DIR
)

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report, confusion_matrix
import xgboost as xgb

def run_python_pipeline():
    print("=" * 65)
    print("  DineIQ Analytics — Independent Python ML Pipeline")
    print("=" * 65)
    
    start_t = time.time()
    
                             
    data_path = PARQUET_DATA_DIR / "menu_classified.parquet"
    df = pd.read_parquet(data_path)
    print(f"Loaded {len(df)} records for Python ML training.")
    
    feature_cols = [
        "total_quantity_sold", "total_revenue", "unit_contribution_margin",
        "actual_profit_margin_pct", "avg_rating", "total_waste_cost",
        "wastage_pct", "repeat_purchase_rate", "promotion_dependency_pct"
    ]
    
    X = df[feature_cols].fillna(0.0).values
    y_raw = df["performance_class"].values
    
                          
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    class_mapping = {int(idx): label for idx, label in enumerate(label_encoder.classes_)}
    print(f"Class Encoding: {class_mapping}")
    
                                                        
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train Set: {len(X_train)} samples | Test Set: {len(X_test)} samples")
    
                             
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_all_scaled = scaler.transform(X)
    
                                                       
    models = {
        "Random Forest (Scikit-Learn)": RandomForestClassifier(
            n_estimators=100, max_depth=6, random_state=42
        ),
        "XGBoost Classifier": xgb.XGBClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.08, eval_metric="mlogloss", random_state=42
        ),
        "Logistic Regression (Scikit-Learn)": LogisticRegression(
            max_iter=500, C=1.0, random_state=42
        )
    }
    
    benchmarks = []
    best_model_name = None
    best_f1 = -1.0
    best_clf = None
    
    print("\n--- Training and Evaluating Python Data Science Candidates ---")
    for name, clf in models.items():
        t0 = time.time()
        clf.fit(X_train_scaled, y_train)
        train_sec = round(time.time() - t0, 3)
        
        y_pred = clf.predict(X_test_scaled)
        acc = round(accuracy_score(y_test, y_pred), 4)
        f1_macro = round(f1_score(y_test, y_pred, average="macro"), 4)
        prec_macro = round(precision_score(y_test, y_pred, average="macro", zero_division=0), 4)
        rec_macro = round(recall_score(y_test, y_pred, average="macro", zero_division=0), 4)
        
        benchmarks.append({
            "algorithm": name,
            "training_time_sec": train_sec,
            "test_accuracy": acc,
            "test_f1_macro": f1_macro,
            "test_precision_macro": prec_macro,
            "test_recall_macro": rec_macro,
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        })
        print(f"  {name:<35}: Acc={acc*100:>5.1f}% | F1={f1_macro:>5.3f} | Prec={prec_macro:>5.3f} | Rec={rec_macro:>5.3f} [{train_sec}s]")
        
        if f1_macro > best_f1:
            best_f1 = f1_macro
            best_model_name = name
            best_clf = clf
            
    print(f"\nWinner Python Model: {best_model_name} with Macro F1: {best_f1:.3f}")
    
                                                          
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_bundle = {
        "model_name": best_model_name,
        "classifier": best_clf,
        "scaler": scaler,
        "label_encoder": label_encoder,
        "feature_cols": feature_cols,
        "class_mapping": class_mapping,
        "version": "1.0.0"
    }
    model_save_path = MODELS_DIR / "python_best_model.joblib"
    joblib.dump(model_bundle, model_save_path)
    print(f"Saved Python model bundle to: {model_save_path}")
    
                                                                
    full_preds_num = best_clf.predict(X_all_scaled)
    full_preds_labels = label_encoder.inverse_transform(full_preds_num)
    
    pred_df = df[["item_id", "item_name", "category_name", "performance_class"]].copy()
    pred_df["python_predicted_class"] = full_preds_labels
    pred_df["python_model_name"] = best_model_name
    
    pred_csv_path = REPORTS_DIR / "python_model_predictions.csv"
    pred_df.to_csv(pred_csv_path, index=False)
    print(f"Saved Python predictions to: {pred_csv_path.name}")
    
                                
    report_file = REPORTS_DIR / "step13_python_pipeline_report.json"
    report_data = {
        "module": "Independent Python Data Science Pipeline",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_records": len(df),
        "features_used": feature_cols,
        "algorithms_tested": benchmarks,
        "selected_model": best_model_name,
        "best_macro_f1": best_f1,
        "class_mapping": class_mapping,
        "model_save_path": str(model_save_path)
    }
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2)
        
    print(f"\nReport saved to: {report_file}")
    print("\n>>> Independent Python Data Science Pipeline COMPLETED! <<<\n")
    return report_data

if __name__ == "__main__":
    run_python_pipeline()
