-- Curated exercise seed — run once in Supabase SQL Editor
-- Step 1: delete all non-custom exercises not in the curated list (keeps user-created exercises intact)
-- Step 2: upsert curated list by name_pt (safe to re-run)

DELETE FROM exercises
WHERE (is_custom = false OR is_custom IS NULL)
  AND id NOT IN (SELECT DISTINCT exercise_id FROM plan_exercises WHERE exercise_id IS NOT NULL)
  AND name_pt NOT IN (
    'Bench Press','Supino Inclinado','Supino Declinado','Crucifixo','Crossover','Flexões','Mergulhos',
    'Barra Fixa','Chin-up','Puxada à Frente','Remada Sentado','Remada Curvada','Remada com Haltere','Remada T',
    'Levantamento Terra','Stiff','Face Pull','Hiperextensão',
    'Press Militar','Press com Halteres','Elevação Lateral','Elevação Frontal','Crucifixo Invertido','Arnold Press','Remada Alta',
    'Rosca Direta','Rosca Martelo','Rosca Scott','Rosca Inclinada','Rosca na Polia','Rosca Concentrada',
    'Extensão na Polia','Rosca Testa','Extensão Francesa','Tricep Dips','Supino Fechado','Kickback',
    'Agachamento','Agachamento Frontal','Leg Press','Hack Squat','Cadeira Extensora','Mesa Flexora','Passadas',
    'Agachamento Búlgaro','Levantamento Terra Sumo','Hip Thrust','Glute Bridge',
    'Elevação de Panturrilha','Gémeos Sentado',
    'Crunch','Prancha','Elevação de Pernas','Russian Twist','Crunch na Polia','Elevação de Pernas na Barra','Roda Abdominal','Mountain Climber',
    'Encolhimento de Ombros','Encolhimento com Halteres',
    'Rosca de Pulso','Farmer''s Walk'
  );

