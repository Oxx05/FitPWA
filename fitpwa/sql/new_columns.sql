-- Criar coluna name_pt para armazenar nomes em português
ALTER TABLE "public"."exercises" 
ADD COLUMN IF NOT EXISTS "name_pt" text;

-- Salvar os nomes atuais no name_pt caso ainda estejam nulos
UPDATE "public"."exercises" SET "name_pt" = "name" WHERE "name_pt" IS NULL;

-- Peito
UPDATE "public"."exercises" SET "name" = 'Bench Press', "name_pt" = 'Supino (Barra)' WHERE "name" = 'Supino (Barbell)';
UPDATE "public"."exercises" SET "name" = 'Incline Bench Press', "name_pt" = 'Supino Inclinado' WHERE "name" = 'Supino Inclinado';
UPDATE "public"."exercises" SET "name" = 'Dumbbell Press', "name_pt" = 'Supino com Halteres' WHERE "name" = 'Supino com Halteres';
UPDATE "public"."exercises" SET "name" = 'Cable Fly', "name_pt" = 'Pec Deck / Voos no Cabo' WHERE "name" = 'Pec Deck / Fly (Cable)';
UPDATE "public"."exercises" SET "name" = 'Dumbbell Fly', "name_pt" = 'Voos com Halteres' WHERE "name" = 'Dumbbell Fly';
UPDATE "public"."exercises" SET "name" = 'Decline Bench Press', "name_pt" = 'Supino Declinado' WHERE "name" = 'Supino Declinado';
UPDATE "public"."exercises" SET "name" = 'Incline Dumbbell Press', "name_pt" = 'Supino Inclinado c/ Halteres' WHERE "name" = 'Supino Inclinado com Halteres';
UPDATE "public"."exercises" SET "name" = 'Machine Chest Press', "name_pt" = 'Máquina Supino Peito' WHERE "name" = 'Chest Press (Máquina)';
UPDATE "public"."exercises" SET "name" = 'Cable Crossover', "name_pt" = 'Crossover no Cabo' WHERE "name" = 'Crossover no Cabo';
UPDATE "public"."exercises" SET "name" = 'Chest Dip', "name_pt" = 'Mergulho para Peito' WHERE "name" = 'Mergulho para Peito';
UPDATE "public"."exercises" SET "name" = 'Smith Machine Bench', "name_pt" = 'Supino na Smith' WHERE "name" = 'Supino no Smith';
UPDATE "public"."exercises" SET "name" = 'Floor Press', "name_pt" = 'Supino no Chão' WHERE "name" = 'Supino no Chão';
UPDATE "public"."exercises" SET "name" = 'Landmine Press', "name_pt" = 'Press Landmine' WHERE "name" = 'Landmine Press';
UPDATE "public"."exercises" SET "name" = 'Push-ups', "name_pt" = 'Flexões' WHERE "name" = 'Flexões (Push-ups)';
UPDATE "public"."exercises" SET "name" = 'Machine Chest Press', "name_pt" = 'Máquina Supino Peito' WHERE "name" = 'Máquina de Supino';
UPDATE "public"."exercises" SET "name" = 'Resistance Band Fly', "name_pt" = 'Voos com Elástico' WHERE "name" = 'Fly com Banda Elástica';

