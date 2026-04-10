
-- Rename Cuadrado Lumbar → Lumbar
UPDATE muscle_groups SET name = 'Lumbar' WHERE id = 'b13ff73a-35df-45e1-b3e7-07d408dc2907';

-- Rename Gastrocnemio → Gemelo
UPDATE muscle_groups SET name = 'Gemelo' WHERE id = '1f0aaac8-9ca0-4bd6-83e1-b9362952df7c';

-- Delete Serrato Anterior (reassign exercises to Pectoral Mayor)
UPDATE exercise_catalog SET primary_muscle_id = 'ffdfd1f9-0b62-46a5-8fd1-73a355cb17b1'
WHERE primary_muscle_id = 'c395da16-3002-48d8-924a-13106d69c523';

UPDATE muscle_fatigue_states SET muscle_id = 'ffdfd1f9-0b62-46a5-8fd1-73a355cb17b1'
WHERE muscle_id = 'c395da16-3002-48d8-924a-13106d69c523';

UPDATE muscle_load_logs SET muscle_id = 'ffdfd1f9-0b62-46a5-8fd1-73a355cb17b1'
WHERE muscle_id = 'c395da16-3002-48d8-924a-13106d69c523';

DELETE FROM muscle_groups WHERE id = 'c395da16-3002-48d8-924a-13106d69c523';
