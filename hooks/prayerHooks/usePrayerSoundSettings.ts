"use client"

import * as SecureStore from "expo-secure-store"
import { useCallback, useEffect, useState } from "react"

const PRAYER_SOUND_SETTINGS_KEY = "prayer_sound_settings"

interface PrayerSoundSettings {
  [prayerName: string]: boolean // true = sound enabled, false = muted
}

const defaultSettings: PrayerSoundSettings = {
  Fajr: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true,
  // Sunrise is not included as it's not a prayer time
}

export const usePrayerSoundSettings = () => {
  const [soundSettings, setSoundSettings] = useState<PrayerSoundSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await SecureStore.getItemAsync(PRAYER_SOUND_SETTINGS_KEY)
        if (stored) {
          const parsedSettings = JSON.parse(stored)
          setSoundSettings({ ...defaultSettings, ...parsedSettings })
        }
      } catch (error) {
        console.log("Error loading prayer sound settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: PrayerSoundSettings) => {
    try {
      await SecureStore.setItemAsync(PRAYER_SOUND_SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.log("Error saving prayer sound settings:", error)
    }
  }, [])

  // Toggle sound for specific prayer
  const togglePrayerSound = useCallback(
    (prayerName: string) => {
      setSoundSettings((prev) => {
        const newSettings = {
          ...prev,
          [prayerName]: !prev[prayerName],
        }
        saveSettings(newSettings)
        return newSettings
      })
    },
    [saveSettings],
  )

  // Check if sound is enabled for specific prayer
  const isSoundEnabled = useCallback(
    (prayerName: string): boolean => {
      return soundSettings[prayerName] ?? false
    },
    [soundSettings],
  )

  // Get all enabled prayers
  const getEnabledPrayers = useCallback((): string[] => {
    return Object.keys(soundSettings).filter((prayer) => soundSettings[prayer])
  }, [soundSettings])

  return {
    soundSettings,
    isLoading,
    togglePrayerSound,
    isSoundEnabled,
    getEnabledPrayers,
  }
}
