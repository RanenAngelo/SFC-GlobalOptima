# DineIQ Analytics — MenuMatrix Dining Intelligence
**Enterprise Big Data & Dining Intelligence Platform · TechWiz 7 (Data Science Intelligence Arena)**

---

## 🍽️ Executive Overview

**DineIQ Analytics / MenuMatrix Dining Intelligence** is an enterprise-grade Big Data analytics and machine learning platform engineered to process and analyze massive restaurant transaction and operational datasets.

The platform implements two completely independent analytical pipelines:
1. **Big Data Pipeline:** Apache Spark (PySpark 4.2.0, Spark SQL, Spark MLlib) operating over Snappy-compressed Parquet columnar storage.
2. **Python Data Science Pipeline:** Scikit-Learn, XGBoost, Statsmodels, and Pandas operating over identical feature splits.
3. **Dual-Pipeline Result Verification:** Independent outputs evaluated across all menu items, achieving a **98.08% overall classification agreement rate** with explainable boundary diagnostics.

The system features a **Flask REST API (Python 3.13)** and a **React 19 + TypeScript + Vite** command center dashboard with strict **Role-Based Access Control (RBAC)** and server-enforced data scoping.

---

## 👥 Roles, Data Scoping & Login Credentials

The system implements four distinct application roles with strict server-side authorization and data isolation:

| Role | Username | Password | Email | Assigned Scope | Permissions & Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | `admin@dineiq.local` | **System-Wide** (All 25 Locations) | Full system governance: User management, location provisioning, Spark jobs monitoring (`/jobs`), model registry (`/model-lab`), audit logs (`/settings`), enterprise overview. |
| **Competition Evaluator** | `evaluator` | `eval2026` | `evaluator@aptech.local` | **System-Wide** (All 25 Locations) | Evaluation identity with administrative rights to verify pipeline integrity, dataset volume, model metrics, and benchmarks. |
| **Lead Data Analyst** | `analyst` | `analyst123` | `analyst@dineiq.local` | **System-Wide** (Analytical Scope) | Menu profitability, BCG/Kasavana-Smith classification, customer RFM segmentation, market basket & association rules, demand forecasting, pricing elasticity, promotion traps, what-if simulator, Spark vs. Python model comparison. |
| **Regional Manager** | `reg_manager` | `regman123` | `regional@dineiq.local` | **Midwest Region** (`REST02`, `REST12`, `REST22`) | Multi-location comparison (`/locations`), regional revenue/profit aggregations, branch ranking, regional anomalies, customer trends, wastage comparison, and scoped reports. |
| **Restaurant Manager A** | `rest_manager` | `restman123` | `manager@dineiq.local` | **Downtown Branch** (`REST01`) | Scoped to Location `REST01` only: Restaurant revenue, net profit, orders, average check size, active customers, repeat customers, inventory & wastage logging, local recommendations. |
| **Restaurant Manager B** | `rest_manager_2` | `restman123` | `manager2@dineiq.local` | **Westside Branch** (`REST02`) | Scoped to Location `REST02` only: Verifies distinct operational metrics, isolated menu item quantities, and branch-specific performance independent of Manager A. |

> **Security Note:** Data scoping is strictly enforced server-side. Querying an out-of-scope location (e.g. Manager A requesting `location=REST02`) or attempting to access administrative endpoints (`/api/jobs`, `/api/audit-logs`) immediately returns **HTTP 403 Forbidden**.

---

## 🏛️ System Architecture & Dual-Pipeline Verification

```
                     ┌────────────────────────────────────────┐
                     │    Raw Restaurant Data (11 Tables)     │
                     │  (1,089,728 Order Items, 100k Orders)  │
                     └──────────────────┬─────────────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  ▼                                           ▼
     ┌─────────────────────────┐                 ┌─────────────────────────┐
     │   Apache Spark Engine   │                 │ Python ML Engine        │
     │  (PySpark & Spark SQL)  │                 │ (Scikit-Learn & XGBoost)│
     └────────────┬────────────┘                 └────────────┬────────────┘
                  │                                           │
                  ▼                                           ▼
     ┌─────────────────────────┐                 ┌─────────────────────────┐
     │ Spark MLlib Classifier  │                 │  XGBoost Classifier     │
     │ (Random Forest: 88.0%)  │                 │  (Test Accuracy: 100%)  │
     └────────────┬────────────┘                 └────────────┬────────────┘
                  │                                           │
                  └─────────────────────┬─────────────────────┘
                                        ▼
                     ┌────────────────────────────────────────┐
                     │  Dual-Pipeline Verification Engine     │
                     │  (156 Dishes | 98.08% Agreement Rate)  │
                     └──────────────────┬─────────────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  ▼                                           ▼
     ┌─────────────────────────┐                 ┌─────────────────────────┐
     │ Flask REST API Backend  │◄───────────────►│ React + Vite Dashboard  │
     │ (Port 5000 · RBAC Scope)│                 │ (Port 3000 · Scoped UI) │
     └─────────────────────────┘                 └─────────────────────────┘
```

