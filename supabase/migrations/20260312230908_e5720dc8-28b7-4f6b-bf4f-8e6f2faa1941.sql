INSERT INTO exercise_catalog (name, slug, description, execution, primary_muscle_id, secondary_muscles, equipment, difficulty, resistance_profile, is_compound, video_url, tips, variants)
VALUES (
  'Cruces de polea en banco',
  'cruces-de-polea-en-banco',
  'Ejercicio de aislamiento para el pectoral mayor utilizando poleas. Permite una contracción máxima en la fase concéntrica gracias a la tensión constante del cable.',
  'Piensa en pegar tu bíceps al pectoral, mantén la caja torácica en extensión. Controla la fase excéntrica y aprieta en la contracción.',
  'ffdfd1f9-0b62-46a5-8fd1-73a355cb17b1',
  ARRAY['8ae161b1-a95a-4a6d-ad05-6d6cb71a30e9']::uuid[],
  ARRAY['polea', 'banco'],
  'intermediate',
  'constant',
  false,
  'https://player.vimeo.com/video/1173096238?autoplay=1&loop=1&muted=1&background=1',
  ARRAY['Mantén la caja torácica en extensión durante todo el movimiento', 'No bloquees los codos completamente', 'Controla la fase excéntrica 2-3 segundos'],
  ARRAY['Cruces de polea de pie', 'Cruces de polea alta', 'Cruces de polea baja']
);