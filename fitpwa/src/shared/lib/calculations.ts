/**
 * Calculate Estimated One Rep Max (1RM) using Brzycki formula
 * Formula: weight / (1.0278 - (0.0278 * reps))
 */
export function calculateBrzycki1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0) return 0
  return weight / (1.0278 - (0.0278 * reps))
}

/**
 * Calculate Estimated One Rep Max (1RM) using Epley formula
 * Formula: weight * (1 + 0.0333 * reps)
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0) return 0
  return weight * (1 + 0.0333 * reps)
}

/**
 * Get a safe estimated 1RM (averaging methods or picking standard)
 */
export function calculateEstimated1RM(weight: number | null, reps: number | null): number {
  if (!weight || !reps || reps <= 0) return 0
  // Brzycki is generally more accurate for low reps (under 10)
  // We'll use Brzycki as the primary standard
  const result = calculateBrzycki1RM(weight, reps)
  return Math.round(result * 10) / 10 // Round to 1 decimal place
}
