"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Update interface to match API response
interface UserUnit {
  unit_id: number;
  unit_name: string | null;
  unit_pic_name: string | null;
}

interface UserContextType {
  userUnits: UserUnit[];
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userUnits, setUserUnits] = useState<UserUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // User not logged in
        setUserUnits([])
        setIsAdmin(false)
        setUserRole(null)
        return
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        setUserRole(null)
        setIsAdmin(false)
      } else {
        setUserRole(profile.role)
        setIsAdmin(profile.role === 'admin')
      }

      // Fetch user's assigned units
      const response = await fetch('/api/v1/users/units')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const units: UserUnit[] = result.data.units || []
          setUserUnits(units)
          
          
          // Check if user has superadmin unit (unit_id = 1)
          const isSuperAdmin = units.some((unit: UserUnit) => unit.unit_id === 1)
          setIsAdmin(isSuperAdmin)
          
        }
      } else {
        console.error('Failed to fetch user units')
        setUserUnits([])
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setUserUnits([])
      setIsAdmin(false)
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const contextValue: UserContextType = {
    userUnits,
    loading,
    isAdmin,
    userRole,
    error,
    refreshUserData: fetchUserData
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}