-- Costas
UPDATE "public"."exercises" SET "name" = 'Deadlift', "name_pt" = 'Peso Morto' WHERE "name" = 'Levantamento Morto (Deadlift)';
UPDATE "public"."exercises" SET "name" = 'Bent Over Row', "name_pt" = 'Remada Inclinada' WHERE "name" = 'Linha Inclinada (Bent Row)';
UPDATE "public"."exercises" SET "name" = 'Dumbbell Row', "name_pt" = 'Remada com Halteres' WHERE "name" = 'Linha com Halteres';
UPDATE "public"."exercises" SET "name" = 'Pull-ups', "name_pt" = 'Elevações' WHERE "name" = 'Dominadas (Pull-ups)';
UPDATE "public"."exercises" SET "name" = 'Lat Pulldown', "name_pt" = 'Puxada Dorsal' WHERE "name" = 'Puxada Frontal (Lat Pulldown)';
UPDATE "public"."exercises" SET "name" = 'Assisted Pull-up', "name_pt" = 'Elevações Assistidas' WHERE "name" = 'Dominadas Assistidas';
UPDATE "public"."exercises" SET "name" = 'Face Pull', "name_pt" = 'Face Pull' WHERE "name" = 'Face Pull';
UPDATE "public"."exercises" SET "name" = 'Machine Row', "name_pt" = 'Remada na Máquina' WHERE "name" = 'Máquina de Linha';
UPDATE "public"."exercises" SET "name" = 'Seated Cable Row', "name_pt" = 'Remada Sentada no Cabo' WHERE "name" = 'Linha por Cabo';
UPDATE "public"."exercises" SET "name" = 'Seal Row', "name_pt" = 'Seal Row' WHERE "name" = 'Seal Row';
UPDATE "public"."exercises" SET "name" = 'T-Bar Row', "name_pt" = 'Remada T-Bar' WHERE "name" = 'Remada T-Bar';
UPDATE "public"."exercises" SET "name" = 'Chest Supported Row', "name_pt" = 'Remada c/ Apoio no Peito' WHERE "name" = 'Remada Apoiada no Peito';
UPDATE "public"."exercises" SET "name" = 'Single Arm Cable Row', "name_pt" = 'Remada Unilateral no Cabo' WHERE "name" = 'Remada Unilateral no Cabo';
UPDATE "public"."exercises" SET "name" = 'Straight Arm Pulldown', "name_pt" = 'Pulldown Braços Esticados' WHERE "name" = 'Pulldown com Braço Estendido';
UPDATE "public"."exercises" SET "name" = 'Dumbbell Pullover', "name_pt" = 'Pullover com Halter' WHERE "name" = 'Pullover';
UPDATE "public"."exercises" SET "name" = 'Inverted Row', "name_pt" = 'Remada Invertida' WHERE "name" = 'Remada Invertida';
UPDATE "public"."exercises" SET "name" = 'Trap Bar Deadlift', "name_pt" = 'Peso Morto Hex Bar' WHERE "name" = 'Deadlift com Trap Bar';
UPDATE "public"."exercises" SET "name" = 'Neutral Grip Pulldown', "name_pt" = 'Puxada Dorsal Pega Neutra' WHERE "name" = 'Puxada Neutra';
UPDATE "public"."exercises" SET "name" = 'V-Bar Pulldown', "name_pt" = 'Puxada com Pega em V' WHERE "name" = 'Puxada V';
UPDATE "public"."exercises" SET "name" = 'Meadows Row', "name_pt" = 'Meadows Row' WHERE "name" = 'Meadows Row';
UPDATE "public"."exercises" SET "name" = 'Reverse Pec Deck', "name_pt" = 'Pec Deck Invertido' WHERE "name" = 'Reverse Fly (Máquina)';
UPDATE "public"."exercises" SET "name" = 'Back Extension', "name_pt" = 'Extensão Lombar' WHERE "name" = 'Extensão Lombar';

