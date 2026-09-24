import sys
import os
import argparse
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from pathlib import Path

                              
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import (
    RAW_DATA_DIR, SAMPLE_DATA_DIR,
    TARGET_ORDER_ITEMS, TARGET_ORDERS, TARGET_CUSTOMERS,
    TARGET_MENU_ITEMS, TARGET_CATEGORIES, TARGET_RESTAURANTS,
    TARGET_RATINGS, TARGET_WASTAGE_RECORDS,
    SAMPLE_ORDER_ITEMS, SAMPLE_ORDERS, SAMPLE_CUSTOMERS,
    SAMPLE_RATINGS, SAMPLE_WASTAGE_RECORDS,
    CHANNELS, CUSTOMER_SEGMENTS
)

                                                         
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

def generate_categories():
    categories = [
        {"category_id": "CAT01", "category_name": "Appetizers", "description": "Starters, finger foods, and sharing plates"},
        {"category_id": "CAT02", "category_name": "Artisan Pizzas", "description": "Wood-fired and hand-tossed artisan pizzas"},
        {"category_id": "CAT03", "category_name": "Handcrafted Pastas", "description": "Fresh pasta with regional authentic sauces"},
        {"category_id": "CAT04", "category_name": "Gourmet Burgers", "description": "Angus beef, wagyu, and brioche burgers"},
        {"category_id": "CAT05", "category_name": "Prime Steaks & Grills", "description": "Aged prime cuts, steaks, and flame-grilled meats"},
        {"category_id": "CAT06", "category_name": "Coastal Seafood", "description": "Wild-caught seafood, lobster, prawns, and fish"},
        {"category_id": "CAT07", "category_name": "Organic Salads", "description": "Farm-fresh greens, superfood bowls, and salads"},
        {"category_id": "CAT08", "category_name": "Heritage Soups", "description": "Slow-simmered artisanal broths and cream soups"},
        {"category_id": "CAT09", "category_name": "Plant-Based & Vegan", "description": "Innovative vegan dishes and meat alternatives"},
        {"category_id": "CAT10", "category_name": "Decadent Desserts", "description": "Pastries, mousses, cheesecakes, and gelato"},
        {"category_id": "CAT11", "category_name": "Craft Beverages", "description": "Mocktails, pressed juices, specialty teas, and sodas"},
        {"category_id": "CAT12", "category_name": "Brunch & Breakfast", "description": "Eggs Benedict, brioche toast, and morning plates"}
    ]
    return pd.DataFrame(categories)

def generate_restaurants(num_restaurants=TARGET_RESTAURANTS):
    zones = ["Downtown Flagship", "Financial District", "Uptown Promenade", "Waterfront Pier", 
             "Suburban Galleria", "Airport Terminal", "Tech Corridor", "Historic Quarter", "Fashion Avenue"]
    cities = [
        ("New York", "NY"), ("Chicago", "IL"), ("San Francisco", "CA"), 
        ("Austin", "TX"), ("Seattle", "WA"), ("Boston", "MA"),
        ("Miami", "FL"), ("Denver", "CO"), ("Los Angeles", "CA"), ("Atlanta", "GA")
    ]
    
    records = []
    for i in range(1, num_restaurants + 1):
        rest_id = f"REST{i:02d}"
        city_info = cities[(i - 1) % len(cities)]
        zone = zones[(i - 1) % len(zones)]
        capacity = random.choice([60, 80, 100, 120, 150, 200, 250])
        open_year = random.randint(2018, 2024)
        open_month = random.randint(1, 12)
        records.append({
            "restaurant_id": rest_id,
            "restaurant_name": f"DineIQ {city_info[0]} {zone.split()[0]}",
            "city": city_info[0],
            "state": city_info[1],
            "zone": zone,
            "seating_capacity": capacity,
            "opened_date": f"{open_year}-{open_month:02d}-01"
        })
    return pd.DataFrame(records)

