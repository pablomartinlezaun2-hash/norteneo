
-- 1. Cuádriceps: keep Recto Femoral as canonical, rename, reassign others
UPDATE exercise_catalog SET primary_muscle_id = '98497c5e-d2c6-43b6-a439-728bea3186f6'
WHERE primary_muscle_id IN ('1289c155-3f2d-4426-8a1a-eb4838f6a30c','d798441d-ccb8-452b-8eac-40bf61794c05','c70b429a-3ca4-4740-87d3-fc2ba015635c');

UPDATE muscle_fatigue_states SET muscle_id = '98497c5e-d2c6-43b6-a439-728bea3186f6'
WHERE muscle_id IN ('1289c155-3f2d-4426-8a1a-eb4838f6a30c','d798441d-ccb8-452b-8eac-40bf61794c05','c70b429a-3ca4-4740-87d3-fc2ba015635c');

UPDATE muscle_load_logs SET muscle_id = '98497c5e-d2c6-43b6-a439-728bea3186f6'
WHERE muscle_id IN ('1289c155-3f2d-4426-8a1a-eb4838f6a30c','d798441d-ccb8-452b-8eac-40bf61794c05','c70b429a-3ca4-4740-87d3-fc2ba015635c');

DELETE FROM muscle_groups WHERE id IN ('1289c155-3f2d-4426-8a1a-eb4838f6a30c','d798441d-ccb8-452b-8eac-40bf61794c05','c70b429a-3ca4-4740-87d3-fc2ba015635c');

UPDATE muscle_groups SET name = 'Cuádriceps' WHERE id = '98497c5e-d2c6-43b6-a439-728bea3186f6';

-- 2. Oblicuo: keep Externo as canonical, rename, reassign Interno
UPDATE exercise_catalog SET primary_muscle_id = '18b4ca5c-ec29-4a91-bbc3-d1c1e9f0361e'
WHERE primary_muscle_id = 'e89aecd8-8363-4916-bcd7-aee587ef2577';

UPDATE muscle_fatigue_states SET muscle_id = '18b4ca5c-ec29-4a91-bbc3-d1c1e9f0361e'
WHERE muscle_id = 'e89aecd8-8363-4916-bcd7-aee587ef2577';

UPDATE muscle_load_logs SET muscle_id = '18b4ca5c-ec29-4a91-bbc3-d1c1e9f0361e'
WHERE muscle_id = 'e89aecd8-8363-4916-bcd7-aee587ef2577';

DELETE FROM muscle_groups WHERE id = 'e89aecd8-8363-4916-bcd7-aee587ef2577';

UPDATE muscle_groups SET name = 'Oblicuo' WHERE id = '18b4ca5c-ec29-4a91-bbc3-d1c1e9f0361e';

-- 3. Recto Abdominal → Abdomen
UPDATE muscle_groups SET name = 'Abdomen' WHERE id = 'fb13aca1-7243-487d-84aa-3b6ddf9363a8';

-- 4. Delete Glúteo Menor (reassign to Glúteo Mayor)
UPDATE exercise_catalog SET primary_muscle_id = 'a9dc9a28-143e-4716-a5f1-979cd07de4b5'
WHERE primary_muscle_id = '60b19de4-5cd9-4963-899b-bd42ba21093f';

UPDATE muscle_fatigue_states SET muscle_id = 'a9dc9a28-143e-4716-a5f1-979cd07de4b5'
WHERE muscle_id = '60b19de4-5cd9-4963-899b-bd42ba21093f';

UPDATE muscle_load_logs SET muscle_id = 'a9dc9a28-143e-4716-a5f1-979cd07de4b5'
WHERE muscle_id = '60b19de4-5cd9-4963-899b-bd42ba21093f';

DELETE FROM muscle_groups WHERE id = '60b19de4-5cd9-4963-899b-bd42ba21093f';

-- 5. Isquiotibiales: keep Bíceps Femoral as canonical, rename, reassign others
UPDATE exercise_catalog SET primary_muscle_id = 'f75fa297-0990-49b8-b03a-3777d75b5f4b'
WHERE primary_muscle_id IN ('d2a47b25-8d0a-4312-85b1-136b9703d1b4','d32d037a-a9d0-43ba-a751-f4f3cbec1a87');

UPDATE muscle_fatigue_states SET muscle_id = 'f75fa297-0990-49b8-b03a-3777d75b5f4b'
WHERE muscle_id IN ('d2a47b25-8d0a-4312-85b1-136b9703d1b4','d32d037a-a9d0-43ba-a751-f4f3cbec1a87');

UPDATE muscle_load_logs SET muscle_id = 'f75fa297-0990-49b8-b03a-3777d75b5f4b'
WHERE muscle_id IN ('d2a47b25-8d0a-4312-85b1-136b9703d1b4','d32d037a-a9d0-43ba-a751-f4f3cbec1a87');

DELETE FROM muscle_groups WHERE id IN ('d2a47b25-8d0a-4312-85b1-136b9703d1b4','d32d037a-a9d0-43ba-a751-f4f3cbec1a87');

UPDATE muscle_groups SET name = 'Isquiotibiales' WHERE id = 'f75fa297-0990-49b8-b03a-3777d75b5f4b';

-- 6. Delete Romboides (reassign to Trapecio Medio)
UPDATE exercise_catalog SET primary_muscle_id = '15a91e88-4509-4a51-ad61-8c8a763f26b9'
WHERE primary_muscle_id = '1ab0e08d-3b7e-42e1-b4f0-9fdacf706b57';

UPDATE muscle_fatigue_states SET muscle_id = '15a91e88-4509-4a51-ad61-8c8a763f26b9'
WHERE muscle_id = '1ab0e08d-3b7e-42e1-b4f0-9fdacf706b57';

UPDATE muscle_load_logs SET muscle_id = '15a91e88-4509-4a51-ad61-8c8a763f26b9'
WHERE muscle_id = '1ab0e08d-3b7e-42e1-b4f0-9fdacf706b57';

DELETE FROM muscle_groups WHERE id = '1ab0e08d-3b7e-42e1-b4f0-9fdacf706b57';

-- 7. Merge Transverso Abdominal into Abdomen
UPDATE exercise_catalog SET primary_muscle_id = 'fb13aca1-7243-487d-84aa-3b6ddf9363a8'
WHERE primary_muscle_id = 'bcad3362-6a46-4dba-8c4a-0132134e376e';

UPDATE muscle_fatigue_states SET muscle_id = 'fb13aca1-7243-487d-84aa-3b6ddf9363a8'
WHERE muscle_id = 'bcad3362-6a46-4dba-8c4a-0132134e376e';

UPDATE muscle_load_logs SET muscle_id = 'fb13aca1-7243-487d-84aa-3b6ddf9363a8'
WHERE muscle_id = 'bcad3362-6a46-4dba-8c4a-0132134e376e';

DELETE FROM muscle_groups WHERE id = 'bcad3362-6a46-4dba-8c4a-0132134e376e';
