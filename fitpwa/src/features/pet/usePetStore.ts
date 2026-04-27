import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PetModel =
  | 'buff_slime'
  | 'gym_cat'
  | 'iron_pup'
  | 'power_bunny'
  | 'flex_fox'
  | 'mighty_panda'
  | 'turbo_tortoise'
  | 'blaze_dragon'
  | 'swift_hawk'
  | 'rocky_bear'
  | 'titan_wolf'  // premium

export type PetMood = 'ecstatic' | 'happy' | 'neutral' | 'hungry' | 'starving' | 'sleeping' | 'dirty' | 'atrophied'

export interface PetInfo {
  name: string
  unlockLevel: number
  premium?: boolean
  color: string
  accentColor: string
}

export const PET_CATALOG: Record<PetModel, PetInfo> = {
  buff_slime:     { name: 'Buff Slime',     unlockLevel: 1,  color: '#c6ff3d', accentColor: '#b1ed1f' },
  power_bunny:    { name: 'Power Bunny',    unlockLevel: 2,  color: '#f472b6', accentColor: '#ec4899' },
  gym_cat:        { name: 'Gym Cat',        unlockLevel: 4,  color: '#f59e0b', accentColor: '#d97706' },
  turbo_tortoise: { name: 'Turbo Tortoise', unlockLevel: 6,  color: '#34d399', accentColor: '#059669' },
  iron_pup:       { name: 'Iron Pup',       unlockLevel: 8,  color: '#8b5cf6', accentColor: '#7c3aed' },
  flex_fox:       { name: 'Flex Fox',       unlockLevel: 10, color: '#f97316', accentColor: '#ea580c' },
  mighty_panda:   { name: 'Mighty Panda',   unlockLevel: 13, color: '#e2e8f0', accentColor: '#94a3b8' },
  swift_hawk:     { name: 'Swift Hawk',     unlockLevel: 16, color: '#06b6d4', accentColor: '#0891b2' },
  blaze_dragon:   { name: 'Blaze Dragon',   unlockLevel: 20, color: '#ef4444', accentColor: '#dc2626' },
  rocky_bear:     { name: 'Rocky Bear',     unlockLevel: 25, color: '#a78bfa', accentColor: '#8b5cf6' },
  titan_wolf:     { name: 'Titan Wolf',     unlockLevel: 1,  color: '#94a3b8', accentColor: '#475569', premium: true },
}

export const ALL_PETS: PetModel[] = Object.keys(PET_CATALOG) as PetModel[]
export const FREE_PETS = ALL_PETS.filter(p => !PET_CATALOG[p].premium)
export const PREMIUM_PETS = ALL_PETS.filter(p => PET_CATALOG[p].premium)

// ─── Hunger / Cleanliness ───
const DECAY_PER_MS = 6 / (60 * 60 * 1000) 

// ─── Interactions ───
export type PetInteraction = 'pet' | 'flex' | 'tickle' | 'bath'

interface PetState {
  selectedPet: PetModel
  petName: string
  unlockedPets: PetModel[]
  hunger: number
  cleanliness: number
  lastFedAt: string | null
  lastWorkoutAt: string | null
  starvingAt: string | null 
  
  // Streaks & Milestones
  currentStreak: number
  longestStreak: number
  lastStreakDate: string | null
  streakFreezeUsed: boolean 
  totalWorkouts: number
  milestones: string[] 

  interactionCooldown: string | null 
  lastInteraction: PetInteraction | null
  
  setPet: (pet: PetModel) => void
  renamePet: (name: string) => void
  unlockPet: (pet: PetModel) => void
  feedPet: (workoutXp?: number) => void
  tickStats: () => void
  getMood: () => PetMood
  interact: (type: PetInteraction) => { success: boolean; message: string }
  canInteract: () => boolean
}

// ─── Per-Pet Messages ───
interface PetMessages {
  starving_pt: string[]
  starving_en: string[]
  hungry_pt: string[]
  hungry_en: string[]
  happy_pt: string[]
  happy_en: string[]
  ecstatic_pt: string[]
  ecstatic_en: string[]
  neutral_pt: string[]
  neutral_en: string[]
  pet_pt: string[]   
  pet_en: string[]
  flex_pt: string[]  
  flex_en: string[]
  tickle_pt: string[]
  tickle_en: string[]
  dirty_pt: string[]
  dirty_en: string[]
  bath_pt: string[]
  bath_en: string[]
}

const DEFAULT_MESSAGES: PetMessages = {
  starving_pt: [
    'Estou a definhar...',
    'Já não me lembro o que é uma barra.',
    'Se eu fosse um exercício, seria um rest day eterno.',
  ],
  starving_en: [
    "I'm wasting away...",
    "I can't even remember what a barbell looks like.",
    "If I were an exercise, I'd be an eternal rest day.",
  ],
  hungry_pt: ['Um treinozinho? Só um?', 'Bora lá, campeão!'],
  hungry_en: ["A little workout? Just one?", "Come on, champ!"],
  happy_pt: ['Estou a ficar enorme!', 'Sinto-me forte! 💪'],
  happy_en: ["I'm getting huge!", "I feel strong! 💪"],
  ecstatic_pt: ['MÁQUINA! 🏆', 'Imparável! 🔥'],
  ecstatic_en: ['MACHINE! 🏆', 'Unstoppable! 🔥'],
  neutral_pt: ['Podia ser melhor...'],
  neutral_en: ['Could be better...'],
  pet_pt: ['Obrigado! 🥰'],
  pet_en: ['Thanks! 🥰'],
  flex_pt: ['💪 Bora!'],
  flex_en: ['💪 Let\'s go!'],
  tickle_pt: ['Hahaha para! 😂'],
  tickle_en: ['Hahaha stop! 😂'],
  dirty_pt: ['Estou a suar em bica... banho por favor 🤢', 'Ugh, cheiro pior que os teus ténis!'],
  dirty_en: ["I'm sweating buckets... bath please 🤢", 'Ugh, I smell worse than your sneakers!'],
  bath_pt: ['Ahhh... fresquinho! 🛁✨'],
  bath_en: ['Ahhh... so fresh! 🛁✨'],
}

