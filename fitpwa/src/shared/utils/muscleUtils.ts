/**
 * Maps a raw muscle-group string (from the DB or free-exercise-db) to the i18n
 * key under `common.muscles`, so callers can do `t(muscleI18nKey(m))`.
 *
 * Falls back to a title-cased version of the raw string when no mapping exists.
 */
export const MUSCLE_I18N_KEYS: Record<string, string> = {
  // English DB values
  chest: 'common.muscles.chest',
  back: 'common.muscles.back',
  shoulders: 'common.muscles.shoulders',
  biceps: 'common.muscles.biceps',
  triceps: 'common.muscles.triceps',
  forearms: 'common.muscles.forearms',
  forearm: 'common.muscles.forearms',
  legs: 'common.muscles.legs',
  quads: 'common.muscles.quads',
  quadriceps: 'common.muscles.quads',
  hamstrings: 'common.muscles.hamstrings',
  hamstring: 'common.muscles.hamstrings',
  glutes: 'common.muscles.glutes',
  gluteal: 'common.muscles.glutes',
  abs: 'common.muscles.abs',
  abdominals: 'common.muscles.abdominals',
  abdominal: 'common.muscles.abdominals',
  core: 'common.muscles.core',
  obliques: 'common.muscles.obliques',
  calves: 'common.muscles.calves',
  lats: 'common.muscles.lats',
  traps: 'common.muscles.traps',
  trapezius: 'common.muscles.traps',
  'lower back': 'common.muscles.lower_back',
  'upper back': 'common.muscles.upper_back',
  'middle back': 'common.muscles.upper_back',
}

/**
 * Returns the i18n key for a muscle group, or null if unknown.
 * Usage: const label = key ? t(key) : titleCase(raw)
 */
export function muscleI18nKey(raw: string): string | null {
  return MUSCLE_I18N_KEYS[raw.toLowerCase().trim()] ?? null
}

/** Title-cases a hyphen/space separated string as a last-resort fallback. */
export function titleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Translates a muscle group using an i18next `t` function.
 * If no mapping exists the raw value is title-cased.
 */
export function humanizeMuscle(raw: string, t: (key: string) => string): string {
  const key = muscleI18nKey(raw)
  return key ? t(key) : titleCase(raw)
}
