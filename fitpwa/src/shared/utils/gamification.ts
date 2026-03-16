/**
 * XP and Level Calculation Constants
 */
export const XP_PER_WORKOUT = 100
export const XP_PER_EXERCISE = 10
export const XP_PER_SET = 2
export const XP_STREAK_MULTIPLIER = 1.1 // 10% bonus per day of streak (max maybe 50%?)

/**
 * Calculate Level based on Total XP
 * Formula: Level = floor(sqrt(XP / 100)) + 1
 * Example: 
 * Lvl 1: 0 - 99 XP
 * Lvl 2: 100 - 399 XP
 * Lvl 3: 400 - 899 XP
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP required for the NEXT level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level, 2) * 100
}

/**
 * Calculate progress percentage within the current level
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp)
  const currentLevelStartXp = xpForLevel(currentLevel - 1)
  const nextLevelStartXp = xpForLevel(currentLevel)
  
  const xpInCurrentLevel = xp - currentLevelStartXp
  const totalXpRequiredForLevel = nextLevelStartXp - currentLevelStartXp
  
  return Math.min(Math.floor((xpInCurrentLevel / totalXpRequiredForLevel) * 100), 100)
}

/**
 * Check if a level up occurred
 */
export function didLevelUp(oldXp: number, newXp: number): boolean {
  return calculateLevel(newXp) > calculateLevel(oldXp)
}