def generate_menu_items(categories_df, num_items=TARGET_MENU_ITEMS):
    cat_ids = categories_df["category_id"].tolist()
    
                             
    name_prefixes = ["Truffle", "Smoked", "Wood-Fired", "Artisan", "Spiced", "Crispy", "Slow-Roasted", "Braised", "Glazed", "Velvet", "Charred", "Wild"]
    dish_roots = {
        "CAT01": ["Calamari", "Bruschetta", "Arancini", "Wings", "Sliders", "Loaded Nachos", "Tartare", "Carpaccio", "Stuffed Mushrooms", "Spring Rolls", "Hummus Trio", "Empanadas", "Garlic Bread"],
        "CAT02": ["Margherita", "Diavola", "Quattro Formaggi", "Prosciutto Funghi", "Burrata Truffle", "Calzone", "Pepperoni Bianca", "Pesto Genovese", "Smoked Salmon Pizza", "Wild Mushroom Flatbread", "Capricciosa", "Marinara", "Fig Gorgonzola"],
        "CAT03": ["Tagliatelle Bolognese", "Truffle Pasta", "Fettuccine Alfredo", "Seafood Linguine", "Penne Arrabbiata", "Ravioli Ricotta", "Gnocchi Gorgonzola", "Pappardelle Ragu", "Spaghetti Carbonara", "Lobster Tortelloni", "Lasagna Classica", "Rigatoni Pesto", "Lasagna Bianca"],
        "CAT04": ["Angus Classic Burger", "Truffle Wagyu Burger", "Smoked Bacon Burger", "Spicy Chicken Burger", "Mushroom Swiss Burger", "Bison Deluxe", "BBQ Pulled Pork Burger", "Crispy Fish Fillet Burger", "Double Smashed Burger", "Sliders Board", "Jalapeno Cheddar Burger", "Avocado Burger", "Blue Cheese Burger"],
        "CAT05": ["Ribeye Steak 12oz", "Filet Mignon 8oz", "New York Strip 10oz", "Tomahawk Cut 32oz", "Braised Beef Short Ribs", "Rack of Lamb", "Grilled Spatchcock Chicken", "Pork Belly Glazed", "T-Bone Steak", "Chateaubriand", "Wagyu Striploin", "BBQ Beef Brisket", "Veal Chop"],
        "CAT06": ["Grilled Atlantic Salmon", "Pan-Seared Sea Bass", "Lobster Tail Thermidor", "Tiger Prawn Skewers", "Crab Cakes Chesapeake", "Grilled Octopus", "Mahi Mahi Tacos", "Halibut Risotto", "Seafood Paella", "Cioppino Stew", "Tuna Tataki Bowl", "Black Cod Miso", "Fish & Chips Craft"],
        "CAT07": ["Mediterranean Quinoa Salad", "Classic Caesar Supreme", "Burrata Heirloom Tomato", "Kale & Roasted Squash", "Roasted Beet & Goat Cheese", "Thai Beef Crunch Salad", "Greek Village Salad", "Superfood Cobb Salad", "Caprese Salad", "Asian Sesame Salmon Bowl", "Arugula Citrus Bowl", "Avocado Corn Bowl", "Warm Lentil Salad"],
        "CAT08": ["French Onion Soup", "Cream of Wild Mushroom", "Lobster Bisque", "Tuscan White Bean Soup", "Butternut Squash Soup", "Minestrone Genovese", "Chicken Tortilla Broth", "Seafood Chowder", "Tomato Basil Bisque", "Beef Goulash Soup", "Miso Salmon Soup", "Roasted Pepper Stew", "Lentil Soup"],
        "CAT09": ["Beyond Truffle Burger", "Wild Mushroom Risotto", "Crispy Cauliflower Wings", "Tofu Teriyaki Bowl", "Zucchini Noodles Pesto", "Jackfruit Carnitas Tacos", "Lentil Shepherd's Pie", "Chickpea Tikka Bowl", "Avocado Green Goddess Bowl", "Smoked Tofu Bao", "Eggplant Parmigiana Vegan", "Pumpkin Ravioli Vegan", "Falafel Mezze Plate"],
        "CAT10": ["Valrhona Molten Lava Cake", "Classic Tiramisu Classico", "Basque Burnt Cheesecake", "Vanilla Bean Creme Brulee", "Pistachio Gelato Sundae", "Apple Tarte Tatin", "Salted Caramel Tart", "Panna Cotta Berry", "Nutella Churros Board", "Key Lime Pie", "Profiteroles Dark Chocolate", "Affogato Supreme", "Chocolate Mousse Dome"],
        "CAT11": ["Sparkling Berry Mocktail", "Cold Pressed Green Detox", "Smoked Hibiscus Soda", "Passionfruit Fizz", "Artisan Cold Brew Latte", "Matcha Lavender Tonic", "Craft Ginger Beer", "Yuzu Mint Lemonade", "Blood Orange Spritz", "Dragonfruit Infusion", "Earl Grey London Fog", "Rosemary Grapefruit Elixir", "Kombucha Tap"],
        "CAT12": ["Classic Eggs Benedict", "Avocado Sourdough Tartine", "Brioche French Toast", "Smoked Salmon Croissant", "Shakshuka Mediterranean", "Belgian Waffle Berry Supreme", "Breakfast Burrito Deluxe", "Truffle Scrambled Brioche", "Pancake Stack Maple", "Açaí Superfruit Bowl", "Steak & Eggs Skillet", "Croque Madame", "Churro French Toast"]
    }
    
    items = []
    item_idx = 1
    
    for cat_id, dish_list in dish_roots.items():
        for d_name in dish_list:
            if item_idx > num_items:
                break
            
                            
            if cat_id in ["CAT05", "CAT06"]:
                base_price = round(random.uniform(28.0, 58.0), 2)
                margin_rate = random.uniform(0.55, 0.72)
            elif cat_id in ["CAT02", "CAT03", "CAT04"]:
                base_price = round(random.uniform(16.0, 26.0), 2)
                margin_rate = random.uniform(0.60, 0.75)
            elif cat_id in ["CAT01", "CAT07", "CAT08", "CAT09"]:
                base_price = round(random.uniform(11.0, 18.0), 2)
                margin_rate = random.uniform(0.65, 0.80)
            elif cat_id in ["CAT10"]:
                base_price = round(random.uniform(9.0, 15.0), 2)
                margin_rate = random.uniform(0.70, 0.85)
            elif cat_id in ["CAT11"]:
                base_price = round(random.uniform(5.5, 9.5), 2)
                margin_rate = random.uniform(0.75, 0.88)
            else:        
                base_price = round(random.uniform(12.0, 22.0), 2)
                margin_rate = random.uniform(0.65, 0.78)
            
            cost_price = round(base_price * (1.0 - margin_rate), 2)
            case_tag = "NORMAL"
            launch_date = "2024-01-01"
            
                                                                      
            if item_idx == 1:
                                                                                  
                d_name = "Wagyu Prime Smashed Burger"
                base_price = 14.50
                cost_price = 17.50                              
                case_tag = "TRICKY_LOSS_MAKER"
            elif item_idx == 2:
                                                                            
                d_name = "Imperial Beluga Caviar Tartlet"
                base_price = 85.00
                cost_price = 18.00                                          
                case_tag = "TRICKY_HIGH_MARGIN_LOW_SALES"
            elif item_idx == 3:
                                                                    
                d_name = "Fresh Maine Lobster Thermidor"
                base_price = 48.00
                cost_price = 22.00
                case_tag = "TRICKY_HIGH_WASTAGE"
            elif item_idx == 4:
                                                                          
                d_name = "Handmade Saffron Tagliolini"
                base_price = 21.00
                cost_price = 19.50                                               
                case_tag = "TRICKY_HIGH_RATING_LOW_PROFIT"
            elif item_idx == 5:
                                                               
                d_name = "Midnight Crispy Onion Rings"
                base_price = 7.50
                cost_price = 1.50
                case_tag = "TRICKY_LOW_RATING_HIGH_SALES"
            elif item_idx == 6:
                                                         
                d_name = "Double Loaded Truffle Fries"
                base_price = 12.00
                cost_price = 4.00
                case_tag = "TRICKY_PROMO_DEPENDENT"
            elif item_idx == 7:
                                                                             
                d_name = "Spicy Cajun Crawfish Boil"
                base_price = 32.00
                cost_price = 13.00
                case_tag = "TRICKY_LOCATION_DIVERGENT"
            elif item_idx == 8:
                                                                          
                d_name = "Prosecco Brunch Tower"
                base_price = 38.00
                cost_price = 12.00
                case_tag = "TRICKY_WEEKEND_ONLY"
            elif item_idx == 9:
                                                                 
                d_name = "Winter Roasted Chestnut Bisque"
                base_price = 15.00
                cost_price = 4.50
                case_tag = "TRICKY_SEASONAL_WINTER"
            elif item_idx == 10:
                                                                         
                d_name = "Smoked Pistachio Gelato Brioche"
                base_price = 11.50
                cost_price = 3.50
                launch_date = "2025-12-15"                                         
                case_tag = "TRICKY_NEW_ITEM"
            
            items.append({
                "item_id": f"M{item_idx:03d}",
                "category_id": cat_id,
                "item_name": d_name,
                "base_price": base_price,
                "cost_price": cost_price,
                "is_active": True,
                "launch_date": launch_date,
                "case_tag": case_tag
            })
            item_idx += 1
            
    return pd.DataFrame(items)

