export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  imageUrl?: string
  videoUrl?: string
  equipment?: string
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  weight_kg: number
  reps: number
  date_set: string
  created_at: string
}

export interface WorkoutHistory {
  id: string
  user_id: string
  plan_id?: string
  exercise_id: string
  sets_completed: number
  duration_seconds: number
  created_at: string
}

export interface WorkspacePlan {
  id: string
  user_id: string
  name: string
  description: string
  exercises: string // JSON array
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_public: boolean
  likes: number
  saves: number
  comments: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface Profile {
  id: string
  username: string
  avatar_url: string
  bio?: string
  objective?: string
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_type: string
  achieved_at: string
}
