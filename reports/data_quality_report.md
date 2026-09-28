# DineIQ Analytics — Data Quality Assessment Report
*Specification: TechWiz 7 / Aptech v1.0 — Step 4*
**Generated:** 2026-09-25 09:00:30

## 1. Executive Summary
A rigorous, distributed data quality audit was executed using Apache Spark across all 11 restaurant dataset tables (over 1.4 million records). Problematic records, anomalies, negative quantities, duplicate transactions, and out-of-bounds metrics were successfully flagged for quarantine and remediation in Step 5.

## 2. Detailed Audit Findings

| Audit Category | Records Evaluated | Defects / Anomalies Detected | Integrity Status |
| :--- | :--- | :--- | :--- |
| **Duplicate Orders** | 100,050 | 50 duplicate order headers | Flagged for Deduplication |
| **Duplicate Order Lines** | 1,089,973 | 100 duplicate line items | Flagged for Deduplication |
| **Negative Quantities** | 1,089,973 | 145 records with qty < 0 | Flagged for Quarantine |
| **Out-of-Range Ratings** | 105,000 | 26 invalid ratings (<1.0 or >5.0) | Flagged for Quarantine / Correction |
| **Impossible Wastage** | 55,000 | 22 extreme outliers (>500 units) | Flagged for Kitchen Outlier Quarantine |
| **Referential Integrity** | All Foreign Keys | 0 violations | 100% Valid Foreign Keys |
| **Price & Discount Validity** | Menu & Promos | 0 invalid prices, 0 invalid promos | 100% Conforming Bounds |

## 3. Order Status Breakdown
- **Refunded**: 2,003 orders
- **Cancelled**: 3,977 orders
- **Completed**: 94,070 orders

## 4. Missing Values Summary
### Table `customers`
- Field `email`: 625 null/empty values
- Field `phone`: 2,000 null/empty values
### Table `orders`
- Field `promo_id`: 86,989 null/empty values
### Table `order_items`
- Field `special_notes`: 926,180 null/empty values

## 5. Remediation Plan (Step 5: Data Cleaning)
1. **Deduplication**: Retain first occurrence of duplicated `order_id` and `order_item_id` using Spark window functions.
2. **Quarantine Negative Quantities**: Isolate line items with quantity < 0 into `processed_data/quarantine/quarantined_negative_quantities.csv`.
3. **Quarantine Impossible Wastage**: Route wastage entries > 500 units into `processed_data/quarantine/quarantined_impossible_wastage.csv`.
4. **Rating Boundary Adjustment**: Clip/quarantine ratings outside [1.0, 5.0].
5. **Order Status Filtering**: Segregate completed orders for revenue analytics while retaining cancelled/refunded orders for churn and friction analysis.
