
-- Drop the recursive policy
DROP POLICY IF EXISTS "Supervisors read all profiles" ON public.profiles;

-- Create security definer function to check supervisor role
CREATE OR REPLACE FUNCTION public.is_supervisor(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id AND role = 'supervisor'
  );
$$;

-- Create safe supervisor policy on profiles
CREATE POLICY "Supervisors read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_supervisor(auth.uid()));

-- Update academy_modules supervisor policies
DROP POLICY IF EXISTS "Supervisors manage modules" ON public.academy_modules;
CREATE POLICY "Supervisors manage modules" ON public.academy_modules
  FOR ALL TO authenticated
  USING (public.is_supervisor(auth.uid()))
  WITH CHECK (public.is_supervisor(auth.uid()));

-- Update exams supervisor policies
DROP POLICY IF EXISTS "Supervisors manage exams" ON public.exams;
CREATE POLICY "Supervisors manage exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.is_supervisor(auth.uid()))
  WITH CHECK (public.is_supervisor(auth.uid()));

-- Update exam_questions supervisor policies
DROP POLICY IF EXISTS "Supervisors manage questions" ON public.exam_questions;
CREATE POLICY "Supervisors manage questions" ON public.exam_questions
  FOR ALL TO authenticated
  USING (public.is_supervisor(auth.uid()))
  WITH CHECK (public.is_supervisor(auth.uid()));

-- Update technician_progress supervisor policy
DROP POLICY IF EXISTS "Supervisors read all progress" ON public.technician_progress;
CREATE POLICY "Supervisors read all progress" ON public.technician_progress
  FOR SELECT TO authenticated
  USING (public.is_supervisor(auth.uid()));

-- Update technician_exam_attempts supervisor policy
DROP POLICY IF EXISTS "Supervisors read all attempts" ON public.technician_exam_attempts;
CREATE POLICY "Supervisors read all attempts" ON public.technician_exam_attempts
  FOR SELECT TO authenticated
  USING (public.is_supervisor(auth.uid()));

-- Update xp_log supervisor policies
DROP POLICY IF EXISTS "Supervisors read all xp_log" ON public.xp_log;
CREATE POLICY "Supervisors read all xp_log" ON public.xp_log
  FOR SELECT TO authenticated
  USING (public.is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors insert xp_log" ON public.xp_log;
CREATE POLICY "Supervisors insert xp_log" ON public.xp_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor(auth.uid()));

-- Update badges supervisor policy
DROP POLICY IF EXISTS "Supervisors manage badges" ON public.badges;
CREATE POLICY "Supervisors manage badges" ON public.badges
  FOR ALL TO authenticated
  USING (public.is_supervisor(auth.uid()))
  WITH CHECK (public.is_supervisor(auth.uid()));

-- Update technician_badges supervisor policies
DROP POLICY IF EXISTS "Supervisors read all tech badges" ON public.technician_badges;
CREATE POLICY "Supervisors read all tech badges" ON public.technician_badges
  FOR SELECT TO authenticated
  USING (public.is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors insert tech badges" ON public.technician_badges;
CREATE POLICY "Supervisors insert tech badges" ON public.technician_badges
  FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor(auth.uid()));
