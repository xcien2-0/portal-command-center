
-- Status enum for dispatch jobs
CREATE TYPE public.dispatch_job_status AS ENUM (
  'pending_dispatch', 'scheduled', 'in_route', 'on_site', 'completed', 'blocked'
);

-- Customer coordination status
CREATE TYPE public.dispatch_customer_status AS ENUM (
  'pending', 'confirmed', 'unavailable', 'access_denied', 'reschedule'
);

-- Service type enum
CREATE TYPE public.dispatch_service_type AS ENUM (
  'instalacion_residencial', 'instalacion_empresarial', 'mantenimiento', 'reparacion', 'retiro', 'migracion', 'otro'
);

-- Visit type enum
CREATE TYPE public.dispatch_visit_type AS ENUM (
  'primera_visita', 'seguimiento', 'revisita', 'emergencia'
);

-- Main dispatch jobs table
CREATE TABLE public.dispatch_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number text NOT NULL DEFAULT ('JOB-' || to_char(now(), 'YYYYMMDD-HH24MISS')),
  project_id text,
  customer_name text NOT NULL,
  site_address text NOT NULL,
  service_type public.dispatch_service_type NOT NULL DEFAULT 'instalacion_residencial',
  visit_type public.dispatch_visit_type NOT NULL DEFAULT 'primera_visita',
  priority text NOT NULL DEFAULT 'media',
  status public.dispatch_job_status NOT NULL DEFAULT 'pending_dispatch',
  customer_status public.dispatch_customer_status NOT NULL DEFAULT 'pending',
  scheduled_date date,
  scheduled_time time,
  estimated_duration_minutes integer DEFAULT 60,
  contact_person text,
  contact_phone text,
  zone text,
  territory text,
  crew_id text,
  work_order_id text,
  odoo_order_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table for assigning multiple technicians
CREATE TABLE public.dispatch_job_technicians (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, technician_id)
);

-- Status history / audit trail
CREATE TABLE public.dispatch_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  old_status public.dispatch_job_status,
  new_status public.dispatch_job_status NOT NULL,
  changed_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notes / comments
CREATE TABLE public.dispatch_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.dispatch_jobs(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Sistema',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dispatch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_job_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies: dispatch_jobs
CREATE POLICY "Anyone authenticated reads dispatch_jobs"
  ON public.dispatch_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated inserts dispatch_jobs"
  ON public.dispatch_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone authenticated updates dispatch_jobs"
  ON public.dispatch_jobs FOR UPDATE TO authenticated USING (true);

-- RLS policies: dispatch_job_technicians
CREATE POLICY "Anyone authenticated reads job_technicians"
  ON public.dispatch_job_technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated inserts job_technicians"
  ON public.dispatch_job_technicians FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone authenticated deletes job_technicians"
  ON public.dispatch_job_technicians FOR DELETE TO authenticated USING (true);

-- RLS policies: dispatch_status_history
CREATE POLICY "Anyone authenticated reads status_history"
  ON public.dispatch_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated inserts status_history"
  ON public.dispatch_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- RLS policies: dispatch_notes
CREATE POLICY "Anyone authenticated reads dispatch_notes"
  ON public.dispatch_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated inserts dispatch_notes"
  ON public.dispatch_notes FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for updated_at on dispatch_jobs
CREATE TRIGGER update_dispatch_jobs_updated_at
  BEFORE UPDATE ON public.dispatch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dispatch_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_jobs;

-- Indexes for performance
CREATE INDEX idx_dispatch_jobs_status ON public.dispatch_jobs(status);
CREATE INDEX idx_dispatch_jobs_scheduled ON public.dispatch_jobs(scheduled_date);
CREATE INDEX idx_dispatch_jobs_zone ON public.dispatch_jobs(zone);
CREATE INDEX idx_dispatch_status_history_job ON public.dispatch_status_history(job_id);
CREATE INDEX idx_dispatch_notes_job ON public.dispatch_notes(job_id);
CREATE INDEX idx_dispatch_job_technicians_job ON public.dispatch_job_technicians(job_id);
CREATE INDEX idx_dispatch_job_technicians_tech ON public.dispatch_job_technicians(technician_id);