-- Ombros
UPDATE "public"."exercises" SET "name" = 'Military Press', "name_pt" = 'Press Militar (Barra)' WHERE "name" = 'Press Militar (Military Press)';
UPDATE "public"."exercises" SET "name" = 'Shoulder Press', "name_pt" = 'Shoulder Press' WHERE "name" = 'Desenvolvimento de Ombro';
UPDATE "public"."exercises" SET "name" = 'Lateral Raise', "name_pt" = 'Elevação Lateral' WHERE "name" = 'Elevação Lateral';
UPDATE "public"."exercises" SET "name" = 'Front Raise', "name_pt" = 'Elevação Frontal' WHERE "name" = 'Elevação Frontal';
UPDATE "public"."exercises" SET "name" = 'Rear Delt Fly', "name_pt" = 'Voos Posteriores' WHERE "name" = 'Fly Posterior';
UPDATE "public"."exercises" SET "name" = 'Machine Shoulder Press', "name_pt" = 'Press Ombros Máquina' WHERE "name" = 'Máquina de Ombro';
UPDATE "public"."exercises" SET "name" = 'Upright Row', "name_pt" = 'Remada Alta' WHERE "name" = 'Linha Alta (Upright Row)';
UPDATE "public"."exercises" SET "name" = 'Shrug', "name_pt" = 'Encolhimentos' WHERE "name" = 'Encolhimento de Ombros (Shrug)';
UPDATE "public"."exercises" SET "name" = 'Arnold Press', "name_pt" = 'Arnold Press' WHERE "name" = 'Arnold Press';
UPDATE "public"."exercises" SET "name" = 'Cable Lateral Raise', "name_pt" = 'Elevação Lateral no Cabo' WHERE "name" = 'Elevação Lateral no Cabo';
UPDATE "public"."exercises" SET "name" = 'Cable Rear Delt Fly', "name_pt" = 'Voos Posteriores no Cabo' WHERE "name" = 'Posterior no Cabo';
UPDATE "public"."exercises" SET "name" = 'Cuban Press', "name_pt" = 'Cuban Press' WHERE "name" = 'Cuban Press';
UPDATE "public"."exercises" SET "name" = 'Y-Raise', "name_pt" = 'Elevação Y' WHERE "name" = 'Elevação Y';

-- Bíceps
UPDATE "public"."exercises" SET "name" = 'Barbell Curl', "name_pt" = 'Curl de Bíceps com Barra' WHERE "name" = 'Rosca Barbell';
UPDATE "public"."exercises" SET "name" = 'Dumbbell Curl', "name_pt" = 'Curl de Bíceps com Halteres' WHERE "name" = 'Rosca com Halteres';
UPDATE "public"."exercises" SET "name" = 'Cable Curl', "name_pt" = 'Curl de Bíceps no Cabo' WHERE "name" = 'Rosca por Cabo';
UPDATE "public"."exercises" SET "name" = 'Hammer Curl', "name_pt" = 'Curl Martelo' WHERE "name" = 'Rosca Martelo';
UPDATE "public"."exercises" SET "name" = 'Preacher Curl', "name_pt" = 'Banco Scott (Preacher)' WHERE "name" = 'Rosca Barbell Inclinada';
UPDATE "public"."exercises" SET "name" = 'Machine Bicep Curl', "name_pt" = 'Máquina Curl Bíceps' WHERE "name" = 'Máquina de Rosca';
UPDATE "public"."exercises" SET "name" = 'Concentration Curl', "name_pt" = 'Curl de Concentração' WHERE "name" = 'Rosca de Concentração';
UPDATE "public"."exercises" SET "name" = 'Incline Dumbbell Curl', "name_pt" = 'Curl Inclinado de Bíceps' WHERE "name" = 'Rosca Inclinado com Halteres';
UPDATE "public"."exercises" SET "name" = 'Spider Curl', "name_pt" = 'Spider Curl' WHERE "name" = 'Rosca Spider';
UPDATE "public"."exercises" SET "name" = 'EZ Bar Curl', "name_pt" = 'Curl c/ Barra EZ' WHERE "name" = 'Rosca EZ';
UPDATE "public"."exercises" SET "name" = 'Reverse Curl', "name_pt" = 'Curl Invertido' WHERE "name" = 'Rosca Reversa';
UPDATE "public"."exercises" SET "name" = 'Cable Hammer Curl', "name_pt" = 'Curto Martelo no Cabo' WHERE "name" = 'Rosca Martelo no Cabo';