def generate_pricing_history(menu_items_df):
    records = []
    change_idx = 1
    reasons = ["Ingredient Inflation", "Seasonal Adjustment", "Annual Price Optimization", "Market Elasticity Test", "Supplier Cost Change"]
    
    for _, row in menu_items_df.iterrows():
                                                                      
        item_id = row["item_id"]
        current_p = row["base_price"]
        
                                                     
        if random.random() < 0.65:
            change_pct = random.choice([-0.10, -0.05, 0.05, 0.08, 0.12, 0.15])
            old_p = round(current_p / (1.0 + change_pct), 2)
            eff_date = f"2025-{random.randint(3, 8):02d}-{random.randint(1, 28):02d}"
            records.append({
                "price_change_id": f"PRC{change_idx:04d}",
                "item_id": item_id,
                "old_price": old_p,
                "new_price": current_p,
                "effective_date": eff_date,
                "reason": random.choice(reasons)
            })
            change_idx += 1
            
    return pd.DataFrame(records)

def generate_promotions():
    promos = [
        {"promo_id": "PR01", "promo_name": "New Year Kickoff 15%", "promo_code": "NY2025", "discount_pct": 0.15, "start_date": "2025-01-01", "end_date": "2025-01-15", "target_category_id": "ALL", "is_trap": False},
        {"promo_id": "PR02", "promo_name": "Valentine Sweethearts 20%", "promo_code": "LOVE20", "discount_pct": 0.20, "start_date": "2025-02-10", "end_date": "2025-02-16", "target_category_id": "CAT10", "is_trap": False},
        {"promo_id": "PR03", "promo_name": "Spring Pasta Bonanza 25%", "promo_code": "PASTA25", "discount_pct": 0.25, "start_date": "2025-03-15", "end_date": "2025-03-31", "target_category_id": "CAT03", "is_trap": False},
        {"promo_id": "PR04", "promo_name": "Burger Frenzy 40% Off", "promo_code": "BURGER40", "discount_pct": 0.40, "start_date": "2025-04-10", "end_date": "2025-04-25", "target_category_id": "CAT04", "is_trap": True},                                      
        {"promo_id": "PR05", "promo_name": "Summer Refresh Mocktails BOGO", "promo_code": "COOL50", "discount_pct": 0.30, "start_date": "2025-06-01", "end_date": "2025-06-30", "target_category_id": "CAT11", "is_trap": False},
        {"promo_id": "PR06", "promo_name": "Artisan Pizza Weekend 20%", "promo_code": "PIZZA20", "discount_pct": 0.20, "start_date": "2025-07-01", "end_date": "2025-07-31", "target_category_id": "CAT02", "is_trap": False},
        {"promo_id": "PR07", "promo_name": "Steakhouse Deep Discount 35%", "promo_code": "PRIME35", "discount_pct": 0.35, "start_date": "2025-08-01", "end_date": "2025-08-20", "target_category_id": "CAT05", "is_trap": True},                                                  
        {"promo_id": "PR08", "promo_name": "Fall Harvest Soups 15%", "promo_code": "HARVEST15", "discount_pct": 0.15, "start_date": "2025-09-15", "end_date": "2025-10-15", "target_category_id": "CAT08", "is_trap": False},
        {"promo_id": "PR09", "promo_name": "Black Friday Feast 30%", "promo_code": "BF30", "discount_pct": 0.30, "start_date": "2025-11-24", "end_date": "2025-11-30", "target_category_id": "ALL", "is_trap": False},
        {"promo_id": "PR10", "promo_name": "Holiday Gastronomy 20%", "promo_code": "CHEER20", "discount_pct": 0.20, "start_date": "2025-12-15", "end_date": "2025-12-31", "target_category_id": "ALL", "is_trap": False},
    ]
    return pd.DataFrame(promos)

