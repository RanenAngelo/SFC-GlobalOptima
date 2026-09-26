CREATE OR REPLACE TEMPORARY VIEW v_menu_item_features AS
WITH item_sales AS (
    SELECT
        item_id,
        COUNT(DISTINCT order_id) AS order_frequency,
        SUM(quantity) AS total_quantity_sold,
        SUM(line_total) AS total_revenue,
        SUM(item_cost) AS total_cost,
        SUM(line_profit) AS total_profit,
        ROUND((SUM(line_profit) / NULLIF(SUM(line_total), 0)) * 100, 2) AS profit_margin_pct,
        COUNT(DISTINCT customer_id) AS unique_buyers,
        SUM(CASE WHEN order_hour IN (12, 13, 18, 19, 20, 21) THEN quantity ELSE 0 END) AS peak_hour_qty,
        SUM(CASE WHEN promo_id IS NOT NULL AND promo_id != 'NONE' AND promo_id != '' THEN quantity ELSE 0 END) AS promo_qty
    FROM v_master_transactions
    WHERE order_status = 'Completed'
    GROUP BY item_id
),
repeat_buyers AS (
    SELECT
        item_id,
        COUNT(customer_id) AS repeat_buyer_count
    FROM (
        SELECT item_id, customer_id
        FROM v_master_transactions
        WHERE order_status = 'Completed'
        GROUP BY item_id, customer_id
        HAVING COUNT(DISTINCT order_id) >= 2
    ) sub
    GROUP BY item_id
),
item_ratings AS (
    SELECT
        item_id,
        ROUND(AVG(rating), 2) AS avg_rating,
        COUNT(rating_id) AS rating_count
    FROM ratings
    GROUP BY item_id
),
item_wastage AS (
    SELECT
        item_id,
        ROUND(SUM(waste_quantity), 2) AS total_waste_qty,
        ROUND(SUM(waste_cost), 2) AS total_waste_cost
    FROM wastage
    GROUP BY item_id
)
SELECT
    m.item_id,
    m.item_name,
    m.category_id,
    cat.category_name,
    m.base_price,
    m.cost_price,
    (m.base_price - m.cost_price) AS unit_contribution_margin,
    ROUND(((m.base_price - m.cost_price) / m.base_price) * 100, 2) AS unit_margin_pct,
    m.case_tag,
    COALESCE(s.order_frequency, 0) AS order_frequency,
    COALESCE(s.total_quantity_sold, 0) AS total_quantity_sold,
    COALESCE(s.total_revenue, 0.0) AS total_revenue,
    COALESCE(s.total_cost, 0.0) AS total_cost,
    COALESCE(s.total_profit, 0.0) AS total_profit,
    COALESCE(s.profit_margin_pct, 0.0) AS actual_profit_margin_pct,
    COALESCE(r.avg_rating, 0.0) AS avg_rating,
    COALESCE(r.rating_count, 0) AS rating_count,
    COALESCE(w.total_waste_qty, 0.0) AS total_waste_qty,
    COALESCE(w.total_waste_cost, 0.0) AS total_waste_cost,
    ROUND((COALESCE(w.total_waste_qty, 0.0) / NULLIF(COALESCE(s.total_quantity_sold, 0) + COALESCE(w.total_waste_qty, 0.0), 0)) * 100, 2) AS wastage_pct,
    ROUND((COALESCE(rb.repeat_buyer_count, 0) / NULLIF(s.unique_buyers, 0)) * 100, 2) AS repeat_purchase_rate,
    ROUND((COALESCE(s.promo_qty, 0) / NULLIF(s.total_quantity_sold, 0)) * 100, 2) AS promotion_dependency_pct,
    ROUND((COALESCE(s.peak_hour_qty, 0) / NULLIF(s.total_quantity_sold, 0)) * 100, 2) AS peak_hour_ratio
FROM menu_items m
INNER JOIN menu_categories cat ON m.category_id = cat.category_id
LEFT JOIN item_sales s ON m.item_id = s.item_id
LEFT JOIN repeat_buyers rb ON m.item_id = rb.item_id
LEFT JOIN item_ratings r ON m.item_id = r.item_id
LEFT JOIN item_wastage w ON m.item_id = w.item_id;