-- Tríceps
UPDATE "public"."exercises" SET "name" = 'Tricep Dip', "name_pt" = 'Fundos no Paralelo' WHERE "name" = 'Mergulho de Tríceps';
UPDATE "public"."exercises" SET "name" = 'Tricep Extension', "name_pt" = 'Extensão de Tríceps' WHERE "name" = 'Extensão de Tríceps (Overhead)';
UPDATE "public"."exercises" SET "name" = 'Tricep Rope Pushdown', "name_pt" = 'Pushdown Tríceps (Corda)' WHERE "name" = 'Push Down com Corda';
UPDATE "public"."exercises" SET "name" = 'Tricep Pushdown', "name_pt" = 'Pushdown Tríceps (Barra)' WHERE "name" = 'Push Down de Tríceps';
UPDATE "public"."exercises" SET "name" = 'Overhead Extension', "name_pt" = 'Extensão Aérea Tríceps' WHERE "name" = 'Extensão Aérea';
UPDATE "public"."exercises" SET "name" = 'Skull Crusher', "name_pt" = 'Quebra-crânios / Testa' WHERE "name" = 'Skull Crusher';
UPDATE "public"."exercises" SET "name" = 'Machine Tricep Extension', "name_pt" = 'Máquina de Tríceps' WHERE "name" = 'Máquina de Tríceps';
UPDATE "public"."exercises" SET "name" = 'Close Grip Bench Press', "name_pt" = 'Supino Pegada Junta' WHERE "name" = 'Supino com Grip Fechado';
UPDATE "public"."exercises" SET "name" = 'Bench Dips', "name_pt" = 'Fundos no Banco' WHERE "name" = 'Dips no Banco';
UPDATE "public"."exercises" SET "name" = 'Cable Overhead Extension', "name_pt" = 'Extensão Aérea no Cabo' WHERE "name" = 'Extensão no Cabo com Corda';
UPDATE "public"."exercises" SET "name" = 'Diamond Push-up', "name_pt" = 'Flexões Diamante' WHERE "name" = 'Flexões Diamante';
UPDATE "public"."exercises" SET "name" = 'Single Arm Pushdown', "name_pt" = 'Pushdown Unilateral' WHERE "name" = 'Pushdown Unilateral';
UPDATE "public"."exercises" SET "name" = 'Assisted Dip', "name_pt" = 'Fundos Assistidos' WHERE "name" = 'Dip Assistido';

-- Antebraço
UPDATE "public"."exercises" SET "name" = 'Wrist Curl', "name_pt" = 'Flexão de Pulso' WHERE "name" = 'Flexão de Pulso';
UPDATE "public"."exercises" SET "name" = 'Reverse Wrist Curl', "name_pt" = 'Extensão de Pulso' WHERE "name" = 'Flexão Reversa de Pulso';
UPDATE "public"."exercises" SET "name" = 'Farmer''s Walk', "name_pt" = 'Passo de Fazendeiro' WHERE "name" = 'Andar do Fazendeiro';
UPDATE "public"."exercises" SET "name" = 'Wrist Roller', "name_pt" = 'Rolo de Pulso' WHERE "name" = 'Wrist Roller';

