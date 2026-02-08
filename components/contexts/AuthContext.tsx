"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getApiUrl } from "@/lib/api-config"

export type UserRole = "user" | "supervisor" | "admin" | "super_admin"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isVerified: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
  updateUser: (updatedFields: Partial<User>) => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error("Login failed")

      const data = await response.json()
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        isVerified: data.user.is_verified,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", data.token)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      })

      if (!response.ok) throw new Error("Registration failed")

      const data = await response.json()
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: "user",
        isVerified: false,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", data.token)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  const updateUser = async (updatedFields: Partial<User>) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found.")

      const response = await fetch(getApiUrl("/profile"), { // Assuming /profile is the endpoint for updating user details
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: updatedFields.firstName,
          last_name: updatedFields.lastName,
          email: updatedFields.email,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      const data = await response.json()
      const updatedUser: User = {
        ...user!, // Use existing user data
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
      }

      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Update user error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, hasRole }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
