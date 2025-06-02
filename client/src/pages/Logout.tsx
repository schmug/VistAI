import { useEffect } from "react"
import { useLocation } from "wouter"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Page that logs the user out and redirects to home.
 */
export default function Logout() {
  const { logout } = useAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    logout()
    navigate("/")
  }, [logout, navigate])

  return null
}
