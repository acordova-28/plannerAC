import { apiFetch } from './client'

export interface PlanSummary {
  id: string
  nombre: string
  fechaInicio: string
  horasPorDia: number
}

export interface PlanMember {
  id: string
  nombre: string
  email: string
  horasPorDia: number
}

export interface ModuloSummary {
  id: string
  planId: string
  nombre: string
  color: string
  orden: number
}

export async function createPlan(nombre: string): Promise<PlanSummary> {
  const today = new Date().toISOString().slice(0, 10)
  const res = await apiFetch('/api/plans', {
    method: 'POST',
    body: JSON.stringify({ nombre, fechaInicio: today, horasPorDia: 8 }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function deletePlan(id: string): Promise<void> {
  const res = await apiFetch(`/api/plans/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function updatePlanName(id: string, nombre: string): Promise<void> {
  const res = await apiFetch(`/api/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ nombre }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function addPlanMember(planId: string, userId: string): Promise<PlanMember[]> {
  const res = await apiFetch(`/api/plans/${planId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function removePlanMember(planId: string, userId: string): Promise<void> {
  const res = await apiFetch(`/api/plans/${planId}/members/${userId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function updatePlanMemberHours(planId: string, userId: string, horasPorDia: number): Promise<PlanMember[]> {
  const res = await apiFetch(`/api/plans/${planId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ horasPorDia }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getPlans(): Promise<PlanSummary[]> {
  const res = await apiFetch('/api/plans')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getPlanMembers(planId: string): Promise<PlanMember[]> {
  const res = await apiFetch(`/api/plans/${planId}/members`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export interface UserSummary {
  id: string
  nombre: string
  email: string
}

export async function getUsers(): Promise<UserSummary[]> {
  const res = await apiFetch('/api/users')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getPlanModulos(planId: string): Promise<ModuloSummary[]> {
  const res = await apiFetch(`/api/plans/${planId}/modulos`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function createModulo(planId: string, nombre: string): Promise<ModuloSummary> {
  const res = await apiFetch(`/api/plans/${planId}/modulos`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function updateModulo(id: string, changes: { nombre?: string; color?: string }): Promise<void> {
  const res = await apiFetch(`/api/modulos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function deleteModulo(id: string): Promise<void> {
  const res = await apiFetch(`/api/modulos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export async function freezeBaselinePlan(planId: string): Promise<void> {
  const res = await apiFetch(`/api/plans/${planId}/freeze-baseline`, { method: 'POST' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}
