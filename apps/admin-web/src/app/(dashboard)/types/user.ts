export type UserRole =
  | 'student'
  | 'psychologist'
  | 'administrator'

export interface User {
  id: number
  institution_id: number
  full_name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface CreateUser {
  institution_id: number
  full_name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUser {
  institution_id?: number
  full_name?: string
  email?: string
  password?: string
  role?: UserRole
}