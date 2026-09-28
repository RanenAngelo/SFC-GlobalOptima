# DineIQ Analytics — Exploratory Data Analysis (EDA) Report
*Specification: TechWiz 7 / Aptech v1.0 — Step 8*
**Audit Execution Time:** 2026-09-25 09:07:35

## 1. Top Selling vs Lowest Selling Dishes

### Top 5 Dishes by Volume
| Dish Name | Category | Units Sold | Revenue | Profit Margin % | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Wagyu Prime Smashed Burger | Appetizers | 52,892 | $766,934.00 | -20.69% | `TRICKY_LOSS_MAKER` |
| Midnight Crispy Onion Rings | Appetizers | 35,098 | $263,235.00 | 80.0% | `TRICKY_LOW_RATING_HIGH_SALES` |
| Fresh Maine Lobster Thermidor | Appetizers | 26,335 | $1,264,080.00 | 54.17% | `TRICKY_HIGH_WASTAGE` |
| Classic Caesar Supreme | Organic Salads | 17,415 | $309,638.70 | 78.91% | `NORMAL` |
| French Onion Soup | Heritage Soups | 17,354 | $197,835.60 | 73.77% | `NORMAL` |

### Lowest 5 Dishes by Volume
| Dish Name | Category | Units Sold | Revenue | Profit Margin % | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Smoked Pistachio Gelato Brioche | Appetizers | 202 | $2,323.00 | 69.57% | `TRICKY_NEW_ITEM` |
| Imperial Beluga Caviar Tartlet | Appetizers | 971 | $82,535.00 | 78.82% | `TRICKY_HIGH_MARGIN_LOW_SALES` |
| Winter Roasted Chestnut Bisque | Appetizers | 2,886 | $43,290.00 | 70.0% | `TRICKY_SEASONAL_WINTER` |
| Prosecco Brunch Tower | Appetizers | 3,837 | $145,806.00 | 68.42% | `TRICKY_WEEKEND_ONLY` |
| Mushroom Swiss Burger | Gourmet Burgers | 8,518 | $211,161.22 | 72.49% | `NORMAL` |

## 2. Highest Profit Dishes vs High Wastage Dishes

### Top 5 Most Profitable Dishes
| Dish Name | Category | Total Profit | Total Revenue | Profit Margin % |
| :--- | :--- | :--- | :--- | :--- |
| Fresh Maine Lobster Thermidor | Appetizers | $684,710.00 | $1,264,080.00 | 54.17% |
| Ribeye Steak 12oz | Prime Steaks & Grills | $506,230.22 | $751,015.82 | 67.41% |
| Grilled Atlantic Salmon | Coastal Seafood | $498,787.83 | $729,756.18 | 68.35% |
| New York Strip 10oz | Prime Steaks & Grills | $339,075.54 | $513,360.90 | 66.05% |
| Veal Chop | Prime Steaks & Grills | $318,030.48 | $491,509.62 | 64.7% |

### Top 5 High Wastage Cost Dishes
| Dish Name | Category | Waste Quantity | Waste Cost | Wastage % | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Fresh Maine Lobster Thermidor | Appetizers | 180,182.0 | $3,964,004.00 | 87.25% | `TRICKY_HIGH_WASTAGE` |
| Chateaubriand | Prime Steaks & Grills | 1,552.5 | $36,576.82 | 14.76% | `NORMAL` |
| Grilled Octopus | Coastal Seafood | 1,464.3 | $36,490.33 | 14.05% | `NORMAL` |
| Halibut Risotto | Coastal Seafood | 1,641.4 | $36,045.09 | 16.05% | `NORMAL` |
| Pan-Seared Sea Bass | Coastal Seafood | 1,614.9 | $35,220.87 | 15.73% | `NORMAL` |

## 3. Popular Menu Categories
| Category | Completed Orders | Total Items Sold | Revenue | Total Profit |
| :--- | :--- | :--- | :--- | :--- |
| Coastal Seafood | 55,375 | 122,886 | $5,310,689.90 | $3,326,344.12 |
| Prime Steaks & Grills | 55,512 | 123,608 | $5,031,341.33 | $3,193,779.96 |
| Appetizers | 67,399 | 183,380 | $3,632,882.00 | $1,536,066.94 |
| Handcrafted Pastas | 55,476 | 123,126 | $2,648,440.00 | $1,807,656.06 |
| Artisan Pizzas | 55,411 | 122,314 | $2,578,071.15 | $1,710,484.81 |
| Gourmet Burgers | 52,872 | 115,428 | $2,349,727.74 | $1,604,378.60 |
| Brunch & Breakfast | 52,735 | 115,084 | $2,142,565.93 | $1,515,108.51 |
| Organic Salads | 55,613 | 123,850 | $1,916,045.12 | $1,427,798.49 |
| Heritage Soups | 55,572 | 123,737 | $1,684,962.71 | $1,234,967.74 |
| Plant-Based & Vegan | 52,851 | 115,354 | $1,684,012.44 | $1,245,162.42 |
| Decadent Desserts | 55,382 | 123,182 | $1,447,013.26 | $1,108,674.86 |
| Craft Beverages | 55,468 | 123,399 | $939,873.64 | $786,956.87 |

## 4. Ordering Channel Share
| Channel | Total Orders | Total Revenue | Avg Item Price |
| :--- | :--- | :--- | :--- |
| Dine-in | 42,508 | $14,179,440.35 | $30.65 |
| Takeaway | 23,568 | $7,839,629.63 | $30.55 |
| Restaurant Website | 16,901 | $5,644,347.83 | $30.69 |
| Third-party Delivery | 11,051 | $3,702,207.41 | $30.50 |