-- Pernas
UPDATE "public"."exercises" SET "name" = 'Squat', "name_pt" = 'Agachamento' WHERE "name" = 'Agachamento (Back Squat)';
UPDATE "public"."exercises" SET "name" = 'Front Squat', "name_pt" = 'Agachamento Frontal' WHERE "name" = 'Agachamento Frontal';
UPDATE "public"."exercises" SET "name" = 'Goblet Squat', "name_pt" = 'Agachamento Goblet' WHERE "name" = 'Agachamento com Halter';
UPDATE "public"."exercises" SET "name" = 'Leg Press', "name_pt" = 'Prensa de Pernas (Leg Press)' WHERE "name" = 'Leg Press';
UPDATE "public"."exercises" SET "name" = 'Hack Squat', "name_pt" = 'Hack Squat' WHERE "name" = 'Hack Squat';
UPDATE "public"."exercises" SET "name" = 'Smith Machine Squat', "name_pt" = 'Agachamento na Smith' WHERE "name" = 'Agachamento Smith';
UPDATE "public"."exercises" SET "name" = 'Leg Extension', "name_pt" = 'Leg Extension (Cadeira Extensora)' WHERE "name" = 'Extensão de Perna';
UPDATE "public"."exercises" SET "name" = 'Sissy Squat', "name_pt" = 'Sissy Squat' WHERE "name" = 'Sissy Squat';
UPDATE "public"."exercises" SET "name" = 'Bulgarian Split Squat', "name_pt" = 'Agachamento Búlgaro' WHERE "name" = 'Agachamento Búlgaro';
UPDATE "public"."exercises" SET "name" = 'Lunges', "name_pt" = 'Avanços (Lunges)' WHERE "name" = 'Avanço (Lunges)';
UPDATE "public"."exercises" SET "name" = 'Step-up', "name_pt" = 'Subida no Banco (Step-up)' WHERE "name" = 'Step-Up';
UPDATE "public"."exercises" SET "name" = 'Horizontal Leg Press', "name_pt" = 'Leg Press Horizontal' WHERE "name" = 'Leg Press Horizontal';
UPDATE "public"."exercises" SET "name" = 'Belt Squat', "name_pt" = 'Belt Squat' WHERE "name" = 'Belt Squat';
UPDATE "public"."exercises" SET "name" = 'Box Squat', "name_pt" = 'Agachamento com Caixa' WHERE "name" = 'Agachamento ao Banco';

-- Isquiotibiais / Femorais
UPDATE "public"."exercises" SET "name" = 'Leg Curl', "name_pt" = 'Flexão de Perna' WHERE "name" = 'Flexão de Perna';
UPDATE "public"."exercises" SET "name" = 'Lying Leg Curl', "name_pt" = 'Mesa Flexora' WHERE "name" = 'Flexão de Perna Deitado';
UPDATE "public"."exercises" SET "name" = 'Nordic Curl', "name_pt" = 'Nordic Curl' WHERE "name" = 'Nordic Curl';
UPDATE "public"."exercises" SET "name" = 'Glute Ham Raise', "name_pt" = 'Glute Ham Raise (GHR)' WHERE "name" = 'Glute Ham Raise';
UPDATE "public"."exercises" SET "name" = 'Romanian Deadlift', "name_pt" = 'Peso Morto Romeno (RDL)' WHERE "name" = 'Levantamento Morto Romeno';
UPDATE "public"."exercises" SET "name" = 'Stiff-Leg Deadlift', "name_pt" = 'Peso Morto Pernas Esticadas' WHERE "name" = 'Levantamento Morto Rígido';
UPDATE "public"."exercises" SET "name" = 'Seated Leg Curl', "name_pt" = 'Cadeira Flexora' WHERE "name" = 'Flexão de Perna Sentado';
UPDATE "public"."exercises" SET "name" = 'Good Morning', "name_pt" = 'Bons Dias (Good Morning)' WHERE "name" = 'Good Morning';
UPDATE "public"."exercises" SET "name" = 'Single Leg RDL', "name_pt" = 'RDL Unilateral' WHERE "name" = 'RDL Unilateral';
UPDATE "public"."exercises" SET "name" = 'Kettlebell Deadlift', "name_pt" = 'Peso Morto c/ Kettlebell' WHERE "name" = 'Deadlift com Kettlebell';

