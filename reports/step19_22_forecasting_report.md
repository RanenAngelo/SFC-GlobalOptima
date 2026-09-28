# DineIQ Analytics — Demand Forecasting & Peak Period Report
*Specification: TechWiz 7 / Aptech v1.0 — Steps 19, 20, 21, & 22*
**Report Generated:** 2026-09-25 09:16:50

## 1. Peak-Period Analysis (Step 19)
- **Primary Peak Dining Hours:** 12:00, 13:00, 18:00, 19:00
- **Weekend Revenue Share:** 42.9% of gross receipts originate between Friday and Sunday.

### Day of Week Performance
| Day of Week | Total Items Prepped | Total Revenue |
| :--- | :--- | :--- |
| Monday | 217,182 | $4,475,722.30 |
| Tuesday | 214,492 | $4,428,411.77 |
| Wednesday | 217,699 | $4,506,237.53 |
| Thursday | 217,178 | $4,491,178.84 |
| Friday | 215,971 | $4,483,385.09 |
| Saturday | 215,497 | $4,467,222.95 |
| Sunday | 217,329 | $4,513,466.74 |

## 2. Time-Aware Demand Forecasting Validation (Step 21)
In strict adherence to Section 1.6 xxviii & Step 21, random k-fold cross validation was rejected to prevent future information leakage into historical training windows. The dataset was divided chronologically:
- **Training Window:** Earlier 10 Months (290 days)
- **Evaluation Holdout:** Final Unseen 2 Months (62 days)

## 3. Forecast Accuracy Benchmark (Step 22)
| Metric | 7-Day Seasonal Baseline | DineIQ ML Model | Measurable Improvement | Evaluation Standard |
| :--- | :--- | :--- | :--- | :--- |
| **MAE** (Mean Absolute Error) | 402.4 | **290.19** | **27.9% lower error** | Lower is better |
| **RMSE** (Root Mean Sq Error) | 541.46 | **459.88** | **15.1% lower error** | Lower is better |
| **MAPE** (Mean Abs % Error) | 11.11% | **8.62%** | Superior Precision | Lower is better |
| **$R^2$ Score** | -0.526 | **-0.101** | +0.425 variance explained | Target $>0.75$ |

## 4. Sample Holdout Forecast vs Actual Tracking
| Forecast Date | Actual Units Sold | DineIQ Prediction | Seasonal Baseline | Prediction Error |
| :--- | :--- | :--- | :--- | :--- |
| 2025-11-01 | 4,109 | **4,263.2** | 3,900.0 | $\pm$154.2 units |
| 2025-11-02 | 4,475 | **4,265.0** | 4,163.0 | $\pm$210.0 units |
| 2025-11-03 | 4,248 | **3,998.0** | 4,075.0 | $\pm$250.0 units |
| 2025-11-04 | 3,922 | **4,114.3** | 3,980.0 | $\pm$192.3 units |
| 2025-11-05 | 4,083 | **4,269.8** | 4,801.0 | $\pm$186.8 units |
| 2025-11-06 | 4,183 | **4,118.2** | 4,197.0 | $\pm$64.8 units |
| 2025-11-07 | 3,734 | **4,198.6** | 4,190.0 | $\pm$464.6 units |
| 2025-11-08 | 3,882 | **4,155.8** | 4,109.0 | $\pm$273.8 units |
| 2025-11-09 | 3,754 | **4,211.3** | 4,475.0 | $\pm$457.3 units |
| 2025-11-10 | 4,050 | **4,109.3** | 4,248.0 | $\pm$59.3 units |
| 2025-11-11 | 4,294 | **4,493.3** | 3,922.0 | $\pm$199.3 units |
| 2025-11-12 | 5,024 | **4,164.6** | 4,083.0 | $\pm$859.4 units |
| 2025-11-13 | 4,189 | **4,081.5** | 4,183.0 | $\pm$107.5 units |
| 2025-11-14 | 4,371 | **4,262.9** | 3,734.0 | $\pm$108.1 units |
| 2025-11-15 | 3,958 | **4,107.4** | 3,882.0 | $\pm$149.4 units |