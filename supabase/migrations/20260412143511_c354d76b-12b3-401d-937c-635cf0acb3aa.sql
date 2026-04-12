
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  speciality TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read technicians"
  ON public.technicians FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage technicians"
  ON public.technicians FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed initial technicians
INSERT INTO public.technicians (name, phone, speciality) VALUES
  ('Carlos Mendoza', '5551234567', 'Fibra óptica'),
  ('Luis Ramírez', '5559876543', 'Radio enlace'),
  ('Ana Torres', '5554567890', 'Switching/Routing'),
  ('Miguel Ángel López', '5553216549', 'GPON'),
  ('Roberto Sánchez', '5558765432', 'Última milla');