def generate_customers(num_customers=TARGET_CUSTOMERS):
    first_names = ["James", "Emma", "Liam", "Olivia", "Noah", "Sophia", "Lucas", "Ava", "Mason", "Isabella", 
                   "Ethan", "Mia", "Oliver", "Harper", "Aiden", "Evelyn", "Elijah", "Abigail", "Logan", "Emily",
                   "Alexander", "Ella", "Daniel", "Elizabeth", "Matthew", "Camila", "Henry", "Luna", "Jackson", "Sofia"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]
    
    segments = CUSTOMER_SEGMENTS
    seg_weights = [0.12, 0.22, 0.18, 0.15, 0.18, 0.15]                                                               
    
                                          
    rand_first = np.random.choice(first_names, num_customers)
    rand_last = np.random.choice(last_names, num_customers)
    full_names = [f"{f} {l}" for f, l in zip(rand_first, rand_last)]
    
    assigned_segs = np.random.choice(segments, num_customers, p=seg_weights)
    channels = np.random.choice(CHANNELS, num_customers, p=[0.40, 0.25, 0.20, 0.15])
    
                                             
    start_date = datetime(2023, 1, 1)
    date_offsets = np.random.randint(0, 365 * 3, num_customers)
    signup_dates = [(start_date + timedelta(days=int(d))).strftime("%Y-%m-%d") for d in date_offsets]
    
                                                                                         
    phones = []
    emails = []
    for i in range(num_customers):
        c_id = f"CUST{i+1:05d}"
        if i % 25 == 0:
            phones.append(None)                        
        else:
            phones.append(f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}")
            
        if i % 80 == 0:
            emails.append(None)                        
        else:
            clean_name = full_names[i].lower().replace(" ", ".")
            emails.append(f"{clean_name}{i%999}@example.com")
            
    df = pd.DataFrame({
        "customer_id": [f"CUST{i+1:05d}" for i in range(num_customers)],
        "full_name": full_names,
        "email": emails,
        "phone": phones,
        "signup_date": signup_dates,
        "segment_label": assigned_segs,
        "preferred_channel": channels
    })
    return df

