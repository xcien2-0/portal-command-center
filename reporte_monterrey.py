#!/usr/bin/env python3
"""
XCIEN 2.0 — Reporte Operativo Plaza Monterrey
Conexión silente a Odoo wispi17 + generación PDF
"""
import os
import json
import xmlrpc.client
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

ODOO_URL = os.environ.get("ODOO_URL")
ODOO_DB = os.environ.get("ODOO_DB")
ODOO_USER = os.environ.get("ODOO_USER")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD")

# ─── Conexión silente ────────────────────────────────────────────────────────
common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

if not uid:
    print("❌ No se pudo autenticar en Odoo")
    exit(1)

print(f"✅ Conectado a Odoo ({ODOO_DB}) como UID {uid}")

today_str = date.today().isoformat()
hoy = datetime.now().strftime("%d de abril de %Y")

# ─── Fase 1: Descubrir modelos disponibles ───────────────────────────────────
data = {}

mty_keywords = ['monterrey', 'mty', 'nuevo leon', 'nuevo león', 'nl', 'san nicolas', 'guadalupe', 'apodaca', 'escobedo', 'santa catarina', 'san pedro']

def is_mty(record):
    return any(k in json.dumps(record, default=str).lower() for k in mty_keywords)

print(f"─── Datos de HOY ({today_str}) — Plaza Monterrey ───")

# Helpdesk tickets de HOY
tickets_mty = []
try:
    tickets = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'helpdesk.ticket', 'search_read',
        [[('create_date', '>=', today_str + ' 00:00:00'), ('create_date', '<=', today_str + ' 23:59:59')]],
        {'fields': ['name', 'partner_id', 'stage_id', 'user_id', 'create_date', 'team_id', 'priority'], 'limit': 500})
    tickets_mty = [t for t in tickets if is_mty(t)]
    print(f"  🎫 Tickets Helpdesk hoy MTY: {len(tickets_mty)} de {len(tickets)} totales hoy")
except Exception as e:
    print(f"  ⚠️ helpdesk.ticket: {e}")

# Tareas de hoy
tasks_mty = []
try:
    tasks = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'project.task', 'search_read',
        [[('create_date', '>=', today_str + ' 00:00:00'), ('create_date', '<=', today_str + ' 23:59:59')]],
        {'fields': ['name', 'project_id', 'stage_id', 'user_ids', 'date_deadline', 'priority', 'create_date'], 'limit': 500})
    tasks_mty = [t for t in tasks if is_mty(t)]
    print(f"  📋 Tareas hoy MTY: {len(tasks_mty)} de {len(tasks)} totales hoy")
except Exception as e:
    print(f"  ⚠️ project.task: {e}")

# Ventas de hoy
sales_mty = []
try:
    sales = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'sale.order', 'search_read',
        [[('create_date', '>=', today_str + ' 00:00:00'), ('create_date', '<=', today_str + ' 23:59:59')]],
        {'fields': ['name', 'partner_id', 'state', 'amount_total', 'date_order', 'user_id'], 'limit': 500})
    sales_mty = [s for s in sales if is_mty(s)]
    print(f"  💰 Ventas hoy MTY: {len(sales_mty)} de {len(sales)} totales hoy")
except Exception as e:
    print(f"  ⚠️ sale.order: {e}")

# Leads de hoy
leads_mty = []
try:
    leads = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'crm.lead', 'search_read',
        [[('create_date', '>=', today_str + ' 00:00:00'), ('create_date', '<=', today_str + ' 23:59:59')]],
        {'fields': ['name', 'partner_id', 'stage_id', 'user_id', 'expected_revenue', 'create_date', 'city', 'type'], 'limit': 500})
    leads_mty = [l for l in leads if is_mty(l)]
    print(f"  🎯 Leads hoy MTY: {len(leads_mty)} de {len(leads)} totales hoy")
except Exception as e:
    print(f"  ⚠️ crm.lead: {e}")

# Empleados (no filtrar por fecha, es catálogo)
employees_mty = []
try:
    employees = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, 'hr.employee', 'search_read',
        [[]], {'fields': ['name', 'job_title', 'department_id', 'work_email', 'work_phone'], 'limit': 300})
    employees_mty = [e for e in employees if is_mty(e)]
    print(f"  👷 Empleados MTY: {len(employees_mty)}")
except Exception as e:
    print(f"  ⚠️ hr.employee: {e}")

# ─── Guardar datos crudos para referencia ─────────────────────────────────────
raw = {
    "fecha": today_str,
    "plaza": "Monterrey",
    "tickets": tickets_mty,
    "tareas": tasks_mty,
    "ventas": sales_mty,
    "leads": leads_mty,
    "empleados": employees_mty,
    "totales_odoo": data,
}
with open("db/reporte_mty_raw.json", "w", encoding="utf-8") as f:
    json.dump(raw, f, indent=2, ensure_ascii=False, default=str)

print(f"\n✅ Datos crudos guardados en db/reporte_mty_raw.json")
print(f"   Tickets: {len(tickets_mty)} | Tareas: {len(tasks_mty)} | Ventas: {len(sales_mty)} | Leads: {len(leads_mty)} | Empleados: {len(employees_mty)}")
