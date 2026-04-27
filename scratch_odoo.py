import os
import xmlrpc.client
from dotenv import load_dotenv

load_dotenv()
ODOO_URL = os.environ.get("ODOO_URL")
ODOO_DB = os.environ.get("ODOO_DB")
ODOO_USER = os.environ.get("ODOO_USER")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD")

common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(ODOO_URL))
uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})

models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(ODOO_URL))
# Try to get employees
try:
    employees = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'hr.employee', 'search_read', [[]], {'fields': ['name', 'job_title', 'department_id'], 'limit': 5})
    print("Employees:", employees)
except Exception as e:
    print("Error fetching hr.employee:", e)

# Try to get users
try:
    users = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'res.users', 'search_read', [[('share', '=', False)]], {'fields': ['name', 'login'], 'limit': 5})
    print("Users:", users)
except Exception as e:
    print("Error fetching res.users:", e)