def generate_orders_and_items(customers_df, menu_items_df, restaurants_df, promotions_df, 
                              target_orders=TARGET_ORDERS, target_order_items=TARGET_ORDER_ITEMS):
    print(f"Generating {target_orders:,} orders and ~{target_order_items:,} order items...")
    
    cust_ids = customers_df["customer_id"].values
    rest_ids = restaurants_df["restaurant_id"].values
    menu_dict = menu_items_df.set_index("item_id").to_dict(orient="index")
    item_id_list = list(menu_dict.keys())
    
                                                                   
    item_weights = []
    for item_id in item_id_list:
        meta = menu_dict[item_id]
        tag = meta["case_tag"]
        if tag == "TRICKY_LOSS_MAKER":                                  
            item_weights.append(5.0)
        elif tag == "TRICKY_HIGH_MARGIN_LOW_SALES":                           
            item_weights.append(0.1)
        elif tag == "TRICKY_HIGH_WASTAGE":                             
            item_weights.append(3.0)
        elif tag == "TRICKY_LOW_RATING_HIGH_SALES":                                
            item_weights.append(4.0)
        elif tag == "TRICKY_NEW_ITEM":                                        
            item_weights.append(0.5)
        else:
            item_weights.append(1.0)
            
    item_weights = np.array(item_weights)
    item_weights /= item_weights.sum()
    
                                                                                              
    avg_items_per_order = max(2, int(np.ceil((target_order_items * 1.06) / target_orders)))
    
                                    
    base_start = datetime(2025, 1, 1, 11, 0, 0)
    total_seconds_in_year = 365 * 24 * 3600
    
    orders_list = []
    order_items_list = []
    
    order_item_counter = 1
    
                                                                  
                                                                                              
    pairings = [
        ("M001", "M006"),                                                     
        ("M028", "M118"),                                   
        ("M014", "M131"),                                              
        ("M053", "M092"),                                        
        ("M066", "M080"),                                        
    ]
    
                                                               
    batch_size = 10000
    num_batches = (target_orders + batch_size - 1) // batch_size
    
    for b in range(num_batches):
        cur_batch_orders = min(batch_size, target_orders - b * batch_size)
        if cur_batch_orders <= 0:
            break
            
                                           
        rand_secs = np.random.randint(0, total_seconds_in_year, cur_batch_orders)
        
                                                                       
        for i in range(cur_batch_orders):
            order_num = b * batch_size + i + 1
            order_id = f"ORD{order_num:06d}"
            
                                                           
            raw_dt = base_start + timedelta(seconds=int(rand_secs[i]))
            hour_roll = random.random()
            if hour_roll < 0.35:
                                       
                dt = raw_dt.replace(hour=random.choice([12, 13]), minute=random.randint(0, 59), second=random.randint(0, 59))
            elif hour_roll < 0.80:
                                        
                dt = raw_dt.replace(hour=random.choice([18, 19, 20, 21]), minute=random.randint(0, 59), second=random.randint(0, 59))
            else:
                                         
                dt = raw_dt.replace(hour=random.randint(11, 22), minute=random.randint(0, 59), second=random.randint(0, 59))
                
            cust_id = np.random.choice(cust_ids)
            rest_id = np.random.choice(rest_ids)
            channel = random.choices(CHANNELS, weights=[0.45, 0.25, 0.18, 0.12])[0]
            
                                                           
            status_roll = random.random()
            if status_roll < 0.94:
                status = "Completed"
            elif status_roll < 0.98:
                status = "Cancelled"
            else:
                status = "Refunded"
                
                              
            promo_id = None
            discount_pct = 0.0
            dt_str = dt.strftime("%Y-%m-%d")
                                     
            if random.random() < 0.25:
                for _, pr in promotions_df.iterrows():
                    if pr["start_date"] <= dt_str <= pr["end_date"]:
                        promo_id = pr["promo_id"]
                        discount_pct = pr["discount_pct"]
                        break
                        
                                                                                            
            n_items = max(2, int(np.random.poisson(avg_items_per_order)))
            
                          
                                                                              
            chosen_items = []
            if random.random() < 0.30:
                combo = random.choice(pairings)
                if combo[0] in menu_dict and combo[1] in menu_dict:
                    chosen_items.extend([combo[0], combo[1]])
                    
            remaining = n_items - len(chosen_items)
            if remaining > 0:
                sampled = list(np.random.choice(item_id_list, size=remaining, p=item_weights))
                chosen_items.extend(sampled)
                
            order_subtotal = 0.0
            order_cost = 0.0
            
            for item_id in chosen_items:
                meta = menu_dict[item_id]
                
                                                             
                if meta["case_tag"] == "TRICKY_WEEKEND_ONLY" and dt.weekday() < 4:
                                                            
                    continue
                                                           
                if meta["case_tag"] == "TRICKY_SEASONAL_WINTER" and dt.month not in [1, 2, 11, 12]:
                                                  
                    continue
                                                     
                if meta["case_tag"] == "TRICKY_NEW_ITEM" and dt_str < meta["launch_date"]:
                    continue
                    
                u_price = meta["base_price"]
                u_cost = meta["cost_price"]
                
                                                     
                qty = np.random.choice([1, 2, 3, 4], p=[0.65, 0.25, 0.07, 0.03])
                
                                                                                                   
                if order_item_counter % 7500 == 0:
                    qty = -qty
                    
                line_total = round(u_price * qty, 2)
                line_cost = round(u_cost * qty, 2)
                
                order_subtotal += line_total
                order_cost += line_cost
                
                                                             
                notes = None
                if random.random() < 0.15:
                    notes = random.choice(["Extra sauce", "No onions", "Well done", "Allergy: Gluten", "Dressing on the side", "Pack cutlery"])
                    
                order_items_list.append({
                    "order_item_id": f"OI{order_item_counter:07d}",
                    "order_id": order_id,
                    "item_id": item_id,
                    "unit_price": u_price,
                    "quantity": qty,
                    "line_total": line_total,
                    "item_cost": line_cost,
                    "special_notes": notes
                })
                order_item_counter += 1
                
            disc_amount = round(order_subtotal * discount_pct, 2)
            tax_amount = round(max(0.0, order_subtotal - disc_amount) * 0.08, 2)
            total_amount = round(max(0.0, order_subtotal - disc_amount) + tax_amount, 2)
            
            orders_list.append({
                "order_id": order_id,
                "customer_id": cust_id,
                "restaurant_id": rest_id,
                "order_datetime": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "order_channel": channel,
                "order_status": status,
                "promo_id": promo_id if promo_id else "",
                "subtotal": round(order_subtotal, 2),
                "discount_amount": disc_amount,
                "tax_amount": tax_amount,
                "total_amount": total_amount
            })
            
        print(f"  Processed batch {b+1}/{num_batches} (Current items: {len(order_items_list):,})...")
        
    orders_df = pd.DataFrame(orders_list)
    order_items_df = pd.DataFrame(order_items_list)
    
                                         
                                         
    if len(orders_df) > 50:
        dup_orders = orders_df.sample(n=min(50, len(orders_df)), random_state=42)
        orders_df = pd.concat([orders_df, dup_orders], ignore_index=True)
        
                                                
    if len(order_items_df) > 100:
        dup_items = order_items_df.sample(n=min(100, len(order_items_df)), random_state=42)
        order_items_df = pd.concat([order_items_df, dup_items], ignore_index=True)
        
    return orders_df, order_items_df

