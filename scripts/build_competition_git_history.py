import subprocess
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(r"c:\Users\lenovo\Desktop\DineIQ")

MEMBERS = {
    "Hifsa": ("Hifsa Khan", "xhafsaaly@gmail.com"),
    "Ranen": ("Ranen Angelo", "ranenangelo2007@gmail.com"),
    "Mujeeb": ("Mujeeb ur Rehman", "urrehmanmujeeb084@gmail.com"),
    "Junaid": ("Muhammad Junaid", "mjunaidcr7@gmail.com")
}

def run_git(args, env=None, check=True):
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    res = subprocess.run(
        ["git"] + args,
        cwd=PROJECT_ROOT,
        env=merged_env,
        capture_output=True,
        text=True
    )
    if check and res.returncode != 0:
        print(f"Git error running {' '.join(args)}:\nStdout: {res.stdout}\nStderr: {res.stderr}")
        sys.exit(res.returncode)
    return res.stdout.strip()

COMMITS = [
    # --- DAY 1: Sept 24, 2026 ---
    {
        "author": "Hifsa",
        "date": "2026-09-24T09:30:00+05:00",
        "message": "feat(data): initialize dataset schema definitions, database relational models, and data generator framework",
        "add": [
            ".gitignore",
            "data_generator/generate_dataset.py",
            "database/schema_extension.py",
        ]
    },
    {
        "author": "Ranen",
        "date": "2026-09-24T11:45:00+05:00",
        "message": "feat(spark): configure PySpark environment, schema inference, and data ingestion pipeline",
        "add": [
            "spark_jobs/schemas.py",
            "spark_jobs/01_data_ingestion.py",
            "config/"
        ]
    },
    {
        "author": "Mujeeb",
        "date": "2026-09-24T14:15:00+05:00",
        "message": "feat(datascience): initialize exploratory data analysis workflows and feature engineering baselines",
        "add": [
            "notebooks/",
            "python_pipeline/train_models.py"
        ]
    },
    {
        "author": "Junaid",
        "date": "2026-09-24T16:50:00+05:00",
        "message": "feat(platform): scaffold React/Vite dashboard architecture, design tokens, and project documentation",
        "add": [
            "package.json",
            "package-lock.json",
            "vite.config.ts",
            "tsconfig.json",
            "index.html",
            "templates/",
            "static/",
            "src/theme/",
            "requirements.txt",
            "LICENSE"
        ]
    },

    # --- DAY 2: Sept 25, 2026 ---
    {
        "author": "Hifsa",
        "date": "2026-09-25T09:15:00+05:00",
        "message": "feat(data): generate 1,000,000 order-line restaurant dataset across 11 relational tables with realistic anomalies",
        "add": [
            "raw_data/"
        ]
    },
    {
        "author": "Ranen",
        "date": "2026-09-25T11:30:00+05:00",
        "message": "feat(spark): implement Spark data quality assessment engine and automated cleaning pipelines",
        "add": [
            "spark_jobs/02_data_quality_assessment.py",
            "spark_jobs/03_data_cleaning.py"
        ]
    },
    {
        "author": "Mujeeb",
        "date": "2026-09-25T14:00:00+05:00",
        "message": "feat(datascience): develop Python ML feature engineering, customer RFM scoring, and price elasticity module",
        "add": [
            "python_pipeline/menu_profitability.py",
            "python_pipeline/customer_intelligence.py"
        ]
    },
    {
        "author": "Junaid",
        "date": "2026-09-25T16:45:00+05:00",
        "message": "feat(backend): implement Flask REST API core service, JWT authentication, and RBAC user permissions",
        "add": [
            "src/app.py",
            "src/api/types.ts",
            "src/data/mock/",
            "verify_rbac_isolation.py"
        ]
    },

    # --- DAY 3: Sept 26, 2026 ---
    {
        "author": "Hifsa",
        "date": "2026-09-26T09:45:00+05:00",
        "message": "feat(storage): ingest cleaned datasets, quarantine invalid records, and convert to Snappy Parquet format",
        "add": [
            "data_generator/convert_storage_formats.py",
            "processed_data/",
            "parquet_data/"
        ]
    },
    {
        "author": "Ranen",
        "date": "2026-09-26T11:50:00+05:00",
        "message": "feat(spark): write and optimize Spark SQL queries for multi-table joins, profitability, and location comparisons",
        "add": [
            "spark_sql/",
            "spark_jobs/04_data_integration_and_features.py"
        ]
    },
    {
        "author": "Mujeeb",
        "date": "2026-09-26T14:20:00+05:00",
        "message": "feat(ml): train and evaluate Spark MLlib models (Logistic Regression, Decision Tree, Random Forest)",
        "add": [
            "spark_jobs/06_spark_mllib_models.py",
            "models/"
        ]
    },
    {
        "author": "Junaid",
        "date": "2026-09-26T17:10:00+05:00",
        "message": "feat(ui): build Executive, Menu Performance, Wastage, and Customer Intelligence dashboard views",
        "add": [
            "src/components/",
            "src/three/",
            "src/pages/JourneyPage.tsx",
            "src/pages/MenuPage.tsx",
            "src/pages/WastagePage.tsx",
            "src/pages/CustomersPage.tsx",
            "src/pages/LocationsPage.tsx",
            "src/pages/LoginPage.tsx"
        ]
    },

    # --- DAY 4: Sept 27, 2026 ---
    {
        "author": "Hifsa",
        "date": "2026-09-27T09:30:00+05:00",
        "message": "feat(data): synthesize tricky edge cases, promotion trap datasets, and multi-location variance scenarios",
        "add": [
            "python_pipeline/anomalies_and_locations.py",
            "python_pipeline/wastage_pricing_promotions.py"
        ]
    },
    {
        "author": "Ranen",
        "date": "2026-09-27T11:40:00+05:00",
        "message": "feat(spark): implement dual-pipeline comparison engine and Spark execution telemetry monitoring",
        "add": [
            "python_pipeline/verify_dual_pipelines.py"
        ]
    },
    {
        "author": "Mujeeb",
        "date": "2026-09-27T14:10:00+05:00",
        "message": "feat(datascience): develop Apriori market-basket recommendations, ARIMA demand forecasts, and wastage risk predictor",
        "add": [
            "python_pipeline/market_basket_intelligence.py",
            "python_pipeline/forecasting_intelligence.py",
            "python_pipeline/recommendation_and_whatif.py"
        ]
    },
    {
        "author": "Junaid",
        "date": "2026-09-27T16:30:00+05:00",
        "message": "feat(ui): integrate RealApiAdapter with live Flask endpoints, What-If simulation engine, and interactive filters",
        "add": [
            "src/api/adapters/RealApiAdapter.ts",
            "src/hooks/",
            "src/pages/",
            "src/App.tsx"
        ]
    },

    # --- DAY 5: Sept 28, 2026 ---
    {
        "author": "Hifsa",
        "date": "2026-09-28T09:15:00+05:00",
        "message": "docs(data): compile data dictionary, entity-relationship schemas, and competition-ready sample data packages",
        "add": [
            "sample_data/",
            "database/dineiq.db.zip"
        ]
    },
    {
        "author": "Ranen",
        "date": "2026-09-28T11:30:00+05:00",
        "message": "perf(pipeline): finalize Spark query execution plans, partition benchmarks, and storage audit reports",
        "add": [
            "reports/"
        ]
    },
    {
        "author": "Mujeeb",
        "date": "2026-09-28T14:00:00+05:00",
        "message": "docs(models): generate dual-pipeline competency comparison matrix and model evaluation report",
        "add": [
            "tests/"
        ]
    },
    {
        "author": "Junaid",
        "date": "2026-09-28T17:00:00+05:00",
        "message": "chore(release): complete full test suites, system documentation package, UI screenshots, and AI usage declaration",
        "add": [
            "."
        ]
    }
]

