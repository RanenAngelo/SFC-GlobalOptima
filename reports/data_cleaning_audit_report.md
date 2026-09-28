# DineIQ Analytics — Data Cleaning & Remediation Audit Log
*Specification: TechWiz 7 / Aptech v1.0 — Step 5*
**Audit Execution Time:** 2026-09-25 09:03:19
**Processing Duration:** 112.65 seconds

## 1. Overview of Cleaning Actions
In accordance with documented enterprise data quality rules, all anomalous, duplicate, and out-of-range records identified in Step 4 were isolated, quarantined, or cleaned. The resulting datasets in `parquet_data/cleaned` and `processed_data/cleaned_csv` provide a golden source of truth for all downstream Data Science pipelines.

## 2. Documented Cleaning Decisions & Dispositions

| Rule ID | Entity | Rule Description | Records Before | Records After | Affected | Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-01-DEDUP-ORDERS` | `orders` | Deduplicate by order_id | 100,050 | 100,000 | 50 | **Removed duplicates** |
| `RULE-02-DEDUP-ITEMS` | `order_items` | Deduplicate by order_item_id | 1,089,973 | 1,089,873 | 100 | **Removed duplicates** |
| `RULE-03-QUARANTINE-NEG-QTY` | `order_items` | Quarantine negative quantities (quantity < 0) | 1,089,873 | 1,089,728 | 145 | **Quarantined to quarantined_negative_quantities.csv** |
| `RULE-04-IMPUTE-CUSTOMERS` | `customers` | Impute missing phone ('Unlisted') and email ('unknown@dineiq.local') | 50,000 | 50,000 | 2,500 | **Imputed missing values** |
| `RULE-05-QUARANTINE-RATINGS` | `ratings` | Quarantine ratings outside [1.0, 5.0] | 105,000 | 104,974 | 26 | **Quarantined to quarantined_invalid_ratings.csv** |
| `RULE-06-QUARANTINE-WASTAGE` | `wastage` | Quarantine extreme wastage outliers (> 500 portions) | 55,000 | 54,978 | 22 | **Quarantined to quarantined_impossible_wastage.csv** |

## 3. Quarantine Directory Audit
The following quarantine files were isolated for audit inspection and fraud tracking:
- `processed_data/quarantine/quarantined_negative_quantities.csv`: Reversal/negative line items.
- `processed_data/quarantine/quarantined_invalid_ratings.csv`: Review scores outside [1.0, 5.0].
- `processed_data/quarantine/quarantined_impossible_wastage.csv`: Kitchen entries exceeding 500 units.

## 4. Verification Check
- Zero duplicate primary keys remain across all entities.
- Zero negative quantities in production order-line transactions.
- All ratings strictly bounded in 1.0 – 5.0 range.
- All wastage figures strictly capped at realistic operational bounds.