const PET_PERSONALITIES: Partial<Record<PetModel, Partial<PetMessages>>> = {
  buff_slime: {
    starving_pt: [
      'Os meus músculos estão a encolher... literalmente.',
      'Estou tão fraco que nem consigo levantar uma barra de chocolate.',
      'A tua subscrição de gym deve estar a chorar de solidão.',
      'Acho que vou começar a treinar sozinho... ah espera, não tenho braços.',
      'Estou a tornar-me um slime 80% água outra vez. Ajuda.',
      'Isto é o que se sente no cardio? Vazio absoluto.',
      'Sinto-me como uma gelatina esquecida no frigorífico.',
      'Onde está a gravidade? Sinto-me demasiado leve.',
    ],
    starving_en: [
      "My muscles are shrinking... literally.",
      "I'm so weak I can't even lift a chocolate bar.",
      "Your gym membership must be crying from loneliness.",
      "I think I'll train alone... oh wait, I don't have real arms.",
      "I'm becoming an 80% water slime again. Help.",
      "Is this what cardio feels like? Absolute void.",
      "I feel like a jelly forgotten in the fridge.",
      "Where is gravity? I feel too light.",
    ],
    happy_pt: [
      'Os meus gains estão ON FIRE! 🔥', 
      'Se continuas assim vou precisar de roupa maior.', 
      'Sinto-me produtivo!',
      'Quase consigo sentir os meus abdominais... ou será só uma bolha?',
      'A consistência é o meu melhor amigo.',
      'Bora lá, mais uma série de existência!',
    ],
    happy_en: [
      "My gains are ON FIRE! 🔥", 
      "If you keep this up I'll need bigger clothes.", 
      "Feeling productivity!",
      "I can almost feel my abs... or is it just a bubble?",
      "Consistency is my best friend.",
      "Let's go, one more set of existence!",
    ],
    ecstatic_pt: [
      'SOU O SLIME MAIS BUFF! LENDA! 🏆', 
      'Não pares! Somos imparáveis! 💪🔥', 
      'ESTOU TÃO JACKED!',
      'PODER ILIMITADO!',
      'Olha para este brilho muscular!',
    ],
    ecstatic_en: [
      "I'M THE BUFFEST SLIME! LEGEND! 🏆", 
      "Don't stop! We're unstoppable! 💪🔥", 
      "I'M SO JACKED!",
      "UNLIMITED POWER!",
      "Look at this muscular glow!",
    ],
    pet_pt: [
      'Adoro festinhas! 🫠', 
      'Sou todo gelatinoso mas forte! 💚', 
      'Fica aqui para sempre.',
      'Isso é melhor que um batido de proteína.',
    ],
    pet_en: [
      'I love pats! 🫠', 
      "I'm all jiggly but strong! 💚", 
      "Stay here forever.",
      "This is better than a protein shake.",
    ],
    flex_pt: [
      '💪✨ Olha estes bíceps de gelatina!', 
      'Músculos líquidos, baby!',
      'A definição é incrível, não achas?',
    ],
    flex_en: [
      '💪✨ Look at these jelly biceps!', 
      'Liquid muscles, baby!',
      'The definition is incredible, don\'t you think?',
    ],
    tickle_pt: [
      'HAHAHAHA PARA! 🤣', 
      'Sou sensível!',
      'Estou a derreter de tanto rir!',
    ],
    tickle_en: [
      'HAHAHAHA STOP! 🤣', 
      "I'm sensitive!",
      "I'm melting from laughing so much!",
    ],
  },
  gym_cat: {
    starving_pt: [
      'Miaaau... o meu ego está a diminuir com os meus músculos.',
      'Até o sofá está mais ativo que tu, humano.',
      'Vou arranhar os teus ténis de corrida se não treinarmos.',
      'Desce dessa cadeira e dá-me 20 flexões.',
      'Estou a ficar flácido. Inaceitável.',
      'A minha paciência é tão curta como o teu último treino.',
      'Olha para mim... estou patético. A culpa é tua.',
      'Vou começar a caçar moscas para fazer cardio se não te mexeres.',
    ],
    starving_en: [
      "Meooow... my ego is shrinking along with my muscles.",
      "Even the couch is more active than you, human.",
      "I'll scratch your running shoes if we don't train.",
      "Get off that chair and give me 20 pushups.",
      "I'm getting flabby. Unacceptable.",
      "My patience is as short as your last workout.",
      "Look at me... I'm pathetic. It's your fault.",
      "I'll start hunting flies for cardio if you don't move.",
    ],
    happy_pt: [
      'Purrr... treino aprovado! 🐱💪', 
      'Sou o gato mais fit do mundo!', 
      'Cuidado que estes bíceps arranham.', 
      'O ginásio é o meu habitat natural.',
      'Vê esta forma felina. Perfeição.',
      'Nada como um bom pump matinal.',
    ],
    happy_en: [
      'Purrr... workout approved! 🐱💪', 
      "I'm the fittest cat in the world!", 
      "Careful, these biceps scratch.", 
      "The gym is my natural habitat.",
      "See this feline form. Perfection.",
      "Nothing like a good morning pump.",
    ],
    pet_pt: [
      '🐱❤️ Miauuuuuu...', 
      'Mais festinhas, humano.', 
      'Reconhece a minha superioridade física.',
      'Ok, isto é aceitável por agora.',
    ],
    pet_en: [
      '🐱❤️ Meooowwww...', 
      "More pets, human.", 
      "Acknowledge my physical superiority.",
      "Okay, this is acceptable for now.",
    ],
    flex_pt: [
      'Miau! 💪 Sou gato mas levanto peso!', 
      'Vê estas garras de aço.', 
      'Agilidade + Força = Perfeição.',
      'Inveja é um sentimento feio, humano.',
    ],
    flex_en: [
      'Meow! 💪 I\'m a cat but I lift heavy!', 
      "See these claws of steel.", 
      "Agility + Strength = Perfection.",
      "Envy is an ugly feeling, human.",
    ],
    tickle_pt: [
      'NÃO NA BARRIGA! 😹', 
      'Hehehe ok talvez mais um pouco...', 
      'Vais arrepender-te disto!', 
      'A minha dignidade! Socorro!',
    ],
    tickle_en: [
      "NOT THE BELLY! 😹", 
      "Hehehe ok maybe a little more...", 
      "You'll regret this!", 
      "My dignity! Help!",
    ],
  },
  iron_pup: {
    starving_pt: [
      'Au au... cadê o treino? 🐕',
      'Treina comigo?',
      'Estou a perder o meu shape de dobermann...',
      'Vou roer o teu tapete de ioga!',
      'Quero correr! Quero puxar ferro!',
      'O meu rabo já nem abana de tanta fraqueza.',
      'A minha trela está cheia de pó!',
      'Onde estão os meus gains? Au...?',
    ],
    starving_en: [
      "Woof woof... where's the workout? 🐕",
      "Train with me?",
      "I'm losing my doberman shape...",
      "I'm gonna chew your yoga mat!",
      "I want to run! I want to lift!",
      "My tail doesn't even wag anymore from weakness.",
      "My leash is covered in dust!",
      "Where are my gains? Woof...?",
    ],
    happy_pt: [
      'AU AU! Bom treino! 🐕‍🦺', 
      'Quem é o bom pet? SOU EU!', 
      'Mais uma série? Por favooor?',
      'Dá-me esse peso! Eu aguento!',
      'Energia de cachorrinho jacked!',
    ],
    happy_en: [
      'WOOF WOOF! Good workout! 🐕‍🦺', 
      "Who's a good pet? IT'S ME!", 
      "One more set? Pleaaaase?",
      "Give me that weight! I can handle it!",
      "Jacked puppy energy!",
    ],
    pet_pt: [
      '🐕❤️ Adoro-te, humano!', 
      'És o meu herói do ginásio!',
      'Mais carinho nos ombros, por favor!',
      'Melhor dia de sempre!',
    ],
    pet_en: [
      '🐕❤️ I love you, human!', 
      "You're my gym hero!",
      "More shoulder rubs, please!",
      "Best day ever!",
    ],
    flex_pt: [
      'AU! 💪🐕 IRON PUP, O CÃO MAIS STRONG!', 
      'Olha este peitoral!', 
      'Inveja, gato? Olho para o lado!',
      'Treina pesado ou vai para o canil!',
    ],
    flex_en: [
      'WOOF! 💪🐕 IRON PUP, STRONGEST DOGGO!', 
      "Check out this chest!", 
      "Jealous, cat? I look away!",
      "Train hard or go home!",
    ],
    tickle_pt: [
      'HEHE a minha perna! 🐕😂', 
      'AUAUAUAU PARE-A-HAHA!', 
      'Cócegas são o meu ponto fraco!',
      'Estou a cansar o meu diafragma de tanto rir!',
    ],
    tickle_en: [
      "HEHE my leg! 🐕😂", 
      'WOOF-WOOF-STOP-HAHA!', 
      "Tickles are my weakness!",
      "I'm working my abs just by laughing!",
    ],
  },
  power_bunny: {
    starving_pt: [
      'As minhas orelhas estão a cair de fraqueza... 🐰',
      'Nem consigo saltar... e saltar é a minha cena!',
      'Vou comer cenouras em vez de proteína se não treinas!',
      'Quero cardio! Agora!',
      'Onde está o meu pré-treino de alface?',
      'Sinto-me um coelho da Páscoa flácido.',
      'O meu metabolismo está a implorar por saltos!',
      'Não me faças usar a minha velocidade máxima para fugir da preguiça.',
    ],
    starving_en: [
      "My ears are drooping from weakness... 🐰",
      "I can't even hop... and hopping is my thing!",
      "I'll eat carrots instead of protein if you don't train!",
      "I want cardio! Now!",
      "Where is my lettuce pre-workout?",
      "I feel like a flabby Easter bunny.",
      "My metabolism is begging for hops!",
      "Don't make me use my max speed to run away from laziness.",
    ],
    happy_pt: [
      'BOING BOING! 🐰💪 Pernas de ferro, baby!', 
      'Salto mais alto que o teu ego.', 
      'Energia infinita!',
      'O cardio é a minha religião.',
      'Vê este motor de arranque!',
    ],
    happy_en: [
      'BOING BOING! 🐰💪 Legs of steel, baby!', 
      "I jump higher than your ego.", 
      "Infinite energy!",
      "Cardio is my religion.",
      "Check out this starter motor!",
    ],
    pet_pt: [
      'Aww! 🐰💕 Sou fofinho mas letal.', 
      'Isso relaxa os meus músculos tensos.',
      'Mexe nesse narizinho, humano!',
      'Estou pronto para o próximo round.',
    ],
    pet_en: [
      'Aww! 🐰💕 I\'m cute but lethal.', 
      "That relaxes my muscle tension.",
      "Wiggle that nose, human!",
      "I'm ready for the next round.",
    ],
    flex_pt: [
      'OLHA ESTES QUADS! Leg day TODOS os dias! 🐰💪', 
      'Bíceps? No, conheces coelhos?', 
      'Explosão muscular máxima!',
      'Atravesso o ginásio num salto!',
    ],
    flex_en: [
      'LOOK AT THESE QUADS! Leg day EVERY day! 🐰💪', 
      "Biceps? No, have you met a bunny?", 
      "Max muscle explosion!",
      "I cross the gym in one hop!",
    ],
    tickle_pt: [
      'HAHAH! 🐰😂 Cuidado com os coices de riso!', 
      'Pára! Vou fazer binky de tanto rir!',
      'As orelhas não param de tremer!',
    ],
    tickle_en: [
      "HAHAH! 🐰😂 Watch out for the laugh kicks!", 
      "Stop! I'll do a binky from laughing!",
      "My ears won't stop twitching!",
    ],
  },
  flex_fox: {
    starving_pt: [
      'Até uma raposa precisa de treino... especialmente esta. 🦊',
      'O meu pelo está a perder o brilho sem exercício.',
      'Sou esperto, mas até eu sei que devias treinar.',
      'Fome de vitórias e de abdominais.',
      'Onde está o astúcia do treino?',
      'Esta inatividade é um insulto à minha agilidade.',
      'A minha astúcia não compensa os músculos a definhar.',
      'Vou acabar num desfile de moda se não ficarmos fortes.',
    ],
    starving_en: [
      "Even a fox needs training... especially this one. 🦊",
      "My fur is losing its shine without exercise.",
      "I'm clever, but even I know you should train.",
      "Hungry for victories and abs.",
      "Where's the cunning in this workout plan?",
      "This inactivity is an insult to my agility.",
      "My cunning doesn't make up for shrinking muscles.",
      "I'll end up in a fashion show if we don't get strong.",
    ],
    happy_pt: [
      'Astúcia e força... a combinação perfeita. 🦊✨', 
      'Viste aquele set? Fui brilhante.', 
      'Sinto-me veloz como o vento.', 
      'Ganhos inteligentes.',
      'A minha forma é impecável, como sempre.',
      'O ginásio é o meu tabuleiro de xadrez.',
    ],
    happy_en: [
      "Cunning and strength... the perfect combo. 🦊✨", 
      "Did you see that set? Brilliant.", 
      "Feeling fast as the wind.", 
      "Smart gains.",
      "My form is impeccable, as always.",
      "The gym is my chessboard.",
    ],
    pet_pt: [
      '🦊🧡 Agradeço o carinho, humano.', 
      'Até as predadoras precisam de mimo.', 
      'Mandas bem nas festinhas.',
      'Secretamente, eu adoro isto.',
    ],
    pet_en: [
      "🦊🧡 I appreciate the affection, human.", 
      "Even predators need cuddles.", 
      "You're good at pets.",
      "Secretly, I love this.",
    ],
    flex_pt: [
      'Elegância muscular. Observa. 💪🦊', 
      'Abdominais definidos pela inteligência.', 
      'Não sou só um rostinho bonito e peludo.', 
      'Flexibilidade é poder.',
      'Sou a definição de funcionalidade.',
    ],
    flex_en: [
      "Muscular elegance. Observe. 💪🦊", 
      "Abs defined by intelligence.", 
      "I'm not just a pretty furry face.", 
      "Flexibility is power.",
      "I am the definition of functionality.",
    ],
    tickle_pt: [
      'HAHA! 🦊😂 Perdi a minha compostura!', 
      'Pára, a cauda é sensível!', 
      'Kek kek kek! Que riso estranho!',
      'A minha reputação de raposa séria foi-se!',
    ],
    tickle_en: [
      "HAHA! 🦊😂 I've lost my composure!", 
      "Stop, the tail is sensitive!", 
      "Kek kek kek! What a weird laugh!",
      "My reputation as a serious fox is gone!",
    ],
  },
  mighty_panda: {
    starving_pt: [
      'Estou a ficar mais redondo... e não de músculo. 🐼',
      'Preciso de bamboo... quer dizer, proteína!',
      'O mestre panda requer disciplina física.',
      'A minha paciência é infinita, mas a minha energia não.',
      'Sinto-me um peluche vazio.',
      'A paz interior não me dá bíceps.',
      'Hibernação forçada? Espero que não.',
      'O meu chi está a descer!',
    ],
    starving_en: [
      "I'm getting rounder... and not from muscle. 🐼",
      "I need bamboo... I mean, protein!",
      "The panda master requires physical discipline.",
      "My patience is infinite, but my energy is not.",
      "I feel like an empty plushie.",
      "Inner peace doesn't give me biceps.",
      "Forced hibernation? I hope not.",
      "My chi is dropping!",
    ],
    happy_pt: [
      'Panda power! Suave mas FORTE! 🐼💪', 
      'Encontrei o equilíbrio entre força e paz.', 
      'Cada repetição é uma meditação.', 
      'Bamboo e bíceps.',
      'A força vem da calma.',
      'Um panda jacked é uma visão rara.',
    ],
    happy_en: [
      'Panda power! Soft but STRONG! 🐼💪', 
      "I found the balance between strength and peace.", 
      "Each rep is a meditation.", 
      "Bamboo and biceps.",
      "Strength comes from calmness.",
      "A jacked panda is a rare sight.",
    ],
    pet_pt: [
      '🐼🤗 A tua energia é reconfortante.', 
      'Mimos zen.',
      'Sinto o meu equilíbrio a voltar.',
      'Gosto deste contacto humano.',
      'Harmonia total.',
    ],
    pet_en: [
      "🐼🤗 Your energy is comforting.", 
      "Zen cuddles.",
      "I feel my balance returning.",
      "I like this human contact.",
      "Total harmony.",
    ],
    flex_pt: [
      'PANDA KUNG FU! HIYAA! 🐼👊', 
      'Suave por fora, AÇO por dentro!', 
      'Vê a potência do meu impacto.', 
      'O poder do urso sagrado.',
      'Inflexível como um carvalho.',
    ],
    flex_en: [
      'PANDA KUNG FU! HIYAA! 🐼👊', 
      'Soft outside, STEEL inside!', 
      "See the power of my impact.", 
      "The power of the sacred bear.",
      "Unyielding as an oak.",
    ],
    tickle_pt: [
      'HAHAHA! 🐼😂 A minha barriga é o meu ponto fraco!', 
      'Hahaha! Desequilibraste o meu chi!',
      'Rolando de tanto rir!',
    ],
    tickle_en: [
      "HAHAHA! 🐼😂 My belly is my weak spot!", 
      "Hahaha! You unbalanced my chi!",
      "Rolling from laughing so much!",
    ],
  },
  turbo_tortoise: {
    starving_pt: [
      'Devagar e sempre... mas agora estou parado. 🐢',
      'Até EU treino mais que tu, e sou uma tartaruga.',
      'A minha carapaça está a perder o brilho...',
      'Energia em níveis críticos. Motor de casco desligado.',
      'Vou levar 100 anos a recuperar se não treinarmos.',
      'Sinto-me mais como uma rocha do que como um atleta.',
      'A lenda da lebre e da tartaruga foi mentira?',
      'Onde está o meu combustível de vida lenta?',
    ],
    starving_en: [
      "Slow and steady... but now I'm standing still. 🐢",
      "Even I train more than you, and I'm a tortoise.",
      "My shell is losing its shine...",
      "Energy at critical levels. Shell motor offline.",
      "It'll take me 100 years to recover if we don't train.",
      "I feel more like a rock than an athlete.",
      "Was the legend of the hare and tortoise a lie?",
      "Where is my slow-life fuel?",
    ],
    happy_pt: [
      'Devagar e FORTE! 🐢💪', 
      'A carapaça está brilhante!', 
      'Consistência vence qualquer lebre.', 
      'Estou no meu ritmo turbo!',
      'A longevidade é o meu trunfo.',
      'Pump de longo prazo.',
    ],
    happy_en: [
      'Slow and STRONG! 🐢💪', 
      'The shell is shining!', 
      "Consistency beats any hare.", 
      "I'm in my turbo rhythm!",
      "Longevity is my trump card.",
      "Long-term pump.",
    ],
    pet_pt: [
      '🐢❤️ Gosto de festas no pescoço.', 
      'Amizade de longa duração.',
      'Isso aquece os meus ossos antigos.',
      'Dá cá mais uma.',
    ],
    pet_en: [
      "🐢❤️ I like neck scratches.", 
      "Long-term friendship.",
      "That warms my ancient bones.",
      "Give me one more.",
    ],
    flex_pt: [
      'TARTARUGA TURBO! 🐢⚡ Quem disse que sou lento?!', 
      'Cuidado com este impacto de casco.', 
      'Construído para durar.',
      'O peso não me assusta, a minha casa é pesada.',
    ],
    flex_en: [
      'TURBO TORTOISE! 🐢⚡ Who said I was slow?!', 
      "Watch out for this shell impact.", 
      "Built to last.",
      "Weight doesn't scare me, my house is heavy.",
    ],
    tickle_pt: [
      '🐢😂 Haha! Cócegas no plastrão!', 
      'Pára! Vou virar-me de costas!',
      'Risinhos abafados dentro da carapaça.',
    ],
    tickle_en: [
      "🐢😂 Haha! Tickles on the plastron!", 
      "Stop! I'll flip over!",
      "Muffled giggles inside the shell.",
    ],
  },
  swift_hawk: {
    starving_pt: [
      'As minhas asas estão pesadas... 🦅',
      'Nem consigo voar direito sem treino.',
      'Até um pardal está mais fit que eu agora.',
      'Visão turva por falta de gains.',
      'Preciso de altitude e de exercícios.',
      'Vou acabar como uma galinha de quinta neste ritmo.',
      'O céu está demasiado longe hoje.',
      'Fome de vento e de vitórias.',
      'A minha plumagem está a perder o brilho do sucesso.',
      'Onde está a próxima térmica de energia?',
    ],
    starving_en: [
      "My wings are heavy... 🦅",
      "I don't fly properly without training.",
      "Even a sparrow is fitter than me right now.",
      "Vision blurred due to lack of gains.",
      "I need altitude and exercise.",
      "I'll end up as a farm chicken at this rate.",
      "The sky is too far away today.",
      "Hungry for wind and victory.",
      "My plumage is losing its shine of success.",
      "Where is the next thermal of energy?",
    ],
    happy_pt: [
      'VOO ALTO! 🦅💪 Ninguém me apanha!', 
      'Visão de águia no objetivo.', 
      'As correntes de ar são o meu ginásio.',
      'Elegância em cada batida de asa.',
      'O topo da cadeia alimentar muscular.',
      'Sinto a velocidade nas minhas penas!',
      'Dominando os céus do fitness!',
    ],
    happy_en: [
      'FLYING HIGH! 🦅💪 Nobody can catch me!', 
      "Eagle vision on the goal.", 
      "The updrafts are my gym.",
      "Elegance in every wing beat.",
      "Top of the muscular food chain.",
      "I feel the speed in my feathers!",
      "Dominating the fitness skies!",
    ],
    pet_pt: [
      '🦅 Respeita o predador... mas continua.', 
      'Afeição aérea.',
      'As minhas penas estão macias, não estão?',
      'Confio em ti, campeão.',
      'Mais um pouco para a aerodinâmica.',
    ],
    pet_en: [
      "🦅 Respect the predator... but keep going.", 
      "Aerial affection.",
      "My feathers are soft, aren't they?",
      "I trust you, champ.",
      "A little more for aerodynamics.",
    ],
    flex_pt: [
      'OLHA ESTA ENVERGADURA! 🦅✨', 
      'Sou o mestre dos céus.', 
      'Poder e elegância em voo.',
      'Assombra os teus limites.',
    ],
    flex_en: [
      'LOOK AT THIS WINGSPAN! 🦅✨', 
      "I am the master of the skies.", 
      "Power and elegance in flight.",
      "Haunt your limits.",
    ],
    tickle_pt: [
      'HAHA NÃO! 🦅😂 Abaixo das asas não!', 
      'Hahaha! Vais cair de rir comigo!',
      'Piados de riso incontrolável!',
    ],
    tickle_en: [
      "HAHA NO! 🦅😂 Not under the wings!", 
      "Hahaha! You'll fall from laughing with me!",
      "Uncontrollable chirps of laughter!",
    ],
  },
  blaze_dragon: {
    starving_pt: [
      'O meu fogo está a apagar-se... 🐲',
      'Nem consigo soprar fumo sequer.',
      'Dragons precisam de TRAIN, não de DRAIN!',
      'Onde está o calor da batalha?',
      'Vou tornar-me um lagarto comum se não treinas.',
      'A minha caverna de gains está vazia.',
      'Sinto-me um fósforo molhado.',
      'Vou hibernar num vulcão desligado.',
    ],
    starving_en: [
      "My fire is going out... 🐲",
      "I can't even blow smoke anymore.",
      "Dragons need TRAIN, not DRAIN!",
      "Where is the heat of battle?",
      "I'll become a common lizard if you don't train.",
      "My cave of gains is empty.",
      "I feel like a wet matchstick.",
      "I'll hibernate in a dead volcano.",
    ],
    happy_pt: [
      'FOGO NOS MÚSCULOS! 🔥🐲 Incinerar a gordura!', 
      'Um dragão nunca desiste.',
      'Sabor a victory and ashes.',
      'O meu coração é uma forja muscular.',
      'Queima essas calorias!',
    ],
    happy_en: [
      'FIRE IN THE MUSCLES! 🔥🐲 Incinerate the fat!', 
      "A dragon never gives up.",
      "Taste of victory and ashes.",
      "My heart is a muscular forge.",
      "Burn those calories!",
    ],
    ecstatic_pt: [
      'DRACARYS DOS GAINS! 🐲🔥🔥 SOU LENDÁRIO! RAWR!', 
      'O MEU PODER É ABSOLUTO!', 
      'QUEIMAR O GINÁSIO COM ESTE TREINO!',
      'O REI DOS DRAGÕES JACKED!',
    ],
    ecstatic_en: [
      'DRACARYS OF GAINS! 🐲🔥🔥 I\'M LEGENDARY! RAWR!', 
      "MY POWER IS ABSOLUTE!", 
      "BURN THE GYM WITH THIS WORKOUT!",
      "THE KING OF JACKED DRAGONS!",
    ],
    pet_pt: [
      '🐲❤️ Fogo amigo para ti.', 
      'Escamas macias? Talvez.',
      'Ronrona como um vulcão adormecido.',
      'Treinador de dragões de elite.',
    ],
    pet_en: [
      "🐲❤️ Friendly fire for you.", 
      "Soft scales? Maybe.",
      "Purrs like a sleeping volcano.",
      "Elite dragon trainer.",
    ],
    flex_pt: [
      '🐲💪🔥 DRAGON GAINZ, baby!', 
      'Tens força para domar este dragão?', 
      'A lenda muscular.',
      'Calor intenso em cada fibra.',
    ],
    flex_en: [
      'DRAGON GAINZ, baby! 🐲💪🔥', 
      "Do you have the strength to tame this dragon?", 
      "The muscular legend.",
      "Intense heat in every fiber.",
    ],
    tickle_pt: [
      'CUIDADO! 🐲😂🔥 Espirras fogo de rir!', 
      'Haha! Cuidado com as labaredas de riso!', 
      'Dragões também têm cócegas!',
      'Vais incendiar a minha paciência!',
    ],
    tickle_en: [
      "CAREFUL! 🐲😂🔥 Sneezing fire from laughing!", 
      "Haha! Watch out for the laugh flames!", 
      "Dragons have tickles too!",
      "You're gonna ignite my patience!",
    ],
  },
  rocky_bear: {
    starving_pt: [
      'A hibernação devia ter acabado... 🐻',
      'Estou mais urso preguiçoso que urso forte.',
      'Preciso de pesos, não de mel!',
      'Vou hibernar outra vez se não houver treino.',
      'Onde está a força da floresta?',
      'Os meus músculos estão a dormir.',
      'Sinto-me um ursinho de peluche abandonado.',
      'Acorda este monstro!',
      'Fome de ferro e frutos silvestres.',
      'A minha caverna está a ficar pequena para tanta preguiça.',
    ],
    starving_en: [
      "Hibernation should be over by now... 🐻",
      "I'm more lazy bear than strong bear.",
      "I need weights, not honey!",
      "I'll hibernate again if there's no workout.",
      "Where is the forest strength?",
      "My muscles are sleeping.",
      "I feel like an abandoned teddy bear.",
      "Wake this monster up!",
      "Hungry for iron and wild berries.",
      "My cave is getting too small for all this laziness.",
    ],
    happy_pt: [
      'BEAR MODE ACTIVATED! 🐻💪', 
      'Ninguém mexe comigo!', 
      'Força bruta e determinação.', 
      'O rei da montanha está de volta.',
      'Levanto árvores ao pequeno-almoço.',
      'Fúria muscular controlada.',
      'Sente o impacto das minhas patas jacked!',
      'Dominando o território com Gains!',
    ],
    happy_en: [
      'BEAR MODE ACTIVATED! 🐻💪', 
      'Nobody messes with me!', 
      "Brute strength and determination.", 
      "The king of the mountain is back.",
      "I lift trees for breakfast.",
      "Controlled muscular fury.",
      "Feel the impact of my jacked paws!",
      "Dominating the territory with Gains!",
    ],
    pet_pt: [
      '🐻🤗 Gosto desta paz pós-treino.', 
      'Amizade de urso.',
      'Só não me esmagues com esse amor.',
      'Peludo e poderoso.',
      'Abraço de urso ativado!',
    ],
    pet_en: [
      "🐻🤗 I like this post-workout peace.", 
      "Bear friendship.",
      "Just don't crush me with that love.",
      "Furry and powerful.",
      "Bear hug activated!",
    ],
    flex_pt: [
      'SOU ENORME! 🐻💪 ROARRR DO GAINS!', 
      'Vê estes bíceps de granito.', 
      'Montanha de músculos.',
      'Inabalável.',
    ],
    flex_en: [
      "I'M MASSIVE! 🐻💪 ROARRR OF GAINS!", 
      "See these granite biceps.", 
      "Mountain of muscle.",
      "Unshakable.",
    ],
    tickle_pt: [
      '🐻😂 Cócegas na barriga de urso! Hahaha!', 
      'Pára! Vou rebentar com o riso!',
      'Riso profundo que abala o chão.',
    ],
    tickle_en: [
      "🐻😂 Tickles on the bear belly! Hahaha!", 
      "Stop! I'm gonna burst laughing!",
      "Deep laughter that shakes the ground.",
    ],
  },
  titan_wolf: {
    starving_pt: [
      'O alfa da matilha não pode estar fraco... 🐺',
      'Os lobos não descansam. Nem tu devias.',
      'AWOOOO... de tristeza por não treinares.',
      'Estou a tornar-me um cão de colo...',
      'Honra o teu espírito de lobo!',
      'A matilha está à espera de liderança.',
      'O meu uivo está rouco de falta de esforço.',
      'Onde está a caçada aos gains?',
      'O inverno vem aí e eu estou sem músculos.',
      'Liderar requer força, não apenas intenção.',
    ],
    starving_en: [
      "The alpha can't be weak... 🐺",
      "Wolves don't rest. Neither should you.",
      "AWOOOO... of sadness because you're not training.",
      "I'm becoming a lap dog...",
      "Honor your wolf spirit!",
      "The pack is waiting for leadership.",
      "My howl is hoarse from lack of effort.",
      "Where is the hunt for gains?",
      "Winter is coming and I'm muscleless.",
      "Leading requires strength, not just intention.",
    ],
    happy_pt: [
      'AWOOOO! O alfa está de volta! 🐺💪', 
      'Matilha forte, líder forte!', 
      'A alcateia do ginásio prospera.', 
      'Liderança pelo exemplo físico.',
      'Instinto selvagem e músculos de aço.',
      'Dominando o território do fitness.',
      'O uivo da consistência ecoa!',
      'A matilha segue o ritmo do meu treino.',
    ],
    happy_en: [
      'AWOOOO! The alpha is back! 🐺💪', 
      'Strong pack, strong leader!', 
      "The gym pack prospers.", 
      "Leadership by physical example.",
      "Wild instinct and steel muscles.",
      "Dominating the fitness territory.",
      "The howl of consistency echoes!",
      "The pack follows the rhythm of my training.",
    ],
    ecstatic_pt: [
      'TITAN WOLF NO TOPO! 🐺👑 O REI DO GYM! AWOOO! 🔥🐺', 
      'NUNCA MAIS ESTAREMOS NO FUNDO!', 
      'SUPREMACIA ALFA!',
      'O UIVO DA VITÓRIA ABSOLUTA!',
    ],
    ecstatic_en: [
      'TITAN WOLF ON TOP! 🐺👑 KING OF THE GYM! AWOOO! 🔥🐺', 
      "WE'LL NEVER BE DOWN AGAIN!", 
      "ALPHA SUPREMACY!",
      "THE HOWL OF ABSOLUTE VICTORY!",
    ],
    pet_pt: [
      '🐺 Só porque somos parceiros.', 
      'Lealdade eterna.',
      'Até o lobo alfa tem um ponto fraco.',
      'Amizade de sangue e suor.',
    ],
    pet_en: [
      "🐺 Only because we're partners.", 
      "Eternal loyalty.",
      "Even the alpha wolf has a soft spot.",
      "Friendship of blood and sweat.",
    ],
    flex_pt: [
      'AWOOOO! 🐺💪🔥 ALFA MODE! SEM RIVAIS!', 
      'Vê a potência do predador.', 
      'Titanium Gains.',
      'O terror dos preguiçosos.',
    ],
    flex_en: [
      'AWOOOO! 🐺💪🔥 ALPHA MODE! NO RIVALS!', 
      "See the predator's power.", 
      "Titanium Gains.",
      "The terror of the lazy.",
    ],
    tickle_pt: [
      '🐺😂 AWOO-HAHA! Cócegas no lobo? Apanhaste-me!', 
      'Hahaha! AWOO-STOP!',
      'Uivo-riso incontrolável!',
    ],
    tickle_en: [
      "🐺😂 AWOO-HAHA! Tickles on the wolf? You got me!", 
      "Hahaha! AWOO-STOP!",
      "Uncontrollable howl-laugh!",
    ],
  },
};

