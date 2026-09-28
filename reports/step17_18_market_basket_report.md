# DineIQ Analytics — Market-Basket Analysis & Bundling Report
*Specification: TechWiz 7 / Aptech v1.0 — Steps 17 & 18*
**Audit Execution Time:** 2026-09-25 09:15:49

## 1. Executive Summary
Using Apriori association rule mining across **94,028 completed order baskets**, DineIQ discovered key menu item synergies. All recommendations are mathematically justified via Support, Confidence, and Lift.

## 2. Top Association Rules (Step 17)
| Antecedent (If Ordered) | Consequent (Also Ordered) | Support % | Confidence % | Lift | Association Strength |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Truffle Pasta** | **Valrhona Molten Lava Cake** | 6.37% | 54.2% | **4.578x** | Very High Synergy |
| **Valrhona Molten Lava Cake** | **Truffle Pasta** | 6.37% | 53.8% | **4.578x** | Very High Synergy |
| **Ribeye Steak 12oz** | **French Onion Soup** | 6.45% | 54.6% | **4.569x** | Very High Synergy |
| **French Onion Soup** | **Ribeye Steak 12oz** | 6.45% | 54.0% | **4.569x** | Very High Synergy |
| **Sparkling Berry Mocktail** | **Margherita** | 6.34% | 53.8% | **4.501x** | Very High Synergy |
| **Margherita** | **Sparkling Berry Mocktail** | 6.34% | 53.1% | **4.501x** | Very High Synergy |
| **Grilled Atlantic Salmon** | **Classic Caesar Supreme** | 6.44% | 53.8% | **4.474x** | Very High Synergy |
| **Classic Caesar Supreme** | **Grilled Atlantic Salmon** | 6.44% | 53.5% | **4.474x** | Very High Synergy |
| **Double Loaded Truffle Fries** | **Wagyu Prime Smashed Burger** | 7.7% | 65.2% | **2.042x** | Very High Synergy |
| **Wagyu Prime Smashed Burger** | **Double Loaded Truffle Fries** | 7.7% | 24.1% | **2.042x** | Very High Synergy |

## 3. Recommended Combo Meals & Bundles (Step 18)
| Combo Meal Title | Main Dishes Included | Separate Price | Combo Bundle Price | Guest Savings | Association Lift |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Truffle Pasta & Valrhona Molten Lava Cake Duo** | Truffle Pasta + Valrhona Molten Lava Cake | $35.60 | **$31.33** | $4.27 | 4.578x |
| **Ribeye Steak 12oz & French Onion Soup Duo** | Ribeye Steak 12oz + French Onion Soup | $55.58 | **$48.91** | $6.67 | 4.569x |
| **Sparkling Berry Mocktail & Margherita Duo** | Sparkling Berry Mocktail + Margherita | $27.99 | **$24.63** | $3.36 | 4.501x |
| **Grilled Atlantic Salmon & Classic Caesar Supreme Duo** | Grilled Atlantic Salmon + Classic Caesar Supreme | $59.96 | **$52.76** | $7.20 | 4.474x |
| **Double Loaded Truffle Fries & Wagyu Prime Smashed Burger Duo** | Double Loaded Truffle Fries + Wagyu Prime Smashed Burger | $26.50 | **$23.32** | $3.18 | 2.042x |
| **Prosciutto Funghi & Double Smashed Burger Duo** | Prosciutto Funghi + Double Smashed Burger | $39.24 | **$34.53** | $4.71 | 1.214x |

## 4. Digital Cross-Sell Recommendations (Online & Server Prompts)
| Trigger Dish | Suggested Add-On | Add-On Price | Acceptance Likelihood | Server / POS Prompt |
| :--- | :--- | :--- | :--- | :--- |
| **Truffle Pasta** | Valrhona Molten Lava Cake | $9.64 | 54.2% | *"Enjoying Truffle Pasta? Guests frequently add Valrhona Molten Lava Cake!"* |
| **Ribeye Steak 12oz** | French Onion Soup | $11.40 | 54.6% | *"Enjoying Ribeye Steak 12oz? Guests frequently add French Onion Soup!"* |
| **Sparkling Berry Mocktail** | Margherita | $19.15 | 53.8% | *"Enjoying Sparkling Berry Mocktail? Guests frequently add Margherita!"* |
| **Grilled Atlantic Salmon** | Classic Caesar Supreme | $17.78 | 53.8% | *"Enjoying Grilled Atlantic Salmon? Guests frequently add Classic Caesar Supreme!"* |
| **Double Loaded Truffle Fries** | Wagyu Prime Smashed Burger | $14.50 | 65.2% | *"Enjoying Double Loaded Truffle Fries? Guests frequently add Wagyu Prime Smashed Burger!"* |
| **Prosciutto Funghi** | Double Smashed Burger | $16.69 | 7.6% | *"Enjoying Prosciutto Funghi? Guests frequently add Double Smashed Burger!"* |