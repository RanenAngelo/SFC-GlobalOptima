CREATE OR REPLACE TEMPORARY VIEW v_master_transactions AS
SELECT
    oi.order_item_id,
    o.order_id,
    o.customer_id,
    c.full_name AS customer_name,
    c.segment_label AS customer_segment,
    o.restaurant_id,
    r.restaurant_name,
    r.city,
    r.zone,
    o.order_datetime,
    SUBSTRING(o.order_datetime, 1, 10) AS order_date,
    CAST(SUBSTRING(o.order_datetime, 12, 2) AS INT) AS order_hour,
    o.order_channel,
    o.order_status,
    o.promo_id,
    COALESCE(p.promo_name, 'No Promotion') AS promo_name,
    COALESCE(p.discount_pct, 0.0) AS promo_discount_pct,
    oi.item_id,
    m.item_name,
    m.category_id,
    cat.category_name,
    m.case_tag,
    oi.unit_price,
    oi.quantity,
    oi.line_total,
    oi.item_cost,
    (oi.line_total - oi.item_cost) AS line_profit,
    ROUND(((oi.line_total - oi.item_cost) / NULLIF(oi.line_total, 0)) * 100, 2) AS margin_pct
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN menu_items m ON oi.item_id = m.item_id
INNER JOIN menu_categories cat ON m.category_id = cat.category_id
INNER JOIN restaurants r ON o.restaurant_id = r.restaurant_id
LEFT JOIN promotions p ON o.promo_id = p.promo_id;