export function injectName(msg: string, _name: string): string {
  // Always return the raw message, ignoring the pet name for dialogue cleanliness
  return msg
}

export function getPetMessage(model: PetModel, mood: PetMood, isPt: boolean, petName: string): string {
  const personality = PET_PERSONALITIES[model]
  let pool: string[] = []

  if (mood === 'sleeping') return isPt ? 'Zzzzz...' : 'Zzzzz...'

  if (personality) {
    if (mood === 'atrophied' || mood === 'starving') pool = (isPt ? personality.starving_pt : personality.starving_en) || []
    else if (mood === 'hungry') pool = (isPt ? personality.hungry_pt : personality.hungry_en) || []
    else if (mood === 'ecstatic') pool = (isPt ? personality.ecstatic_pt : personality.ecstatic_en) || []
    else if (mood === 'happy') pool = (isPt ? personality.happy_pt : personality.happy_en) || []
    else pool = (isPt ? personality.neutral_pt : personality.neutral_en) || []
  }

  if (pool.length === 0) {
    if (mood === 'atrophied' || mood === 'starving') pool = isPt ? DEFAULT_MESSAGES.starving_pt : DEFAULT_MESSAGES.starving_en
    else if (mood === 'hungry') pool = isPt ? DEFAULT_MESSAGES.hungry_pt : DEFAULT_MESSAGES.hungry_en
    else if (mood === 'ecstatic') pool = isPt ? DEFAULT_MESSAGES.ecstatic_pt : DEFAULT_MESSAGES.ecstatic_en
    else if (mood === 'happy') pool = isPt ? DEFAULT_MESSAGES.happy_pt : DEFAULT_MESSAGES.happy_en
    else pool = isPt ? DEFAULT_MESSAGES.neutral_pt : DEFAULT_MESSAGES.neutral_en
  }

  const msg = pool[Math.floor(Math.random() * pool.length)]
  return injectName(msg, petName)
}

