
-- Dispatch tickets table
CREATE TABLE public.dispatch_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL DEFAULT 'DIS-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
  city text NOT NULL,
  site text,
  host_ip text,
  host_name text,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  status text NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto','en_progreso','resuelto','cancelado')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('noc_alert','red_en_vivo','manual')),
  technician_id uuid REFERENCES public.technicians(id),
  technician_name text,
  tenant_id text,
  tenant_type text,
  isp text,
  zone text,
  notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER dispatch_tickets_updated_at
  BEFORE UPDATE ON public.dispatch_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.dispatch_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dispatch_tickets"
  ON public.dispatch_tickets FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert dispatch_tickets"
  ON public.dispatch_tickets FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update dispatch_tickets"
  ON public.dispatch_tickets FOR UPDATE TO public USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_tickets;
