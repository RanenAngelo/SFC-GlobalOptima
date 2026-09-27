import sys
import os
import json
import time
from itertools import combinations
from collections import defaultdict
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    PARQUET_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR
)

def run_market_basket_analysis():
    print("=" * 65)
    print("  DineIQ Analytics — Market-Basket Analysis & Cross-Sell Bundling")
    print("=" * 65)
    
    start_t = time.time()
    
                                                  
    trans_path = PARQUET_DATA_DIR / "master_transactions.parquet"
    print(f"Loading transaction baskets from: {trans_path.name}...")
    df = pd.read_parquet(trans_path, columns=["order_id", "item_id", "item_name", "category_name", "order_status", "unit_price"])
    
                             
    df = df[df["order_status"] == "Completed"]
    item_names = df.set_index("item_id")["item_name"].to_dict()
    item_categories = df.set_index("item_id")["category_name"].to_dict()
    item_prices = df.set_index("item_id")["unit_price"].to_dict()
    
                      
    print("Constructing transaction baskets...")
    baskets = df.groupby("order_id")["item_id"].apply(lambda s: sorted(list(set(s)))).tolist()
    total_baskets = len(baskets)
    print(f"Constructed {total_baskets:,d} unique order baskets.")
    
                                             
    item_counts = defaultdict(int)
    pair_counts = defaultdict(int)
    
    for b in baskets:
        for item in b:
            item_counts[item] += 1
                    
        if len(b) >= 2:
            for pair in combinations(b, 2):
                pair_counts[pair] += 1
                
                                                              
    print("\nMining association rules (Support, Confidence, Lift)...")
    rules = []
    min_support_count = 150                                  
    
    for (item_a, item_b), count_ab in pair_counts.items():
        if count_ab < min_support_count:
            continue
            
        supp_ab = count_ab / total_baskets
        supp_a = item_counts[item_a] / total_baskets
        supp_b = item_counts[item_b] / total_baskets
        
                     
        conf_a_b = supp_ab / supp_a
        lift_a_b = conf_a_b / supp_b
        
                     
        conf_b_a = supp_ab / supp_b
        lift_b_a = conf_b_a / supp_a
        
        rules.append({
            "antecedent_id": item_a,
            "antecedent_name": item_names.get(item_a, item_a),
            "antecedent_category": item_categories.get(item_a, ""),
            "consequent_id": item_b,
            "consequent_name": item_names.get(item_b, item_b),
            "consequent_category": item_categories.get(item_b, ""),
            "support": round(supp_ab, 4),
            "confidence": round(conf_a_b, 4),
            "lift": round(lift_a_b, 3),
            "co_occurrence_count": count_ab
        })
        
        rules.append({
            "antecedent_id": item_b,
            "antecedent_name": item_names.get(item_b, item_b),
            "antecedent_category": item_categories.get(item_b, ""),
            "consequent_id": item_a,
            "consequent_name": item_names.get(item_a, item_a),
            "consequent_category": item_categories.get(item_a, ""),
            "support": round(supp_ab, 4),
            "confidence": round(conf_b_a, 4),
            "lift": round(lift_b_a, 3),
            "co_occurrence_count": count_ab
        })
        
    rules_df = pd.DataFrame(rules)
                                                                   
    top_rules = rules_df.sort_values(by=["lift", "confidence"], ascending=[False, False])
    print(f"Identified {len(rules_df)} association rules across menu items.")
    
                                                                   
                                                    
                                                                   
    print("\n--- Generating Bundles and Cross-Sell Strategies ---")
    
    combos = []
    cross_sells = []
    
                                
    unique_combos_seen = set()
    for _, r in top_rules.iterrows():
        a_id, b_id = r["antecedent_id"], r["consequent_id"]
        pair_key = tuple(sorted([a_id, b_id]))
        if pair_key in unique_combos_seen:
            continue
        unique_combos_seen.add(pair_key)
        
        a_price = item_prices.get(a_id, 15.0)
        b_price = item_prices.get(b_id, 10.0)
        bundled_price = round((a_price + b_price) * 0.88, 2)                     
        
        combos.append({
            "combo_title": f"{r['antecedent_name']} & {r['consequent_name']} Duo",
            "item_1": r["antecedent_name"],
            "item_2": r["consequent_name"],
            "item_1_id": a_id,
            "item_2_id": b_id,
            "combined_individual_price": round(a_price + b_price, 2),
            "recommended_bundle_price": bundled_price,
            "estimated_savings_for_guest": round((a_price + b_price) - bundled_price, 2),
            "support": r["support"],
            "confidence": r["confidence"],
            "lift": r["lift"],
            "rationale": f"High co-purchasing affinity (Lift: {r['lift']:.2f}x baseline). Strong customer acceptance expected."
        })
        
        cross_sells.append({
            "trigger_item": r["antecedent_name"],
            "trigger_id": a_id,
            "recommended_add_on": r["consequent_name"],
            "add_on_id": b_id,
            "add_on_price": b_price,
            "confidence_pct": round(r["confidence"] * 100, 1),
            "lift": r["lift"],
            "prompt_text": f"Enjoying {r['antecedent_name']}? Guests frequently add {r['consequent_name']}!"
        })
        
        if len(combos) >= 10:
            break
            
    print(f"Generated {len(combos)} curated combo meals and {len(cross_sells)} digital cross-sell prompts.")
    
                 
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_data = {
        "module": "Market-Basket Analysis & Cross-Sell Bundling",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_transactions_evaluated": total_baskets,
        "total_rules_mined": len(rules_df),
        "top_association_rules": top_rules.head(15).to_dict(orient="records"),
        "curated_combo_meals": combos,
        "digital_cross_sell_prompts": cross_sells[:10]
    }
    
    json_path = REPORTS_DIR / "step17_18_market_basket_report.json"
    with open(json_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    md_path = REPORTS_DIR / "step17_18_market_basket_report.md"
    generate_markdown(report_data, md_path)
    
    print(f"\nReport written to: {json_path}")
    print(f"Markdown written to: {md_path}")
    print("\n>>> Market-Basket Analysis Completed Successfully! <<<\n")
    return report_data

def generate_markdown(rep, md_path: Path):
    lines = [
        "# DineIQ Analytics — Market-Basket Analysis & Bundling Report",
        "*Association Rule Mining & Synergistic Bundle Optimization*",
        f"**Audit Execution Time:** {rep['timestamp']}",
        "",
        "## 1. Executive Summary",
        f"Using Apriori association rule mining across **{rep['total_transactions_evaluated']:,} completed order baskets**, DineIQ discovered key menu item synergies. All recommendations are mathematically justified via Support, Confidence, and Lift.",
        "",
        "## 2. Top Association Rules",
        "| Antecedent (If Ordered) | Consequent (Also Ordered) | Support % | Confidence % | Lift | Association Strength |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ]
    for r in rep["top_association_rules"][:10]:
        supp_pct = round(r["support"] * 100, 2)
        conf_pct = round(r["confidence"] * 100, 1)
        strength = "Very High Synergy" if r["lift"] >= 2.0 else "High Synergy"
        lines.append(f"| **{r['antecedent_name']}** | **{r['consequent_name']}** | {supp_pct}% | {conf_pct}% | **{r['lift']}x** | {strength} |")
        
    lines.extend([
        "",
        "## 3. Recommended Combo Meals & Bundles",
        "| Combo Meal Title | Main Dishes Included | Separate Price | Combo Bundle Price | Guest Savings | Association Lift |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for c in rep["curated_combo_meals"][:6]:
        lines.append(f"| **{c['combo_title']}** | {c['item_1']} + {c['item_2']} | ${c['combined_individual_price']:.2f} | **${c['recommended_bundle_price']:.2f}** | ${c['estimated_savings_for_guest']:.2f} | {c['lift']}x |")
        
    lines.extend([
        "",
        "## 4. Digital Cross-Sell Recommendations (Online & Server Prompts)",
        "| Trigger Dish | Suggested Add-On | Add-On Price | Acceptance Likelihood | Server / POS Prompt |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])
    for cs in rep["digital_cross_sell_prompts"][:6]:
        lines.append(f"| **{cs['trigger_item']}** | {cs['recommended_add_on']} | ${cs['add_on_price']:.2f} | {cs['confidence_pct']}% | *\"{cs['prompt_text']}\"* |")
        
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_market_basket_analysis()