export function getInteractionMessage(model: PetModel, type: PetInteraction, isPt: boolean, petName: string): string {
  const personality = PET_PERSONALITIES[model]
  let pool: string[] = []

  if (personality) {
    if (type === 'pet') pool = (isPt ? personality.pet_pt : personality.pet_en) || []
    else if (type === 'flex') pool = (isPt ? personality.flex_pt : personality.flex_en) || []
    else if (type === 'tickle') pool = (isPt ? personality.tickle_pt : personality.tickle_en) || []
    else if (type === 'bath') pool = (isPt ? personality.bath_pt : personality.bath_en) || []
  }

  if (pool.length === 0) {
    if (type === 'pet') pool = isPt ? DEFAULT_MESSAGES.pet_pt : DEFAULT_MESSAGES.pet_en
    else if (type === 'flex') pool = isPt ? DEFAULT_MESSAGES.flex_pt : DEFAULT_MESSAGES.flex_en
    else if (type === 'tickle') pool = isPt ? DEFAULT_MESSAGES.tickle_pt : DEFAULT_MESSAGES.tickle_en
    else if (type === 'bath') pool = isPt ? DEFAULT_MESSAGES.bath_pt : DEFAULT_MESSAGES.bath_en
  }

  const msg = pool[Math.floor(Math.random() * pool.length)]
  return injectName(msg, petName)
}

