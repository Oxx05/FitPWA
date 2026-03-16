-- Seed exercises básicos para a aplicação
INSERT INTO exercises (id, name, name_pt, muscle_groups, secondary_muscles, equipment, difficulty, instructions, tips, video_url, is_custom, created_by, is_premium)
VALUES
-- Perna
(gen_random_uuid(), 'Barbell Squat', 'Agachamento com Barra', '{perna, glúteos}', '{costas_inferior}', '{barbell, rack}', 3, 'Coloca a barra nos ombros, abaixe o glúteo para trás mantendo o peito elevado', 'Manter joelhos alinhados com os artelhos', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Leg Press', 'Leg Press 45°', '{perna, glúteos}', '{~}', '{machine}', 1, 'Senta-te na máquina e impulsiona com as pernas', 'Máquina segura para iniciantes', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Leg Curl', 'Leg Curl (sentado)', '{isquiotibiais}', '{~}', '{machine}', 1, 'Senta-te e curva as pernas contra a resistência', 'Isolamento puro para posteriores', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Leg Extension', 'Leg Extension', '{quadríceps}', '{~}', '{machine}', 1, 'Estende as pernas contra a resistência', 'Ótimo para isolamento de quad', 'https://example.com', false, NULL, false),

-- Peito
(gen_random_uuid(), 'Barbell Bench Press', 'Supino com Barra', '{peito}', '{tríceps, ombro_anterior}', '{barbell, bench}', 2, 'Deita-te no banco, baixa a barra até ao peito, impulsiona para cima', 'Exercício clássico fundamental', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Incline Bench Press', 'Supino Inclinado', '{peito_superior}', '{ombro_anterior}', '{barbell, bench}', 2, 'Supino com banco inclinado 30-45 graus', 'Ênfase no peito superior', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Dumbbell Bench Press', 'Supino com Halteres', '{peito}', '{tríceps, ombro_anterior}', '{dumbbells, bench}', 2, 'Supino com halteres em vez de barra', 'Maior amplitude de movimento', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Pec Deck', 'Pec Deck / Fly na Máquina', '{peito}', '{~}', '{machine}', 1, 'Máquina de fly para isolamento puro', 'Isolamento seguro e eficiente', 'https://example.com', false, NULL, false),

-- Costas
(gen_random_uuid(), 'Barbell Bent Over Row', 'Linha Curvada (Barbell Row)', '{costas}', '{bíceps}', '{barbell}', 2, 'Dobra na cintura e puxa a barra em direção ao abdómen', 'Exercício composto essencial', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Dumbbell Row', 'Remada com Halteres', '{costas}', '{bíceps}', '{dumbbells, bench}', 2, 'Remada unilateral com haltere', 'Treina cada lado independentemente', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Lat Pulldown', 'Lat Pulldown (Puxada Alta)', '{costas}', '{bíceps}', '{machine, cable}', 1, 'Puxa o cabo de cima para baixo até ao peito', 'Máquina acessível para iniciantes', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Face Pull', 'Face Pull', '{ombro_posterior}', '{costas}', '{cable}', 1, 'Puxa o cabo em direção à face', 'Excelente para saúde do ombro', 'https://example.com', false, NULL, false),

-- Ombros
(gen_random_uuid(), 'Overhead Press', 'Militar Press (Standing Press)', '{ombro_anterior}', '{ombro_lateral, tríceps}', '{barbell, dumbbells}', 3, 'De pé ou sentado, impulsiona peso acima da cabeça', 'Exercício clássico composto', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Lateral Raise', 'Elevação Lateral', '{ombro_lateral}', '{~}', '{dumbbells, cable}', 1, 'Levanta os halteres lateralmente até à altura do ombro', 'Isolamento para ombro lateral', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Reverse Pec Deck', 'Reverse Pec Deck', '{ombro_posterior}', '{~}', '{machine}', 1, 'Máquina de fly ao contrário para ombro posterior', 'Isolamento posterior crucial', 'https://example.com', false, NULL, false),

-- Braços
(gen_random_uuid(), 'Barbell Curl', 'Rosca Direta (Barbell Curl)', '{bíceps}', '{~}', '{barbell}', 1, 'Em pé, curva os braços trazendo a barra ao queixo', 'Exercício principal para bíceps', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Dumbbell Curl', 'Rosca Halteres', '{bíceps}', '{~}', '{dumbbells}', 1, 'Rosca com halteres', 'Variação clássica e versátil', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Rope Pushdown', 'Tricep Pushdown (Corda)', '{tríceps}', '{~}', '{cable}', 1, 'Puxa a corda para baixo contra resistência', 'Isolamento eficivo para tríceps', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Overhead Tricep Extension', 'Extensão Aérea', '{tríceps}', '{~}', '{dumbbells, cable}', 1, 'Extensão do braço acima da cabeça', 'Isolamento completo de tríceps', 'https://example.com', false, NULL, false),

-- Compostos/Núcleo
(gen_random_uuid(), 'Deadlift', 'Levantamento Terra', '{costas_inferior, glúteos}', '{isquiotibiais, perna}', '{barbell}', 5, 'Levanta a barra do chão até à altura da cintura', 'Exercício mais completo do corpo', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Plank', 'Prancha', '{abdominais}', '{~}', '{}', 1, 'Posição de estática mantendo o corpo reto', 'Exercício isométrico excelente', 'https://example.com', false, NULL, false),
(gen_random_uuid(), 'Crunch', 'Crunch', '{abdominais}', '{~}', '{}', 1, 'Levanta o tronco contra a contração abdominal', 'Isolamento básico de abs', 'https://example.com', false, NULL, false);
