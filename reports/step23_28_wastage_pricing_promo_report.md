# DineIQ Analytics — Wastage, Price Sensitivity & Promotion Trap Audit
*Specification: TechWiz 7 / Aptech v1.0 — Steps 23 through 28*
**Report Generated:** 2026-09-25 09:18:52

## 1. Food Wastage Analytics & Risk Prediction (Steps 23 & 24)
- **Total Operational Wastage Loss:** $5,583,721.80
- **Total Portions Discarded:** 420,873.6 units

### Wastage by Reason
| Waste Reason | Incidents Logged | Total Portions | Financial Loss |
| :--- | :--- | :--- | :--- |
| Overproduction | 10,937 | 84,944.2 | $1,130,147.33 |
| Kitchen Error | 11,029 | 84,404.5 | $1,116,600.89 |
| Storage Temp Deviation | 11,005 | 84,028.0 | $1,116,532.96 |
| Spoiled Fresh Prep | 10,985 | 83,586.7 | $1,110,586.22 |
| Expired | 11,022 | 83,910.2 | $1,109,854.40 |

### Top Critical Wastage Risk Dishes
| Dish Name | Category | Incidents | Wasted Portions | Total Financial Loss | Risk Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fresh Maine Lobster Thermidor** | Appetizers | 11,291 | 180,182.0 | **$3,964,004.00** | `CRITICAL_WASTE_RISK` |
| **Chateaubriand** | Prime Steaks & Grills | 286 | 1,552.5 | **$36,576.82** | `CRITICAL_WASTE_RISK` |
| **Grilled Octopus** | Coastal Seafood | 272 | 1,464.3 | **$36,490.33** | `CRITICAL_WASTE_RISK` |
| **Halibut Risotto** | Coastal Seafood | 316 | 1,641.4 | **$36,045.09** | `CRITICAL_WASTE_RISK` |
| **Pan-Seared Sea Bass** | Coastal Seafood | 284 | 1,614.9 | **$35,220.87** | `CRITICAL_WASTE_RISK` |
| **Fish & Chips Craft** | Coastal Seafood | 294 | 1,664.9 | **$32,714.69** | `CRITICAL_WASTE_RISK` |

## 2. Price Sensitivity Classification (Steps 25 & 26)
| Sensitivity Tier | Dish Count | Strategic Pricing Action |
| :--- | :--- | :--- |
| **Low Price Sensitivity** | 96 | Inelastic demand; premium guest status. Favorable opportunity for 8-12% price optimization. |
| **Moderately Price Sensitive** | 41 | Standard elasticity; execute measured 3-5% price changes during scheduled menu updates. |
| **Highly Price Sensitive** | 19 | Strict price protection; high customer elasticity. Offset food costs via portion adjustments. |

## 3. Promotion Effectiveness & Trap Detection (Steps 27 & 28)
| Promo Name | Discount % | Orders | Net Revenue | Net Profit | Margin % | Trap Status | Audit Findings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| New Year Kickoff 15% | 15% | 942 | $269,916.61 | $159,602.01 | 59.1% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Valentine Sweethearts 20% | 20% | 443 | $114,609.33 | $64,950.02 | 56.7% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Spring Pasta Bonanza 25% | 25% | 1,074 | $266,016.95 | $143,284.80 | 53.9% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Burger Frenzy 40% Off | 40% | 1,046 | $211,217.46 | $89,283.87 | 42.3% | ⚠️ **PROMO TRAP** | PROMOTION TRAP: Deep discount (40%) cannibalized profit margins down to 42.3%. Sales volume spiked but net profit collapsed. |
| Summer Refresh Mocktails BOGO | 30% | 1,930 | $445,052.99 | $225,677.25 | 50.7% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Artisan Pizza Weekend 20% | 20% | 1,959 | $522,228.25 | $295,211.44 | 56.5% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Steakhouse Deep Discount 35% | 35% | 1,360 | $294,438.63 | $137,104.12 | 46.6% | ⚠️ **PROMO TRAP** | PROMOTION TRAP: Deep discount (35%) cannibalized profit margins down to 46.6%. Sales volume spiked but net profit collapsed. |
| Fall Harvest Soups 15% | 15% | 2,008 | $564,793.82 | $334,040.42 | 59.1% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Black Friday Feast 30% | 30% | 443 | $101,155.88 | $51,474.96 | 50.9% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |
| Holiday Gastronomy 20% | 20% | 1,071 | $285,607.23 | $162,269.99 | 56.8% | ✅ Healthy | Healthy promotional campaign generating net positive margin. |