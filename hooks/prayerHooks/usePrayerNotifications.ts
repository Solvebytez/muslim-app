"use client"

import { Audio } from "expo-av"
import * as Notifications from "expo-notifications"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, Platform } from "react-native"

import { isCurrentlyPrayerTime, type PrayerTime } from "@/utils/prayerUtils"

// ✅ Notification handler setup
Notifications.setNotificationHandler({
  handleNotification: async ({ request }) => {
    const { soundEnabled, isAzanNotification } = request.content.data || {}

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
      shouldPlaySound: isAzanNotification ? false : !!soundEnabled,
      priority: isAzanNotification
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    }
  },
})

export const usePrayerNotifications = (
  prayerTimes: PrayerTime[],
  currentPrayer: PrayerTime | null,
  isSoundEnabled: (prayerName: string) => boolean
) => {
  const [isAzanPlaying, setIsAzanPlaying] = useState(false)
  const [currentPlayingPrayer, setCurrentPlayingPrayer] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const lastNotifiedPrayerRef = useRef<string | null>(null)
 const azanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appState = useRef(AppState.currentState)

  // ✅ Load azan sound
  useEffect(() => {
    const loadAzan = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        })

        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require("@/assets/azan.mp3"),
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          },
          (status) => {
            if (status.isLoaded && "didJustFinish" in status && status.didJustFinish) {
              stopAzan()
            }
          }
        )

        setSound(loadedSound)
        console.log("✅ Azan sound loaded")
      } catch (error) {
        console.error("❌ Failed to load azan sound:", error)
      }
    }

    loadAzan()

    return () => {
      sound?.unloadAsync()
      if (azanTimeoutRef.current) clearTimeout(azanTimeoutRef.current)
    }
  }, [])

  // ✅ Play azan audio
  const playAzan = useCallback(
    async (prayerName?: unknown) => {
      if (typeof prayerName !== "string") {
        console.warn("⚠️ playAzan called without valid prayerName")
        return
      }

      if (!sound || isAzanPlaying || !isSoundEnabled(prayerName)) return

      try {
        console.log(`🔊 Playing azan for ${prayerName}`)
        setIsAzanPlaying(true)
        setCurrentPlayingPrayer(prayerName)

        await sound.replayAsync()

        azanTimeoutRef.current = setTimeout(() => {
          console.log("⏱ Auto-stopping azan after 3 min")
          stopAzan()
        }, 180000)
      } catch (err) {
        console.error("❌ Azan play failed:", err)
        stopAzan()
      }
    },
    [sound, isAzanPlaying, isSoundEnabled]
  )

  // ✅ Stop azan
  const stopAzan = useCallback(async () => {
    if (!isAzanPlaying || !sound) return

    try {
      await sound.stopAsync()
      console.log("🛑 Azan stopped")
    } catch (err) {
      console.warn("⚠️ Error stopping azan:", err)
    } finally {
      setIsAzanPlaying(false)
      setCurrentPlayingPrayer(null)
      if (azanTimeoutRef.current) clearTimeout(azanTimeoutRef.current)
    }
  }, [sound, isAzanPlaying])

  // ✅ Background check
  const checkCurrentPrayerAzan = useCallback(() => {
    if (
      currentPrayer &&
      currentPrayer.name !== "Sunrise" &&
      isCurrentlyPrayerTime(currentPrayer.originalTime, 5) &&
      isSoundEnabled(currentPrayer.name)
    ) {
      playAzan(currentPrayer.name)
    }
  }, [currentPrayer, isSoundEnabled, playAzan])

  // ✅ Stop azan if user muted it
  const checkAndStopAzanIfMuted = useCallback(() => {
    if (isAzanPlaying && currentPlayingPrayer && !isSoundEnabled(currentPlayingPrayer)) {
      stopAzan()
    }
  }, [isAzanPlaying, currentPlayingPrayer, isSoundEnabled, stopAzan])

  // ✅ Notification permission and channels
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync()
        console.log("🔔 Notification permission:", status)

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("azan-channel", {
            name: "Azan Notifications",
            importance: Notifications.AndroidImportance.MAX,
            sound: "azan.mp3",
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          })

          await Notifications.setNotificationChannelAsync("prayer-times", {
            name: "Prayer Times",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
          })
        }
      } catch (err) {
        console.error("❌ Notification setup failed:", err)
      }
    }

    setupNotifications()
  }, [])

  // ✅ Handle notification while app is open
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(({ request }) => {
      const { prayerName, soundEnabled, isAzanNotification } = request.content.data || {}

      if (
        typeof prayerName === "string" &&
        isAzanNotification &&
        soundEnabled &&
        prayerName !== "Sunrise" &&
        AppState.currentState === "active"
      ) {
        setTimeout(() => playAzan(prayerName), 500)
      }
    })

    return () => sub.remove()
  }, [playAzan])

  // ✅ Handle notification tap
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(({ notification }) => {
      const { prayerName, soundEnabled, isAzanNotification } = notification.request.content.data || {}

      if (
        typeof prayerName === "string" &&
        isAzanNotification &&
        soundEnabled &&
        prayerName !== "Sunrise"
      ) {
        setTimeout(() => playAzan(prayerName), 1000)
      }
    })

    return () => sub.remove()
  }, [playAzan])

  // ✅ App state monitor
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      console.log(`📱 App state: ${appState.current} → ${nextState}`)
      appState.current = nextState
    })

    return () => sub.remove()
  }, [])

  // ✅ Foreground periodic check
  useEffect(() => {
    if (!prayerTimes.length) return

    const interval = setInterval(() => {
      if (AppState.currentState !== "active") return

      const now = new Date()
      const currentMins = now.getHours() * 60 + now.getMinutes()

      prayerTimes.forEach((prayer) => {
        const [h, m] = prayer.originalTime.split(":").map(Number)
        const prayerMins = h * 60 + m
        const key = `${prayer.name}-${prayer.originalTime}-${now.getDate()}`

        if (Math.abs(currentMins - prayerMins) <= 1 && lastNotifiedPrayerRef.current !== key) {
          lastNotifiedPrayerRef.current = key

          if (prayer.name !== "Sunrise" && isSoundEnabled(prayer.name)) {
            playAzan(prayer.name)
          }
        }
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [prayerTimes, isSoundEnabled, playAzan])

  return {
    isAzanPlaying,
    currentPlayingPrayer,
    playAzan,
    stopAzan,
    checkCurrentPrayerAzan,
    checkAndStopAzanIfMuted,
  }
}