// ─── AI Plan Personality Comments ─────────────────────────────────────────────
const PET_AI_COMMENTS: Partial<Record<PetModel, { pt: string[]; en: string[] }>> = {
  buff_slime: {
    pt: ['MÁXIMO VOLUME, ZERO DESCULPAS! 💪🔥', 'Plano aprovado pelo mais musculoso dos slimes!', 'Isto vai deixar-te gigante! Bora LAVAR! 🏋️'],
    en: ['MAXIMUM VOLUME, ZERO EXCUSES! 💪🔥', "Approved by the buffest slime alive!", "This'll make you MASSIVE! Let's GET IT! 🏋️"],
  },
  power_bunny: {
    pt: ['Ui, que treino bonitinho! Vais conseguir! 🌸', 'Confio em ti, campeão! Um passinho de cada vez 🐰', 'Vai com calma mas não pares! 💕'],
    en: ["Oh, what a cute workout plan! You've got this! 🌸", 'I believe in you, champ! One step at a time 🐰', 'Take it easy but never stop! 💕'],
  },
  gym_cat: {
    pt: ['Hmm... aceitável. Podias ter pedido mais séries. 😏', 'Eu faria em metade do tempo, mas serve.', 'Devo dizer… está razoavelmente competente. 🐱'],
    en: ["Hmm… acceptable. Could've asked for more sets. 😏", "I'd do it in half the time, but it'll work.", "I must say… this is reasonably competent. 🐱"],
  },
  iron_pup: {
    pt: ['TREINO TREINO TREINO!!! 🐶🎉', 'Melhor dia da minha vida! Vamos começar JÁ!!', 'WOW WOW WOW adorei este plano!!! 🏅'],
    en: ['WORKOUT WORKOUT WORKOUT!!! 🐶🎉', 'Best day of my life! Let\'s start NOW!!', 'WOW WOW WOW I love this plan!!! 🏅'],
  },
  flex_fox: {
    pt: ['Hmm, deixa-me analisar a estratégia... parece sólido 🦊', 'Cada exercício tem um propósito. Bom plano.', 'A ciência por detrás disto é impecável. Execute com precisão.'],
    en: ["Hmm, let me analyse the strategy… looks solid 🦊", 'Every exercise has a purpose. Good plan.', 'The science behind this is impeccable. Execute with precision.'],
  },
  mighty_panda: {
    pt: ['Boa escolha! Agora vai com tudo! 🐼', 'Focado. Calmo. Imparável. Isso és tu.', 'Respeito o plano. Respeito o esforço. Bora! 🍃'],
    en: ['Good choice! Now give it everything! 🐼', 'Focused. Calm. Unstoppable. That is you.', 'I respect the plan. I respect the effort. Let\'s go! 🍃'],
  },
  turbo_tortoise: {
    pt: ['Devagar e sempre! Este plano tem consistência 🐢', 'Não se trata de velocidade, trata-se de constância.', 'Anos de paciência ensinaram-me: este plano funciona!'],
    en: ["Slow and steady! This plan has consistency 🐢", "It's not about speed, it's about consistency.", 'Years of patience taught me: this plan works!'],
  },
  swift_hawk: {
    pt: ['Eficiência máxima! Sem tempo a perder 🦅', 'Vi treinos piores. Este serve o objetivo.', 'Foca. Executa. Voa para o próximo nível. ⚡'],
    en: ['Maximum efficiency! No time to waste 🦅', "I've seen worse workouts. This serves the purpose.", 'Focus. Execute. Fly to the next level. ⚡'],
  },
  blaze_dragon: {
    pt: ['OS DRAGÕES NÃO FAZEM DIAS DE DESCANSO! 🐉🔥', 'Fogo no peito! Este treino vai queimar tudo!', 'PODER ABSOLUTO! Executa com fúria! ⚡🔥'],
    en: ['DRAGONS DO NOT REST! 🐉🔥', 'Fire in the chest! This workout will BURN everything!', 'ABSOLUTE POWER! Execute with fury! ⚡🔥'],
  },
  rocky_bear: {
    pt: ['Sólido. Resistente. Eficaz. Como eu. 🐻', 'Um bom urso reconhece um bom plano.', 'Força bruta com cabeça. Perfeito.'],
    en: ['Solid. Durable. Effective. Like me. 🐻', 'A good bear recognises a good plan.', 'Brute strength with brains. Perfect.'],
  },
  titan_wolf: {
    pt: ['A matilha não aceita fraqueza. Executa este plano com HONRA. 🐺', 'Forjado em treino, temperado em dor. Isto é o caminho.', 'O lobo solitário treina sozinho. O lobo titan treina assim. ⚔️'],
    en: ["The pack accepts no weakness. Execute this plan with HONOUR. 🐺", 'Forged in training, tempered in pain. This is the way.', 'The lone wolf trains alone. The titan wolf trains like this. ⚔️'],
  },
}

