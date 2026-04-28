import os
import json
from agents.odoo_connector import odoo_conn

# Mocking env if needed (assuming they are set in the environment)
def check_tickets():
    # Model could be 'helpdesk.ticket' or 'crm.lead'
    # Try helpdesk.ticket first
    print("Checking Odoo tickets...")
    try:
        tickets = odoo_conn.search_read(
            'helpdesk.ticket', 
            domain=[['name', 'ilike', 'NOC']], 
            fields=['id', 'name', 'stage_id', 'description', 'create_date']
        )
        print(f"Found {len(tickets)} tickets matching 'NOC'")
        for t in tickets:
            print(f"- {t['name']} (ID: {t['id']}, Stage: {t['stage_id'][1]})")
            
        # Try CRM just in case
        leads = odoo_conn.search_read(
            'crm.lead',
            domain=[['name', 'ilike', 'NOC']],
            fields=['id', 'name', 'type', 'probability']
        )
        print(f"Found {len(leads)} CRM leads matching 'NOC'")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tickets()