-- Glúteos
UPDATE "public"."exercises" SET "name" = 'Hip Thrust', "name_pt" = 'Elevação Pélvica' WHERE "name" = 'Hip Thrust';
UPDATE "public"."exercises" SET "name" = 'Glute Bridge', "name_pt" = 'Ponte de Glúteos' WHERE "name" = 'Ponte de Glúteos';
UPDATE "public"."exercises" SET "name" = 'Cable Kickback', "name_pt" = 'Coice no Cabo' WHERE "name" = 'Chute Traseiro (Cable)';
UPDATE "public"."exercises" SET "name" = 'Adductor Machine', "name_pt" = 'Máquina Adutora' WHERE "name" = 'Máquina Adutora';
UPDATE "public"."exercises" SET "name" = 'Abductor Machine', "name_pt" = 'Máquina Abdutora' WHERE "name" = 'Máquina Abdutora';
UPDATE "public"."exercises" SET "name" = 'Pendulum Squat', "name_pt" = 'Pendulum Squat' WHERE "name" = 'Agachamento Pêndulo';
UPDATE "public"."exercises" SET "name" = 'Banded Hip Abduction', "name_pt" = 'Abdução de Anca com Elástico' WHERE "name" = 'Abdução com Banda';
UPDATE "public"."exercises" SET "name" = 'Cable Hip Abduction', "name_pt" = 'Abdução de Anca no Cabo' WHERE "name" = 'Abdução no Cabo';
UPDATE "public"."exercises" SET "name" = 'Frog Pumps', "name_pt" = 'Bombas Sapo (Frog Pumps)' WHERE "name" = 'Frog Pumps';

-- Core / Abs
UPDATE "public"."exercises" SET "name" = 'Crunch', "name_pt" = 'Abdominais Crumb' WHERE "name" = 'Abdominais (Crunch)';
UPDATE "public"."exercises" SET "name" = 'Ab Wheel', "name_pt" = 'Roda Abdominal' WHERE "name" = 'Ab Wheel';
UPDATE "public"."exercises" SET "name" = 'Cable Crunch', "name_pt" = 'Abdominais no Cabo' WHERE "name" = 'Abdominais por Cabo';
UPDATE "public"."exercises" SET "name" = 'Cable Woodchop', "name_pt" = 'Lenhador no Cabo' WHERE "name" = 'Movimento de Lenhador';
UPDATE "public"."exercises" SET "name" = 'Hanging Leg Raise', "name_pt" = 'Elevação de Pernas em Suspensão' WHERE "name" = 'Elevação de Perna Suspensa';
UPDATE "public"."exercises" SET "name" = 'Abdominal Machine', "name_pt" = 'Máquina de Abdominais' WHERE "name" = 'Máquina de Abdominais';
UPDATE "public"."exercises" SET "name" = 'Plank', "name_pt" = 'Prancha' WHERE "name" = 'Prancha (Plank)';
UPDATE "public"."exercises" SET "name" = 'Dead Bug', "name_pt" = 'Bicho Morto' WHERE "name" = 'Dead Bug';
UPDATE "public"."exercises" SET "name" = 'Pallof Press', "name_pt" = 'Pallof Press' WHERE "name" = 'Pallof Press';
UPDATE "public"."exercises" SET "name" = 'Russian Twist', "name_pt" = 'Russian Twist' WHERE "name" = 'Russian Twist';
UPDATE "public"."exercises" SET "name" = 'Side Plank', "name_pt" = 'Prancha Lateral' WHERE "name" = 'Prancha Lateral';
UPDATE "public"."exercises" SET "name" = 'Hanging Knee Raise', "name_pt" = 'Elevação de Joelhos em Suspensão' WHERE "name" = 'Elevação de Joelhos Suspensa';
UPDATE "public"."exercises" SET "name" = 'Reverse Crunch', "name_pt" = 'Abdominais Reverso' WHERE "name" = 'Crunch Reverso';
UPDATE "public"."exercises" SET "name" = 'Hollow Hold', "name_pt" = 'Canoa (Hollow Hold)' WHERE "name" = 'Hollow Hold';
UPDATE "public"."exercises" SET "name" = 'Cable Side Bend', "name_pt" = 'Flexão Lateral no Cabo' WHERE "name" = 'Flexão Lateral no Cabo';

