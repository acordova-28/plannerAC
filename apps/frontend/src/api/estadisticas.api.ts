import { apiFetch } from './client'

export interface EstadisticasDto {
  totalTareas:      number
  horasEstimadas:   number
  horasBaseline:    number | null
  porEstado:        Record<string, number>
  porModulo:        Record<string, number>
  porResponsable:   Record<string, number>
  porcentajeAvance: number
}

export async function getEstadisticas(): Promise<EstadisticasDto> {
  const res = await apiFetch('/api/estadisticas')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
