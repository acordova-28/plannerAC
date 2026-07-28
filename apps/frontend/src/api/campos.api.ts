import { apiFetch } from './client'

export interface CampoSummary {
  id:       string
  planId:   string
  nombre:   string
  tipoDato: string
  orden:    number
}

export async function getCampos(planId: string): Promise<CampoSummary[]> {
  const res = await apiFetch(`/api/plans/${planId}/campos`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function createCampo(planId: string, nombre: string, tipoDato: string): Promise<CampoSummary> {
  const res = await apiFetch(`/api/plans/${planId}/campos`, {
    method: 'POST',
    body: JSON.stringify({ nombre, tipoDato }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function deleteCampo(id: string): Promise<void> {
  const res = await apiFetch(`/api/campos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function setValorCampo(taskId: string, campoId: string, valor: string): Promise<void> {
  const res = await apiFetch(`/api/tasks/${taskId}/campos/${campoId}`, {
    method: 'PUT',
    body: JSON.stringify({ valor }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
