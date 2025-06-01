import * as React from "react"

interface AuthUser {
  id: number
  username: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

function readStorage() {
  if (typeof window === "undefined") return { token: null, user: null }
  const token = window.localStorage.getItem("token")
  const userStr = window.localStorage.getItem("user")
  return { token, user: userStr ? (JSON.parse(userStr) as AuthUser) : null }
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

/**
 * Provider and hook to access authentication state stored in localStorage.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ token, user }, setState] = React.useState(readStorage())

  const login = React.useCallback((t: string, u: AuthUser) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", t)
      window.localStorage.setItem("user", JSON.stringify(u))
    }
    setState({ token: t, user: u })
  }, [])

  const logout = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token")
      window.localStorage.removeItem("user")
    }
    setState({ token: null, user: null })
  }, [])

  const value = React.useMemo(
    () => ({ token, user, login, logout }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * React hook exposing auth context.
 */
export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