def generate_ratings(orders_df, order_items_df, menu_items_df, target_ratings=TARGET_RATINGS):
    print(f"Generating {target_ratings:,} customer ratings...")
    
    completed_orders = orders_df[orders_df["order_status"] == "Completed"]
    merged = order_items_df.merge(completed_orders[["order_id", "customer_id", "restaurant_id", "order_datetime"]], on="order_id")
    
    sample_pool = merged.sample(n=min(target_ratings, len(merged)), replace=(target_ratings > len(merged)), random_state=42)
    menu_meta = menu_items_df.set_index("item_id")["case_tag"].to_dict()
    
    reviews_good = ["Absolute perfection!", "Best dish in town.", "Fresh ingredients, superb balance.", "Loved the presentation.", "Will order every week!"]
    reviews_avg = ["Pretty good standard meal.", "Decent portion size.", "Average flavor, nothing special.", "Good for the price."]
    reviews_poor = ["Too greasy and salty.", "Arrived cold, underwhelming.", "Disappointing taste.", "Poor presentation."]
    
    records = []
    for i, (_, row) in enumerate(sample_pool.iterrows()):
        rat_id = f"RAT{i+1:06d}"
        item_id = row["item_id"]
        tag = menu_meta.get(item_id, "NORMAL")
        
                       
        if tag == "TRICKY_HIGH_RATING_LOW_PROFIT":
            rating = np.random.choice([4.5, 4.8, 5.0], p=[0.2, 0.3, 0.5])
            review = random.choice(reviews_good)
        elif tag == "TRICKY_LOW_RATING_HIGH_SALES":
            rating = np.random.choice([1.0, 2.0, 2.5], p=[0.4, 0.4, 0.2])
            review = random.choice(reviews_poor)
        else:
            rating = np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], p=[0.05, 0.08, 0.17, 0.35, 0.35])
            if rating >= 4.0:
                review = random.choice(reviews_good)
            elif rating == 3.0:
                review = random.choice(reviews_avg)
            else:
                review = random.choice(reviews_poor)
                
                                                                                         
        if (i + 1) % 4000 == 0:
            rating = random.choice([0.0, 6.0, 7.5, -1.0])
            
        records.append({
            "rating_id": rat_id,
            "order_id": row["order_id"],
            "customer_id": row["customer_id"],
            "item_id": item_id,
            "restaurant_id": row["restaurant_id"],
            "rating": rating,
            "review_text": review,
            "rating_date": row["order_datetime"]
        })
        
    return pd.DataFrame(records)

