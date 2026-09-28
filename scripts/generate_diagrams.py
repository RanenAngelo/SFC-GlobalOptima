import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image, ImageDraw, ImageFont

os.makedirs('screenshots/diagrams', exist_ok=True)

# Styling palette
BG_COLOR = '#0F172A'       # Slate 900
BOX_BG = '#1E293B'         # Slate 800
BOX_BORDER = '#38BDF8'     # Sky 400
ACCENT_CYAN = '#06B6D4'    # Cyan 500
ACCENT_GREEN = '#10B981'   # Emerald 500
ACCENT_AMBER = '#F59E0B'   # Amber 500
ACCENT_PURPLE = '#8B5CF6'  # Purple 500
TEXT_MAIN = '#F8FAFC'      # White/slate 50
TEXT_MUTED = '#94A3B8'     # Slate 400

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'

def save_fig(fig, filename):
    filepath = os.path.join('screenshots/diagrams', filename)
    fig.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"Generated: {filepath}")

# 1. DIAG-BIZ-001: Business Intelligence Flow
def create_diag_biz_001():
    fig, ax = plt.subplots(figsize=(12, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    stages = [
        ("Raw Restaurant Data\n(11 Multi-Table Domains)", "#EF4444"),
        ("Scattered / Siloed\nInformation", "#F97316"),
        ("Complex Bottleneck\nSpreadsheets Fail", "#EAB308"),
        ("DineIQ Core Engine\nSpark + Python Dual", "#06B6D4"),
        ("Integrated Intelligence\n& ML Feature Store", "#3B82F6"),
        ("Actionable Insights\n4-Class Menu & RFM", "#8B5CF6"),
        ("Evidence-Based\nRecommendations", "#10B981")
    ]
    
    for i, (text, col) in enumerate(stages):
        x = 0.5 + i * 1.55
        rect = patches.FancyBboxPatch((x, 1.8), 1.25, 2.0, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.5)
        ax.add_patch(rect)
        ax.text(x + 0.625, 2.8, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')
        
        # Arrow to next
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + 1.5, 2.8), xytext=(x + 1.25, 2.8),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    # Feedback loop arrow underneath
    ax.annotate('Continuous Performance Feedback & Iterative Improvement Loop',
                xy=(1.125, 1.2), xytext=(10.0, 1.2),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6",
                                color="#10B981", lw=2, connectionstyle="arc3,rad=-0.15"),
                ha='center', va='center', color="#34D399", fontsize=11, weight='bold')

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0.5, 4.5)
    plt.title("DineIQ — End-to-End Business Intelligence & Value Flow", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-BIZ-001.png')

# 2. DIAG-UC-001: Use Case Diagram
def create_diag_uc_001():
    fig, ax = plt.subplots(figsize=(13, 8), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    actors = [
        ("Restaurant Manager", 1.5, 6.5, "#38BDF8"),
        ("Data Analyst", 1.5, 4.5, "#818CF8"),
        ("Regional Manager", 1.5, 2.5, "#F472B6"),
        ("System Administrator", 1.5, 0.8, "#34D399")
    ]
    
    use_cases = [
        ("Secure Authentication & RBAC", 6.0, 7.0),
        ("View Executive Dashboard & Real-Time KPIs", 6.0, 6.0),
        ("Analyze Menu Performance (4-Class Matrix)", 6.0, 5.0),
        ("Customer RFM Segmentation & Churn Risk", 6.0, 4.0),
        ("Wastage Analysis & Risk Forecast", 6.0, 3.0),
        ("Run What-If Simulations (Price & Demand)", 6.0, 2.0),
        ("Dual-Pipeline ML Comparison & Verification", 6.0, 1.0),
        ("Export Reports (PDF/CSV) & Manage System", 6.0, 0.1)
    ]
    
    # Boundary box
    system_box = patches.FancyBboxPatch((3.5, -0.3), 6.5, 8.0, boxstyle="round,pad=0.2",
                                        facecolor=BOX_BG, edgecolor="#475569", linestyle='--', linewidth=2)
    ax.add_patch(system_box)
    ax.text(6.75, 7.45, "DineIQ Analytics System Boundary", color=BOX_BORDER, fontsize=12, weight='bold', ha='center')
    
    actor_coords = {}
    for name, x, y, col in actors:
        circle = plt.Circle((x, y + 0.3), 0.25, facecolor=col, edgecolor=TEXT_MAIN, lw=1.5)
        ax.add_patch(circle)
        ax.plot([x, x], [y + 0.05, y - 0.3], color=col, lw=2.5) # body
        ax.plot([x - 0.25, x + 0.25], [y - 0.1, y - 0.1], color=col, lw=2) # arms
        ax.plot([x, x - 0.2], [y - 0.3, y - 0.55], color=col, lw=2) # leg left
        ax.plot([x, x + 0.2], [y - 0.3, y - 0.55], color=col, lw=2) # leg right
        ax.text(x, y - 0.75, name, color=col, fontsize=10, weight='bold', ha='center')
        actor_coords[name] = (x + 0.4, y)
        
    for name, x, y in use_cases:
        ellipse = patches.Ellipse((x + 0.75, y), 3.2, 0.65, facecolor='#334155', edgecolor=BOX_BORDER, lw=1.5)
        ax.add_patch(ellipse)
        ax.text(x + 0.75, y, name, color=TEXT_MAIN, fontsize=9, ha='center', va='center', weight='bold')
        
    # Connect actors to use cases
    links = [
        ("Restaurant Manager", [0, 1, 2, 4]),
        ("Data Analyst", [0, 1, 2, 3, 4, 5, 6, 7]),
        ("Regional Manager", [0, 1, 2, 7]),
        ("System Administrator", [0, 7])
    ]
    for act, ucs in links:
        ax_coord = actor_coords[act]
        for u_idx in ucs:
            uc_x = use_cases[u_idx][1] - 0.8
            uc_y = use_cases[u_idx][2]
            ax.plot([ax_coord[0], uc_x], [ax_coord[1], uc_y], color='#64748B', lw=1.2, alpha=0.8)

    ax.set_xlim(0, 11)
    ax.set_ylim(-0.8, 8.2)
    plt.title("DineIQ Analytics — UML Use Case Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-UC-001.png')

# 3. DIAG-SYS-001: System Architecture
def create_diag_sys_001():
    fig, ax = plt.subplots(figsize=(13, 8), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    layers = [
        ("Layer 1: Presentation Layer", "React 19 Frontend + Vite + Tailwind CSS + Lucide Icons + Recharts / CanvasJS\n(15 Responsive Command Center Dashboards at http://localhost:3000)", 6.5, '#38BDF8'),
        ("Layer 2: API & Gateway Layer", "Flask RESTful Micro-Services + CORS Gateway + Auth RBAC Middleware\nEndpoints: /api/executive, /api/menu, /api/customers, /api/whatif, /api/compare", 4.7, '#818CF8'),
        ("Layer 3: Dual-Analytics & Intelligence Engine", "Spark Pipeline (PySpark 3.5, Spark SQL, Spark MLlib)\nPython Pipeline (Pandas 2.2, Scikit-Learn 1.5, XGBoost, Statsmodels)\nRule Engine & Priority Scoring (Impact x Urgency Matrix)", 2.8, '#F59E0B'),
        ("Layer 4: Data Store & Model Registry", "Parquet Columnar Files (processed_data/parquet_data/)\nRaw CSV Storage (11 Relational Tables, 1,000,000+ Records)\nModel Artifacts: Spark MLlib Pipelines & Python Joblib Classifiers", 0.9, '#10B981')
    ]
    
    for title, desc, y, col in layers:
        rect = patches.FancyBboxPatch((1.0, y - 0.6), 11.0, 1.4, boxstyle="round,pad=0.2",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2)
        ax.add_patch(rect)
        ax.text(1.3, y + 0.45, title, color=col, fontsize=11.5, weight='bold')
        ax.text(1.3, y - 0.1, desc, color=TEXT_MAIN, fontsize=9.5)
        
    # Vertical connector arrows
    for y in [5.8, 4.0, 2.1]:
        ax.annotate('', xy=(6.5, y - 0.6), xytext=(6.5, y),
                    arrowprops=dict(arrowstyle="<->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))

    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    plt.title("DineIQ Analytics — 4-Tier Layered System Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-SYS-001.png')

# 4. DIAG-BD-001: Big Data Architecture
def create_diag_bd_001():
    fig, ax = plt.subplots(figsize=(14, 7), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    stages = [
        ("Data Sources\n(11 Relational Domains\n1M+ Transactions)", "#EF4444"),
        ("Ingestion Layer\nPySpark StructType\nSchema Validation", "#F97316"),
        ("Storage Layer\nParquet Columnar\nSnappy Partitioning", "#EAB308"),
        ("Spark SQL & Quality\n14 Cleaning Rules\nQuarantine Log", "#10B981"),
        ("Dual ML Pipeline\nSpark MLlib (RF/GBT)\nPython XGBoost", "#06B6D4"),
        ("Comparison Engine\n98.08% Agreement\nDiscrepancy Audit", "#8B5CF6"),
        ("Serving & UI\nFlask REST Endpoints\nInteractive Dashboard", "#EC4899")
    ]
    
    for i, (text, col) in enumerate(stages):
        x = 0.5 + i * 1.85
        rect = patches.FancyBboxPatch((x, 2.0), 1.55, 3.0, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.5)
        ax.add_patch(rect)
        ax.text(x + 0.775, 3.5, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')
        
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + 1.8, 3.5), xytext=(x + 1.55, 3.5),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13.5)
    ax.set_ylim(0.5, 6.0)
    plt.title("DineIQ Analytics — End-to-End Big Data Pipeline Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-BD-001.png')

# 5. DIAG-ER-001: Entity Relationship Diagram
def create_diag_er_001():
    fig, ax = plt.subplots(figsize=(14, 8.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    tables = [
        ("Restaurants\n(PK: restaurant_id)", 1.0, 6.0, "#38BDF8"),
        ("Menu_Categories\n(PK: category_id)", 4.8, 6.0, "#818CF8"),
        ("Menu_Items\n(PK: item_id\nFK: category_id, rest_id)", 8.5, 6.0, "#F59E0B"),
        ("Customers\n(PK: customer_id)", 1.0, 3.5, "#10B981"),
        ("Orders\n(PK: order_id\nFK: cust_id, rest_id)", 4.8, 3.5, "#EC4899"),
        ("Order_Items\n(PK: order_item_id\nFK: order_id, item_id)", 8.5, 3.5, "#EF4444"),
        ("Ratings\n(PK: rating_id\nFK: cust_id, item_id)", 1.0, 1.0, "#A855F7"),
        ("Wastage\n(PK: wastage_id\nFK: item_id, rest_id)", 4.8, 1.0, "#14B8A6"),
        ("Pricing_History\n(PK: history_id\nFK: item_id)", 8.5, 1.0, "#06B6D4"),
        ("Promotions\n(PK: promo_id\nFK: rest_id)", 11.5, 4.75, "#F97316"),
        ("Inventory\n(PK: inventory_id\nFK: item_id, rest_id)", 11.5, 2.25, "#84CC16")
    ]
    
    for name, x, y, col in tables:
        rect = patches.FancyBboxPatch((x, y), 2.2, 1.2, boxstyle="round,pad=0.1",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + 1.1, y + 0.6, name, ha='center', va='center', color=TEXT_MAIN, fontsize=8.5, weight='bold')

    # Draw connection lines (1:N relationships)
    def connect(t1, t2, color="#64748B"):
        ax.plot([t1[0], t2[0]], [t1[1], t2[1]], color=color, lw=1.8, linestyle='--')
        
    connect((3.2, 6.6), (4.8, 6.6)) # Rest -> Cat
    connect((7.0, 6.6), (8.5, 6.6)) # Cat -> Item
    connect((3.2, 4.1), (4.8, 4.1)) # Cust -> Orders
    connect((7.0, 4.1), (8.5, 4.1)) # Orders -> Order_Items
    connect((9.6, 6.0), (9.6, 4.7)) # Item -> Order_Items
    connect((2.1, 3.5), (2.1, 2.2)) # Cust -> Ratings
    connect((8.5, 6.0), (3.2, 1.6)) # Item -> Ratings
    connect((9.6, 3.5), (7.0, 1.6)) # Item -> Wastage
    connect((9.6, 3.5), (9.6, 2.2)) # Item -> Pricing_History
    connect((3.2, 6.0), (11.5, 5.3)) # Rest -> Promotions
    connect((9.6, 6.0), (11.5, 2.8)) # Item -> Inventory

    ax.set_xlim(0.5, 14.0)
    ax.set_ylim(0.5, 7.8)
    plt.title("DineIQ — Relational Database Schema & Entity Relationships (11 Entities)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-ER-001.png')

# 6. DIAG-DQ-001: Data Quality Pipeline
def create_diag_dq_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Raw CSV\n11 Tables", "#EF4444"),
        ("Schema Validation\nStructType Coercion", "#F97316"),
        ("Missing & Duplicate\nRule Detection (14 Rules)", "#EAB308"),
        ("Outlier & Boundary\nAnomaly Isolation", "#10B981"),
        ("Quarantine Table\nproblem_records.parquet", "#EC4899"),
        ("Data Quality Report\nSummary & JSON Log", "#8B5CF6"),
        ("Clean Parquet\nReady for Analytics", "#06B6D4")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.5 + i * 1.75
        rect = patches.FancyBboxPatch((x, 1.8), 1.45, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.725, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.7, 2.9), xytext=(x + 1.45, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Automated Data Quality & Quarantine Pipeline (14 Rule Engine)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-DQ-001.png')

# 7. DIAG-SPARK-001: Spark Pipeline Flow
def create_diag_spark_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    nodes = [
        ("SparkSession\nBuilder", "#38BDF8"),
        ("Ingest with\nStructType", "#818CF8"),
        ("14 DQ Rules\nEvaluation", "#F59E0B"),
        ("Multi-Table\nSpark SQL Joins", "#10B981"),
        ("Window & UDF\nFeature Eng", "#06B6D4"),
        ("Spark MLlib\nRF, GBT, LR", "#8B5CF6"),
        ("Partitioned Parquet\n& Model Export", "#EC4899")
    ]
    for i, (text, col) in enumerate(nodes):
        x = 0.5 + i * 1.75
        rect = patches.FancyBboxPatch((x, 1.8), 1.45, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.725, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(nodes) - 1:
            ax.annotate('', xy=(x + 1.7, 2.9), xytext=(x + 1.45, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Distributed Apache Spark / PySpark Processing Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-SPARK-001.png')

# 8. DIAG-PY-001: Python Pipeline Flow
def create_diag_py_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    nodes = [
        ("Independent\nCSV Read", "#38BDF8"),
        ("Pandas\nCleaning & Norm", "#818CF8"),
        ("Numpy/Scipy\nFeature Extraction", "#F59E0B"),
        ("Chronological\nTrain/Test Split", "#10B981"),
        ("Scikit-Learn &\nXGBoost Training", "#06B6D4"),
        ("Metrics Evaluation\n(Acc, F1, MAPE)", "#8B5CF6"),
        ("Saved .joblib &\nPredictions Export", "#EC4899")
    ]
    for i, (text, col) in enumerate(nodes):
        x = 0.5 + i * 1.75
        rect = patches.FancyBboxPatch((x, 1.8), 1.45, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.725, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(nodes) - 1:
            ax.annotate('', xy=(x + 1.7, 2.9), xytext=(x + 1.45, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Independent Python Data Science Pipeline (Zero Spark Coupling)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-PY-001.png')

# 9. DIAG-FE-001: Feature Engineering Flow
def create_diag_fe_001():
    fig, ax = plt.subplots(figsize=(13, 6.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    sources = [
        ("Order_Items + Menu_Items", 1.0, 5.0),
        ("Orders (Timestamps & Amounts)", 1.0, 3.5),
        ("Wastage + Inventory Data", 1.0, 2.0),
        ("Customer Order History", 1.0, 0.5)
    ]
    features = [
        ("Menu Intelligence Features:\n* contribution_margin = revenue - cost\n* profit_pct = margin / revenue\n* repeat_purchase_rate & popularity_rank", 6.5, 5.0),
        ("Temporal & Channel Features:\n* peak_hour_frequency (11-2, 7-9)\n* weekend_order_ratio & channel_mix", 6.5, 3.5),
        ("Operational Features:\n* wastage_percentage = wasted / prepared\n* stockout_risk & shelf_life_index", 6.5, 2.0),
        ("Customer RFM & Churn:\n* customer_recency, frequency, monetary\n* quintile-weighted composite score", 6.5, 0.5)
    ]
    
    for text, x, y in sources:
        rect = patches.FancyBboxPatch((x, y - 0.4), 3.5, 0.8, boxstyle="round,pad=0.1",
                                      facecolor=BOX_BG, edgecolor='#38BDF8', linewidth=1.8)
        ax.add_patch(rect)
        ax.text(x + 1.75, y, text, color=TEXT_MAIN, fontsize=9, weight='bold', ha='center', va='center')
        
    for text, x, y in features:
        rect = patches.FancyBboxPatch((x, y - 0.55), 5.5, 1.1, boxstyle="round,pad=0.1",
                                      facecolor=BOX_BG, edgecolor='#10B981', linewidth=1.8)
        ax.add_patch(rect)
        ax.text(x + 2.75, y, text, color=TEXT_MAIN, fontsize=8.5, ha='center', va='center')
        
    for i in range(4):
        y = sources[i][1]
        ax.annotate('', xy=(6.5, y), xytext=(4.5, y),
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.2))

    ax.set_xlim(0, 13)
    ax.set_ylim(-0.3, 6.2)
    plt.title("DineIQ — Feature Engineering & Signal Transformation Flow", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-FE-001.png')

# 10. DIAG-MENU-001: Menu Classification Flow
def create_diag_menu_001():
    fig, ax = plt.subplots(figsize=(13, 7.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    # Decision tree nodes
    root = ("Menu Item (10 Signals: Sales, Margin, Cost, Rating, Repeat, Waste, Promo)", 6.5, 6.5, '#38BDF8')
    d1 = ("Demand Frequency > 40th Percentile?", 6.5, 4.8, '#F59E0B')
    
    rect_root = patches.FancyBboxPatch((root[1] - 4.0, root[2] - 0.4), 8.0, 0.8, boxstyle="round,pad=0.1", facecolor=BOX_BG, edgecolor=root[3], lw=2)
    ax.add_patch(rect_root)
    ax.text(root[1], root[2], root[0], color=TEXT_MAIN, fontsize=9.5, weight='bold', ha='center', va='center')
    
    rect_d1 = patches.FancyBboxPatch((d1[1] - 2.5, d1[2] - 0.35), 5.0, 0.7, boxstyle="round,pad=0.1", facecolor=BOX_BG, edgecolor=d1[3], lw=2)
    ax.add_patch(rect_d1)
    ax.text(d1[1], d1[2], d1[0], color=TEXT_MAIN, fontsize=9.5, weight='bold', ha='center', va='center')
    
    ax.plot([6.5, 6.5], [6.1, 5.15], color=BOX_BORDER, lw=2)
    
    # Branches
    leaves = [
        ("Profit Driver (High Demand + High Margin + Low Waste)", 2.5, 2.5, '#10B981', "YES & Margin > Med"),
        ("Volume Driver (High Demand BUT Low Margin / Promo Trap)", 5.2, 1.2, '#3B82F6', "YES & Margin <= Med"),
        ("Hidden Opportunity (Low Demand BUT High Margin & Rating)", 8.2, 1.2, '#F59E0B', "NO & High Rating"),
        ("Low Performer (Low Demand + Low Margin / High Waste)", 10.8, 2.5, '#EF4444', "NO & Low Rating/Margin")
    ]
    
    for text, x, y, col, label in leaves:
        rect = patches.FancyBboxPatch((x - 1.3, y - 0.4), 2.6, 0.8, boxstyle="round,pad=0.1", facecolor=BOX_BG, edgecolor=col, lw=2)
        ax.add_patch(rect)
        ax.text(x, y, text, color=TEXT_MAIN, fontsize=8.5, weight='bold', ha='center', va='center', multialignment='center')
        ax.plot([6.5, x], [4.45, y + 0.4], color='#64748B', lw=1.8, linestyle='--')
        ax.text((6.5 + x) / 2, (4.45 + y + 0.4) / 2 + 0.15, label, color=col, fontsize=8, weight='bold', ha='center')

    ax.set_xlim(0.5, 12.5)
    ax.set_ylim(0.2, 7.5)
    plt.title("DineIQ — 4-Class Menu Performance Classification Matrix", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-MENU-001.png')

# 11. DIAG-CUST-001: Customer Segmentation Flow
def create_diag_cust_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Customer Transactions\n(Dates, Spend, Items)", "#38BDF8"),
        ("RFM Feature Calculation\nRecency, Freq, Monetary", "#818CF8"),
        ("Quintile Binning (1-5)\nRFM Composite Score", "#F59E0B"),
        ("K-Means Clustering &\nRule-Based Fallback", "#10B981"),
        ("6 Core Segments:\nVIP Loyal, At-Risk, etc.", "#06B6D4"),
        ("Churn Risk Classifier\n(Logistic + GBT)", "#8B5CF6"),
        ("Targeted Action Plans\nWin-Back & Upsell", "#EC4899")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.5 + i * 1.75
        rect = patches.FancyBboxPatch((x, 1.8), 1.45, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.725, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=8.5, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.7, 2.9), xytext=(x + 1.45, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Customer Intelligence & Churn Risk Segmentation Pipeline", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-CUST-001.png')

# 12. DIAG-MBA-001: Market Basket Flow
def create_diag_mba_001():
    fig, ax = plt.subplots(figsize=(13, 5.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Order Line Items\n100,000+ Baskets", "#38BDF8"),
        ("Basket Grouping\n(Transaction Encoding)", "#818CF8"),
        ("FP-Growth / Apriori\nSupport >= 0.01", "#F59E0B"),
        ("Rule Generation\nConfidence >= 0.30", "#10B981"),
        ("Lift Filtering\nLift >= 1.20 (>20% uplift)", "#06B6D4"),
        ("Dynamic Bundles\nCombo Recommendations", "#8B5CF6")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.6 + i * 2.0
        rect = patches.FancyBboxPatch((x, 1.6), 1.6, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.8, 2.7, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.95, 2.7), xytext=(x + 1.6, 2.7),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.5, 4.6)
    plt.title("DineIQ — Market Basket Analysis & Association Rule Mining (FP-Growth)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-MBA-001.png')

# 13. DIAG-FORECAST-001: Demand Forecasting Pipeline
def create_diag_forecast_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Historical Daily Orders\n(Time Series per Item)", "#38BDF8"),
        ("Lag Features & Rolling\n(Lag-7, Lag-14, MA-7)", "#818CF8"),
        ("Chronological Split\n(80% Train / 20% Test)", "#F59E0B"),
        ("Ensemble Forecasting\n(GBT, SARIMA, Prophet)", "#10B981"),
        ("Evaluation vs Baseline\n(MAPE, MAE 290.2)", "#06B6D4"),
        ("30/60/90 Day Horizon\nInteractive Projections", "#8B5CF6")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.6 + i * 2.0
        rect = patches.FancyBboxPatch((x, 1.8), 1.6, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.8, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.95, 2.9), xytext=(x + 1.6, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Chronological Demand Forecasting Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-FORECAST-001.png')

# 14. DIAG-WASTE-001: Wastage Analysis Flow
def create_diag_waste_001():
    fig, ax = plt.subplots(figsize=(13, 5.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Raw Wastage Logs\n54,978 Records", "#38BDF8"),
        ("Wastage % Calculation\n(Wasted / Prepared)", "#818CF8"),
        ("Correlation with Demand\n& Day-of-Week Trends", "#F59E0B"),
        ("Risk Classification\nHigh / Med / Low Risk", "#10B981"),
        ("Batch Adjustment Rules\nInventory Recommendations", "#06B6D4")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.8 + i * 2.35
        rect = patches.FancyBboxPatch((x, 1.6), 1.9, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.95, 2.7, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 2.3, 2.7), xytext=(x + 1.9, 2.7),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.5, 4.6)
    plt.title("DineIQ — Wastage Intelligence & Stock Preparation Optimization", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-WASTE-001.png')

# 15. DIAG-COMP-001: Dual Pipeline Architecture
def create_diag_comp_001():
    fig, ax = plt.subplots(figsize=(13, 7), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    # Common Data
    rect_data = patches.FancyBboxPatch((0.8, 2.6), 2.2, 1.8, boxstyle="round,pad=0.15",
                                       facecolor=BOX_BG, edgecolor="#EF4444", lw=2.5)
    ax.add_patch(rect_data)
    ax.text(1.9, 3.5, "Single Truth Source\nRaw CSV Data\n(1,089,728 Rows)", ha='center', va='center', color=TEXT_MAIN, fontsize=10, weight='bold')
    
    # Spark Track
    rect_spark = patches.FancyBboxPatch((4.2, 4.2), 3.4, 2.0, boxstyle="round,pad=0.15",
                                        facecolor=BOX_BG, edgecolor="#38BDF8", lw=2.2)
    ax.add_patch(rect_spark)
    ax.text(5.9, 5.2, "Spark Pipeline (PySpark)\n* Schema Validation\n* Spark SQL Engine\n* MLlib Random Forest\nAccuracy: 88.0%", ha='center', va='center', color=TEXT_MAIN, fontsize=9.5)
    
    # Python Track
    rect_py = patches.FancyBboxPatch((4.2, 0.8), 3.4, 2.0, boxstyle="round,pad=0.15",
                                     facecolor=BOX_BG, edgecolor="#10B981", lw=2.2)
    ax.add_patch(rect_py)
    ax.text(5.9, 1.8, "Python Pipeline (Pandas)\n* Vectorized Processing\n* Scikit-Learn / XGBoost\n* Chronological Split\nAccuracy: 100.0%", ha='center', va='center', color=TEXT_MAIN, fontsize=9.5)
    
    # Comparison Engine
    rect_cmp = patches.FancyBboxPatch((8.8, 2.4), 3.4, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor="#F59E0B", lw=2.5)
    ax.add_patch(rect_cmp)
    ax.text(10.5, 3.5, "Comparison Engine\n* Row-by-Row Evaluation\n* 98.08% Agreement Rate\n* 153 Matches / 3 Boundary\n* Comprehensive Audit Log", ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')

    # Arrows
    ax.annotate('', xy=(4.2, 5.2), xytext=(3.0, 4.0),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color='#38BDF8', lw=2.5))
    ax.annotate('', xy=(4.2, 1.8), xytext=(3.0, 3.0),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color='#10B981', lw=2.5))
    ax.annotate('', xy=(8.8, 3.8), xytext=(7.6, 5.0),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color='#38BDF8', lw=2.5))
    ax.annotate('', xy=(8.8, 3.2), xytext=(7.6, 2.0),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color='#10B981', lw=2.5))

    ax.set_xlim(0, 13)
    ax.set_ylim(0, 7)
    plt.title("DineIQ — Dual-Pipeline Multi-Model Cross-Validation Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-COMP-001.png')

# 16. DIAG-REC-001: Recommendation Engine Flow
def create_diag_rec_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("Multi-Domain Inputs\nMenu, RFM, Forecast, Wastage", "#38BDF8"),
        ("Rule-Based Collector\nEvidence Extraction", "#818CF8"),
        ("Priority Scoring Engine\nImpact x Urgency Matrix", "#F59E0B"),
        ("Action Tiering\nCritical, High, Medium, Low", "#10B981"),
        ("Interactive Cards\nWith Transparent Metrics", "#06B6D4"),
        ("Export & Tracking\nTask Execution & CSV", "#8B5CF6")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.6 + i * 2.0
        rect = patches.FancyBboxPatch((x, 1.8), 1.6, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.8, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.95, 2.9), xytext=(x + 1.6, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ — Evidence-Based Prioritised Recommendation Engine", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-REC-001.png')

# 17. DIAG-DFD-0: DFD Level 0 Context Diagram
def create_diag_dfd_0():
    fig, ax = plt.subplots(figsize=(12, 7), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    # Process circle
    circle = plt.Circle((6.0, 3.5), 1.6, facecolor=BOX_BG, edgecolor='#38BDF8', lw=3)
    ax.add_patch(circle)
    ax.text(6.0, 3.7, "0.0\nDineIQ Analytics\nSystem", color=TEXT_MAIN, fontsize=12, weight='bold', ha='center', va='center')
    
    # Entities
    entities = [
        ("Restaurant Manager", 1.5, 5.5, "#818CF8"),
        ("Data Analyst", 1.5, 1.5, "#F59E0B"),
        ("Regional Manager", 10.5, 5.5, "#10B981"),
        ("System Administrator", 10.5, 1.5, "#EC4899")
    ]
    for name, x, y, col in entities:
        rect = patches.FancyBboxPatch((x - 1.2, y - 0.5), 2.4, 1.0, boxstyle="round,pad=0.1",
                                      facecolor=BOX_BG, edgecolor=col, lw=2)
        ax.add_patch(rect)
        ax.text(x, y, name, color=TEXT_MAIN, fontsize=9.5, weight='bold', ha='center', va='center')
        
    # Flow lines with arrows
    ax.annotate('Menu & Ops Updates', xy=(4.6, 4.3), xytext=(2.7, 5.5),
                arrowprops=dict(arrowstyle="->", color='#818CF8', lw=1.8), color=TEXT_MUTED, fontsize=8)
    ax.annotate('Actionable Insights', xy=(2.7, 5.2), xytext=(4.6, 4.0),
                arrowprops=dict(arrowstyle="->", color='#818CF8', lw=1.8), color=TEXT_MUTED, fontsize=8)
    
    ax.annotate('What-If Simulations', xy=(4.6, 2.7), xytext=(2.7, 1.7),
                arrowprops=dict(arrowstyle="->", color='#F59E0B', lw=1.8), color=TEXT_MUTED, fontsize=8)
    ax.annotate('Model Comparison & DFs', xy=(2.7, 1.3), xytext=(4.6, 2.4),
                arrowprops=dict(arrowstyle="->", color='#F59E0B', lw=1.8), color=TEXT_MUTED, fontsize=8)

    ax.annotate('Regional Aggregates', xy=(7.4, 4.3), xytext=(9.3, 5.5),
                arrowprops=dict(arrowstyle="<-", color='#10B981', lw=1.8), color=TEXT_MUTED, fontsize=8)
    ax.annotate('Location Performance', xy=(9.3, 5.2), xytext=(7.4, 4.0),
                arrowprops=dict(arrowstyle="<-", color='#10B981', lw=1.8), color=TEXT_MUTED, fontsize=8)

    ax.annotate('System Configuration', xy=(7.4, 2.7), xytext=(9.3, 1.7),
                arrowprops=dict(arrowstyle="->", color='#EC4899', lw=1.8), color=TEXT_MUTED, fontsize=8)
    ax.annotate('Audit Logs & Status', xy=(9.3, 1.3), xytext=(7.4, 2.4),
                arrowprops=dict(arrowstyle="<-", color='#EC4899', lw=1.8), color=TEXT_MUTED, fontsize=8)

    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    plt.title("DineIQ Analytics — DFD Level 0 (Context Diagram)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-DFD-0.png')

# 18. DIAG-DFD-1: DFD Level 1 Major Processes
def create_diag_dfd_1():
    fig, ax = plt.subplots(figsize=(14, 7.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    processes = [
        ("P1: Ingestion\n& Schema Validation", 1.8, 5.2, "#38BDF8"),
        ("P2: Data Quality\n& 14-Rule Cleaning", 5.0, 5.2, "#818CF8"),
        ("P3: Spark Big Data\nProcessing & SQL", 8.2, 5.2, "#F59E0B"),
        ("P4: Python Data\nScience Pipeline", 11.4, 5.2, "#10B981"),
        ("P5: Dual Pipeline\nCross-Validation", 8.2, 2.0, "#06B6D4"),
        ("P6: Recommendation\nEngine & Scoring", 5.0, 2.0, "#8B5CF6"),
        ("P7: Interactive Web\nDashboard & Reports", 1.8, 2.0, "#EC4899")
    ]
    
    for name, x, y, col in processes:
        rect = patches.FancyBboxPatch((x - 1.2, y - 0.6), 2.4, 1.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, lw=2.2)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')

    # Data stores
    stores = [
        ("D1: Raw CSVs", 1.8, 6.7),
        ("D2: Clean Parquet", 5.0, 6.7),
        ("D3: Model Store", 11.4, 6.7),
        ("D4: App DB / Reports", 5.0, 0.6)
    ]
    for name, x, y in stores:
        rect = patches.Rectangle((x - 1.0, y - 0.25), 2.0, 0.5, facecolor='#1E293B', edgecolor='#94A3B8', lw=1.5)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', color='#94A3B8', fontsize=8.5, weight='bold')

    # Flow connections
    ax.annotate('', xy=(3.8, 5.2), xytext=(3.0, 5.2), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(7.0, 5.2), xytext=(6.2, 5.2), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(10.2, 5.2), xytext=(9.4, 5.2), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(8.2, 3.2), xytext=(8.2, 4.6), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(9.6, 2.6), xytext=(11.0, 4.6), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(6.2, 2.0), xytext=(7.0, 2.0), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))
    ax.annotate('', xy=(3.0, 2.0), xytext=(3.8, 2.0), arrowprops=dict(arrowstyle="->", color=BOX_BORDER, lw=2))

    ax.set_xlim(0, 13.5)
    ax.set_ylim(0, 7.5)
    plt.title("DineIQ Analytics — DFD Level 1 (Major System Processes)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-DFD-1.png')

# 19. DIAG-DFD-2: DFD Level 2 Analytics Processes
def create_diag_dfd_2():
    fig, ax = plt.subplots(figsize=(14, 8), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    sub_procs = [
        ("P5.1 Menu Profitability\n(Margin & Volume Matrix)", 2.5, 6.0, "#38BDF8"),
        ("P5.2 Customer Intelligence\n(RFM & Churn Scoring)", 6.5, 6.0, "#818CF8"),
        ("P5.3 Market Basket\n(FP-Growth & Cross-Sell)", 10.5, 6.0, "#F59E0B"),
        ("P5.4 Demand Forecasting\n(Chronological 80/20)", 2.5, 3.8, "#10B981"),
        ("P5.5 Wastage Analytics\n(Risk Prediction & Trend)", 6.5, 3.8, "#06B6D4"),
        ("P5.6 Pricing Intelligence\n(Elasticity Classification)", 10.5, 3.8, "#8B5CF6"),
        ("P5.7 Promotion Analytics\n(Trap Identification)", 4.5, 1.6, "#EC4899"),
        ("P5.8 Anomaly Detection\n(Z-Score & IQR Outliers)", 8.5, 1.6, "#EF4444")
    ]
    
    for name, x, y, col in sub_procs:
        rect = patches.FancyBboxPatch((x - 1.6, y - 0.6), 3.2, 1.2, boxstyle="round,pad=0.12",
                                      facecolor=BOX_BG, edgecolor=col, lw=2.2)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')

    ax.set_xlim(0, 13)
    ax.set_ylim(0.5, 7.5)
    plt.title("DineIQ Analytics — DFD Level 2 (Decomposition of Analytics Engine)", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-DFD-2.png')

# 20. DIAG-DEPLOY-001: Deployment Architecture
def create_diag_deploy_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    stages = [
        ("Client Tier\nModern Web Browser\nEdge / Chrome", "#38BDF8"),
        ("Frontend Tier\nVite Dev Server\nPort 3000 (React 19)", "#818CF8"),
        ("Application Tier\nFlask REST API\nPort 5000 (Python 3.13)", "#F59E0B"),
        ("Compute Tier\nPySpark 3.5 Engine\nJVM Spark Context", "#10B981"),
        ("Persistence Tier\nParquet Data Store\nModels & SQLite DB", "#06B6D4")
    ]
    for i, (text, col) in enumerate(stages):
        x = 0.8 + i * 2.35
        rect = patches.FancyBboxPatch((x, 1.6), 1.9, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.95, 2.7, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9.5, weight='bold')
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + 2.3, 2.7), xytext=(x + 1.9, 2.7),
                        arrowprops=dict(arrowstyle="<->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.5, 4.6)
    plt.title("DineIQ Analytics — Deployment & Runtime Topology Architecture", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-DEPLOY-001.png')

# 21. DIAG-EXEC-001: Execution Workflow
def create_diag_exec_001():
    fig, ax = plt.subplots(figsize=(14, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    steps = [
        ("1. Generate\nDataset\n(1M+ Rows)", "#EF4444"),
        ("2. Spark\nIngestion\n& Validation", "#F97316"),
        ("3. Data\nQuality &\nCleaning", "#EAB308"),
        ("4. Spark SQL\n& Feature\nEngineering", "#10B981"),
        ("5. Dual ML\nTraining\n(Spark+Py)", "#06B6D4"),
        ("6. Compare\nPipelines\n(98.08% Acc)", "#8B5CF6"),
        ("7. Launch\nWeb UI\n(:3000)", "#EC4899")
    ]
    for i, (text, col) in enumerate(steps):
        x = 0.5 + i * 1.85
        rect = patches.FancyBboxPatch((x, 1.8), 1.55, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.775, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.8, 2.9), xytext=(x + 1.55, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13.5)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ Analytics — Complete End-to-End System Execution Sequence", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-EXEC-001.png')

# 22. DIAG-ACT-001: Activity Diagram
def create_diag_act_001():
    fig, ax = plt.subplots(figsize=(13, 6), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    stages = [
        ("User Login\n& Role Auth", "#38BDF8"),
        ("Select Restaurant\n& Date Range", "#818CF8"),
        ("Review Executive\nKPIs & Alerts", "#F59E0B"),
        ("Drill-Down: Menu /\nCustomer / Waste", "#10B981"),
        ("Simulate What-If\nScenario Changes", "#06B6D4"),
        ("Export Reports\n& Action Plan", "#8B5CF6")
    ]
    for i, (text, col) in enumerate(stages):
        x = 0.6 + i * 2.0
        rect = patches.FancyBboxPatch((x, 1.8), 1.6, 2.2, boxstyle="round,pad=0.15",
                                      facecolor=BOX_BG, edgecolor=col, linewidth=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.8, 2.9, text, ha='center', va='center', color=TEXT_MAIN, fontsize=9, weight='bold')
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + 1.95, 2.9), xytext=(x + 1.6, 2.9),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=BOX_BORDER, lw=2.5))
            
    ax.set_xlim(0, 13)
    ax.set_ylim(0.8, 4.8)
    plt.title("DineIQ Analytics — End-to-End User Activity Diagram", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-ACT-001.png')

# 23. DIAG-SEQ-001: Sequence Diagram
def create_diag_seq_001():
    fig, ax = plt.subplots(figsize=(13, 7.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    lifelines = [
        ("User / Browser", 1.5),
        ("React UI (Vite)", 4.0),
        ("Flask API (:5000)", 7.0),
        ("Dual ML Engine", 9.8),
        ("Parquet Storage", 12.0)
    ]
    
    for name, x in lifelines:
        rect = patches.FancyBboxPatch((x - 0.9, 6.4), 1.8, 0.6, boxstyle="round,pad=0.1",
                                      facecolor=BOX_BG, edgecolor='#38BDF8', lw=1.8)
        ax.add_patch(rect)
        ax.text(x, 6.7, name, color=TEXT_MAIN, fontsize=9.5, weight='bold', ha='center', va='center')
        ax.plot([x, x], [6.3, 0.8], color='#475569', linestyle='--', lw=1.5)
        
    # Sequence messages
    msgs = [
        (1.5, 4.0, 5.8, "1. Click 'Simulate Scenario'", '#38BDF8', True),
        (4.0, 7.0, 5.0, "2. POST /api/whatif (payload)", '#818CF8', True),
        (7.0, 9.8, 4.2, "3. Execute Pricing Elasticity Model", '#F59E0B', True),
        (9.8, 12.0, 3.4, "4. Fetch Baseline Aggregates", '#10B981', True),
        (12.0, 9.8, 2.8, "5. Return Item Statistics", '#10B981', False),
        (9.8, 7.0, 2.2, "6. Return Prediction & Confidence", '#F59E0B', False),
        (7.0, 4.0, 1.6, "7. JSON Response (Before/After)", '#818CF8', False),
        (4.0, 1.5, 1.0, "8. Render Impact Cards & Charts", '#38BDF8', False)
    ]
    
    for x1, x2, y, text, col, is_req in msgs:
        ls = '-' if is_req else '--'
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color=col, lw=2, linestyle=ls))
        ax.text((x1 + x2) / 2, y + 0.15, text, color=TEXT_MAIN, fontsize=8.5, ha='center')

    ax.set_xlim(0, 13.5)
    ax.set_ylim(0.4, 7.5)
    plt.title("DineIQ — Sequence Diagram: Real-Time What-If Analytical Request Flow", color=TEXT_MAIN, fontsize=14, weight='bold', pad=15)
    save_fig(fig, 'DIAG-SEQ-001.png')

# 24. DIAG-FOLDER-001: Project Folder Architecture
def create_diag_folder_001():
    fig, ax = plt.subplots(figsize=(13, 8), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    tree_text = """
DineIQ/ (Root Repository)
├── src/                          # Application Core
│   ├── backend/ (app.py, auth.py) # Flask REST Gateway & Microservices
│   ├── components/               # React 19 UI Modular Components
│   ├── pages/                    # 15 Command Center Analytical Dashboards
│   ├── services/                 # Recommendation & Scorer Engine
│   └── data/mock/                # Structured Mock Data & Pipeline Fallback
├── spark_jobs/                   # Apache Spark Big Data Pipeline
│   ├── ingest_validate.py        # StructType Schema Validation & Ingestion
│   ├── engines.py                # 14-Rule Automated Data Quality Engine
│   ├── features.py               # Cleaning, Quarantine & Imputation Rules
│   ├── mllib_models.py           # Spark MLlib Distributed Training (RF, GBT)
│   └── dual_pipeline_compare.py  # Cross-Validation & Agreement Auditor
├── python_pipeline/              # Independent Python Data Science Pipeline
│   ├── run_pipeline.py           # End-to-End SciPy/Scikit/XGBoost Pipeline
│   ├── customer_intelligence.py  # RFM Customer Segmentation & Churn Risk
│   ├── demand_forecasting.py     # Chronological Demand Forecasting
│   └── model_artifacts.py        # Independent Feature Store & Evaluation
├── data_generator/               # Synthetic Data Generation Suite
│   └── generate_dineiq_data.py   # 11 Relational Tables, 1,000,000+ Records
├── processed_data/parquet_data/  # High-Performance Parquet Storage
├── models/                       # Versioned ML Model Artifacts & Metadata
├── tests/                        # Automated Pytest Suite (40/40 Unit Tests)
├── documentation/                # SRS Mapping, Installation & Architecture Docs
└── AI_USAGE.md                   # Transparent AI Assistance Declaration
"""
    rect = patches.FancyBboxPatch((0.5, 0.5), 12.0, 6.8, boxstyle="round,pad=0.2",
                                  facecolor=BOX_BG, edgecolor='#38BDF8', lw=2)
    ax.add_patch(rect)
    ax.text(0.9, 6.9, "DineIQ — Master Repository & Folder Architecture", color=BOX_BORDER, fontsize=12, weight='bold')
    ax.text(0.9, 3.8, tree_text, color=TEXT_MAIN, fontfamily='monospace', fontsize=8.5, va='center')

    ax.set_xlim(0, 13)
    ax.set_ylim(0, 7.8)
    save_fig(fig, 'DIAG-FOLDER-001.png')

if __name__ == '__main__':
    print("Generating diagrams...")
    create_diag_biz_001()
    create_diag_uc_001()
    create_diag_sys_001()
    create_diag_bd_001()
    create_diag_er_001()
    create_diag_dq_001()
    create_diag_spark_001()
    create_diag_py_001()
    create_diag_fe_001()
    create_diag_menu_001()
    create_diag_cust_001()
    create_diag_mba_001()
    create_diag_forecast_001()
    create_diag_waste_001()
    create_diag_comp_001()
    create_diag_rec_001()
    create_diag_dfd_0()
    create_diag_dfd_1()
    create_diag_dfd_2()
    create_diag_deploy_001()
    create_diag_exec_001()
    create_diag_act_001()
    create_diag_seq_001()
    create_diag_folder_001()
    print("All 24 diagrams generated successfully!")