---

## 📊 Dataset Scale & 11 Relational Tables

The system exceeds all mandatory data scale thresholds:

| Table | File | Real Records | Threshold Requirement | Key Identifiers & Relationships |
| :--- | :--- | :--- | :--- | :--- |
| **Order Items** | `order_items.csv` | **1,089,728** | $\ge 1,000,000$ | `order_item_id`, `order_id` $\rightarrow$ `orders`, `item_id` $\rightarrow$ `menu_items` |
| **Orders** | `orders.csv` | **100,000** | $\ge 100,000$ | `order_id`, `customer_id` $\rightarrow$ `customers`, `restaurant_id` $\rightarrow$ `restaurants` |
| **Customers** | `customers.csv` | **50,000** | $\ge 50,000$ | `customer_id`, `segment_label`, `preferred_channel` |
| **Ratings** | `ratings.csv` | **104,974** | $\ge 100,000$ | `rating_id`, `order_id`, `item_id`, `rating` (1–5), `review_text` |
| **Wastage** | `wastage.csv` | **54,978** | $\ge 50,000$ | `waste_id`, `restaurant_id`, `item_id`, `waste_kg`, `waste_cost` |
| **Menu Items** | `menu_items.csv` | **156** | $\ge 150$ | `item_id`, `category_id` $\rightarrow$ `menu_categories`, `base_price`, `cost_price` |
| **Menu Categories** | `menu_categories.csv` | **12** | $\ge 10$ | `category_id`, `category_name` |
| **Restaurants** | `restaurants.csv` | **25** | $\ge 20$ | `restaurant_id`, `city`, `state`, `seating_capacity` |
| **Pricing History** | `pricing_history.csv` | **97** | Point-in-time | `history_id`, `item_id`, `old_price`, `new_price`, `effective_date` |
| **Promotions** | `promotions.csv` | **10** | Campaigns | `promo_id`, `promo_name`, `discount_pct`, `start_date`, `end_date` |
| **Inventory** | `inventory.csv` | **15,900** | Weekly audits | `inv_id`, `restaurant_id`, `item_id`, `stock_level`, `reorder_threshold` |

---

## 🎯 The 10 Mandatory Tricky Performance Scenarios (Step 11)

DineIQ identifies, explains, and resolves the 10 critical edge cases where volume alone is deceptive:

1. **High-Selling, Loss-Making Dish** (`M001` Wagyu Prime Smashed Burger: $17.50 unit cost vs. $14.50 menu price). Classified: *Low Performer*. Action: Increase price or substitute cut.
2. **Highly Profitable But Rarely Ordered** (`M002` Beluga Caviar Tartlet: $67.00 contribution margin). Classified: *Hidden Opportunity*. Action: Prominently feature on front cover and train servers.
3. **Popular Dish With Excessive Wastage** (`M003` Fresh Maine Lobster Thermidor: $48k annual spoilage). Classified: *Volume Driver*. Action: Rationalize batch prep and mandate pre-orders.
4. **High Guest Rating But Poor Profit Margin** (`M004` Saffron Tagliolini: 4.8★ rating, $1.50 margin). Classified: *Volume Driver*. Action: Apply inelastic 8% price increase.
5. **Low Guest Rating With High Sales Volume** (`M005` Midnight Onion Rings: 2.1★ rating, 12k volume). Classified: *Low Performer*. Action: Overhaul recipe quality to defend brand reputation.
6. **Promotion-Dependent Dish** (`M006` Loaded Truffle Fries: 88% of orders sold under discount). Classified: *Hidden Opportunity*. Action: Transition into high-margin combo bundles.
7. **Multi-Location Divergent Dish** (`M007` Cajun Crawfish: High margin in coastal branches, poor in business district). Action: Establish localized regional menus.
8. **Weekend-Only Peak Dish** (`M008` Prosecco Brunch Tower: 85% of volume sold Fri–Sun). Action: Restrict to weekend exclusive to optimize kitchen mise-en-place.
9. **Seasonal Winter Item** (`M009` Chestnut Bisque: Peak demand in Q1 & Q4). Action: Implement seasonal Limited Time Offer (LTO) menu rotation.
10. **New Item With Insufficient History** (`M010` Pistachio Gelato Brioche: Launched mid-December). Action: Apply Bayesian shrinkage prior and incubation monitoring.

---

## 📈 Key Verification & Model Benchmarks