export function getPetAiComment(model: PetModel, isPt: boolean): string {
  const entry = PET_AI_COMMENTS[model]
  const pool = entry ? (isPt ? entry.pt : entry.en) : (isPt ? ['Parece um bom plano!'] : ['Looks like a great plan!'])
  return pool[Math.floor(Math.random() * pool.length)]
}

const PET_DAILY_SUGGESTIONS: Partial<Record<PetModel, { pt: string[]; en: string[] }>> = {
  buff_slime: {
    pt: ['Dia de peito HOJE! Vai lá rebentar! 💪', 'Pernas não se desenvolvem sozinhas. VAI TREINAR!', 'Costas largas = respeito. Bora! 🏋️'],
    en: ['CHEST DAY TODAY! Go destroy it! 💪', "Legs don't grow themselves. GO TRAIN!", 'Wide back = respect. Let\'s GO! 🏋️'],
  },
  power_bunny: {
    pt: ['Que tal um treino suavinho hoje? O teu corpo merece! 🌸', 'Exercício faz bem à alma, não só ao corpo 🐰', 'Um treino pequenino é melhor que nenhum! 💕'],
    en: ['How about a gentle workout today? Your body deserves it! 🌸', 'Exercise is good for the soul, not just the body 🐰', 'A small workout is better than none! 💕'],
  },
  gym_cat: {
    pt: ['Pernas. É sempre dia de pernas. 😏', 'A consistência separa os mediocres dos... menos mediocres.', 'Treina costas. Postura de realeza ou de indigente - a tua escolha. 🐱'],
    en: ['Legs. It\'s always leg day. 😏', 'Consistency separates the mediocre from the... less mediocre.', 'Train back. Royal posture or slouch — your choice. 🐱'],
  },
  iron_pup: {
    pt: ['HOJE TREINAMOS TUDO!!! 🐶🎉', 'Bora bora bora!!! Não há tempo a perder!!', 'OMBROS HOJE!!! Vai ficar ENORME!!! 🏅'],
    en: ['TODAY WE TRAIN EVERYTHING!!! 🐶🎉', 'Let\'s go let\'s go let\'s go!!! No time to waste!!', 'SHOULDERS TODAY!!! You\'re gonna be HUGE!!! 🏅'],
  },
  flex_fox: {
    pt: ['Análise de semana: falta volume em braços. Corrige hoje. 🦊', 'Rotina push/pull/legs — qual segues?', 'Dados indicam que tu pulas dias de pernas. Hoje não.'],
    en: ['Weekly analysis: arm volume is low. Fix it today. 🦊', 'Push/pull/legs routine — which are you following?', 'Data shows you skip leg days. Not today.'],
  },
  titan_wolf: {
    pt: ['A matilha não descansa. O que vais treinar hoje? 🐺', 'Forja-te no ferro. Hoje: costas ou pernas.', 'O lobo fraco morre cedo. Treina. ⚔️'],
    en: ["The pack doesn't rest. What will you train today? 🐺", 'Forge yourself in iron. Today: back or legs.', 'The weak wolf dies early. Train. ⚔️'],
  },
}

