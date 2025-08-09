"use client"

import * as Location from "expo-location"
import * as SecureStore from "expo-secure-store"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const LOCATION_KEY = "user_location"

type LocationData = {
  latitude: number
  longitude: number
  timestamp: string
  // Add location name fields
  name?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  street?: string
}

type UseDateTimeLocationReturn = {
  date: string
  time: string
  location: LocationData | null
  isLoading: boolean
  error: string | null
  refreshLocation: () => Promise<void>
}

type UseLocationReturn = {
  location: LocationData | null
  isLoading: boolean
  error: string | null
  refreshLocation: () => Promise<void>
}

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// Helper function to get location name from coordinates
const getLocationName = async (latitude: number, longitude: number): Promise<Partial<LocationData>> => {
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    })

    if (address) {
      return {
        name: address.name || undefined,
        city: address.city || undefined,
        region: address.region || undefined,
        country: address.country || undefined,
        postalCode: address.postalCode || undefined,
        street: address.street || undefined,
      }
    }
    return {}
  } catch (error) {
    console.warn("Failed to get location name:", error)
    return {}
  }
}

export default function useDateTimeLocation(): UseDateTimeLocationReturn {
  const [date, setDate] = useState<string>(() => formatDate(new Date()))
  const [time, setTime] = useState<string>(() => new Date().toLocaleTimeString())
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const lastDateRef = useRef<string>(formatDate(new Date()))

  // Update time every second, but only update date when it actually changes
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const currentDate = formatDate(now)
      const currentTime = now.toLocaleTimeString()

      // Only update date if it has actually changed
      if (currentDate !== lastDateRef.current) {
        setDate(currentDate)
        lastDateRef.current = currentDate
      }

      setTime(currentTime)
    }

    const timer = setInterval(updateDateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load location only once on mount
  useEffect(() => {
    let isMounted = true

    const getLocation = async () => {
      try {
        // First, try to get stored location
        const storedLocation = await SecureStore.getItemAsync(LOCATION_KEY)
        if (storedLocation && isMounted) {
          const parsedLocation = JSON.parse(storedLocation) as LocationData
          setLocation(parsedLocation)
        }

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          if (isMounted) {
            setError("Permission to access location was denied")
            setIsLoading(false)
          }
          return
        }

        // Get current location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (isMounted) {
          // Get location name using reverse geocoding
          const locationName = await getLocationName(loc.coords.latitude, loc.coords.longitude)

          const locationData: LocationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: new Date().toISOString(),
            ...locationName, // Spread the location name data
          }

          setLocation(locationData)
          await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(locationData))
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("An unknown error occurred while fetching location.")
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getLocation()

    return () => {
      isMounted = false
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      // Get location name using reverse geocoding
      const locationName = await getLocationName(loc.coords.latitude, loc.coords.longitude)

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: new Date().toISOString(),
        ...locationName, // Spread the location name data
      }

      setLocation(locationData)
      await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(locationData))
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred while refreshing location.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    date,
    time,
    location,
    isLoading,
    error,
    refreshLocation,
  }
}

// Location-only hook (no time updates)
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load location only once on mount
  useEffect(() => {
    let isMounted = true

    const getLocation = async () => {
      try {
        // First, try to get stored location
        const storedLocation = await SecureStore.getItemAsync(LOCATION_KEY)
        if (storedLocation && isMounted) {
          const parsedLocation = JSON.parse(storedLocation) as LocationData
          setLocation(parsedLocation)
        }

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          if (isMounted) {
            setError("Permission to access location was denied")
            setIsLoading(false)
          }
          return
        }

        // Get current location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (isMounted) {
          // Get location name using reverse geocoding
          const locationName = await getLocationName(loc.coords.latitude, loc.coords.longitude)

          const locationData: LocationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: new Date().toISOString(),
            ...locationName, // Spread the location name data
          }

          setLocation(locationData)
          await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(locationData))
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("An unknown error occurred while fetching location.")
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getLocation()

    return () => {
      isMounted = false
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      // Get location name using reverse geocoding
      const locationName = await getLocationName(loc.coords.latitude, loc.coords.longitude)

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: new Date().toISOString(),
        ...locationName, // Spread the location name data
      }

      setLocation(locationData)
      await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(locationData))
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred while refreshing location.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    location,
    isLoading,
    error,
    refreshLocation,
  }
}

type Coordinates = {
  latitude: number
  longitude: number
}

export function useStableCoordinates(
  defaultLat: number,
  defaultLng: number,
): {
  coordinates: Coordinates
  isLoading: boolean
  error: string | null
} {
  const { location, isLoading, error } = useLocation()
  const coordinatesRef = useRef<Coordinates>({ latitude: defaultLat, longitude: defaultLng })

  const coordinates = useMemo(() => {
    const lat = location?.latitude ?? defaultLat
    const lng = location?.longitude ?? defaultLng

    // Only create new object if coordinates actually changed
    if (coordinatesRef.current.latitude !== lat || coordinatesRef.current.longitude !== lng) {
      coordinatesRef.current = { latitude: lat, longitude: lng }
    }

    return coordinatesRef.current
  }, [location?.latitude, location?.longitude, defaultLat, defaultLng])

  return { coordinates, isLoading, error }
}
