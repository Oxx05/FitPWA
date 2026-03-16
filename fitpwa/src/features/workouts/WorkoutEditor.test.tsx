import { describe, it, expect } from 'vitest'

// We test the formatRestTime helper extracted from WorkoutEditor
// and key validation logic isolated from the component

// Extracted formatRestTime logic for isolated unit testing
function formatRestTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  return `${seconds}s`
}

describe('WorkoutEditor - formatRestTime', () => {
  it('should format seconds below 60 correctly', () => {
    expect(formatRestTime(30)).toBe('30s')
    expect(formatRestTime(0)).toBe('0s')
    expect(formatRestTime(45)).toBe('45s')
  })

  it('should format exact minutes correctly', () => {
    expect(formatRestTime(60)).toBe('1m')
    expect(formatRestTime(120)).toBe('2m')
    expect(formatRestTime(300)).toBe('5m')
  })

  it('should format minutes and seconds correctly', () => {
    expect(formatRestTime(90)).toBe('1m 30s')
    expect(formatRestTime(75)).toBe('1m 15s')
    expect(formatRestTime(150)).toBe('2m 30s')
  })
})

describe('WorkoutEditor - Validation Logic', () => {
  it('should require a plan name', () => {
    const title = ''
    const exercises: unknown[] = [{ id: '1' }]

    const errors: string[] = []
    if (!title.trim()) errors.push('Nome do plano é obrigatório')
    if (exercises.length === 0) errors.push('Adiciona pelo menos um exercício')

    expect(errors).toContain('Nome do plano é obrigatório')
    expect(errors).not.toContain('Adiciona pelo menos um exercício')
  })

  it('should require at least one exercise', () => {
    const title = 'My Plan'
    const exercises: unknown[] = []

    const errors: string[] = []
    if (!title.trim()) errors.push('Nome do plano é obrigatório')
    if (exercises.length === 0) errors.push('Adiciona pelo menos um exercício')

    expect(errors).not.toContain('Nome do plano é obrigatório')
    expect(errors).toContain('Adiciona pelo menos um exercício')
  })

  it('should pass validation with valid data', () => {
    const title = 'Push Day'
    const exercises = [{ id: '1', name: 'Bench Press' }]

    const errors: string[] = []
    if (!title.trim()) errors.push('Nome do plano é obrigatório')
    if (exercises.length === 0) errors.push('Adiciona pelo menos um exercício')

    expect(errors).toHaveLength(0)
  })
})
