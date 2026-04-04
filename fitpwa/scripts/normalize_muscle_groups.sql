-- Normalize all muscle_groups and secondary_muscles to standard lowercase English.
-- Run BEFORE seed_curated_exercises.sql.
-- Safe to re-run.

UPDATE exercises
SET
  muscle_groups = COALESCE((
    SELECT array_agg(DISTINCT normalized ORDER BY normalized)
    FROM unnest(COALESCE(muscle_groups, ARRAY[]::text[])) AS raw_m,
    LATERAL (
      SELECT CASE lower(trim(raw_m))
        WHEN 'peito'           THEN 'chest'
        WHEN 'pectorais'       THEN 'chest'
        WHEN 'pectoralis'      THEN 'chest'
        WHEN 'costas'          THEN 'back'
        WHEN 'dorsais'         THEN 'back'
        WHEN 'upper back'      THEN 'back'
        WHEN 'upper-back'      THEN 'back'
        WHEN 'lower back'      THEN 'lower back'
        WHEN 'lower-back'      THEN 'lower back'
        WHEN 'lombar'          THEN 'lower back'
        WHEN 'lombares'        THEN 'lower back'
        WHEN 'ombro'           THEN 'shoulders'
        WHEN 'ombros'          THEN 'shoulders'
        WHEN 'deltóides'       THEN 'shoulders'
        WHEN 'deltoide'        THEN 'shoulders'
        WHEN 'front deltoids'  THEN 'shoulders'
        WHEN 'front-deltoids'  THEN 'shoulders'
        WHEN 'back-deltoids'   THEN 'shoulders'
        WHEN 'rear deltoids'   THEN 'shoulders'
        WHEN 'bíceps'          THEN 'biceps'
        WHEN 'tríceps'         THEN 'triceps'
        WHEN 'triceps'         THEN 'triceps'
        WHEN 'pernas'          THEN 'quads'
        WHEN 'quadríceps'      THEN 'quads'
        WHEN 'quadriceps'      THEN 'quads'
        WHEN 'femorais'        THEN 'hamstrings'
        WHEN 'isquiotibiais'   THEN 'hamstrings'
        WHEN 'hamstring'       THEN 'hamstrings'
        WHEN 'glúteos'         THEN 'glutes'
        WHEN 'gluteos'         THEN 'glutes'
        WHEN 'gluteal'         THEN 'glutes'
        WHEN 'panturrilla'     THEN 'calves'
        WHEN 'panturrilha'     THEN 'calves'
        WHEN 'gémeos'          THEN 'calves'
        WHEN 'abdominais'      THEN 'abdominals'
        WHEN 'abdominal'       THEN 'abdominals'
        WHEN 'abs'             THEN 'abdominals'
        WHEN 'core'            THEN 'abdominals'
        WHEN 'oblíquos'        THEN 'obliques'
        WHEN 'obliquos'        THEN 'obliques'
        WHEN 'antebraços'      THEN 'forearms'
        WHEN 'antebraço'       THEN 'forearms'
        WHEN 'forearm'         THEN 'forearms'
        WHEN 'trapézio'        THEN 'traps'
        WHEN 'trapezio'        THEN 'traps'
        WHEN 'trapezius'       THEN 'traps'
        WHEN 'braços'          THEN 'biceps'
        WHEN 'grip'            THEN 'forearms'
        WHEN 'adductor'        THEN 'adductors'
        WHEN 'hip flexors'     THEN 'quads'
        WHEN 'middle back'     THEN 'back'
        WHEN 'neck'            THEN 'traps'
        ELSE lower(trim(raw_m))
      END AS normalized
    ) t
    WHERE normalized IS NOT NULL
  ), ARRAY[]::text[]),
  secondary_muscles = COALESCE((
    SELECT array_agg(DISTINCT normalized ORDER BY normalized)
    FROM unnest(COALESCE(secondary_muscles, ARRAY[]::text[])) AS raw_m,
    LATERAL (
      SELECT CASE lower(trim(raw_m))
        WHEN 'peito'           THEN 'chest'
        WHEN 'costas'          THEN 'back'
        WHEN 'dorsais'         THEN 'back'
        WHEN 'upper back'      THEN 'back'
        WHEN 'upper-back'      THEN 'back'
        WHEN 'lower back'      THEN 'lower back'
        WHEN 'lower-back'      THEN 'lower back'
        WHEN 'lombar'          THEN 'lower back'
        WHEN 'ombro'           THEN 'shoulders'
        WHEN 'ombros'          THEN 'shoulders'
        WHEN 'deltóides'       THEN 'shoulders'
        WHEN 'front-deltoids'  THEN 'shoulders'
        WHEN 'back-deltoids'   THEN 'shoulders'
        WHEN 'bíceps'          THEN 'biceps'
        WHEN 'tríceps'         THEN 'triceps'
        WHEN 'triceps'         THEN 'triceps'
        WHEN 'pernas'          THEN 'quads'
        WHEN 'quadríceps'      THEN 'quads'
        WHEN 'quadriceps'      THEN 'quads'
        WHEN 'femorais'        THEN 'hamstrings'
        WHEN 'isquiotibiais'   THEN 'hamstrings'
        WHEN 'hamstring'       THEN 'hamstrings'
        WHEN 'glúteos'         THEN 'glutes'
        WHEN 'gluteos'         THEN 'glutes'
        WHEN 'gluteal'         THEN 'glutes'
        WHEN 'panturrilha'     THEN 'calves'
        WHEN 'panturrilla'     THEN 'calves'
        WHEN 'abdominais'      THEN 'abdominals'
        WHEN 'abdominal'       THEN 'abdominals'
        WHEN 'abs'             THEN 'abdominals'
        WHEN 'oblíquos'        THEN 'obliques'
        WHEN 'antebraços'      THEN 'forearms'
        WHEN 'forearm'         THEN 'forearms'
        WHEN 'trapézio'        THEN 'traps'
        WHEN 'trapezius'       THEN 'traps'
        WHEN 'braços'          THEN 'biceps'
        WHEN 'grip'            THEN 'forearms'
        WHEN 'adductor'        THEN 'adductors'
        WHEN 'middle back'     THEN 'back'
        ELSE lower(trim(raw_m))
      END AS normalized
    ) t
    WHERE normalized IS NOT NULL
  ), ARRAY[]::text[])
WHERE true;
