# 🏗️ Arquitetura Técnica - FitPWA

## 📐 Visão Geral

```
┌─────────────────────────────────────────────┐
│           React Frontend (Vite)              │
│  ├─ Components (Reusable UI)                │
│  ├─ Features (Business Logic)               │
│  └─ Shared (Utils & API)                    │
└────────────────┬────────────────────────────┘
                 │ REST/Realtime API
┌────────────────▼────────────────────────────┐
│       Supabase (Backend as Service)          │
│  ├─ Auth (Passwordless, Session)            │
│  ├─ PostgreSQL Database                     │
│  ├─ RLS (Row Level Security)                │
│  └─ Realtime Subscriptions                  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    External Services                        │
│  ├─ Stripe (Payments)                       │
│  ├─ Resend (Email)                          │
│  └─ Unsplash (Images)                       │
└─────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

### `/src` - Source Code

```
src/
├── App.tsx                 # Entry point + Routes
├── main.tsx               # React render
├── index.css              # Global styles
├── pwa.ts                 # PWA config
│
├── assets/                # Images, icons, etc
│
├── components.test.tsx    # Component tests
├── auth.test.tsx         # Auth tests
├── gamification.test.tsx  # Gamification tests
├── session.test.tsx       # Session tests
│
├── db/
│   └── fitpwa.db.ts      # Supabase client setup
│
├── features/              # Feature modules
│   ├── auth/
│   │   ├── AuthProvider.tsx        # Auth context
│   │   ├── LoginPage.tsx           # Login UI
│   │   ├── RegisterPage.tsx        # Signup UI
│   │   └── OnboardingFlow.tsx      # Onboarding
│   │
│   ├── dashboard/
│   │   └── Dashboard.tsx           # Home page
│   │
│   ├── exercises/
│   │   ├── ExerciseCard.tsx        # Exercise UI
│   │   └── ExerciseLibrary.tsx     # Exercise list
│   │
│   ├── gamification/
│   │   ├── GamificationManager.tsx # Game logic
│   │   ├── GamificationEffects.tsx # Animations
│   │   └── useAchievementsStore.ts # Zustand store
│   │
│   ├── notes/
│   │   └── NoteEditor.tsx          # Note UI
│   │
│   ├── premium/
│   │   ├── FeatureGate.tsx         # Permission check
│   │   └── PremiumPage.tsx         # Premium info
│   │
│   ├── profile/
│   │   └── ProfilePage.tsx         # User profile
│   │
│   ├── progress/
│   │   ├── ProgressDashboard.tsx   # Stats page
│   │   └── RecordsPage.tsx         # NEW: PRs & History
│   │
│   ├── session/
│   │   ├── ActiveSessionProvider.tsx
│   │   ├── SessionScreen.tsx        # Workout tracking
│   │   └── SessionSummary.tsx       # Summary after
│   │
│   └── workouts/
│       ├── WorkoutEditor.tsx        # Create plan
│       ├── WorkoutsList.tsx         # List plans (NEW: 3 card view)
│       └── QuickWorkout.tsx         # NEW: Ad-hoc exercises
│
└── shared/                # Shared utilities
    ├── components/
    │   ├── Button.tsx              # Reusable button
    │   ├── Input.tsx               # Reusable input
    │   ├── Navbar.tsx              # Navigation bar
    │   ├── EmptyState.tsx          # Empty state UI
    │   ├── ErrorBoundary.tsx       # Error handling
    │   └── ProtectedRoute.tsx      # Auth guard
    │
    ├── data/
    │   └── exercises.ts            # 150+ exercises (UPDATED)
    │
    ├── lib/
    │   ├── supabase.ts             # Supabase client
    │   ├── stripe.ts               # Stripe integration
    │   └── resend.ts               # Email service
    │
    └── utils/
        ├── cn.ts                   # Classname utility
        └── gamification.ts         # Game helpers

```

### `/supabase` - Database & Migrations

```
supabase/
└── migrations/
    └── 20260320000000_social_features.sql  # NEW: Tables & RLS
