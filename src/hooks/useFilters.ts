import { useMemo } from 'react'
import { ComputedTask, FilterState } from '../types'

export function useFilters(tasks: ComputedTask[], filters: FilterState): ComputedTask[] {
  return useMemo(() => {
    return tasks.filter(t => {
      if (filters.responsable.length && !filters.responsable.includes(t.responsable)) return false
      if (filters.modulo.length      && !filters.modulo.includes(t.modulo))           return false
      if (filters.prioridad.length   && !filters.prioridad.includes(t.prioridad))     return false
      if (filters.tipo.length        && !filters.tipo.includes(t.tipo))               return false
      return true
    })
  }, [tasks, filters])
}
