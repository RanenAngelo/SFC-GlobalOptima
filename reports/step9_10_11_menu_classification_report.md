# DineIQ Analytics — Menu Profitability & Classification Report
*Specification: TechWiz 7 / Aptech v1.0 — Steps 9, 10, & 11*

## 1. Classification Methodology & Philosophy
As mandated by Step 9, high sales volume alone does not determine menu success. DineIQ computes multi-dimensional performance integrating contribution margins, operational kitchen wastage, customer ratings, repeat purchase loyalty, and promotional dependencies.

## 2. Menu Classification Distribution
| Performance Category | Dish Count | Share of Menu | Strategic Objective |
| :--- | :--- | :--- | :--- |
| **Low Performer** | 52 | 33.3% | Re-engineer recipe, adjust prices, reduce prep waste, or retire. |
| **Volume Driver** | 41 | 26.3% | Protect margins, cross-sell high-margin sides, optimize portion costs. |
| **Hidden Opportunity** | 41 | 26.3% | Increase visibility, feature in promotional campaigns, staff upselling. |
| **Profit Driver** | 22 | 14.1% | Protect core quality, sustain brand reputation, prime positioning. |

## 3. Tricky Menu Performance Cases Audited (Step 11)
The application explicitly diagnoses and provides prescriptive actions for the 10 edge cases:

### Case 4: Highly rated dish with poor profitability
- **Item:** `M004` — **Handmade Saffron Tagliolini**
- **Assigned Classification:** `Volume Driver`
- **Key Metrics:** Units Sold: 8,927 | Revenue: $187,467.00 | Margin: 7.1% | Rating: 4.84 | Wastage: 14.8%
- **Analytical Finding:** Exceptional rating (4.84/5.0), but razor-thin margin (7.1%). Customers love it, but each sale contributes negligible profit.
- **Prescriptive Recommendation:** Gradual 8-12% price increase; guest satisfaction and willingness-to-pay are high.

### Case 9: Seasonal menu item
- **Item:** `M009` — **Winter Roasted Chestnut Bisque**
- **Assigned Classification:** `Low Performer`
- **Key Metrics:** Units Sold: 2,886 | Revenue: $43,290.00 | Margin: 70.0% | Rating: 3.82 | Wastage: 36.2%
- **Analytical Finding:** Orders concentrated heavily in Q1 and Q4; stagnant in summer months.
- **Prescriptive Recommendation:** Rotate off summer menu and reintroduce as Winter Limited Time Offer (LTO).

### Case 2: Highly profitable but rarely purchased dish
- **Item:** `M002` — **Imperial Beluga Caviar Tartlet**
- **Assigned Classification:** `Hidden Opportunity`
- **Key Metrics:** Units Sold: 971 | Revenue: $82,535.00 | Margin: 78.8% | Rating: 3.69 | Wastage: 58.7%
- **Analytical Finding:** High margin of 78.8%, but only 971 units ordered. High upside potential if promoted.
- **Prescriptive Recommendation:** Feature on Chef's Tasting Menu or bundle with Champagne pairing.

### Case 6: Promotion-dependent dish
- **Item:** `M006` — **Double Loaded Truffle Fries**
- **Assigned Classification:** `Volume Driver`
- **Key Metrics:** Units Sold: 17,102 | Revenue: $205,224.00 | Margin: 66.7% | Rating: 3.78 | Wastage: 8.8%
- **Analytical Finding:** 13.0% of all sales volume occurs exclusively when promotional discounts are active.
- **Prescriptive Recommendation:** Transition item into fixed combo deals rather than standalone price cuts.

### Case 7: Dish performing differently across locations
- **Item:** `M007` — **Spicy Cajun Crawfish Boil**
- **Assigned Classification:** `Low Performer`
- **Key Metrics:** Units Sold: 8,798 | Revenue: $281,536.00 | Margin: 59.4% | Rating: 3.88 | Wastage: 13.4%
- **Analytical Finding:** High sales in coastal and nightlife hubs; poor traction in corporate business lunch zones.
- **Prescriptive Recommendation:** Adopt localized dynamic menus rather than a uniform regional menu.

### Case 10: New menu item with insufficient history
- **Item:** `M010` — **Smoked Pistachio Gelato Brioche**
- **Assigned Classification:** `Hidden Opportunity`
- **Key Metrics:** Units Sold: 202 | Revenue: $2,323.00 | Margin: 69.6% | Rating: 3.35 | Wastage: 88.3%
- **Analytical Finding:** Launched in late December (2025-12-15). Historical volume is naturally limited.
- **Prescriptive Recommendation:** Maintain Hidden Opportunity incubation status; monitor early reviews before altering price.

### Case 1: High-selling, but loss-making dish
- **Item:** `M001` — **Wagyu Prime Smashed Burger**
- **Assigned Classification:** `Low Performer`
- **Key Metrics:** Units Sold: 52,892 | Revenue: $766,934.00 | Margin: -20.7% | Rating: 3.83 | Wastage: 3.2%
- **Analytical Finding:** Sold 52,892 units generating $766,934.00 revenue, but total profit is negative ($-158,676.00) due to cost ($17.50) exceeding price ($14.50). Correctly classified as Low Performer.
- **Prescriptive Recommendation:** Immediate repricing to $19.50 or renegotiation of wagyu ingredient supply.

### Case 3: Popular dish with excessive wastage
- **Item:** `M003` — **Fresh Maine Lobster Thermidor**
- **Assigned Classification:** `Low Performer`
- **Key Metrics:** Units Sold: 26,335 | Revenue: $1,264,080.00 | Margin: 54.2% | Rating: 3.86 | Wastage: 87.2%
- **Analytical Finding:** Strong demand (26,335 units) and high revenue, but excessive kitchen wastage (87.2%) resulting in $3,964,004.00 waste loss.
- **Prescriptive Recommendation:** Revise batch preparation quantities and train kitchen line on shellfish preservation.

### Case 8: Dish performing well only during weekends
- **Item:** `M008` — **Prosecco Brunch Tower**
- **Assigned Classification:** `Low Performer`
- **Key Metrics:** Units Sold: 3,837 | Revenue: $145,806.00 | Margin: 68.4% | Rating: 3.79 | Wastage: 30.5%
- **Analytical Finding:** Over 85% of orders concentrated between Friday evening and Sunday afternoon.
- **Prescriptive Recommendation:** Designate as a weekend-exclusive feature to streamline weekday inventory.

### Case 5: Low-rated dish with high sales
- **Item:** `M005` — **Midnight Crispy Onion Rings**
- **Assigned Classification:** `Volume Driver`
- **Key Metrics:** Units Sold: 35,098 | Revenue: $263,235.00 | Margin: 80.0% | Rating: 1.70 | Wastage: 4.3%
- **Analytical Finding:** Poor rating (1.70/5.0), but high transaction volume (35,098 units). Risk of brand erosion.
- **Prescriptive Recommendation:** Reformulate recipe (reduce greasiness, upgrade breading) while preserving price point.
