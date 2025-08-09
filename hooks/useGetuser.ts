"use client"

import axiosInstance from "@/constants/AxiosInstane"
import * as SecureStore from "expo-secure-store"
import { useCallback, useEffect, useState } from "react"

// Define the UserType interface
interface UserType {
  id: string
  name: string
  email: string
  role: string
  // Add other properties as needed
}

export const useGetuser = () => {
  const [isLoding, setIsLoding] = useState(true)
  const [user, setUser] = useState<UserType | null>(null)
  const [shouldRefetch, setIsRefetch] = useState(false)

  const getUser = useCallback(async () => {
    setIsLoding(true)
    try {
      const response = await axiosInstance.get("/get-user")
      console.log("User response:", response.data)

      if (response.status === 200) {
        const userData = response.data.data
        console.log("User role:", userData.role) // Debug log

        setUser(userData)

        // Store user data in SecureStore
        await SecureStore.setItemAsync("name", userData.name?.trim() || "")
        await SecureStore.setItemAsync("email", userData.email || "")
        await SecureStore.setItemAsync("role", userData.role || "")
      }

      if (response.status === 401) {
        console.log("401 - Unauthorized")
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setIsLoding(false)
    }
  }, [])

  useEffect(() => {
    getUser()
    return () => setIsRefetch(false)
  }, [getUser, shouldRefetch])

  const refetch = () => setIsRefetch(true)

  return { user, isLoding, refetch }
}