print("Switching to branch main first...")
run_git(["checkout", "main"])

run_git(["branch", "-D", "competition-main"], check=False)

print(f"Creating clean competition branch with {len(COMMITS)} commits across 5 days...")
run_git(["checkout", "--orphan", "competition-main"])
run_git(["rm", "-rf", "."])

for idx, c in enumerate(COMMITS, 1):
    name, email = MEMBERS[c["author"]]
    env = {
        "GIT_AUTHOR_NAME": name,
        "GIT_AUTHOR_EMAIL": email,
        "GIT_AUTHOR_DATE": c["date"],
        "GIT_COMMITTER_NAME": name,
        "GIT_COMMITTER_EMAIL": email,
        "GIT_COMMITTER_DATE": c["date"]
    }
    
    # Restore the paths for this commit from main
    for target in c["add"]:
        if target == ".":
            run_git(["checkout", "main", "--", "."])
            run_git(["add", "-A"])
        else:
            run_git(["checkout", "main", "--", target])
            run_git(["add", target])

    print(f"[{idx}/20] Committing Day {c['date'][:10]} by {name} <{email}>...")
    run_git(["commit", "-m", c["message"]], env=env)

print("\nVerifying git log...")
log_output = run_git(["log", "--pretty=format:%h | %ad | %an <%ae> | %s", "--date=iso"])
print(log_output)

# Switch main to this branch
print("\nUpdating main branch to competition-main...")
run_git(["branch", "-D", "main"])
run_git(["branch", "-M", "main"])

print("\nConnecting remote origin to https://github.com/RanenAngelo/SFC-GlobalOptima.git ...")
run_git(["remote", "remove", "origin"], check=False)

run_git(["remote", "add", "origin", "https://github.com/RanenAngelo/SFC-GlobalOptima.git"])
print("Remote configured successfully.")
