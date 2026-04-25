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

print("Testing helpdesk.ticket...")
try:
    tickets = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'helpdesk.ticket', 'search_read', [[]], {'limit': 1, 'fields': ['name', 'description']})
    print("Helpdesk Tickets:", tickets)
except Exception as e:
    print("Error:", e)

print("Testing project.task...")
try:
    tasks = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'project.task', 'search_read', [[]], {'limit': 1, 'fields': ['name', 'description']})
    print("Project Tasks:", tasks)
except Exception as e:
    print("Error:", e)

