import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ODOO_URL = Deno.env.get("ODOO_URL");
    const ODOO_DB = Deno.env.get("ODOO_DB");
    const ODOO_USERNAME = Deno.env.get("ODOO_USERNAME");
    const ODOO_API_KEY = Deno.env.get("ODOO_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
      return new Response(JSON.stringify({ error: "Odoo credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, ...params } = await req.json();

    // ─── Odoo JSON-RPC helper ───
    async function odooRpc(service: string, method: string, args: any[]) {
      const res = await fetch(`${ODOO_URL}/jsonrpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          id: Date.now(),
          params: { service, method, args },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      return json.result;
    }

    // Authenticate with Odoo
    const uid = await odooRpc("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}]);
    if (!uid) throw new Error("Odoo authentication failed");

    async function odooCall(model: string, method: string, args: any[], kwargs: any = {}) {
      return odooRpc("object", "execute_kw", [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]);
    }

    // ─── Actions ───

    // 1. Fetch work orders from Odoo → create dispatch jobs
    if (action === "fetch_work_orders") {
      const domain = params.domain || [["state", "in", ["draft", "confirmed", "progress"]]];
      const fields = ["id", "name", "partner_id", "date_planned_start", "product_id", "state", "origin"];
      const orders = await odooCall("mrp.production", "search_read", [domain], { fields, limit: params.limit || 50 });

      const created = [];
      for (const wo of orders) {
        // Check if already imported
        const { data: existing } = await supabase
          .from("dispatch_jobs")
          .select("id")
          .eq("odoo_order_id", String(wo.id))
          .maybeSingle();

        if (!existing) {
          const { data, error } = await supabase.from("dispatch_jobs").insert({
            customer_name: wo.partner_id?.[1] || "Sin cliente",
            site_address: "Pendiente de asignar",
            service_type: "instalacion_residencial",
            work_order_id: wo.name || null,
            odoo_order_id: String(wo.id),
            project_id: wo.origin || null,
            notes: `Importado de Odoo. Producto: ${wo.product_id?.[1] || "N/A"}`,
          }).select().single();

          if (data) {
            created.push(data);
            await supabase.from("dispatch_status_history").insert({
              job_id: data.id,
              new_status: "pending_dispatch",
              changed_by_name: "Odoo Sync",
              notes: `Importado desde Odoo WO: ${wo.name}`,
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, imported: created.length, total_found: orders.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Push status update to Odoo
    if (action === "push_status") {
      const { job_id } = params;
      const { data: job } = await supabase.from("dispatch_jobs").select("*").eq("id", job_id).single();
      if (!job || !job.odoo_order_id) {
        return new Response(JSON.stringify({ error: "Job not found or no Odoo link" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map dispatch status to Odoo work order state
      const statusMap: Record<string, string> = {
        in_route: "progress",
        on_site: "progress",
        completed: "done",
        blocked: "confirmed",
      };

      const odooState = statusMap[job.status] || "confirmed";
      await odooCall("mrp.production", "write", [[parseInt(job.odoo_order_id)], { state: odooState }]);

      return new Response(JSON.stringify({ success: true, odoo_state: odooState }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch field service tasks (if using Odoo Field Service module)
    if (action === "fetch_field_tasks") {
      const domain = params.domain || [["stage_id.fold", "=", false]];
      const fields = ["id", "name", "partner_id", "partner_phone", "partner_email", "date_deadline", "planned_date_begin", "planned_date_end", "stage_id", "user_ids", "description"];
      const tasks = await odooCall("project.task", "search_read", [domain], { fields, limit: params.limit || 50 });

      const created = [];
      for (const task of tasks) {
        const { data: existing } = await supabase
          .from("dispatch_jobs")
          .select("id")
          .eq("odoo_order_id", `task-${task.id}`)
          .maybeSingle();

        if (!existing) {
          const { data } = await supabase.from("dispatch_jobs").insert({
            customer_name: task.partner_id?.[1] || task.name,
            site_address: "Pendiente",
            service_type: "mantenimiento",
            odoo_order_id: `task-${task.id}`,
            project_id: task.name,
            contact_phone: task.partner_phone || null,
            notes: task.description || null,
            scheduled_date: task.planned_date_begin ? task.planned_date_begin.split(" ")[0] : null,
          }).select().single();

          if (data) created.push(data);
        }
      }

      return new Response(JSON.stringify({ success: true, imported: created.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("dispatch-odoo-sync error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
