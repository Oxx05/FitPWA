-- Seed exercises básicos para a aplicação
INSERT INTO exercises (id, name, category, muscle_groups, difficulty, description, image_url, video_url)
VALUES
-- Perna
('squat', 'Agachamento com Barra', 'legs', '{perna, glúteos}', 'intermediate', 'Exercício composto para perna inferior', 'https://images.unsplash.com/photo-1541534227411-a320f32b9f50?w=400', 'https://example.com'),
('leg-press', 'Leg Press 45°', 'legs', '{perna, glúteos}', 'beginner', 'Máquina segura para desenvolvimento de pernas', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'https://example.com'),
('leg-curl', 'Leg Curl (sentado)', 'legs', '{isquiotibiais}', 'beginner', 'Isolamento para posteriores coxa', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', 'https://example.com'),
('leg-extension', 'Leg Extension', 'legs', '{quadríceps}', 'beginner', 'Isolamento para quadríceps', 'https://images.unsplash.com/photo-1517836357463-d25ddfcb53ef?w=400', 'https://example.com'),

-- Peito
('bench-press', 'Supino com Barra', 'chest', '{peito, tríceps, ombro_anterior}', 'intermediate', 'Exercício clássico de peito', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400', 'https://example.com'),
('incline-bench', 'Supino Inclinado', 'chest', '{peito_superior, ombro_anterior}', 'intermediate', 'Ênfase no peito superior', 'https://images.unsplash.com/photo-1574680178050-55c6a6be0220?w=400', 'https://example.com'),
('dumbbell-press', 'Supino com Halteres', 'chest', '{peito, tríceps, ombro_anterior}', 'intermediate', 'Variação com maior amplitude de movimento', 'https://images.unsplash.com/photo-1516906736482-18ba36b8d5e8?w=400', 'https://example.com'),
('cable-fly', 'Pec Deck / Fly na Máquina', 'chest', '{peito}', 'beginner', 'Isolamento seguro para peito', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', 'https://example.com'),

-- Costas
('bent-row', 'Linha Curvada (Barbell Row)', 'back', '{costas, bíceps}', 'intermediate', 'Exercício composto para costas', 'https://images.unsplash.com/photo-1541534227411-a320f32b9f50?w=400', 'https://example.com'),
('dumbbell-row', 'Remada com Halteres', 'back', '{costas, bíceps}', 'intermediate', 'Unilateral, maior mobilidade', 'https://images.unsplash.com/photo-1520127562621-d2f6a39c4f0d?w=400', 'https://example.com'),
('pulldown', 'Lat Pulldown (Puxada Alta)', 'back', '{costas, bíceps}', 'beginner', 'Máquina acessível para lats', 'https://images.unsplash.com/photo-1565373880347-60c6f5c5cb39?w=400', 'https://example.com'),
('face-pull', 'Face Pull', 'back', '{ombro_posterior, costas}', 'beginner', 'Excelente para ombro posterior', 'https://images.unsplash.com/photo-1599058917212-d217de713b42?w=400', 'https://example.com'),

-- Ombros
('military-press', 'Militar Press (Standing Press)', 'shoulders', '{ombro_anterior, ombro_lateral, tríceps}', 'intermediate', 'Exercício clássico para ombro', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'https://example.com'),
('lateral-raise', 'Elevação Lateral', 'shoulders', '{ombro_lateral}', 'beginner', 'Isolamento para ombro lateral', 'https://images.unsplash.com/photo-1538805060514-3995066f55cc?w=400', 'https://example.com'),
('rear-delt-fly', 'Reverse Pec Deck', 'shoulders', '{ombro_posterior}', 'beginner', 'Isolamento para ombro posterior', 'https://images.unsplash.com/photo-1516906736482-18ba36b8d5e8?w=400', 'https://example.com'),

-- Braços
('barbell-curl', 'Rosca Direta (Barbell Curl)', 'arms', '{bíceps}', 'beginner', 'Exercício principal para bíceps', 'https://images.unsplash.com/photo-1538805060514-3995066f55cc?w=400', 'https://example.com'),
('dumbbell-curl', 'Rosca Halteres', 'arms', '{bíceps}', 'beginner', 'Variação clássica de rosca', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'https://example.com'),
('tricep-pushdown', 'Tricep Pushdown (Corda)', 'arms', '{tríceps}', 'beginner', 'Isolamento para tríceps', 'https://images.unsplash.com/photo-1541534227411-a320f32b9f50?w=400', 'https://example.com'),
('overhead-extension', 'Extensão Aérea', 'arms', '{tríceps}', 'beginner', 'Extensão para tríceps', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'https://example.com'),

-- Núcleo
('deadlift', 'Levantamento Terra', 'compound', '{costas_inferior, glúteos, isquiotibiais, perna}', 'advanced', 'Exercício composto mais completo', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400', 'https://example.com'),
('plank', 'Prancha', 'core', '{abdominais, núcleo}', 'beginner', 'Exercício de estática para núcleo', 'https://images.unsplash.com/photo-1566241142559-40e1dbb51d75?w=400', 'https://example.com'),
('crunch', 'Crunch', 'core', '{abdominais}', 'beginner', 'Isolamento para abdominais', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', 'https://example.com')
ON CONFLICT (id) DO NOTHING;
