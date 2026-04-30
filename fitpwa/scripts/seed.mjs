/**
 * fitPWA / TitanPulse — DB Seed Script
 * Run: node scripts/seed.mjs
 *
 * What it does:
 *  1. Upserts curated exercises with PT/EN translations
 *  2. Fills in name_pt + description (EN) + description_pt on template workout plans
 *  3. Inserts bilingual weekly challenges (rolling 8-week pool)
 */

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs'

const SUPABASE_URL = 'https://skehofopzhnhzhhqtnam.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWhvZm9wemhuaHpoaHF0bmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYxNTc1MSwiZXhwIjoyMDg5MTkxNzUxfQ.ArRsGlSrO20mFYQHNi_g8mProZxsueCMt8EaPFaOSvs'

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// 1. CURATED EXERCISES
// ─────────────────────────────────────────────────────────────────────────────
const EXERCISES = [
  // Chest
  { name: 'Bench Press',           name_pt: 'Bench Press',            muscle_groups: ['chest'],        secondary_muscles: ['triceps','shoulders'], equipment: ['barbell'],     difficulty: 3, tips: 'Retrai as omoplatas antes de descer a barra. Mantém os pés firmes no chão e os cotovelos a ~75° do torso. / Retract your shoulder blades before lowering. Keep feet flat and elbows ~75° from torso.' },
  { name: 'Incline Bench Press',   name_pt: 'Supino Inclinado',       muscle_groups: ['chest'],        secondary_muscles: ['triceps','shoulders'], equipment: ['barbell'],     difficulty: 3, tips: 'Inclinação ideal entre 30-45°. Desce a barra até à clavícula. Evita arredar os ombros para a frente. / Set bench to 30-45°. Lower bar to upper chest/clavicle. Avoid rolling shoulders forward.' },
  { name: 'Decline Bench Press',   name_pt: 'Supino Declinado',       muscle_groups: ['chest'],        secondary_muscles: ['triceps'],            equipment: ['barbell'],     difficulty: 3, tips: 'Trabalha a porção inferior do peitoral. Desce a barra ao nível dos mamilos. Usa pega ligeiramente mais larga. / Targets lower chest. Lower bar to nipple level. Use a slightly wider grip.' },
  { name: 'Dumbbell Fly',          name_pt: 'Crucifixo',              muscle_groups: ['chest'],        secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Mantém uma ligeira flexão nos cotovelos durante todo o movimento. Sente o alongamento no fundo — não forces além do conforto. / Keep a slight bend in the elbows throughout. Feel the chest stretch at the bottom.' },
  { name: 'Cable Crossover',       name_pt: 'Crossover',              muscle_groups: ['chest'],        secondary_muscles: [],                     equipment: ['cable'],       difficulty: 2, tips: 'Contrai o peitoral no final do movimento cruzando as mãos. Inclina o tronco ligeiramente para a frente. / Squeeze the chest hard at the finish by crossing hands slightly. Lean forward slightly from the hips.' },
  { name: 'Push-up',               name_pt: 'Flexões',                muscle_groups: ['chest'],        secondary_muscles: ['triceps','shoulders'], equipment: ['body weight'], difficulty: 2, tips: 'Corpo em linha reta da cabeça aos calcanhares. Cotovelos a 45° do corpo. Contrai o abdómen durante todo o movimento. / Keep a straight plank position head-to-heel. Elbows at 45° to body.' },
  { name: 'Dips',                  name_pt: 'Mergulhos',              muscle_groups: ['chest'],        secondary_muscles: ['triceps'],            equipment: ['body weight'], difficulty: 3, tips: 'Para trabalhar mais o peitoral inclina o tronco para a frente. Para tríceps mantém o tronco vertical. Desce até os cotovelos ficarem a 90°. / Lean forward to target chest, stay upright for triceps. Lower until elbows reach 90°.' },
  // Back
  { name: 'Pull-up',               name_pt: 'Barra Fixa',             muscle_groups: ['lats'],         secondary_muscles: ['biceps','traps'],     equipment: ['body weight'], difficulty: 4, tips: 'Inicia o movimento deprimindo as omoplatas. Puxa os cotovelos em direção ao chão, não a barra em direção ao peito. / Initiate by depressing your scapulae. Drive elbows down toward the floor, not bar to chest.' },
  { name: 'Chin-up',               name_pt: 'Chin-up',                muscle_groups: ['lats'],         secondary_muscles: ['biceps'],             equipment: ['body weight'], difficulty: 3, tips: 'Pega supinada envolve mais o bíceps. Contrai o bíceps no topo. Desce de forma controlada para o máximo de alongamento. / Supinated grip recruits more biceps. Squeeze at the top. Lower slowly for maximum stretch.' },
  { name: 'Lat Pulldown',          name_pt: 'Puxada à Frente',        muscle_groups: ['lats'],         secondary_muscles: ['biceps'],             equipment: ['cable'],       difficulty: 2, tips: 'Puxa para o peito superior, não para o pescoço. Inclina ligeiramente o tronco para trás. Imagina que estás a "partir a barra ao meio". / Pull to upper chest, not neck. Slight torso lean back. Think of "bending the bar apart".' },
  { name: 'Seated Cable Row',      name_pt: 'Remada Sentado',         muscle_groups: ['back'],         secondary_muscles: ['biceps'],             equipment: ['cable'],       difficulty: 2, tips: 'Puxa o punho em direção ao umbigo. No final aperta as omoplatas como se quisesses esmagar um lápis entre elas. / Pull handle toward your navel. At the finish, squeeze shoulder blades as if crushing a pencil between them.' },
  { name: 'Bent-over Barbell Row', name_pt: 'Remada Curvada',         muscle_groups: ['back'],         secondary_muscles: ['biceps','traps'],     equipment: ['barbell'],     difficulty: 4, tips: 'Tronco quase paralelo ao chão. Puxa a barra para o umbigo, não para o peito. Mantém as costas neutras — sem hiperextensão. / Torso nearly parallel to floor. Pull bar to navel, not chest. Keep spine neutral throughout.' },
  { name: 'Dumbbell Row',          name_pt: 'Remada com Haltere',     muscle_groups: ['back'],         secondary_muscles: ['biceps'],             equipment: ['dumbbell'],    difficulty: 2, tips: 'Apoia o joelho e a mão ipsilateral no banco. Puxa o haltere em direção ao quadril, não ao ombro. / Support same-side knee and hand on bench. Pull dumbbell toward your hip, not your shoulder.' },
  { name: 'T-Bar Row',             name_pt: 'Remada T',               muscle_groups: ['back'],         secondary_muscles: ['biceps','traps'],     equipment: ['barbell'],     difficulty: 3, tips: 'Pega neutra permite mais carga com menos stress nos cotovelos. Puxa com os cotovelos altos para ativar mais o médio das costas. / Neutral grip allows heavier loads with less elbow stress. Pull elbows high to target mid-back.' },
  { name: 'Deadlift',              name_pt: 'Levantamento Terra',     muscle_groups: ['back'],         secondary_muscles: ['glutes','hamstrings','traps'], equipment: ['barbell'], difficulty: 5, tips: 'Barra sobre o metatarso. Braços verticais. Quebra os joelhos antes de dobrar os quadris. "Empurra o chão para baixo." / Bar over mid-foot. Arms vertical. Unlock knees before hinging hips. Think "push the floor away".' },
  { name: 'Romanian Deadlift',     name_pt: 'Stiff',                  muscle_groups: ['hamstrings'],   secondary_muscles: ['glutes','back'],      equipment: ['barbell'],     difficulty: 3, tips: 'Empurra os quadris para trás em vez de dobrar os joelhos. Sente o alongamento nos femorais antes de voltar. / Push hips back instead of bending knees. Feel the hamstring stretch before returning to standing.' },
  { name: 'Face Pull',             name_pt: 'Face Pull',              muscle_groups: ['shoulders'],    secondary_muscles: ['traps','back'],       equipment: ['cable'],       difficulty: 2, tips: 'Polia alta, pega com os polegares para cima. Separa as mãos no final do movimento para ativar a rotação externa. Excelente para saúde dos ombros. / High pulley, thumbs up grip. Separate hands at the finish to cue external rotation. Great for shoulder health.' },
  { name: 'Hyperextension',        name_pt: 'Hiperextensão',          muscle_groups: ['lower back'],   secondary_muscles: ['glutes','hamstrings'], equipment: ['body weight'], difficulty: 2, tips: 'Não hiperextendes a lombar no topo — vai apenas até à posição neutra. Para trabalhar mais os glúteos, empurra os quadris contra o apoio. / Don\'t hyperextend at the top — stop at neutral. Push hips into the pad to target glutes more.' },
  // Shoulders
  { name: 'Overhead Press',        name_pt: 'Press Militar',          muscle_groups: ['shoulders'],    secondary_muscles: ['triceps','traps'],    equipment: ['barbell'],     difficulty: 4, tips: 'Core contraído para proteger a lombar. No topo "empurra a cabeça através" dos braços. Descansam na parte superior do peito entre reps. / Brace your core to protect lower back. At the top "push your head through" your arms.' },
  { name: 'Dumbbell Shoulder Press', name_pt: 'Press com Halteres',   muscle_groups: ['shoulders'],    secondary_muscles: ['triceps'],            equipment: ['dumbbell'],    difficulty: 3, tips: 'Permite maior amplitude que a barra. Começa com halteres ao nível das orelhas. Não trava os cotovelos no topo para manter tensão. / Greater range of motion than barbell. Start with dumbbells at ear level. Don\'t lock out at top.' },
  { name: 'Lateral Raise',         name_pt: 'Elevação Lateral',       muscle_groups: ['shoulders'],    secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Inclina ligeiramente o polegar para baixo ("deita a garrafa") para ativar mais o deltoide médio. Para os cotovelos levemente fletidos. Usa menos peso do que pensas. / Tilt pinky slightly up ("pour a jug") to maximize medial delt. Keep a slight elbow bend.' },
  { name: 'Front Raise',           name_pt: 'Elevação Frontal',       muscle_groups: ['shoulders'],    secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Sobe até à altura dos ombros — não é necessário subir mais. Usa pega neutra (polegares para cima) para reduzir stress no ombro. / Raise only to shoulder height. Use a neutral grip (thumbs up) to reduce shoulder impingement risk.' },
  { name: 'Rear Delt Fly',         name_pt: 'Crucifixo Invertido',    muscle_groups: ['shoulders'],    secondary_muscles: ['traps','back'],       equipment: ['dumbbell'],    difficulty: 2, tips: 'Inclina o tronco quase paralelo ao chão. Foca a contração no deltoide posterior e não nas trapézios. Usa peso leve com forma perfeita. / Hinge torso nearly parallel to floor. Focus contraction on rear delt, not traps. Use light weight with perfect form.' },
  { name: 'Arnold Press',          name_pt: 'Arnold Press',           muscle_groups: ['shoulders'],    secondary_muscles: ['triceps'],            equipment: ['dumbbell'],    difficulty: 3, tips: 'Começa com palmas para ti, roda para fora enquanto pressiona. Trabalha mais o deltoide anterior e médio que o press normal. / Start palms facing you, rotate outward as you press. Hits more of the anterior and medial delt than a standard press.' },
  { name: 'Upright Row',           name_pt: 'Remada Alta',            muscle_groups: ['shoulders'],    secondary_muscles: ['traps','biceps'],     equipment: ['barbell'],     difficulty: 3, tips: 'Pega mais larga reduz o stress nas articulações do ombro. Puxa os cotovelos acima dos ombros. Evitar se tiveres impingement no ombro. / Wider grip reduces shoulder joint stress. Pull elbows above shoulder height. Avoid if you have shoulder impingement.' },
  // Biceps
  { name: 'Bicep Curl',            name_pt: 'Rosca Direta',           muscle_groups: ['biceps'],       secondary_muscles: ['forearms'],           equipment: ['barbell'],     difficulty: 2, tips: 'Mantém os cotovelos junto ao corpo — não deixa avançar. Sobe de forma explosiva, desce de forma controlada (2-3 segundos). / Keep elbows pinned to your sides. Curl explosively up, lower slowly (2-3 seconds).' },
  { name: 'Hammer Curl',           name_pt: 'Rosca Martelo',          muscle_groups: ['biceps'],       secondary_muscles: ['forearms'],           equipment: ['dumbbell'],    difficulty: 2, tips: 'Pega neutra trabalha o braquial e antebraço além do bíceps. Ótimo para ganho de espessura do braço. / Neutral grip targets the brachialis and forearms in addition to the biceps. Great for overall arm thickness.' },
  { name: 'Preacher Curl',         name_pt: 'Rosca Scott',            muscle_groups: ['biceps'],       secondary_muscles: [],                     equipment: ['barbell'],     difficulty: 2, tips: 'O apoio elimina o balanço do corpo. Não estenga completamente no fundo para manter tensão. Contrai forte no topo. / The pad eliminates body swing. Don\'t fully extend at the bottom. Squeeze hard at the top.' },
  { name: 'Incline Dumbbell Curl', name_pt: 'Rosca Inclinada',        muscle_groups: ['biceps'],       secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'A inclinação do banco cria uma pré-tensão no bíceps na posição inicial. Mantém os ombros para trás no banco durante todo o movimento. / Bench angle creates pre-tension on the biceps at the start. Keep shoulders back against the bench throughout.' },
  { name: 'Cable Curl',            name_pt: 'Rosca na Polia',         muscle_groups: ['biceps'],       secondary_muscles: [],                     equipment: ['cable'],       difficulty: 2, tips: 'A polia mantém tensão constante em todo o arco do movimento, ao contrário do haltere. Experimenta com polia baixa e alta para variação. / Cable maintains constant tension throughout the arc unlike dumbbells. Try both low and high pulley for variation.' },
  { name: 'Concentration Curl',    name_pt: 'Rosca Concentrada',      muscle_groups: ['biceps'],       secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Apoia o cotovelo na parte interna da coxa. Gira ligeiramente o pulso para fora no topo para maximizar a contração do bíceps. / Brace elbow against inner thigh. Supinate wrist slightly at the top to maximize the bicep peak contraction.' },
  // Triceps
  { name: 'Tricep Pushdown',       name_pt: 'Extensão na Polia',      muscle_groups: ['triceps'],      secondary_muscles: [],                     equipment: ['cable'],       difficulty: 2, tips: 'Mantém os cotovelos junto ao corpo — só o antebraço se move. Bloqueia completamente os cotovelos em baixo para contração máxima. / Keep elbows pinned to sides — only the forearms move. Fully lock out at the bottom for peak contraction.' },
  { name: 'Skull Crusher',         name_pt: 'Rosca Testa',            muscle_groups: ['triceps'],      secondary_muscles: [],                     equipment: ['barbell'],     difficulty: 3, tips: 'Baixa a barra para a testa ou ligeiramente atrás da cabeça. Mantém os cotovelos apontados para o teto — não deixa abrir para os lados. / Lower bar to forehead or slightly behind head. Keep elbows pointing straight up — don\'t let them flare out.' },
  { name: 'Overhead Tricep Extension', name_pt: 'Extensão Francesa',  muscle_groups: ['triceps'],      secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Trabalha a porção longa do tríceps em alongamento — ideal para hipertrofia. Mantém os cotovelos apontados para a frente, não para os lados. / Works the long head of the triceps in a stretched position — great for hypertrophy. Keep elbows pointing forward.' },
  { name: 'Tricep Dips',           name_pt: 'Tricep Dips',            muscle_groups: ['triceps'],      secondary_muscles: ['chest'],              equipment: ['body weight'], difficulty: 3, tips: 'Para focar no tríceps, mantém o tronco ereto e os cotovelos junto ao corpo. Desce até 90° — mais fundo pode stressar em demasia o ombro. / To isolate triceps, keep torso upright and elbows close to body. Lower to 90° — going deeper can stress the shoulder.' },
  { name: 'Close-Grip Bench Press', name_pt: 'Supino Fechado',        muscle_groups: ['triceps'],      secondary_muscles: ['chest'],              equipment: ['barbell'],     difficulty: 3, tips: 'Pega ligeiramente mais estreita que a largura dos ombros (não demasiado fechada). Cotovelos a 45° para reduzir stress nos pulsos. / Grip slightly narrower than shoulder-width (not too close). Tuck elbows 45° to reduce wrist stress.' },
  { name: 'Kickback',              name_pt: 'Kickback',               muscle_groups: ['triceps'],      secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 2, tips: 'Tronco paralelo ao chão, braço superior paralelo ao chão. Estende completamente o cotovelo no topo. Usa peso leve — a forma é tudo. / Torso parallel to floor, upper arm parallel to floor. Fully extend at the top. Use light weight — form is everything.' },
  // Legs
  { name: 'Squat',                 name_pt: 'Agachamento',            muscle_groups: ['quads'],        secondary_muscles: ['glutes','hamstrings'], equipment: ['barbell'],    difficulty: 4, tips: 'Pés à largura dos ombros ou ligeiramente mais. Joelhos seguem a direção dos dedos dos pés. Desça até as coxas ficarem paralelas ao chão. / Feet shoulder-width or slightly wider. Knees track over toes. Descend until thighs are parallel to floor.' },
  { name: 'Front Squat',           name_pt: 'Agachamento Frontal',    muscle_groups: ['quads'],        secondary_muscles: ['glutes'],             equipment: ['barbell'],     difficulty: 5, tips: 'Mantém os cotovelos altos para não perder a barra. Tronco mais vertical que no back squat. Exige grande mobilidade do tornozelo. / Keep elbows high to prevent bar roll. More upright torso than back squat. Requires significant ankle mobility.' },
  { name: 'Leg Press',             name_pt: 'Leg Press',              muscle_groups: ['quads'],        secondary_muscles: ['glutes','hamstrings'], equipment: ['machine'],    difficulty: 2, tips: 'Nunca bloqueies completamente os joelhos no topo. Pés mais altos = mais glúteos e femorais; pés mais baixos = mais quadríceps. / Never fully lock out knees at the top. Higher foot placement = more glutes/hams; lower placement = more quads.' },
  { name: 'Hack Squat',            name_pt: 'Hack Squat',             muscle_groups: ['quads'],        secondary_muscles: ['glutes'],             equipment: ['machine'],     difficulty: 3, tips: 'Pés próximos e baixos na plataforma para maximizar o trabalho dos quadríceps. Desce lentamente para aumentar o tempo sob tensão. / Feet close and low on the platform to maximize quad activation. Lower slowly to increase time under tension.' },
  { name: 'Leg Extension',         name_pt: 'Cadeira Extensora',      muscle_groups: ['quads'],        secondary_muscles: [],                     equipment: ['machine'],     difficulty: 1, tips: 'Ajusta o apoio para que o eixo fique alinhado com o joelho. Faz uma pausa de 1 segundo no topo com a perna totalmente estendida. / Adjust the pad so the pivot point aligns with your knee. Pause 1 second at the top with leg fully extended.' },
  { name: 'Leg Curl',              name_pt: 'Mesa Flexora',           muscle_groups: ['hamstrings'],   secondary_muscles: [],                     equipment: ['machine'],     difficulty: 1, tips: 'Puxa os calcanhares em direção aos glúteos o máximo possível. Desce de forma lenta e controlada — o excêntrico é o que constrói o músculo. / Curl heels as close to glutes as possible. Lower slowly and controlled — the eccentric phase is where growth happens.' },
  { name: 'Lunges',                name_pt: 'Passadas',               muscle_groups: ['quads'],        secondary_muscles: ['glutes','hamstrings'], equipment: ['body weight'], difficulty: 2, tips: 'Passo longo o suficiente para o joelho de trás quase tocar o chão. O joelho da frente não ultrapassa o dedo do pé. Core ativado. / Step long enough that your back knee nearly touches the floor. Front knee does not pass your toes. Brace core.' },
  { name: 'Bulgarian Split Squat', name_pt: 'Agachamento Búlgaro',    muscle_groups: ['quads'],        secondary_muscles: ['glutes','hamstrings'], equipment: ['dumbbell'],   difficulty: 4, tips: 'Pé traseiro apoiado num banco. Desce verticalmente — não inclinas o tronco para a frente. Um dos exercícios mais eficazes para pernas. / Back foot elevated on bench. Descend vertically — don\'t lean forward. One of the most effective lower body exercises.' },
  { name: 'Sumo Deadlift',         name_pt: 'Levantamento Terra Sumo', muscle_groups: ['glutes'],      secondary_muscles: ['hamstrings','quads','back'], equipment: ['barbell'], difficulty: 4, tips: 'Pés muito abertos, dedos apontados para fora. Pega dentro das pernas. Empurra os joelhos para fora durante todo o movimento. / Very wide stance, toes pointed out. Grip inside your legs. Push knees out throughout the entire movement.' },
  { name: 'Hip Thrust',            name_pt: 'Hip Thrust',             muscle_groups: ['glutes'],       secondary_muscles: ['hamstrings'],         equipment: ['barbell'],     difficulty: 2, tips: 'Omoplatas apoiadas no banco, queixo para o peito. Empurra pelos calcanhares. Contrai os glúteos ao máximo no topo — pausa de 1 segundo. / Shoulder blades on bench, chin tucked. Drive through your heels. Squeeze glutes hard at the top — 1-second pause.' },
  { name: 'Glute Bridge',          name_pt: 'Glute Bridge',           muscle_groups: ['glutes'],       secondary_muscles: ['hamstrings'],         equipment: ['body weight'], difficulty: 1, tips: 'Pés planos no chão à largura dos quadris. Empurra pelos calcanhares. Contrai os glúteos fortemente no topo antes de descer. / Feet flat, hip-width apart. Drive through heels. Squeeze glutes hard at the top before lowering.' },
  { name: 'Calf Raise',            name_pt: 'Elevação de Panturrilha', muscle_groups: ['calves'],      secondary_muscles: [],                     equipment: ['machine'],     difficulty: 1, tips: 'Desce completamente para o alongamento máximo, sobe na ponta dos pés o mais alto possível. Pausa 1 segundo no topo. As panturrilhas precisam de amplitude total para crescer. / Lower fully for maximum stretch, rise as high as possible. Pause 1 second at top. Calves need full ROM to grow.' },
  { name: 'Seated Calf Raise',     name_pt: 'Gémeos Sentado',         muscle_groups: ['calves'],       secondary_muscles: [],                     equipment: ['machine'],     difficulty: 1, tips: 'Com o joelho fletido trabalha mais o sóleo (músculo profundo). Complementa o calf raise em pé para desenvolvimento completo. / With knee bent, targets the soleus (deeper calf muscle). Pairs with standing calf raise for complete calf development.' },
  // Core
  { name: 'Crunch',                name_pt: 'Crunch',                 muscle_groups: ['abdominals'],   secondary_muscles: [],                     equipment: ['body weight'], difficulty: 1, tips: 'Eleva apenas os ombros do chão — não és um sit-up. Mãos atrás da cabeça sem puxar o pescoço. Expira durante a contração. / Lift only your shoulders off the floor — this is not a sit-up. Hands behind head without pulling neck. Exhale during the crunch.' },
  { name: 'Plank',                 name_pt: 'Prancha',                muscle_groups: ['abdominals'],   secondary_muscles: ['obliques','shoulders'], equipment: ['body weight'], difficulty: 2, tips: 'Corpo em linha reta — não levantes os quadris nem os deixes cair. Pensa em empurrar o chão para trás com os pés. Qualidade > quantidade. / Body in a straight line — don\'t raise hips or let them sag. Think of pushing the floor back with your feet. Quality over duration.' },
  { name: 'Leg Raise',             name_pt: 'Elevação de Pernas',     muscle_groups: ['abdominals'],   secondary_muscles: [],                     equipment: ['body weight'], difficulty: 2, tips: 'Mantém a lombar colada ao chão (versão deitada) ou os ombros em baixo (versão na barra). Desce as pernas lentamente sem tocar no chão. / Keep lower back pressed to floor (lying) or shoulders down (hanging). Lower legs slowly without touching the floor.' },
  { name: 'Russian Twist',         name_pt: 'Russian Twist',          muscle_groups: ['obliques'],     secondary_muscles: ['abdominals'],         equipment: ['body weight'], difficulty: 2, tips: 'Inclina o tronco a ~45°. A rotação vem das costas e core — não apenas dos braços. Adiciona peso ou bola medicinal para progredir. / Lean back ~45°. Rotation comes from your torso and core — not just arms. Add a weight or medicine ball to progress.' },
  { name: 'Cable Crunch',          name_pt: 'Crunch na Polia',        muscle_groups: ['abdominals'],   secondary_muscles: [],                     equipment: ['cable'],       difficulty: 2, tips: 'Mantém as ancas fixas — o movimento é de flexão do tronco, não de puxar o peso para baixo. Permite sobrecarga progressiva no abdominal. / Keep hips stationary — the movement is trunk flexion, not pulling weight down with arms. Allows progressive overload for abs.' },
  { name: 'Hanging Leg Raise',     name_pt: 'Elevação de Pernas na Barra', muscle_groups: ['abdominals'], secondary_muscles: ['obliques'],       equipment: ['body weight'], difficulty: 3, tips: 'Evita balanço. Eleva as pernas com controlo. Para iniciantes: joelhos fletidos. Avançado: pernas retas ou tocas a barra com os pés. / Avoid swinging. Raise legs with control. Beginners: bent knees. Advanced: straight legs or toes-to-bar.' },
  { name: 'Ab Wheel Rollout',      name_pt: 'Roda Abdominal',         muscle_groups: ['abdominals'],   secondary_muscles: ['back','shoulders'],   equipment: ['other'],       difficulty: 4, tips: 'Começa com rollouts de joelhos antes de tentar em pé. Mantém as ancas baixas. Evita a lombar a afundar — é um exercício de anti-extensão. / Start with kneeling rollouts before standing. Keep hips low. Avoid lower back sag — this is an anti-extension exercise.' },
  { name: 'Mountain Climber',      name_pt: 'Mountain Climber',       muscle_groups: ['abdominals'],   secondary_muscles: ['shoulders','quads'],  equipment: ['body weight'], difficulty: 2, tips: 'Mantém os quadris baixos e o core ativo. Alterna as pernas de forma controlada ou explosiva. Óptimo como aquecimento ou finisher. / Keep hips low and core tight. Alternate legs in a controlled or explosive manner. Great as a warm-up or circuit finisher.' },
  // Traps / Forearms
  { name: 'Shrugs',                name_pt: 'Encolhimento de Ombros', muscle_groups: ['traps'],        secondary_muscles: [],                     equipment: ['barbell'],     difficulty: 1, tips: 'Encolhe verticalmente — não rodas os ombros. Pausa de 1 segundo no topo. Usa uma pega mista ou straps para cargas mais altas. / Shrug straight up — do not roll your shoulders. Hold 1 second at the top. Use mixed grip or straps for heavier loads.' },
  { name: 'Dumbbell Shrugs',       name_pt: 'Encolhimento com Halteres', muscle_groups: ['traps'],    secondary_muscles: [],                     equipment: ['dumbbell'],    difficulty: 1, tips: 'Permite amplitude ligeiramente maior que a barra. Os halteres podem afastar-se ligeiramente no topo para melhor contração. / Allows a slightly greater range of motion than a barbell. Dumbbells can flare slightly at the top for a better trap contraction.' },
  { name: 'Wrist Curl',            name_pt: 'Rosca de Pulso',         muscle_groups: ['forearms'],     secondary_muscles: [],                     equipment: ['barbell'],     difficulty: 1, tips: 'Apoia os antebraços no banco com os pulsos além da borda. Move apenas os pulsos — não os antebraços. Complementa com wrist curl reverso. / Rest forearms on bench with wrists hanging off the edge. Move only the wrists. Pair with reverse wrist curl for balance.' },
  { name: "Farmer's Walk",         name_pt: "Farmer's Walk",          muscle_groups: ['forearms'],     secondary_muscles: ['traps','shoulders'],  equipment: ['dumbbell'],    difficulty: 2, tips: 'Mantém os ombros retraídos e o core ativo. Caminha com passos controlados. Um dos melhores exercícios funcionais — treina grip, core e postura. / Keep shoulders retracted and core braced. Walk with controlled steps. One of the best functional exercises — trains grip, core, and posture.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEMPLATE PLAN TRANSLATIONS (updates existing rows by name)
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_TRANSLATIONS = [
  { name: 'Athletic Performance',   name_pt: 'Performance Atlética',      description: 'Power, core and general athletic conditioning.',         description_pt: 'Potência, core e condicionamento geral.' },
  { name: 'Condicionamento HIIT',   name_pt: 'Condicionamento HIIT',      description: 'Quick high-intensity cardio session.',                   description_pt: 'Sessão rápida de cardio intenso.' },
  { name: 'Core & Mobility',        name_pt: 'Core & Mobilidade',         description: 'Core strength, stability and mobility work.',            description_pt: 'Core, estabilidade e mobilidade.' },
  { name: 'Full Body (Iniciante)',   name_pt: 'Full Body (Iniciante)',     description: 'Full body session for beginners — focus on technique and habit-building.', description_pt: 'Sessão completa para iniciantes, foco em técnica e criação de hábito.' },
  { name: 'Full Body (Intermédio)', name_pt: 'Full Body (Intermédio)',    description: 'Complete workout with higher volume and compound movements.', description_pt: 'Treino completo com mais volume e compostos.' },
  { name: 'Glúteos Intensivo',      name_pt: 'Glúteos Intensivo',         description: 'Glute and posterior chain focused session.',              description_pt: 'Foco em glúteos e cadeia posterior.' },
  { name: 'Hipertrofia Upper',      name_pt: 'Hipertrofia Upper',         description: 'Extra volume for upper body hypertrophy.',               description_pt: 'Volume extra para hipertrofia do trem superior.' },
  { name: 'Legs (Quadríceps)',      name_pt: 'Pernas (Quadríceps)',       description: 'Quad-dominant leg day with squat variations.',           description_pt: 'Foco em quadríceps e agachamentos.' },
  { name: 'Lower (Intermédio)',     name_pt: 'Lower (Intermédio)',        description: 'Balanced lower body workout for intermediate athletes.', description_pt: 'Treino de trem inferior equilibrado.' },
  { name: 'Panturrilhas & Core',    name_pt: 'Panturrilhas & Core',       description: 'Calves and core work for stability and definition.',     description_pt: 'Panturrilhas + core para estabilidade e definição.' },
  { name: 'Posterior & Glúteos',   name_pt: 'Posterior & Glúteos',       description: 'Heavy hinge movements for hamstrings and glutes.',       description_pt: 'Movimentos de hinge pesado para femorais e glúteos.' },
  { name: 'Power Upper',           name_pt: 'Power Upper',               description: 'Strength and power development for upper body.',         description_pt: 'Força e potência no trem superior.' },
  { name: 'PPL - Legs',            name_pt: 'PPL - Pernas',              description: 'Classic PPL leg day — quads, hamstrings and calves.',   description_pt: 'Leg day clássico PPL — quadríceps, femorais e gémeos.' },
  { name: 'PPL - Pull',            name_pt: 'PPL - Pull',                description: 'Classic PPL pull day — back and biceps.',               description_pt: 'Pull day clássico PPL — costas e bíceps.' },
  { name: 'PPL - Push',            name_pt: 'PPL - Push',                description: 'Classic PPL push day — chest, shoulders and triceps.',  description_pt: 'Push day clássico PPL — peito, ombros e tríceps.' },
  { name: 'Pull (Costas/Bíceps)',  name_pt: 'Pull (Costas/Bíceps)',      description: 'Back and biceps with rows, pulldowns and curls.',       description_pt: 'Costas e bíceps com remadas, puxadas e roscas.' },
  { name: 'Push (Peito/Tríceps)', name_pt: 'Push (Peito/Tríceps)',       description: 'Chest and triceps focused on strength and hypertrophy.', description_pt: 'Peito e tríceps com foco em força e hipertrofia.' },
  { name: 'Strength 5x5',         name_pt: 'Força 5x5',                  description: 'Classic 5x5 strength program — squat, bench, deadlift, row, press.', description_pt: 'Programa clássico de força 5x5 nos principais levantamentos.' },
  { name: 'Upper (Intermédio)',    name_pt: 'Upper (Intermédio)',         description: 'Balanced upper body session for intermediate athletes.', description_pt: 'Treino de trem superior equilibrado para intermédio.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. WEEKLY CHALLENGES (bilingual pool — system inserts week_start/week_end)
// ─────────────────────────────────────────────────────────────────────────────
function weekStart(offsetWeeks = 0) {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7) + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}
function weekEnd(offsetWeeks = 0) {
  const d = new Date(weekStart(offsetWeeks))
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

const CHALLENGE_POOL = [
  { title: 'Workout 3 Times',       title_pt: 'Treina 3 Vezes',          description: 'Complete 3 workouts this week.',          description_pt: 'Completa 3 treinos esta semana.',          type: 'sessions_count', target_value: 3,    xp_reward: 150 },
  { title: 'Workout 5 Times',       title_pt: 'Treina 5 Vezes',          description: 'Complete 5 workouts this week.',          description_pt: 'Completa 5 treinos esta semana.',          type: 'sessions_count', target_value: 5,    xp_reward: 300 },
  { title: '100 Reps Challenge',    title_pt: 'Desafio 100 Reps',        description: 'Hit 100 total reps in a single session.', description_pt: 'Faz 100 reps totais numa só sessão.',     type: 'total_reps',     target_value: 100,  xp_reward: 200 },
  { title: '1,000 kg Lifted',       title_pt: '1.000 kg Levantados',     description: 'Accumulate 1,000 kg volume in a session.',description_pt: 'Acumula 1.000 kg de volume numa sessão.', type: 'volume',         target_value: 1000, xp_reward: 250 },
  { title: 'Try Something New',     title_pt: 'Experimenta um Exercício',description: 'Do an exercise you\'ve never logged before.',description_pt: 'Faz um exercício que nunca registaste.',type: 'new_exercise',   target_value: 1,    xp_reward: 100 },
  { title: 'Early Bird',            title_pt: 'Madrugador',              description: 'Train before 8 AM at least once.',       description_pt: 'Treina antes das 8h pelo menos uma vez.', type: 'sessions_count', target_value: 1,    xp_reward: 120 },
  { title: 'Full Week Streak',      title_pt: 'Semana Completa',         description: 'Train every day for 7 days straight.',   description_pt: 'Treina todos os dias durante 7 dias seguidos.', type: 'sessions_count', target_value: 7, xp_reward: 500 },
  { title: '5,000 kg Volume Week',  title_pt: 'Semana de 5.000 kg',      description: 'Lift 5,000 kg total volume this week.',  description_pt: 'Levanta 5.000 kg de volume total esta semana.', type: 'volume',    target_value: 5000, xp_reward: 400 },
  { title: 'Leg Day Hero',          title_pt: 'Herói do Leg Day',        description: 'Complete 2 leg sessions this week.',     description_pt: 'Completa 2 sessões de pernas esta semana.', type: 'sessions_count', target_value: 2,   xp_reward: 200 },
  { title: 'Push Your Limits',      title_pt: 'Supera os Teus Limites',  description: 'Log a session with RPE 9 or higher.',    description_pt: 'Regista uma sessão com RPE 9 ou superior.', type: 'sessions_count', target_value: 1,   xp_reward: 175 },
  { title: '200 Push-up Challenge', title_pt: 'Desafio 200 Flexões',     description: 'Do 200 push-ups across the week.',       description_pt: 'Faz 200 flexões ao longo da semana.',       type: 'total_reps',     target_value: 200, xp_reward: 350 },
  { title: 'Back to Basics',        title_pt: 'Regresso ao Básico',      description: 'Log workouts 4 days this week.',         description_pt: 'Regista treinos 4 dias esta semana.',       type: 'sessions_count', target_value: 4,   xp_reward: 225 },
]

// Assign challenges to rolling 8-week windows (cycle through pool)
const challenges = Array.from({ length: 8 }, (_, i) => {
  const pool = CHALLENGE_POOL[i % CHALLENGE_POOL.length]
  return { ...pool, week_start: weekStart(i - 1), week_end: weekEnd(i - 1) }
})

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  // 1. Upsert exercises
  process.stdout.write('Seeding exercises... ')
  const { error: exErr } = await sb.from('exercises').upsert(
    EXERCISES.map(e => ({ ...e, is_custom: false })),
    { onConflict: 'name_pt' }
  )
  if (exErr) console.error('\nExercise error:', exErr.message)
  else console.log(`${EXERCISES.length} upserted`)

  // 2. Update template plan translations
  process.stdout.write('Updating template plan translations... ')
  let planOk = 0
  for (const t of PLAN_TRANSLATIONS) {
    const { error } = await sb.from('workout_plans')
      .update({ name_pt: t.name_pt, description: t.description, description_pt: t.description_pt })
      .eq('name', t.name)
      .eq('is_template', true)
    if (error) console.error(`\n  Plan "${t.name}": ${error.message}`)
    else planOk++
  }
  console.log(`${planOk}/${PLAN_TRANSLATIONS.length} updated`)

  // 3. Seed weekly challenges (upsert by week_start+type to be idempotent)
  process.stdout.write('Seeding weekly challenges... ')
  const { error: chErr } = await sb.from('weekly_challenges').upsert(
    challenges,
    { onConflict: 'id', ignoreDuplicates: false }
  )
  if (chErr) console.error('\nChallenge error:', chErr.message)
  else console.log(`${challenges.length} upserted`)

  console.log('\nDone.')
}

run().catch(err => { console.error(err); process.exit(1) })