def generate_inventory_and_wastage(restaurants_df, menu_items_df, target_wastage=TARGET_WASTAGE_RECORDS):
    print(f"Generating inventory and {target_wastage:,} wastage records...")
    
    rest_ids = restaurants_df["restaurant_id"].values
    menu_meta = menu_items_df.set_index("item_id").to_dict(orient="index")
    item_ids = list(menu_meta.keys())
    
    reasons = ["Overproduction", "Expired", "Kitchen Error", "Spoiled Fresh Prep", "Storage Temp Deviation"]
    
                      
    start_d = datetime(2025, 1, 1)
    
    wastage_records = []
    inventory_records = []
    
    w_counter = 1
    inv_counter = 1
    
                                                                
    tracked_items = item_ids[:30]                                      
    
    for day_idx in range(0, 365, 7):                                        
        cur_date = (start_d + timedelta(days=day_idx)).strftime("%Y-%m-%d")
        for r_id in rest_ids[:10]:                   
            for i_id in tracked_items:
                start_s = round(random.uniform(50.0, 150.0), 1)
                recd_s = round(random.uniform(20.0, 60.0), 1)
                cons_s = round(random.uniform(30.0, 80.0), 1)
                end_s = max(0.0, round(start_s + recd_s - cons_s, 1))
                inventory_records.append({
                    "inventory_id": f"INV{inv_counter:06d}",
                    "restaurant_id": r_id,
                    "item_id": i_id,
                    "date": cur_date,
                    "starting_stock": start_s,
                    "received_stock": recd_s,
                    "consumed_stock": cons_s,
                    "ending_stock": end_s,
                    "unit": "portions"
                })
                inv_counter += 1
                
                              
    for i in range(target_wastage):
        w_id = f"WST{i+1:06d}"
        r_id = np.random.choice(rest_ids)
        
                                                                 
        if random.random() < 0.20:
            i_id = "M003"                
        else:
            i_id = np.random.choice(item_ids)
            
        meta = menu_meta[i_id]
        cur_date = (start_d + timedelta(days=random.randint(0, 364))).strftime("%Y-%m-%d")
        reason = random.choice(reasons)
        
                                                           
        waste_qty = round(random.uniform(1.0, 10.0), 1)
        if meta.get("case_tag") == "TRICKY_HIGH_WASTAGE":
            waste_qty = round(random.uniform(8.0, 24.0), 1)
            
                                                                                               
        if (i + 1) % 2500 == 0:
            waste_qty = 9999.0
            
        unit_cost = meta["cost_price"]
        waste_cost = round(waste_qty * unit_cost, 2)
        
        wastage_records.append({
            "wastage_id": w_id,
            "restaurant_id": r_id,
            "item_id": i_id,
            "date": cur_date,
            "waste_quantity": waste_qty,
            "waste_cost": waste_cost,
            "waste_reason": reason
        })
        
    return pd.DataFrame(inventory_records), pd.DataFrame(wastage_records)

