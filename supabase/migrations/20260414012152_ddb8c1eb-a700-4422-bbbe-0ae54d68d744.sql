
-- Enums
CREATE TYPE public.plaza_enum AS ENUM ('nuevo_leon','coahuila','tamaulipas','queretaro','jalisco','cdmx');
CREATE TYPE public.module_tipo_enum AS ENUM ('video','documento','practica');
CREATE TYPE public.xp_tipo_enum AS ENUM (
  'ticket_ok','ticket_anticipado','ticket_critico',
  'instalacion','instalacion_empresa',
  'modulo','examen_1er','examen_reintento',
  'sop','racha_30d','badge','mentoria',
  'revisita','sla_fail','ticket_sin_evidencia','instalacion_falla'
);
CREATE TYPE public.user_role_enum AS ENUM ('technician','supervisor');

-- Alter existing technicians table
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS plaza public.plaza_enum DEFAULT 'nuevo_leon',
  ADD COLUMN IF NOT EXISTS nivel int DEFAULT 1 CHECK (nivel >= 1 AND nivel <= 6),
  ADD COLUMN IF NOT EXISTS xp_total int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_mes_actual int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS racha_meses_limpios int DEFAULT 0;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role public.user_role_enum NOT NULL DEFAULT 'technician',
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supervisors read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Academy Modules
CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  nivel_requerido int NOT NULL DEFAULT 1 CHECK (nivel_requerido >= 1 AND nivel_requerido <= 6),
  tipo public.module_tipo_enum NOT NULL DEFAULT 'documento',
  xp_otorga int NOT NULL DEFAULT 60,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads modules" ON public.academy_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors manage modules" ON public.academy_modules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Exams
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  xp_primer_intento int NOT NULL DEFAULT 100,
  xp_reintento int NOT NULL DEFAULT 60,
  calificacion_minima int NOT NULL DEFAULT 75,
  max_intentos int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors manage exams" ON public.exams FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Exam Questions
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  pregunta text NOT NULL,
  opciones jsonb NOT NULL DEFAULT '[]',
  respuesta_correcta int NOT NULL DEFAULT 0,
  explicacion text
);
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads questions" ON public.exam_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors manage questions" ON public.exam_questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Technician Progress
CREATE TABLE public.technician_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  completado boolean NOT NULL DEFAULT false,
  fecha_completado timestamptz,
  xp_ganado int NOT NULL DEFAULT 0,
  UNIQUE(technician_id, module_id)
);
ALTER TABLE public.technician_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians read own progress" ON public.technician_progress FOR SELECT TO authenticated USING (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Technicians insert own progress" ON public.technician_progress FOR INSERT TO authenticated WITH CHECK (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Supervisors read all progress" ON public.technician_progress FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Technician Exam Attempts
CREATE TABLE public.technician_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  calificacion int NOT NULL DEFAULT 0,
  aprobado boolean NOT NULL DEFAULT false,
  intento_num int NOT NULL DEFAULT 1,
  fecha timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.technician_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians read own attempts" ON public.technician_exam_attempts FOR SELECT TO authenticated USING (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Technicians insert own attempts" ON public.technician_exam_attempts FOR INSERT TO authenticated WITH CHECK (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Supervisors read all attempts" ON public.technician_exam_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- XP Log
CREATE TABLE public.xp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  tipo public.xp_tipo_enum NOT NULL,
  puntos int NOT NULL,
  referencia_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians read own xp_log" ON public.xp_log FOR SELECT TO authenticated USING (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Supervisors read all xp_log" ON public.xp_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);
CREATE POLICY "Supervisors insert xp_log" ON public.xp_log FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);
CREATE POLICY "System insert xp_log" ON public.xp_log FOR INSERT TO authenticated WITH CHECK (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  criterio text,
  xp_otorga int NOT NULL DEFAULT 50,
  imagen_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors manage badges" ON public.badges FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- Technician Badges
CREATE TABLE public.technician_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  fecha_obtenido timestamptz NOT NULL DEFAULT now(),
  UNIQUE(technician_id, badge_id)
);
ALTER TABLE public.technician_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians read own badges" ON public.technician_badges FOR SELECT TO authenticated USING (
  technician_id IN (SELECT p.technician_id FROM public.profiles p WHERE p.user_id = auth.uid())
);
CREATE POLICY "Supervisors read all tech badges" ON public.technician_badges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);
CREATE POLICY "Supervisors insert tech badges" ON public.technician_badges FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'supervisor')
);

-- RPC: calcular_xp_mes
CREATE OR REPLACE FUNCTION public.calcular_xp_mes(p_technician_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tech technicians%ROWTYPE;
  v_xp_positivo int;
  v_xp_negativo int;
  v_mult_plaza numeric;
  v_mult_racha numeric;
  v_mult_nivel numeric;
  v_xp_neto numeric;
BEGIN
  SELECT * INTO v_tech FROM technicians WHERE id = p_technician_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Technician not found');
  END IF;

  -- Sum positive XP this month
  SELECT COALESCE(SUM(puntos), 0) INTO v_xp_positivo
  FROM xp_log
  WHERE technician_id = p_technician_id
    AND puntos > 0
    AND created_at >= date_trunc('month', now());

  -- Sum negative XP this month
  SELECT COALESCE(ABS(SUM(puntos)), 0) INTO v_xp_negativo
  FROM xp_log
  WHERE technician_id = p_technician_id
    AND puntos < 0
    AND created_at >= date_trunc('month', now());

  -- Plaza multiplier
  v_mult_plaza := CASE v_tech.plaza
    WHEN 'nuevo_leon' THEN 1.0
    WHEN 'cdmx' THEN 1.0
    WHEN 'jalisco' THEN 1.1
    WHEN 'queretaro' THEN 1.1
    WHEN 'coahuila' THEN 1.15
    WHEN 'tamaulipas' THEN 1.15
    ELSE 1.0
  END;

  -- Racha multiplier
  v_mult_racha := CASE
    WHEN v_tech.racha_meses_limpios >= 3 THEN 1.5
    WHEN v_tech.racha_meses_limpios = 2 THEN 1.35
    WHEN v_tech.racha_meses_limpios = 1 THEN 1.2
    ELSE 1.0
  END;

  -- Check if there are penalties this month (nullifies racha)
  IF v_xp_negativo > 0 THEN
    v_mult_racha := 1.0;
  END IF;

  -- Level multiplier
  v_mult_nivel := CASE v_tech.nivel
    WHEN 1 THEN 1.0
    WHEN 2 THEN 1.1
    WHEN 3 THEN 1.2
    WHEN 4 THEN 1.3
    WHEN 5 THEN 1.4
    WHEN 6 THEN 1.5
    ELSE 1.0
  END;

  v_xp_neto := GREATEST(0, (v_xp_positivo - v_xp_negativo)) * v_mult_plaza * v_mult_racha * v_mult_nivel;

  RETURN jsonb_build_object(
    'technician_id', p_technician_id,
    'xp_positivo', v_xp_positivo,
    'xp_negativo', v_xp_negativo,
    'mult_plaza', v_mult_plaza,
    'mult_racha', v_mult_racha,
    'mult_nivel', v_mult_nivel,
    'xp_neto', round(v_xp_neto),
    'nivel', v_tech.nivel,
    'plaza', v_tech.plaza,
    'racha', v_tech.racha_meses_limpios
  );
END;
$$;
