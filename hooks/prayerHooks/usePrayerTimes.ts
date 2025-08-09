"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
  Firstthird: string
  Lastthird: string
}

interface PrayerData {
  timings: PrayerTimings
  date: {
    readable: string
    gregorian: {
      date: string
      weekday: {
        en: string
      }
    }
    hijri: {
      date: string
      weekday: {
        en: string
        ar: string
      }
    }
  }
  meta: {
    latitude: number
    longitude: number
    timezone: string
  }
}

interface UsePrayerTimesReturn {
  prayerData: PrayerData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const usePrayerTimes = (date: string, latitude: number, longitude: number): UsePrayerTimesReturn => {
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastFetchRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPrayerTimes = useCallback(async () => {
    if (!date || !latitude || !longitude) return

    const fetchKey = `${date}-${latitude}-${longitude}`

    // Don't fetch if we already have data for this exact combination
    if (fetchKey === lastFetchRef.current && prayerData) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`,
        { signal: abortControllerRef.current.signal },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch prayer times")
      }

      const result = await response.json()

      if (result.code === 200) {
        setPrayerData(result.data)
        lastFetchRef.current = fetchKey
      } else {
        throw new Error("Invalid API response")
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [date, latitude, longitude, prayerData])

  useEffect(() => {
    fetchPrayerTimes()
  }, [date, latitude, longitude]) // Remove fetchPrayerTimes from dependencies

  const refetch = useCallback(() => {
    lastFetchRef.current = "" // Reset to force refetch
    fetchPrayerTimes()
  }, [fetchPrayerTimes])

  return {
    prayerData,
    isLoading,
    error,
    refetch,
  }
}