def save_tables(data_dict, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n=======================================================")
    print(f"Saving {len(data_dict)} tables to: {output_dir}")
    print(f"=======================================================")
    
    summary = []
    for table_name, df in data_dict.items():
        csv_path = output_dir / f"{table_name}.csv"
        df.to_csv(csv_path, index=False)
        file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        summary.append({
            "Table": table_name,
            "Records": len(df),
            "Columns": len(df.columns),
            "Size (MB)": round(file_size_mb, 2)
        })
        print(f"  [SAVED] {table_name:<18}: {len(df):>10,d} rows | {file_size_mb:>6.2f} MB -> {csv_path.name}")
        
    summary_df = pd.DataFrame(summary)
    print(f"=======================================================")
    print(f"Total Records Generated: {summary_df['Records'].sum():,}")
    print(f"Total Storage Size:     {summary_df['Size (MB)'].sum():.2f} MB")
    print(f"=======================================================\n")
    return summary_df

def run_generator(full_scale=False, sample_scale=True):
    print("=" * 65)
    print("  DineIQ Analytics — Large-Scale Dataset Generator (Step 1)")
    print("=" * 65)
    
                      
    categories_df = generate_categories()
    restaurants_df = generate_restaurants(TARGET_RESTAURANTS)
    menu_items_df = generate_menu_items(categories_df, TARGET_MENU_ITEMS)
    pricing_history_df = generate_pricing_history(menu_items_df)
    promotions_df = generate_promotions()
    
                                                          
    if sample_scale:
        print("\n--- Generating High-Fidelity Sample Dataset (sample_data/) ---")
        sample_cust = generate_customers(SAMPLE_CUSTOMERS)
        sample_orders, sample_order_items = generate_orders_and_items(
            sample_cust, menu_items_df, restaurants_df, promotions_df,
            target_orders=SAMPLE_ORDERS, target_order_items=SAMPLE_ORDER_ITEMS
        )
        sample_ratings = generate_ratings(sample_orders, sample_order_items, menu_items_df, target_ratings=SAMPLE_RATINGS)
        sample_inv, sample_wastage = generate_inventory_and_wastage(restaurants_df, menu_items_df, target_wastage=SAMPLE_WASTAGE_RECORDS)
        
        sample_dict = {
            "menu_categories": categories_df,
            "restaurants": restaurants_df,
            "menu_items": menu_items_df,
            "pricing_history": pricing_history_df,
            "promotions": promotions_df,
            "customers": sample_cust,
            "orders": sample_orders,
            "order_items": sample_order_items,
            "ratings": sample_ratings,
            "inventory": sample_inv,
            "wastage": sample_wastage
        }
        save_tables(sample_dict, SAMPLE_DATA_DIR)
        
                                                       
    if full_scale:
        print("\n--- Generating Full Competition Dataset (raw_data/ >= 1,000,000 lines) ---")
        full_cust = generate_customers(TARGET_CUSTOMERS)
        full_orders, full_order_items = generate_orders_and_items(
            full_cust, menu_items_df, restaurants_df, promotions_df,
            target_orders=TARGET_ORDERS, target_order_items=TARGET_ORDER_ITEMS
        )
        full_ratings = generate_ratings(full_orders, full_order_items, menu_items_df, target_ratings=TARGET_RATINGS)
        full_inv, full_wastage = generate_inventory_and_wastage(restaurants_df, menu_items_df, target_wastage=TARGET_WASTAGE_RECORDS)
        
        full_dict = {
            "menu_categories": categories_df,
            "restaurants": restaurants_df,
            "menu_items": menu_items_df,
            "pricing_history": pricing_history_df,
            "promotions": promotions_df,
            "customers": full_cust,
            "orders": full_orders,
            "order_items": full_order_items,
            "ratings": full_ratings,
            "inventory": full_inv,
            "wastage": full_wastage
        }
        save_tables(full_dict, RAW_DATA_DIR)
        
    print("Dataset generation routine complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DineIQ Dataset Generator")
    parser.add_argument("--full", action="store_true", help="Generate full 1M+ dataset in raw_data/")
    parser.add_argument("--sample", action="store_true", default=True, help="Generate sample dataset in sample_data/")
    args = parser.parse_args()
    
                                                                                      
    run_generator(full_scale=args.full, sample_scale=args.sample or not args.full)
