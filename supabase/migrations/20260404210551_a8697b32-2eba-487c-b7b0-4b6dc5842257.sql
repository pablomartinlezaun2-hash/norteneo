
-- Add column to link training programs to their source planning mesocycle
ALTER TABLE public.training_programs
ADD COLUMN source_planning_mesocycle_id uuid REFERENCES public.planning_mesocycles(id) ON DELETE SET NULL;

-- Create function to deactivate training programs when their source mesocycle is deleted
CREATE OR REPLACE FUNCTION public.deactivate_programs_on_mesocycle_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.training_programs
  SET is_active = false
  WHERE source_planning_mesocycle_id = OLD.id
    AND is_active = true;
  RETURN OLD;
END;
$$;

-- Attach trigger to planning_mesocycles
CREATE TRIGGER trg_deactivate_programs_on_mesocycle_delete
BEFORE DELETE ON public.planning_mesocycles
FOR EACH ROW
EXECUTE FUNCTION public.deactivate_programs_on_mesocycle_delete();
