import { describe, expect, it } from 'vitest'
import { averages, calcScore, health, scoreProgress, strongestAndWeakest, zoneOf } from '../lib/metrics'
import { addDays, daysUntilAnniversary, sharedDays, streak, weekStart } from '../lib/dates'

describe('score', () => {
  it('suma las cuatro dimensiones positivas y resta el conflicto × 1,5', () => {
    expect(calcScore({ ce: 4, com: 4, con: 2, re: 3, sg: 5 })).toBe(13)
    expect(calcScore({ ce: 0, com: 0, con: 5, re: 0, sg: 0 })).toBe(-7.5)
    expect(calcScore({ ce: 5, com: 5, con: 0, re: 5, sg: 5 })).toBe(20)
  })

  it('clasifica en zonas con los mismos cortes de la versión anterior', () => {
    expect(zoneOf(12)).toBe('estable')
    expect(zoneOf(11.9)).toBe('friccion')
    expect(zoneOf(8)).toBe('friccion')
    expect(zoneOf(7.9)).toBe('tension')
  })

  it('normaliza el progreso entre el mínimo y el máximo posibles', () => {
    expect(scoreProgress(-7.5)).toBe(0)
    expect(scoreProgress(20)).toBe(1)
    expect(scoreProgress(99)).toBe(1)
  })
})

describe('dimensiones', () => {
  it('invierte el conflicto al medir salud', () => {
    expect(health('con', 1)).toBe(4)
    expect(health('ce', 1)).toBe(1)
  })

  it('promedia y encuentra la dimensión más fuerte y la más débil', () => {
    const avg = averages([
      { ce: 5, com: 2, con: 1, re: 3, sg: 4 },
      { ce: 5, com: 2, con: 1, re: 3, sg: 4 },
    ])!
    expect(avg.ce).toBe(5)
    const { strongest, weakest } = strongestAndWeakest(avg)
    expect(strongest.key).toBe('ce')
    expect(weakest.key).toBe('com')
  })

  it('devuelve null sin registros', () => {
    expect(averages([])).toBeNull()
  })
})

describe('fechas', () => {
  it('cuenta la racha aunque hoy todavía no haya registro', () => {
    const ref = '2026-09-21'
    expect(streak(['2026-09-19', '2026-09-20'], ref)).toBe(2)
    expect(streak(['2026-09-19', '2026-09-20', '2026-09-21'], ref)).toBe(3)
    expect(streak(['2026-09-18'], ref)).toBe(0)
  })

  it('suma y resta días cruzando meses', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('agrupa por semana empezando el lunes', () => {
    expect(weekStart('2026-09-21')).toBe('2026-09-21')
    expect(weekStart('2026-09-27')).toBe('2026-09-21')
  })

  it('cuenta días registrados por los dos', () => {
    expect(sharedDays(['a', 'b', 'c'], ['b', 'c', 'd'])).toBe(2)
  })

  it('calcula los días al próximo aniversario', () => {
    expect(daysUntilAnniversary('2024-09-21', '2026-09-21')).toEqual({ days: 0, years: 2 })
    expect(daysUntilAnniversary('2024-09-22', '2026-09-21')).toEqual({ days: 1, years: 2 })
    expect(daysUntilAnniversary('2024-09-20', '2026-09-21').years).toBe(3)
  })
})
