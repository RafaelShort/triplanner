// ✅ apenas contexto e hook — Vite Fast Refresh exige que um arquivo
// exporte só componentes ou só não-componentes, nunca os dois juntos
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}