| Milestone / Metric | Spark MLlib Pipeline | Python Pipeline | Dual Verification Status |
| :--- | :--- | :--- | :--- |
| **Model Architecture** | Random Forest Classifier (30 trees) | XGBoost Classifier (100 estimators) | Independent Algorithms |
| **Training Execution** | Distributed PySpark | Scikit-Learn / XGBoost | Benchmarked |
| **Accuracy Score** | **88.0%** (Target: $\ge 85\%$) | **100.0%** (Target: $\ge 85\%$) | **Target Exceeded** |
| **Macro F1 Score** | **0.880** (Target: $\ge 0.80$) | **1.000** (Target: $\ge 0.80$) | **Target Exceeded** |
| **Records Evaluated** | 156 items (Target: $\ge 100$) | 156 items (Target: $\ge 100$) | **Target Exceeded** |
| **Agreement Rate** | — | — | **98.08%** (153 matches / 3 boundary cases) |
| **Demand Forecast MAE** | — | **290.2 units** | **27.9% improvement** over baseline |
| **Inference Latency** | — | **< 50ms** | Meets NFR-1 sub-5-second SLA |

---

## 🚀 Execution & Setup Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm
- Java 8/11/17 (required for Apache Spark / PySpark execution)

### 1. Environment Setup

```powershell
# Clone or navigate to the project directory
cd c:\Users\lenovo\Desktop\DineIQ

# Install Python dependencies
pip install -r requirements.txt

# Install Frontend dependencies
npm install
```

### 2. Running the Full Stack Application

#### Terminal 1 — Start the Flask REST API Backend:
```powershell
python -u src/app.py
```
*Backend runs on `http://127.0.0.1:5000` with SQLite WAL database and ML engines active.*

#### Terminal 2 — Start the Vite Frontend Command Center:
```powershell
npm run dev
```
*Frontend runs on `http://127.0.0.1:3000`.*

---

## 🧪 Automated Testing & Verification

The project includes an automated test suite verifying all 26 functional requirements and 6 non-functional requirements:

### Run the Pytest Test Suite:
```powershell
python -m pytest tests/ -v
```
*Result: **40 passed in ~50s (100% pass rate)** covering RBAC boundaries, SQL injection resilience, inference latency, indexing, and Parquet integrity.*

### Run the TypeScript Typecheck:
```powershell
npm run typecheck
```
*Result: **0 errors** (`tsc --noEmit`).*

### Run the RBAC Data Isolation Verification Script:
```powershell
python verify_rbac_isolation.py
```
*Outputs side-by-side verification of distinct order counts, revenues, customer counts, and HTTP 403 authorization checks across all four roles.*

---

## 📂 Repository Structure

```
DineIQ/
├── database/                   # SQLite database & RBAC schema migrations
│   ├── dineiq.db               # Primary operational database (WAL mode, indexed)
│   └── schema_extension.py     # Database seeding & user management
├── parquet_data/cleaned/       # Snappy-compressed Parquet tables for Spark ingestion
├── spark_jobs/                 # Apache Spark / PySpark distributed jobs (Steps 3–8, 12)
│   ├── 01_data_ingestion.py
│   ├── 02_data_quality_assessment.py
│   ├── 03_data_cleaning.py
│   ├── 04_data_integration_and_features.py
│   └── 06_spark_mllib_models.py
├── python_pipeline/            # Independent Python ML / Scikit-Learn pipeline (Steps 9–41)
│   ├── train_models.py
│   ├── verify_dual_pipelines.py
│   ├── customer_intelligence.py
│   ├── market_basket_intelligence.py
│   ├── forecasting_intelligence.py
│   ├── wastage_pricing_promotions.py
│   └── recommendation_and_whatif.py
├── reports/                    # Generated audit JSON reports for Spark vs. Python
├── src/                        # Flask REST API Backend & Frontend Source
│   ├── app.py                  # Primary Flask REST API with RBAC & scoped queries
│   ├── api/                    # TypeScript API contracts and RealApiAdapter
│   ├── components/             # UI components, layout, AppShell, charts, navigation
│   ├── hooks/                  # React hooks (useAuth, useFilters, useApi)
│   └── pages/                  # Dashboard pages (Menu, Customers, Forecast, etc.)
├── tests/                      # Automated test suite (FRs, NFRs, integrity)
│   ├── test_functional_requirements.py
│   └── test_non_functional_requirements.py
├── AI_USAGE.md                 # AI usage declaration complying with Section 1.8
├── verify_rbac_isolation.py    # Multi-role data isolation verification script
└── README.md                   # Enterprise project documentation
```

---

## 🔒 Compliance & Integrity Standards

- **Section 1.8 Compliance:** All AI and generative tooling usage is declared in [`AI_USAGE.md`](file:///c:/Users/lenovo/Desktop/DineIQ/AI_USAGE.md). Core analytical models (XGBoost, Random Forest, ARIMA, Apriori) are self-contained and execute locally.
- **Explainability:** Predictions are backed by unit economics, gross margins, guest ratings, and wastage metrics.
- **Data Protection:** Passwords are encrypted with salt and hash algorithms (`scrypt` / `werkzeug.security`).