const DEFAULT_DAILY: { pt: string[]; en: string[] } = {
  pt: ['Pronto para treinar hoje? 💪', 'O teu corpo está à espera!', 'Mais um dia, mais um treino!'],
  en: ['Ready to train today? 💪', 'Your body is waiting!', 'One more day, one more workout!'],
}

export function getPetDailySuggestion(model: PetModel, isPt: boolean): string {
  const entry = PET_DAILY_SUGGESTIONS[model]
  const pool = entry ? (isPt ? entry.pt : entry.en) : (isPt ? DEFAULT_DAILY.pt : DEFAULT_DAILY.en)
  return pool[new Date().getDay() % pool.length]
}

const MILESTONES_THRESHOLDS = [1, 5, 10, 25, 50, 100, 200, 365]

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      selectedPet: 'buff_slime',
      petName: '',
      unlockedPets: ['buff_slime'],
      hunger: 100,
      cleanliness: 100,
      lastFedAt: null,
      lastWorkoutAt: null,
      starvingAt: null,
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      streakFreezeUsed: false,
      totalWorkouts: 0,
      milestones: [],
      interactionCooldown: null,
      lastInteraction: null,

      setPet: (pet) => set({ selectedPet: pet }),
      renamePet: (name) => set((state) => ({
        petName: name.trim() || state.petName
      })),
      unlockPet: (pet) => set((state) => ({ 
        unlockedPets: state.unlockedPets.includes(pet) ? state.unlockedPets : [...state.unlockedPets, pet] 
      })),

      feedPet: (workoutXp) => {
        const now = new Date()
        const newState: Partial<PetState> = {
          hunger: 100,
          lastFedAt: now.toISOString(),
          starvingAt: null
        }

        if (workoutXp) {
          const today = now.toISOString().split('T')[0]
          const lastDate = get().lastStreakDate
          const totalWorkouts = get().totalWorkouts + 1
          newState.totalWorkouts = totalWorkouts

          // Milestone check
          const newMilestones = [...get().milestones]
          MILESTONES_THRESHOLDS.forEach(t => {
            if (totalWorkouts >= t && !newMilestones.includes(t.toString())) {
              newMilestones.push(t.toString())
            }
          })
          newState.milestones = newMilestones

          if (lastDate !== today) {
            const yesterday = new Date(now)
            yesterday.setDate(now.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            let newStreak = 1
            if (lastDate === yesterdayStr) {
              newStreak = get().currentStreak + 1
            }

            newState.currentStreak = newStreak
            newState.longestStreak = Math.max(get().longestStreak, newStreak)
            newState.lastStreakDate = today
          }
          newState.lastWorkoutAt = now.toISOString()
        }

        set(newState)
      },

      tickStats: () => {
        const { lastFedAt, hunger, cleanliness } = get()
        const now = Date.now()
        
        let newHunger = hunger
        let newCleanliness = cleanliness
        let starvingAt = get().starvingAt

        if (lastFedAt) {
          const elapsed = now - new Date(lastFedAt).getTime()
          const petInfo = PET_CATALOG[get().selectedPet]
          const isPremium = petInfo.premium
          // Premium pets decay 25% slower
          const decayRate = isPremium ? DECAY_PER_MS * 0.75 : DECAY_PER_MS
          newHunger = Math.max(0, 100 - (elapsed * decayRate))
        }

        if (newHunger === 0 && !starvingAt) {
          starvingAt = new Date().toISOString()
        }

        set({ hunger: newHunger, cleanliness: newCleanliness, starvingAt })
      },

      getMood: () => {
        const { hunger, cleanliness, starvingAt } = get()
        const now = new Date()
        const hour = now.getHours()
        
        // Sleep between 23h and 07h
        if (hour >= 23 || hour < 7) return 'sleeping'
        
        if (cleanliness < 30) return 'dirty'
        
        if (starvingAt) {
          const starvedElapsed = Date.now() - new Date(starvingAt).getTime()
          if (starvedElapsed > 24 * 60 * 60 * 1000) return 'atrophied'
          return 'starving'
        }

        if (hunger < 30) return 'hungry'
        if (hunger > 90 && cleanliness > 90) return 'ecstatic'
        if (hunger > 70) return 'happy'
        return 'neutral'
      },

      canInteract: () => {
        const { interactionCooldown } = get()
        if (!interactionCooldown) return true
        return new Date() > new Date(interactionCooldown)
      },

      interact: (type) => {
        const mood = get().getMood()
        if (mood === 'sleeping') {
          return { success: false, message: 'Zzzzz...' }
        }

        if (!get().canInteract()) {
          return { success: false, message: 'Cooldown...' }
        }

        const now = new Date()
        const cooldown = new Date(now.getTime() + 15 * 60 * 1000).toISOString() // 15 min cooldown
        
        let hungerGain = 0
        let cleanlinessGain = 0

        const petInfo = PET_CATALOG[get().selectedPet]
        const isPremium = petInfo.premium
        
        // Premium pets give slightly more interaction points
        const multiplier = isPremium ? 1.5 : 1

        if (type === 'pet') hungerGain = 2 * multiplier
        if (type === 'flex') hungerGain = 3 * multiplier
        if (type === 'tickle') hungerGain = 2 * multiplier
        if (type === 'bath') cleanlinessGain = 100

        set((state) => ({
          hunger: Math.min(100, state.hunger + hungerGain),
          cleanliness: Math.min(100, state.cleanliness + cleanlinessGain),
          interactionCooldown: cooldown,
          lastInteraction: type
        }))

        return { 
          success: true, 
          message: getInteractionMessage(get().selectedPet, type, true, get().petName) 
        }
      }
    }),
    {
      name: 'pet-storage',
    }
  )
)
