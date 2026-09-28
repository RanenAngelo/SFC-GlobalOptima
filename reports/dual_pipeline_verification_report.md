# DineIQ Analytics — Dual-Pipeline Model Comparison Report
*Specification: TechWiz 7 / Aptech v1.0 — Step 14 & Deliverable 7*
**Report Generated:** 2026-09-25 09:13:00

## 1. Executive Summary & Integrity Compliance
To satisfy the core competition integrity requirement (Section 1.2 & Step 14), both the **Apache Spark MLlib Pipeline** and the **Python Data Science Pipeline (XGBoost/Scikit-Learn)** were developed and trained completely independently on identical underlying data splits. Spark predictions were not exported or reused as Python results.

## 2. Overall Verification Metrics
- **Total Entities Evaluated:** 156 records (Mandate: $\ge 100$ records)
- **Identical Matches:** 153 records
- **Model Disagreements:** 3 records
- **Overall Pipeline Agreement:** **98.08%**
- **Spark MLlib Test Accuracy:** 98.08%
- **Python XGBoost Test Accuracy:** 100.0%

## 3. Discrepancy Diagnostics & Analytical Explanations
Exact equality is not expected from independently trained architectures. Where predictions differ, the models are encountering boundary data points:

| Item ID | Dish Name | Actual Class | Spark MLlib | Python XGBoost | Match Status | Diagnostic Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `M009` | Winter Roasted Chestnut Bisque | **Low Performer** | `Hidden Opportunity` | `Low Performer` | ⚠️ MISMATCH | Model decision boundary variance on near-threshold features. Spark MLlib Random Forest classified as 'Hidden Opportunity', whereas Python XGBoost classified as 'Low Performer' (Actual: 'Low Performer'). Spark utilizes bagging over tree ensembles with sub-sampled feature spaces, while XGBoost utilizes sequential gradient boosting on pseudo-residuals. |
| `M003` | Fresh Maine Lobster Thermidor | **Low Performer** | `Volume Driver` | `Low Performer` | ⚠️ MISMATCH | Model decision boundary variance on near-threshold features. Spark MLlib Random Forest classified as 'Volume Driver', whereas Python XGBoost classified as 'Low Performer' (Actual: 'Low Performer'). Spark utilizes bagging over tree ensembles with sub-sampled feature spaces, while XGBoost utilizes sequential gradient boosting on pseudo-residuals. |
| `M153` | Açaí Superfruit Bowl | **Low Performer** | `Volume Driver` | `Low Performer` | ⚠️ MISMATCH | Model decision boundary variance on near-threshold features. Spark MLlib Random Forest classified as 'Volume Driver', whereas Python XGBoost classified as 'Low Performer' (Actual: 'Low Performer'). Spark utilizes bagging over tree ensembles with sub-sampled feature spaces, while XGBoost utilizes sequential gradient boosting on pseudo-residuals. |

## 4. Verification Sample Table (First 15 Cases)
| Record ID | Item Name | Category | Actual Class | Spark MLlib | Python XGBoost | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `M004` | Handmade Saffron Tagliolini | Appetizers | Volume Driver | Volume Driver | Volume Driver | ✅ MATCH |
| `M009` | Winter Roasted Chestnut Bisque | Appetizers | Low Performer | Hidden Opportunity | Low Performer | ⚠️ MISMATCH |
| `M016` | Quattro Formaggi | Artisan Pizzas | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M033` | Gnocchi Gorgonzola | Handcrafted Pastas | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M044` | Mushroom Swiss Burger | Gourmet Burgers | Hidden Opportunity | Hidden Opportunity | Hidden Opportunity | ✅ MATCH |
| `M054` | Filet Mignon 8oz | Prime Steaks & Grills | Volume Driver | Volume Driver | Volume Driver | ✅ MATCH |
| `M056` | Tomahawk Cut 32oz | Prime Steaks & Grills | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M063` | Wagyu Striploin | Prime Steaks & Grills | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M068` | Lobster Tail Thermidor | Coastal Seafood | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M076` | Tuna Tataki Bowl | Coastal Seafood | Low Performer | Low Performer | Low Performer | ✅ MATCH |
| `M081` | Burrata Heirloom Tomato | Organic Salads | Volume Driver | Volume Driver | Volume Driver | ✅ MATCH |
| `M085` | Greek Village Salad | Organic Salads | Hidden Opportunity | Hidden Opportunity | Hidden Opportunity | ✅ MATCH |
| `M086` | Superfood Cobb Salad | Organic Salads | Hidden Opportunity | Hidden Opportunity | Hidden Opportunity | ✅ MATCH |
| `M109` | Zucchini Noodles Pesto | Plant-Based & Vegan | Profit Driver | Profit Driver | Profit Driver | ✅ MATCH |
| `M127` | Key Lime Pie | Decadent Desserts | Low Performer | Low Performer | Low Performer | ✅ MATCH |