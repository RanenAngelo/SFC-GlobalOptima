import urllib.request
import urllib.error
import json

BASE_URL = 'http://127.0.0.1:5000'

def request(path, method='GET', token=None, body=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("=== 1. AUTHENTICATION & ROLE IDENTITIES ===")
users = {}
test_accounts = [
    ('rest_manager', 'restman123'),
    ('rest_manager_2', 'restman123'),
    ('reg_manager', 'regman123'),
    ('analyst', 'analyst123'),
    ('admin', 'admin123')
]

for username, pwd in test_accounts:
    status, res = request('/api/auth/login', 'POST', body={'username': username, 'password': pwd})
    assert status == 200, f"Login failed for {username}"
    users[username] = res
    u = res['user']
    print(f"User: {username:15} | Role: {u['role']:20} | Scope: {u.get('locations')}")

print("\n=== 2. EXECUTIVE DASHBOARD DATA ISOLATION & COMPARISON ===")
exec_results = {}
for username, data in users.items():
    status, res = request('/api/analytics/executive', token=data['token'])
    assert status == 200
    k = res['kpis']
    exec_results[username] = k
    top_cat = res.get('by_category', [{}])[0]
    cat_name = top_cat.get('name', 'N/A')
    cat_rev = top_cat.get('revenue', 0)
    print(f"{username:15}: Orders={k['total_orders']:5} | Rev=${k['total_gross_revenue']:11,.2f} | Profit=${k['total_profit']:10,.2f} | Cust={k['total_active_customers']:5} | Repeat={k['total_repeat_customers']:5} | Top Cat={cat_name} (${cat_rev:,.2f})")

# Assert mathematical and scoping differences
m1 = exec_results['rest_manager']
m2 = exec_results['rest_manager_2']
reg = exec_results['reg_manager']
adm = exec_results['admin']

assert m1['total_orders'] != m2['total_orders'], "Managers must have different order counts!"
assert m1['total_gross_revenue'] != m2['total_gross_revenue'], "Managers must have different revenue!"
assert m1['total_repeat_customers'] != m2['total_repeat_customers'], "Managers must have different repeat customers!"
assert reg['total_orders'] > m1['total_orders'], "Regional manager must aggregate multiple locations!"
assert adm['total_orders'] > reg['total_orders'], "Admin must aggregate entire enterprise system-wide!"
print("\n[PASS] Executive KPIs are strictly distinct, accurate, and scoped!")

print("\n=== 3. LOCATION SCOPE ENFORCEMENT & UNAUTHORIZED REQUESTS ===")
# Manager A (REST01) requesting REST02 -> 403 Forbidden
code, res = request('/api/analytics/executive?location=REST02', token=users['rest_manager']['token'])
print(f"Manager A (REST01) querying unauthorized REST02: HTTP {code} ({res.get('message')})")
assert code == 403

# Manager B (REST02) requesting REST01 -> 403 Forbidden
code, res = request('/api/analytics/executive?location=REST01', token=users['rest_manager_2']['token'])
print(f"Manager B (REST02) querying unauthorized REST01: HTTP {code} ({res.get('message')})")
assert code == 403

# Regional Manager requesting unauthorized REST01 -> 403 Forbidden
code, res = request('/api/analytics/executive?location=REST01', token=users['reg_manager']['token'])
print(f"Regional Manager querying unauthorized REST01: HTTP {code} ({res.get('message')})")
assert code == 403

# Regional Manager requesting authorized REST12 -> 200 OK
code, res = request('/api/analytics/executive?location=REST12', token=users['reg_manager']['token'])
print(f"Regional Manager querying authorized REST12: HTTP {code} (Orders: {res['kpis']['total_orders']})")
assert code == 200

# Ordinary manager attempting to access admin jobs -> 403 Forbidden
code, res = request('/api/jobs', token=users['rest_manager']['token'])
print(f"Manager attempting admin jobs API: HTTP {code} ({res.get('message')})")
assert code == 403

# Ordinary manager attempting to access admin audit logs -> 403 Forbidden
code, res = request('/api/audit-logs', token=users['rest_manager']['token'])
print(f"Manager attempting admin audit logs API: HTTP {code} ({res.get('message')})")
assert code == 403

# Admin accessing admin jobs -> 200 OK
code, res = request('/api/jobs', token=users['admin']['token'])
print(f"Admin accessing admin jobs API: HTTP {code} (Jobs count: {len(res.get('data', []))})")
assert code == 200

print("\n=== 4. FILTERED DATASETS (ORDERS, CUSTOMERS, LOCATIONS) ===")
# Manager A orders only have REST01
code, res = request('/api/orders?limit=50', token=users['rest_manager']['token'])
orders = res['data']
rest_ids = {o['restaurant_id'] for o in orders}
assert rest_ids == {'REST01'}, f"Manager A got orders from {rest_ids}"
print(f"Manager A orders scope: {rest_ids} (Count: {len(orders)})")

# Manager B orders only have REST02
code, res = request('/api/orders?limit=50', token=users['rest_manager_2']['token'])
orders = res['data']
rest_ids = {o['restaurant_id'] for o in orders}
assert rest_ids == {'REST02'}, f"Manager B got orders from {rest_ids}"
print(f"Manager B orders scope: {rest_ids} (Count: {len(orders)})")

# Regional Manager orders only have REST02, REST12, REST22
code, res = request('/api/orders?limit=100', token=users['reg_manager']['token'])
orders = res['data']
rest_ids = {o['restaurant_id'] for o in orders}
assert rest_ids.issubset({'REST02', 'REST12', 'REST22'}), f"Regional manager got orders from {rest_ids}"
print(f"Regional Manager orders scope: {rest_ids} (Count: {len(orders)})")

# Locations API scoping
code, res = request('/api/locations', token=users['rest_manager']['token'])
locs = [x['restaurant_id'] for x in res['data']]
assert locs == ['REST01'], f"Manager A got locations {locs}"
print(f"Manager A visible locations: {locs}")

code, res = request('/api/locations', token=users['rest_manager_2']['token'])
locs = [x['restaurant_id'] for x in res['data']]
assert locs == ['REST02'], f"Manager B visible locations: {locs}"
print(f"Manager B visible locations: {locs}")

code, res = request('/api/locations', token=users['reg_manager']['token'])
locs = {x['restaurant_id'] for x in res['data']}
assert locs == {'REST02', 'REST12', 'REST22'}, f"Regional manager got locations {locs}"
print(f"Regional Manager visible locations: {locs}")

code, res = request('/api/locations', token=users['admin']['token'])
locs = [x['restaurant_id'] for x in res['data']]
assert len(locs) == 25, f"Admin got {len(locs)} locations"
print(f"Admin visible locations: {len(locs)} total locations (all restaurants)")

print("\n=======================================================")
print(" ALL RBAC, SCOPING, AND AUTHORIZATION CHECKS PASSED 100% ")
print("=======================================================")
