from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, DoubleType, BooleanType
)

def get_explicit_schemas():
    return {
        "menu_categories": StructType([
            StructField("category_id", StringType(), False),
            StructField("category_name", StringType(), False),
            StructField("description", StringType(), True)
        ]),
        "restaurants": StructType([
            StructField("restaurant_id", StringType(), False),
            StructField("restaurant_name", StringType(), False),
            StructField("city", StringType(), True),
            StructField("state", StringType(), True),
            StructField("zone", StringType(), True),
            StructField("seating_capacity", IntegerType(), True),
            StructField("opened_date", StringType(), True)
        ]),
        "menu_items": StructType([
            StructField("item_id", StringType(), False),
            StructField("category_id", StringType(), False),
            StructField("item_name", StringType(), False),
            StructField("base_price", DoubleType(), False),
            StructField("cost_price", DoubleType(), False),
            StructField("is_active", BooleanType(), True),
            StructField("launch_date", StringType(), True),
            StructField("case_tag", StringType(), True)
        ]),
        "customers": StructType([
            StructField("customer_id", StringType(), False),
            StructField("full_name", StringType(), False),
            StructField("email", StringType(), True),
            StructField("phone", StringType(), True),
            StructField("signup_date", StringType(), True),
            StructField("segment_label", StringType(), True),
            StructField("preferred_channel", StringType(), True)
        ]),
        "pricing_history": StructType([
            StructField("price_change_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("old_price", DoubleType(), False),
            StructField("new_price", DoubleType(), False),
            StructField("effective_date", StringType(), True),
            StructField("reason", StringType(), True)
        ]),
        "promotions": StructType([
            StructField("promo_id", StringType(), False),
            StructField("promo_name", StringType(), False),
            StructField("promo_code", StringType(), False),
            StructField("discount_pct", DoubleType(), False),
            StructField("start_date", StringType(), True),
            StructField("end_date", StringType(), True),
            StructField("target_category_id", StringType(), True),
            StructField("is_trap", BooleanType(), True)
        ]),
        "orders": StructType([
            StructField("order_id", StringType(), False),
            StructField("customer_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("order_datetime", StringType(), False),
            StructField("order_channel", StringType(), False),
            StructField("order_status", StringType(), False),
            StructField("promo_id", StringType(), True),
            StructField("subtotal", DoubleType(), True),
            StructField("discount_amount", DoubleType(), True),
            StructField("tax_amount", DoubleType(), True),
            StructField("total_amount", DoubleType(), True)
        ]),
        "order_items": StructType([
            StructField("order_item_id", StringType(), False),
            StructField("order_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("unit_price", DoubleType(), False),
            StructField("quantity", IntegerType(), False),
            StructField("line_total", DoubleType(), False),
            StructField("item_cost", DoubleType(), False),
            StructField("special_notes", StringType(), True)
        ]),
        "ratings": StructType([
            StructField("rating_id", StringType(), False),
            StructField("order_id", StringType(), True),
            StructField("customer_id", StringType(), True),
            StructField("item_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("rating", DoubleType(), False),
            StructField("review_text", StringType(), True),
            StructField("rating_date", StringType(), True)
        ]),
        "inventory": StructType([
            StructField("inventory_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("date", StringType(), False),
            StructField("starting_stock", DoubleType(), True),
            StructField("received_stock", DoubleType(), True),
            StructField("consumed_stock", DoubleType(), True),
            StructField("ending_stock", DoubleType(), True),
            StructField("unit", StringType(), True)
        ]),
        "wastage": StructType([
            StructField("wastage_id", StringType(), False),
            StructField("restaurant_id", StringType(), False),
            StructField("item_id", StringType(), False),
            StructField("date", StringType(), False),
            StructField("waste_quantity", DoubleType(), False),
            StructField("waste_cost", DoubleType(), False),
            StructField("waste_reason", StringType(), True)
        ])
    }