INSERT INTO exercises (name, name_pt, muscle_groups, secondary_muscles, equipment, difficulty, is_custom)
VALUES
  -- Peito
  ('Bench Press',              'Bench Press',                        ARRAY['chest'],       ARRAY['triceps','shoulders'],          ARRAY['barbell'],     3, false),
  ('Incline Bench Press',      'Supino Inclinado',                   ARRAY['chest'],       ARRAY['triceps','shoulders'],          ARRAY['barbell'],     3, false),
  ('Decline Bench Press',      'Supino Declinado',                   ARRAY['chest'],       ARRAY['triceps'],                      ARRAY['barbell'],     3, false),
  ('Dumbbell Fly',             'Crucifixo',                          ARRAY['chest'],       ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  ('Cable Crossover',          'Crossover',                          ARRAY['chest'],       ARRAY[]::text[],                       ARRAY['cable'],       2, false),
  ('Push-up',                  'Flexões',                            ARRAY['chest'],       ARRAY['triceps','shoulders'],          ARRAY['body weight'], 2, false),
  ('Dips',                     'Mergulhos',                          ARRAY['chest'],       ARRAY['triceps'],                      ARRAY['body weight'], 3, false),
  -- Costas
  ('Pull-up',                  'Barra Fixa',                         ARRAY['lats'],        ARRAY['biceps','traps'],               ARRAY['body weight'], 4, false),
  ('Chin-up',                  'Chin-up',                            ARRAY['lats'],        ARRAY['biceps'],                       ARRAY['body weight'], 3, false),
  ('Lat Pulldown',             'Puxada à Frente',                    ARRAY['lats'],        ARRAY['biceps'],                       ARRAY['cable'],       2, false),
  ('Seated Cable Row',         'Remada Sentado',                     ARRAY['back'],        ARRAY['biceps'],                       ARRAY['cable'],       2, false),
  ('Bent-over Barbell Row',    'Remada Curvada',                     ARRAY['back'],        ARRAY['biceps','traps'],               ARRAY['barbell'],     4, false),
  ('Dumbbell Row',             'Remada com Haltere',                 ARRAY['back'],        ARRAY['biceps'],                       ARRAY['dumbbell'],    2, false),
  ('T-Bar Row',                'Remada T',                           ARRAY['back'],        ARRAY['biceps','traps'],               ARRAY['barbell'],     3, false),
  ('Deadlift',                 'Levantamento Terra',                 ARRAY['back'],        ARRAY['glutes','hamstrings','traps'],  ARRAY['barbell'],     5, false),
  ('Romanian Deadlift',        'Stiff',                              ARRAY['hamstrings'],  ARRAY['glutes','back'],                ARRAY['barbell'],     3, false),
  ('Face Pull',                'Face Pull',                          ARRAY['shoulders'],   ARRAY['traps','back'],                 ARRAY['cable'],       2, false),
  ('Hyperextension',           'Hiperextensão',                      ARRAY['lower back'],  ARRAY['glutes','hamstrings'],          ARRAY['body weight'], 2, false),
  -- Ombros
  ('Overhead Press',           'Press Militar',                      ARRAY['shoulders'],   ARRAY['triceps','traps'],              ARRAY['barbell'],     4, false),
  ('Dumbbell Shoulder Press',  'Press com Halteres',                 ARRAY['shoulders'],   ARRAY['triceps'],                      ARRAY['dumbbell'],    3, false),
  ('Lateral Raise',            'Elevação Lateral',                   ARRAY['shoulders'],   ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  ('Front Raise',              'Elevação Frontal',                   ARRAY['shoulders'],   ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  ('Rear Delt Fly',            'Crucifixo Invertido',                ARRAY['shoulders'],   ARRAY['traps','back'],                 ARRAY['dumbbell'],    2, false),
  ('Arnold Press',             'Arnold Press',                       ARRAY['shoulders'],   ARRAY['triceps'],                      ARRAY['dumbbell'],    3, false),
  ('Upright Row',              'Remada Alta',                        ARRAY['shoulders'],   ARRAY['traps','biceps'],               ARRAY['barbell'],     3, false),
  -- Bíceps
  ('Bicep Curl',               'Rosca Direta',                       ARRAY['biceps'],      ARRAY['forearms'],                     ARRAY['barbell'],     2, false),
  ('Hammer Curl',              'Rosca Martelo',                      ARRAY['biceps'],      ARRAY['forearms'],                     ARRAY['dumbbell'],    2, false),
  ('Preacher Curl',            'Rosca Scott',                        ARRAY['biceps'],      ARRAY[]::text[],                       ARRAY['barbell'],     2, false),
  ('Incline Dumbbell Curl',    'Rosca Inclinada',                    ARRAY['biceps'],      ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  ('Cable Curl',               'Rosca na Polia',                     ARRAY['biceps'],      ARRAY[]::text[],                       ARRAY['cable'],       2, false),
  ('Concentration Curl',       'Rosca Concentrada',                  ARRAY['biceps'],      ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  -- Tríceps
  ('Tricep Pushdown',          'Extensão na Polia',                  ARRAY['triceps'],     ARRAY[]::text[],                       ARRAY['cable'],       2, false),
  ('Skull Crusher',            'Rosca Testa',                        ARRAY['triceps'],     ARRAY[]::text[],                       ARRAY['barbell'],     3, false),
  ('Overhead Tricep Extension','Extensão Francesa',                  ARRAY['triceps'],     ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  ('Tricep Dips',              'Tricep Dips',                        ARRAY['triceps'],     ARRAY['chest'],                        ARRAY['body weight'], 3, false),
  ('Close-Grip Bench Press',   'Supino Fechado',                     ARRAY['triceps'],     ARRAY['chest'],                        ARRAY['barbell'],     3, false),
  ('Kickback',                 'Kickback',                           ARRAY['triceps'],     ARRAY[]::text[],                       ARRAY['dumbbell'],    2, false),
  -- Pernas
  ('Squat',                    'Agachamento',                        ARRAY['quads'],       ARRAY['glutes','hamstrings'],          ARRAY['barbell'],     4, false),
  ('Front Squat',              'Agachamento Frontal',                ARRAY['quads'],       ARRAY['glutes'],                       ARRAY['barbell'],     5, false),
  ('Leg Press',                'Leg Press',                          ARRAY['quads'],       ARRAY['glutes','hamstrings'],          ARRAY['machine'],     2, false),
  ('Hack Squat',               'Hack Squat',                         ARRAY['quads'],       ARRAY['glutes'],                       ARRAY['machine'],     3, false),
  ('Leg Extension',            'Cadeira Extensora',                  ARRAY['quads'],       ARRAY[]::text[],                       ARRAY['machine'],     1, false),
  ('Leg Curl',                 'Mesa Flexora',                       ARRAY['hamstrings'],  ARRAY[]::text[],                       ARRAY['machine'],     1, false),
  ('Lunges',                   'Passadas',                           ARRAY['quads'],       ARRAY['glutes','hamstrings'],          ARRAY['body weight'], 2, false),
  ('Bulgarian Split Squat',    'Agachamento Búlgaro',                ARRAY['quads'],       ARRAY['glutes','hamstrings'],          ARRAY['dumbbell'],    4, false),
  ('Sumo Deadlift',            'Levantamento Terra Sumo',            ARRAY['glutes'],      ARRAY['hamstrings','quads','back'],    ARRAY['barbell'],     4, false),
  ('Hip Thrust',               'Hip Thrust',                         ARRAY['glutes'],      ARRAY['hamstrings'],                   ARRAY['barbell'],     2, false),
  ('Glute Bridge',             'Glute Bridge',                       ARRAY['glutes'],      ARRAY['hamstrings'],                   ARRAY['body weight'], 1, false),
  ('Calf Raise',               'Elevação de Panturrilha',            ARRAY['calves'],      ARRAY[]::text[],                       ARRAY['machine'],     1, false),
  ('Seated Calf Raise',        'Gémeos Sentado',                     ARRAY['calves'],      ARRAY[]::text[],                       ARRAY['machine'],     1, false),
  -- Core
  ('Crunch',                   'Crunch',                             ARRAY['abdominals'],  ARRAY[]::text[],                       ARRAY['body weight'], 1, false),
  ('Plank',                    'Prancha',                            ARRAY['abdominals'],  ARRAY['obliques','shoulders'],         ARRAY['body weight'], 2, false),
  ('Leg Raise',                'Elevação de Pernas',                 ARRAY['abdominals'],  ARRAY[]::text[],                       ARRAY['body weight'], 2, false),
  ('Russian Twist',            'Russian Twist',                      ARRAY['obliques'],    ARRAY['abdominals'],                   ARRAY['body weight'], 2, false),
  ('Cable Crunch',             'Crunch na Polia',                    ARRAY['abdominals'],  ARRAY[]::text[],                       ARRAY['cable'],       2, false),
  ('Hanging Leg Raise',        'Elevação de Pernas na Barra',        ARRAY['abdominals'],  ARRAY['obliques'],                     ARRAY['body weight'], 3, false),
  ('Ab Wheel Rollout',         'Roda Abdominal',                     ARRAY['abdominals'],  ARRAY['back','shoulders'],             ARRAY['other'],       4, false),
  ('Mountain Climber',         'Mountain Climber',                   ARRAY['abdominals'],  ARRAY['shoulders','quads'],            ARRAY['body weight'], 2, false),
  -- Trapézio
  ('Shrugs',                   'Encolhimento de Ombros',             ARRAY['traps'],       ARRAY[]::text[],                       ARRAY['barbell'],     1, false),
  ('Dumbbell Shrugs',          'Encolhimento com Halteres',          ARRAY['traps'],       ARRAY[]::text[],                       ARRAY['dumbbell'],    1, false),
  -- Antebraços
  ('Wrist Curl',               'Rosca de Pulso',                     ARRAY['forearms'],    ARRAY[]::text[],                       ARRAY['barbell'],     1, false),
  ('Farmer''s Walk',           'Farmer''s Walk',                     ARRAY['forearms'],    ARRAY['traps','shoulders'],            ARRAY['dumbbell'],    2, false)

ON CONFLICT (name_pt) DO UPDATE SET
  name             = EXCLUDED.name,
  muscle_groups    = EXCLUDED.muscle_groups,
  secondary_muscles= EXCLUDED.secondary_muscles,
  equipment        = EXCLUDED.equipment,
  difficulty       = EXCLUDED.difficulty,
  is_custom        = false;
