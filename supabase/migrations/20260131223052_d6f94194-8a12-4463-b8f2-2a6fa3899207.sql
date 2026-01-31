-- Create educational content categories
CREATE TABLE public.educational_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create educational articles (editable by users)
CREATE TABLE public.educational_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.educational_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Create muscle groups for exercise catalog
CREATE TABLE public.muscle_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'upper', 'lower', 'core'
  description TEXT,
  icon TEXT
);

-- Create exercise catalog (master list of all exercises)
CREATE TABLE public.exercise_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  execution TEXT,
  primary_muscle_id UUID REFERENCES public.muscle_groups(id),
  secondary_muscles UUID[],
  equipment TEXT[], -- 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
  difficulty TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  resistance_profile TEXT, -- 'ascending', 'descending', 'bell-shaped', 'constant'
  strength_curve TEXT,
  video_url TEXT,
  image_url TEXT,
  tips TEXT[],
  variants TEXT[],
  is_compound BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_catalog ENABLE ROW LEVEL SECURITY;

-- Educational categories: everyone can read
CREATE POLICY "Anyone can view educational categories" 
ON public.educational_categories FOR SELECT USING (true);

-- Educational articles: everyone can read, users can edit their own copies
CREATE POLICY "Anyone can view educational articles" 
ON public.educational_articles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own articles" 
ON public.educational_articles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles" 
ON public.educational_articles FOR UPDATE 
USING (auth.uid() = user_id OR (is_default = true AND user_id IS NULL));

CREATE POLICY "Users can delete their own articles" 
ON public.educational_articles FOR DELETE 
USING (auth.uid() = user_id);

-- Muscle groups: everyone can read
CREATE POLICY "Anyone can view muscle groups" 
ON public.muscle_groups FOR SELECT USING (true);

-- Exercise catalog: everyone can read
CREATE POLICY "Anyone can view exercise catalog" 
ON public.exercise_catalog FOR SELECT USING (true);

-- Add trigger for updated_at on articles
CREATE TRIGGER update_educational_articles_updated_at
  BEFORE UPDATE ON public.educational_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.educational_categories (name, slug, description, icon, order_index) VALUES
('Hipertrofia', 'hipertrofia', 'Fundamentos científicos del crecimiento muscular', 'Dumbbell', 1),
('Natación', 'natacion', 'Técnica, entrenamientos y periodización en natación', 'Waves', 2),
('Running', 'running', 'Metodología del entrenamiento de carrera', 'Footprints', 3);

-- Insert muscle groups
INSERT INTO public.muscle_groups (name, category, description) VALUES
-- Upper body
('Pectoral Mayor', 'upper', 'Músculo principal del pecho, dividido en porción clavicular, esternal y abdominal'),
('Pectoral Menor', 'upper', 'Músculo profundo del pecho que estabiliza la escápula'),
('Deltoides Anterior', 'upper', 'Porción frontal del hombro, flexión y rotación interna'),
('Deltoides Lateral', 'upper', 'Porción media del hombro, abducción del brazo'),
('Deltoides Posterior', 'upper', 'Porción trasera del hombro, extensión y rotación externa'),
('Dorsal Ancho', 'upper', 'Principal músculo de la espalda, aducción y extensión del húmero'),
('Trapecio Superior', 'upper', 'Elevación escapular y extensión cervical'),
('Trapecio Medio', 'upper', 'Retracción escapular'),
('Trapecio Inferior', 'upper', 'Depresión y rotación escapular'),
('Romboides', 'upper', 'Retracción y elevación escapular'),
('Bíceps Braquial', 'upper', 'Flexión del codo y supinación del antebrazo'),
('Braquial', 'upper', 'Flexor puro del codo'),
('Braquiorradial', 'upper', 'Flexión del codo en posición neutra'),
('Tríceps Largo', 'upper', 'Extensión del codo y extensión del hombro'),
('Tríceps Lateral', 'upper', 'Extensión del codo'),
('Tríceps Medial', 'upper', 'Extensión del codo, estabilizador'),
('Serrato Anterior', 'upper', 'Protracción y rotación escapular'),
-- Lower body
('Cuádriceps Recto Femoral', 'lower', 'Flexión de cadera y extensión de rodilla'),
('Cuádriceps Vasto Lateral', 'lower', 'Extensión de rodilla, porción externa'),
('Cuádriceps Vasto Medial', 'lower', 'Extensión de rodilla, estabilización rotuliana'),
('Cuádriceps Vasto Intermedio', 'lower', 'Extensión de rodilla, porción profunda'),
('Isquiotibiales Bíceps Femoral', 'lower', 'Flexión de rodilla y extensión de cadera'),
('Isquiotibiales Semitendinoso', 'lower', 'Flexión de rodilla y rotación interna'),
('Isquiotibiales Semimembranoso', 'lower', 'Flexión de rodilla y extensión de cadera'),
('Glúteo Mayor', 'lower', 'Principal extensor de cadera y rotador externo'),
('Glúteo Medio', 'lower', 'Abducción y estabilización de cadera'),
('Glúteo Menor', 'lower', 'Abducción y rotación interna de cadera'),
('Aductores', 'lower', 'Aducción de cadera y estabilización'),
('Gastrocnemio', 'lower', 'Flexión plantar y flexión de rodilla'),
('Sóleo', 'lower', 'Flexión plantar, predominante con rodilla flexionada'),
('Tibial Anterior', 'lower', 'Dorsiflexión e inversión del pie'),
-- Core
('Recto Abdominal', 'core', 'Flexión del tronco y estabilización'),
('Oblicuo Externo', 'core', 'Rotación y flexión lateral del tronco'),
('Oblicuo Interno', 'core', 'Rotación contralateral y flexión lateral'),
('Transverso Abdominal', 'core', 'Estabilización profunda y compresión abdominal'),
('Erectores Espinales', 'core', 'Extensión y estabilización de la columna'),
('Cuadrado Lumbar', 'core', 'Flexión lateral y estabilización lumbar');