-- Cardio
UPDATE "public"."exercises" SET "name" = 'Treadmill', "name_pt" = 'Passadeira' WHERE "name" = 'Esteira (Treadmill)';
UPDATE "public"."exercises" SET "name" = 'Stationary Bike', "name_pt" = 'Bicicleta Estática' WHERE "name" = 'Bicicleta Estática';
UPDATE "public"."exercises" SET "name" = 'Rowing Machine', "name_pt" = 'Máquina de Remo' WHERE "name" = 'Máquina de Remo';
UPDATE "public"."exercises" SET "name" = 'Elliptical', "name_pt" = 'Elíptica' WHERE "name" = 'Elíptica';
UPDATE "public"."exercises" SET "name" = 'Jump Rope', "name_pt" = 'Saltar à Corda' WHERE "name" = 'Corda de Pular';
UPDATE "public"."exercises" SET "name" = 'Battle Ropes', "name_pt" = 'Cordas de Batalha' WHERE "name" = 'Battle Ropes';
UPDATE "public"."exercises" SET "name" = 'Burpees', "name_pt" = 'Burpees' WHERE "name" = 'Burpees';
UPDATE "public"."exercises" SET "name" = 'Box Jump', "name_pt" = 'Salto à Caixa' WHERE "name" = 'Salto para Caixa';
UPDATE "public"."exercises" SET "name" = 'Sprints', "name_pt" = 'Sprints' WHERE "name" = 'Sprints';
UPDATE "public"."exercises" SET "name" = 'Stair Climber', "name_pt" = 'Simulador de Escadas' WHERE "name" = 'Escadas (Stair Climber)';
UPDATE "public"."exercises" SET "name" = 'Assault Bike', "name_pt" = 'Air Bike' WHERE "name" = 'Air Bike';
UPDATE "public"."exercises" SET "name" = 'SkiErg', "name_pt" = 'SkiErg' WHERE "name" = 'SkiErg';

-- Movimentos Complexos
UPDATE "public"."exercises" SET "name" = 'Kettlebell Swing', "name_pt" = 'Balanço de Kettlebell' WHERE "name" = 'Kettlebell Swing';
UPDATE "public"."exercises" SET "name" = 'Tire Flip', "name_pt" = 'Virar Pneu' WHERE "name" = 'Tire Flip';
UPDATE "public"."exercises" SET "name" = 'Sled Push', "name_pt" = 'Empurre de Trenó' WHERE "name" = 'Empurrão de Trenó';
UPDATE "public"."exercises" SET "name" = 'Sled Drag', "name_pt" = 'Arrasto de Trenó' WHERE "name" = 'Arrasto de Trenó';
UPDATE "public"."exercises" SET "name" = 'Power Clean', "name_pt" = 'Arranque (Power Clean)' WHERE "name" = 'Power Clean';
UPDATE "public"."exercises" SET "name" = 'Thrusters', "name_pt" = 'Thrusters' WHERE "name" = 'Thrusters';
UPDATE "public"."exercises" SET "name" = 'Turkish Get-up', "name_pt" = 'Levantamento Turco' WHERE "name" = 'Turkish Get-up';

-- Panturrilhas
UPDATE "public"."exercises" SET "name" = 'Standing Calf Raise', "name_pt" = 'Gémeos em Pé' WHERE "name" = 'Elevação de Gémeos em Pé';
UPDATE "public"."exercises" SET "name" = 'Seated Calf Raise', "name_pt" = 'Gémeos Sentado' WHERE "name" = 'Elevação de Gémeos Sentado';
UPDATE "public"."exercises" SET "name" = 'Donkey Calf Raise', "name_pt" = 'Gémeos Donkey' WHERE "name" = 'Elevação de Gémeos Donkey';
UPDATE "public"."exercises" SET "name" = 'Single Leg Calf Raise', "name_pt" = 'Gémeos Unilateral' WHERE "name" = 'Elevação de Gémeos Unilateral';

-- Criar colunas para tradução de planos de sistema
ALTER TABLE "public"."workout_plans" 
ADD COLUMN IF NOT EXISTS "name_pt" text,
ADD COLUMN IF NOT EXISTS "description_pt" text;

UPDATE "public"."workout_plans" SET "name_pt" = "name" WHERE "name_pt" IS NULL;