```

---

## 🗄️ Database Schema

### Tables (Nova Estrutura)

#### `profiles`
```typescript
interface Profile {
  id: UUID                 // From auth.users.id
  username: string        
  avatar_url: string
  bio: string
  objective: string       // "lose_weight" | "build_muscle" | "general"
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### `workspace_plans` (Planos de Treino)
```typescript
interface WorkspacePlan {
  id: UUID
  user_id: UUID           // FK: profiles.id
  name: string            // "Upper Body", "Cardio", etc
  description: string
  exercises: Exercise[]   // JSON array
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_public: boolean
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### `workout_history` (Novo)
```typescript
interface WorkoutHistory {
  id: UUID
  user_id: UUID           // FK: profiles.id
  plan_id: UUID | null    // FK: workspace_plans.id (nullable para Quick Workouts)
  exercise_id: string     // Reference to EXERCISES array
  sets_completed: integer
  duration_seconds: integer
  created_at: Timestamp
}
```

#### `personal_records` (Novo)
```typescript
interface PersonalRecord {
  id: UUID
  user_id: UUID           // FK: profiles.id
  exercise_id: string     // Reference to EXERCISES array
  weight_kg: decimal(8,2)
  reps: integer
  date_set: Timestamp
  // UNIQUE(user_id, exercise_id) - One PR per user+exercise
}
```

#### `community_comments`
```typescript
interface CommunityComment {
  id: UUID
  plan_id: UUID           // FK: workspace_plans.id
  user_id: UUID
  content: string
  rating: integer         // 1-5
  created_at: Timestamp
}
```

#### `notes`
```typescript
interface Note {
  id: UUID
  user_id: UUID
  plan_id: UUID | null
  content: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### `achievements`
```typescript
interface Achievement {
  id: UUID
  user_id: UUID
  achievement_type: string  // "first_workout", "ten_workouts", etc
  achieved_at: Timestamp
}
```

### RLS Policies

Todas as tabelas têm policies:

```typescript
// Exemplo: workout_history RLS
CREATE POLICY "Users can view own history"
  ON workout_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON workout_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Índices

```sql
-- Performance
CREATE INDEX idx_plans_user_id ON workspace_plans(user_id);
CREATE INDEX idx_history_user_id ON workout_history(user_id);
CREATE INDEX idx_history_created ON workout_history(created_at DESC);
CREATE INDEX idx_records_user_exercise ON personal_records(user_id, exercise_id);
```

---

## 🔄 Fluxo de Dados

### 1. User Registration
```
User Input → RegisterPage
    ↓
Supabase Auth.signUp()
    ↓
Email Verification (Resend)
    ↓
Create Profile
    ↓
Redirect to Onboarding
```

### 2. Create Workout Plan
```
WorkoutEditor.tsx
    ↓
Select exercises + configure sets/reps/weight
    ↓
Save to workspace_plans table
    ↓
RLS: Only user sees their plan
    ↓
Can assign visibility (private/public)
```

### 3. Quick Workout Flow (NOVO)
```
QuickWorkout.tsx
    ↓
Search exercises → Filter by muscle group
    ↓
Add exercises to list (configure sets/reps/weight)
    ↓
Save to localStorage as "quickWorkout"
    ↓
Navigate to /session/quick
    ↓
SessionScreen reads localStorage
    ↓
User completes exercises
    ↓
Save to workout_history table
    ↓
Auto-detect PRs (compare with personal_records)
    ↓
Redirect to /records
```

### 4. Complete Workout Session
```
SessionScreen.tsx
    ↓
Display exercises (from plan or quickWorkout)
    ↓
User completes each set
    ↓
Timer running
    ↓
Click "Finalizar"
    ↓
SessionSummary shows completion
    ↓
Save to workout_history
    ↓
Compare weight/reps vs personal_records
    ↓
If new PR: Update personal_records
    ↓
Toast notification: "New PR!"
```

### 5. View Records (NOVO)
```
RecordsPage.tsx
    ↓
Fetch personal_records (ordered by weight DESC)
    ↓
Fetch workout_history (last 100)
    ↓
Calculate stats:
  - Total workouts (COUNT)
  - Volume total (SUM of weights)
  - Best lift (MAX weight)
    ↓
Display in dashboard
```

---

## 🎨 Component Hierarchy

### Page Components
```
App.tsx
├── ProtectedRoute
│   ├── Dashboard
│   ├── WorkoutsList
│   ├── WorkoutEditor
│   ├── QuickWorkout (NEW)
│   ├── SessionScreen
│   ├── SessionSummary
│   ├── RecordsPage (NEW)
│   ├── ProgressDashboard
│   ├── CommunityPage
│   ├── ProfilePage
│   └── PremiumPage
└── PublicRoute
    ├── LoginPage
    ├── RegisterPage
    └── OnboardingFlow
```

### Shared Components
```
Navbar (Top navigation)
  └── Links: Home, Workouts, Community, Profile, Premium

EmptyState
  └── When no data

ErrorBoundary
  └── Global error handling

Button & Input
  └── Reusable UI components

ProtectedRoute
  └── Guards authenticated routes

FeatureGate
  └── Premium feature check
```

---

## 📱 State Management (Zustand)

### Stores

#### authStore
```typescript
interface AuthStore {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signUp: (email, password) => Promise
  login: (email, password) => Promise
  logout: () => Promise
  setProfile: (profile) => void
}
```

#### gamificationStore
```typescript
interface GamificationStore {
  achievements: Achievement[]
  points: number
  streak: number
  addAchievement: (type) => void
  addPoints: (amount) => void
  updateStreak: () => void
}
```

#### sessionStore
```typescript
interface SessionStore {
  currentSession: WorkoutSession | null
  startSession: (planId) => void
  completeExercise: () => void
  endSession: () => void
}
```

---

## 🔌 API Integration

### Supabase Client

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
```

### Stripe Integration

```typescript
// stripe.ts
const stripe = new Stripe(process.env.VITE_STRIPE_PK)

const handlePayment = async () => {
  const { error } = await stripe.redirectToCheckout({
    sessionId: checkoutSessionId
  })
}
```

### Unsplash Images

```typescript
// No API key needed for public images
const imageUrl = 'https://images.unsplash.com/photo-{ID}?w=400&h=300&fit=crop'
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```typescript
// components.test.tsx
test('Button renders correctly', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})

// auth.test.tsx
test('Login flow works', async () => {
  // Test signup → login → redirect
})

// gamification.test.tsx
test('Achievement unlocks on conditions', () => {
  // Test achievement logic
})
```

### Component Tests
- Button, Input, Navbar
- ProtectedRoute, FeatureGate
- ErrorBoundary

### Integration Tests
- Full auth flow
- Workout creation + start
- PR detection

---

## 🚀 Performance Optimizations

### Frontend
- **Code Splitting**: React.lazy() for features
- **Image Optimization**: Unsplash width optimization (w=400)
- **Memoization**: React.memo() for expensive renders
- **Lazy Loading**: Intersection Observer for lists

### Database
- **Índices**: On frequently queried columns
- **RLS Filtering**: Server-side filtering
- **Pagination**: Load 20 items at a time

### PWA
- **Service Worker**: Precache critical assets
- **Offline**: localStorage for offline access
- **Manifest**: Web app manifest for install

---

## 🔐 Security Measures

### Authentication
- Supabase Auth (OAuth-ready)
- Session tokens in secure HTTP-only cookies
- Password hashing (bcrypt at Supabase level)

### Authorization
- RLS Policies (row-level security)
- All tables filtered by auth.uid()
- Public data explicitly marked

### Data Protection
- All data encrypted at rest (Supabase)
- HTTPS only (enforced)
- CORS configured
- Input validation on frontend

---

## 📊 Monitoring & Logging

### Implemented
- Error tracking (React.ErrorBoundary)
- User journey logging
- API call logging
- Performance metrics

### TODO
- Sentry integration
- Analytics (Plausible/Posthog)
- Error reporting dashboard

---

## 🛠️ Build & Deployment

### Build Process

```bash
npm run build
# ├─ TypeScript compilation (tsc)
# ├─ Vite bundling
# ├─ CSS minification
# ├─ Asset optimization
# └─ PWA manifest generation
```

### Output
```
dist/
├── index.html
├── manifest.webmanifest
├── sw.js
└── assets/
    ├── app-[hash].js
    └── style-[hash].css
```

### Deployment Pipeline
```
GitHub Push → GitHub Actions
    ↓
npm install
npm run build
npm run test (if applicable)
    ↓
Deploy to Vercel/Netlify
    ↓
Preview + Production
```

---

## 📈 Scaling Considerations

### Current Limitations
- Single Supabase project
- localStorage for session data (max 5MB)
- No database caching layer

### Future Improvements
- Redis cache layer
- Database read replicas
- CDN for assets
- Background jobs (queue)
- Analytics warehouse

---

## 🔗 External Dependencies

### Key Packages
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.33.0",
  "@stripe/react-stripe-js": "^2.0.0",
  "framer-motion": "^10.16.0",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^4.36.0",
  "react-router-dom": "^6.20.0",
  "tailwindcss": "^3.3.0"
}
```

### Peer Dependencies
- Supabase project (backend)
- Stripe account (payments)
- Resend account (email)

---

## 📚 Development Workflow

### Local Development
```bash
# 1. Setup environment
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser
open http://localhost:5173
```

### Making Changes
1. Create feature branch
2. Make changes
3. Test locally (`npm run test`)
4. Build locally (`npm run build`)
5. Push to GitHub
6. CI/CD handles deployment

### Debugging
- Chrome DevTools
- React DevTools extension
- Supabase Studio dashboard
- Network tab for API calls

---

## 📝 Code Quality Standards

### Formatting
- Prettier configured
- ESLint active
- Pre-commit hooks (husky)

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case.tsx

### Best Practices
- DRY principle (reusable components)
- Single responsibility principle
- Type safety (full TypeScript)
- Error boundaries for React errors

---

**Architecture v1.2.0 - March 2025**

For questions or updates, refer to relevant component files or GUIA_DE_USO.md
