# DineIQ Analytics — Anomalies, Locations & Channel Economics Report
*Multi-Location Surveillance, Rating Audits & Channel Analytics*
**Report Generated:** 2026-09-28 23:45:20

## 1. Rating & Sales Anomaly Detection
### Detected Rating Bursts & Clusters
| Dish Name | Date | Rating Score | Cluster Volume | Audit Flag |
| :--- | :--- | :--- | :--- | :--- |

### Abnormally High Sales Baskets (> 2.5x IQR)
| Order ID | Customer ID | Store ID | Order Date | Basket Total | Audit Diagnosis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ORD086749` | `CUST48306` | `REST08` | 2025-11-11 12:16:55 | **$1,235.35** | Order total ($1,235.35) exceeds 2.5x IQR threshold ($901.58). Potential catering or corporate banquet. |
| `ORD073325` | `CUST01436` | `REST14` | 2025-05-01 20:10:50 | **$1,217.64** | Order total ($1,217.64) exceeds 2.5x IQR threshold ($901.58). Potential catering or corporate banquet. |
| `ORD094761` | `CUST16477` | `REST07` | 2025-05-23 15:39:45 | **$1,209.63** | Order total ($1,209.63) exceeds 2.5x IQR threshold ($901.58). Potential catering or corporate banquet. |
| `ORD012161` | `CUST35558` | `REST15` | 2025-12-21 18:07:37 | **$1,156.35** | Order total ($1,156.35) exceeds 2.5x IQR threshold ($901.58). Potential catering or corporate banquet. |
| `ORD065710` | `CUST18490` | `REST03` | 2025-06-01 12:53:15 | **$1,138.81** | Order total ($1,138.81) exceeds 2.5x IQR threshold ($901.58). Potential catering or corporate banquet. |

## 2. Slow-Moving Dish Detection
Dishes flagged by multi-factor screening (Bottom 20% volume, high waste, weak repeat purchase loyalty):

| Dish Name | Category | Units Sold | Revenue | Waste Loss | Repeat Loyalty % | Corrective Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Winter Roasted Chestnut Bisque** | Appetizers | 2886 | $43,290.00 | $7,367.85 | 2.3% | Deprecate from active menu to eliminate inventory holding cost. |
| **Prosecco Brunch Tower** | Appetizers | 3837 | $145,806.00 | $20,185.20 | 2.8% | Deprecate from active menu to eliminate inventory holding cost. |
| **Smoked Salmon Pizza** | Artisan Pizzas | 8525 | $170,414.75 | $11,351.31 | 5.8% | Deprecate from active menu to eliminate inventory holding cost. |
| **Cioppino Stew** | Coastal Seafood | 8551 | $347,683.66 | $25,208.29 | 5.2% | Deprecate from active menu to eliminate inventory holding cost. |
| **Halibut Risotto** | Coastal Seafood | 8587 | $462,409.95 | $36,045.09 | 5.7% | Deprecate from active menu to eliminate inventory holding cost. |
| **Garlic Bread** | Appetizers | 8636 | $108,813.60 | $7,258.27 | 5.2% | Deprecate from active menu to eliminate inventory holding cost. |

## 3. Multi-Location Comparative Intelligence
| Restaurant Location | City | Zone | Orders Count | Net Revenue | Total Profit | AOV |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DineIQ Denver Historic** | Denver | Historic Quarter | 3,873 | $1,291,637.79 | $843,156.48 | $333.50 |
| **DineIQ Seattle Suburban** | Seattle | Suburban Galleria | 3,821 | $1,289,243.99 | $841,887.95 | $337.41 |
| **DineIQ Boston Tech** | Boston | Tech Corridor | 3,860 | $1,288,595.71 | $842,064.06 | $333.83 |
| **DineIQ San Francisco Uptown** | San Francisco | Uptown Promenade | 3,835 | $1,277,593.45 | $835,616.36 | $333.14 |
| **DineIQ Seattle Tech** | Seattle | Tech Corridor | 3,810 | $1,272,541.88 | $831,962.79 | $334.00 |
| **DineIQ Miami Historic** | Miami | Historic Quarter | 3,823 | $1,270,505.10 | $830,340.86 | $332.33 |
| **DineIQ San Francisco Waterfront** | San Francisco | Waterfront Pier | 3,820 | $1,262,771.07 | $823,760.54 | $330.57 |
| **DineIQ Austin Waterfront** | Austin | Waterfront Pier | 3,775 | $1,262,408.55 | $826,033.90 | $334.41 |

## 4. Ordering Channel Comparative Economics
| Channel | Completed Orders | Net Revenue | Avg Order Value | Promo Discount Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Dine-in** | 42,508 | $14,823,502.28 | **$348.72** | 3.2% |
| **Restaurant Website** | 16,901 | $5,900,421.71 | **$349.12** | 3.2% |
| **Takeaway** | 23,568 | $8,190,741.39 | **$347.54** | 3.3% |
| **Third-party Delivery** | 11,051 | $3,876,622.47 | **$350.79** | 3.0% |