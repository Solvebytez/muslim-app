"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import * as Notifications from "expo-notifications"
import * as TaskManager from "expo-task-manager"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, Platform } from "react-native"

import type { PrayerTime } from "@/utils/prayerUtils"

const BACKGROUND_NOTIFICATION_TASK = "background-notification-task"
const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications"
const LAST_SCHEDULE_DATE_KEY = "last_schedule_date"

interface ScheduledNotification {
  id: string
  prayerName: string
  time: string
  date: string
  soundEnabled: boolean
  type: "azan" | "reminder"
}

let scheduledNotificationsCache: ScheduledNotification[] = []
let currentAppState = AppState.currentState

// Enhanced notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { soundEnabled, prayerName, isAzanNotification, notificationType } = notification.request.content.data || {}

    // Handle reminder notifications
    if (notificationType === "reminder") {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sound: "default",
      }
    }

    // Handle azan notifications
    if (isAzanNotification && soundEnabled) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: "azan.mp3",
      }
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: soundEnabled !== false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }
  },
})

// Background task for handling notifications
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background notification task error:", error)
    return
  }

  if (data) {
    const { notification } = data as any
    const { prayerName, soundEnabled, isAzanNotification, notificationType } =
      notification?.request?.content?.data || {}

    console.log(`Background task: ${prayerName} ${notificationType || "notification"} received`)

    if (isAzanNotification && soundEnabled) {
      console.log(`Playing azan for ${prayerName} in background`)
    } else if (notificationType === "reminder") {
      console.log(`Showing reminder for ${prayerName} in background`)
    }
  }
})

export const useUnifiedPrayerNotifications = (
  prayerTimes: PrayerTime[],
  isSoundEnabled: (prayerName: string) => boolean,
) => {
  const [isAzanPlaying, setIsAzanPlaying] = useState(false)
  const [currentPlayingPrayer, setCurrentPlayingPrayer] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const azanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize audio and permissions
  useEffect(() => {
    const initialize = async () => {
      try {
        // Setup background audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        })

        // Load azan sound
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
          },
        )
        setSound(loadedSound)

        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: true,
            allowProvisional: false,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        })

        if (status === "granted") {
          await setupNotificationChannels()
          await registerBackgroundTask()
        }

        setIsInitialized(true)
        console.log("✅ Unified prayer notifications initialized")
      } catch (error) {
        console.error("❌ Failed to initialize prayer notifications:", error)
      }
    }

    initialize()

    return () => {
      sound?.unloadAsync()
      if (azanTimeoutRef.current) clearTimeout(azanTimeoutRef.current)
    }
  }, [])

  // Setup notification channels for Android
  const setupNotificationChannels = async () => {
    if (Platform.OS !== "android") return

    try {
      await Notifications.setNotificationChannelAsync("azan-channel", {
        name: "Azan Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A5FBF",
        sound: "azan.mp3",
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      })

      await Notifications.setNotificationChannelAsync("prayer-times", {
        name: "Prayer Times",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A5FBF",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      })

      // Dedicated channel for reminders with higher importance
      await Notifications.setNotificationChannelAsync("prayer-reminders", {
        name: "Prayer Reminders (10 min before)",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFA500",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      })

      console.log("✅ Android notification channels configured")
    } catch (error) {
      console.error("❌ Error setting up Android channels:", error)
    }
  }

  // Register background task
  const registerBackgroundTask = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK)
      if (!isRegistered) {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
        console.log("✅ Background notification task registered")
      }
    } catch (error) {
      console.error("❌ Error registering background task:", error)
    }
  }

  // Play azan audio
  const playAzan = useCallback(
    async (prayerName: string) => {
      if (!sound || isAzanPlaying || !isSoundEnabled(prayerName) || prayerName === "Sunrise") {
        return
      }

      try {
        console.log(`🔊 Playing azan for ${prayerName}`)
        setIsAzanPlaying(true)
        setCurrentPlayingPrayer(prayerName)

        await sound.replayAsync()

        // Auto-stop after 3 minutes
        azanTimeoutRef.current = setTimeout(() => {
          console.log("⏱ Auto-stopping azan after 3 minutes")
          stopAzan()
        }, 180000)
      } catch (error) {
        console.error("❌ Azan play failed:", error)
        stopAzan()
      }
    },
    [sound, isAzanPlaying, isSoundEnabled],
  )

  // Stop azan
  const stopAzan = useCallback(async () => {
    if (!isAzanPlaying || !sound) return

    try {
      await sound.stopAsync()
      console.log("🛑 Azan stopped")
    } catch (error) {
      console.warn("⚠️ Error stopping azan:", error)
    } finally {
      setIsAzanPlaying(false)
      setCurrentPlayingPrayer(null)
      if (azanTimeoutRef.current) {
        clearTimeout(azanTimeoutRef.current)
        azanTimeoutRef.current = null
      }
    }
  }, [sound, isAzanPlaying])

  // Generate unique notification ID to prevent duplicates
  const generateNotificationId = (
    prayerName: string,
    date: string,
    time: string,
    type: "azan" | "reminder" = "azan",
  ): string => {
    return `${type}-${prayerName}-${date}-${time}`.toLowerCase().replace(/[^a-z0-9-]/g, "")
  }

  const saveScheduledNotifications = async (notifications: ScheduledNotification[]) => {
    try {
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications))
      scheduledNotificationsCache = notifications
      console.log(`💾 Saved ${notifications.length} notifications to AsyncStorage`)
    } catch (error) {
      console.error("❌ Error saving scheduled notifications:", error)
    }
  }

  const loadScheduledNotifications = async (): Promise<ScheduledNotification[]> => {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY)
      if (stored) {
        const notifications = JSON.parse(stored) as ScheduledNotification[]
        scheduledNotificationsCache = notifications
        console.log(`📱 Loaded ${notifications.length} notifications from AsyncStorage`)
        return notifications
      }
    } catch (error) {
      console.error("❌ Error loading scheduled notifications:", error)
    }
    return []
  }

  // Schedule prayer notifications with optimized storage
  const scheduleUnifiedPrayerNotifications = useCallback(async () => {
    if (!prayerTimes.length || !isInitialized) return

    try {
      const today = new Date()
      const todayStr = today.toDateString()

      // Check if we already scheduled for today to prevent excessive rescheduling
      const lastScheduleDate = await AsyncStorage.getItem(LAST_SCHEDULE_DATE_KEY)
      if (lastScheduleDate === todayStr) {
        console.log("📅 Notifications already scheduled for today")
        return
      }

      // Cancel all existing scheduled notifications to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync()

      // Reduced days to schedule to avoid storage limit
      const daysToSchedule = Platform.OS === "android" ? 7 : 3 // Restored to full capacity
      let totalScheduled = 0

      console.log(`📅 Scheduling optimized notifications for ${daysToSchedule} days`)

      for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() + dayOffset)
        const dateStr = targetDate.toDateString()

        for (const prayer of prayerTimes) {
          if (prayer.name === "Sunrise") continue

          const [hours, minutes] = prayer.originalTime.split(":").map(Number)
          const prayerTime = new Date(targetDate)
          prayerTime.setHours(hours, minutes, 0, 0)

          // Skip past prayers for today
          if (dayOffset === 0 && prayerTime <= new Date()) {
            continue
          }

          const soundEnabled = isSoundEnabled(prayer.name)

          // 1. Schedule 10-minute reminder notification (ALWAYS)
          const reminderTime = new Date(prayerTime.getTime() - 10 * 60 * 1000)
          if (reminderTime > new Date()) {
            const reminderNotificationId = generateNotificationId(prayer.name, dateStr, prayer.originalTime, "reminder")

            await scheduleReminderNotification(prayer, reminderTime, reminderNotificationId)
            totalScheduled++

            console.log(`⏰ Scheduled reminder for ${prayer.name} at ${reminderTime.toLocaleTimeString()}`)
          }

          // 2. Schedule main azan notification
          const azanNotificationId = generateNotificationId(prayer.name, dateStr, prayer.originalTime, "azan")

          await scheduleIndividualNotification(prayer, prayerTime, soundEnabled, azanNotificationId)
          totalScheduled++
        }
      }

      // Save scheduled notifications and update last schedule date
      //await saveScheduledNotifications(newScheduledNotifications)
      await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, todayStr)

      console.log(`✅ Scheduled ${totalScheduled} total notifications (optimized for storage)`)
    } catch (error) {
      console.error("❌ Error scheduling unified prayer notifications:", error)
    }
  }, [prayerTimes, isSoundEnabled, isInitialized])

  // Schedule individual notification
  const scheduleIndividualNotification = async (
    prayer: PrayerTime,
    triggerTime: Date,
    soundEnabled: boolean,
    notificationId: string,
  ) => {
    try {
      const secondsUntilTrigger = Math.floor((triggerTime.getTime() - Date.now()) / 1000)

      if (secondsUntilTrigger <= 0) {
        console.log(`⏭ Skipping past prayer: ${prayer.name}`)
        return
      }

      const timeIntervalTrigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      }

      const trigger =
        Platform.OS === "android"
          ? { ...timeIntervalTrigger, channelId: soundEnabled ? "azan-channel" : "prayer-times" }
          : timeIntervalTrigger

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${prayer.name} Prayer Time`,
          body: `It's time for ${prayer.name} prayer. May Allah accept your prayers.`,
          sound: soundEnabled ? "azan.mp3" : "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: "prayer-time",
          data: {
            prayerName: prayer.name,
            soundEnabled,
            isAzanNotification: true,
            prayerTime: prayer.originalTime,
            notificationType: "azan",
          },
        },
        trigger,
        identifier: notificationId,
      })

      const hoursUntil = Math.floor(secondsUntilTrigger / 3600)
      const minutesUntil = Math.floor((secondsUntilTrigger % 3600) / 60)

      console.log(`✅ Scheduled ${prayer.name} azan in ${hoursUntil}h ${minutesUntil}m - Sound: ${soundEnabled}`)
    } catch (error) {
      console.error(`❌ Error scheduling ${prayer.name} notification:`, error)
    }
  }

  // Schedule reminder notification (10 minutes before prayer)
  const scheduleReminderNotification = async (prayer: PrayerTime, triggerTime: Date, notificationId: string) => {
    try {
      const secondsUntilTrigger = Math.floor((triggerTime.getTime() - Date.now()) / 1000)

      if (secondsUntilTrigger <= 0) {
        console.log(`⏭ Skipping past reminder: ${prayer.name}`)
        return
      }

      const timeIntervalTrigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      }

      const trigger =
        Platform.OS === "android" ? { ...timeIntervalTrigger, channelId: "prayer-reminders" } : timeIntervalTrigger

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${prayer.name} Prayer Reminder`,
          body: `${prayer.name} prayer is in 10 minutes. Prepare for prayer.`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: "prayer-reminder",
          data: {
            prayerName: prayer.name,
            soundEnabled: false,
            isAzanNotification: false,
            prayerTime: prayer.originalTime,
            notificationType: "reminder",
          },
        },
        trigger,
        identifier: notificationId,
      })

      const hoursUntil = Math.floor(secondsUntilTrigger / 3600)
      const minutesUntil = Math.floor((secondsUntilTrigger % 3600) / 60)

      console.log(`⏰ Scheduled ${prayer.name} reminder in ${hoursUntil}h ${minutesUntil}m`)
    } catch (error) {
      console.error(`❌ Error scheduling ${prayer.name} reminder:`, error)
    }
  }

  // Handle notification received while app is open
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(({ request }) => {
      const { prayerName, soundEnabled, isAzanNotification, notificationType } = request.content.data || {}

      console.log(`📱 Notification received: ${prayerName} (${notificationType})`)

      if (
        typeof prayerName === "string" &&
        isAzanNotification &&
        soundEnabled &&
        prayerName !== "Sunrise" &&
        currentAppState === "active"
      ) {
        setTimeout(() => playAzan(prayerName), 500)
      }
    })

    return () => subscription.remove()
  }, [playAzan])

  // Handle notification tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(({ notification }) => {
      const { prayerName, soundEnabled, isAzanNotification, notificationType } = notification.request.content.data || {}

      console.log(`👆 Notification tapped: ${prayerName} (${notificationType})`)

      if (typeof prayerName === "string" && isAzanNotification && soundEnabled && prayerName !== "Sunrise") {
        setTimeout(() => playAzan(prayerName), 1000)
      }
    })

    return () => subscription.remove()
  }, [playAzan])

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log(`📱 App state changed: ${currentAppState} → ${nextAppState}`)
      currentAppState = nextAppState
    })

    return () => subscription?.remove()
  }, [])

  // Auto-schedule when prayer times change
  useEffect(() => {
    if (prayerTimes.length > 0 && isInitialized) {
      scheduleUnifiedPrayerNotifications()
    }
  }, [prayerTimes, scheduleUnifiedPrayerNotifications, isInitialized])

  // Debug function to list all scheduled notifications
  const listAllScheduledNotifications = useCallback(async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync()
      console.log(`📋 ${notifications.length} total notifications scheduled:`)

      const reminderNotifs = notifications.filter((n) => n.content.data?.notificationType === "reminder")
      const azanNotifs = notifications.filter((n) => n.content.data?.notificationType === "azan")

      console.log(`   ⏰ ${reminderNotifs.length} reminder notifications`)
      console.log(`   🕌 ${azanNotifs.length} azan notifications`)

      notifications.forEach((notif, index) => {
        const data = notif.content.data || {}
        const type = data.notificationType || "unknown"
        console.log(`${index + 1}. ${data.prayerName || "Unknown"} (${type}) - ${notif.content.title}`)
      })

      return notifications
    } catch (error) {
      console.error("❌ Error listing notifications:", error)
      return []
    }
  }, [])

  // Cancel all notifications and clear storage
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY)
      await AsyncStorage.removeItem(LAST_SCHEDULE_DATE_KEY)
      scheduledNotificationsCache = []
      console.log("🗑️ All notifications cancelled and AsyncStorage cleared")
    } catch (error) {
      console.error("❌ Error cancelling notifications:", error)
    }
  }, [])

  return {
    isAzanPlaying,
    currentPlayingPrayer,
    playAzan,
    stopAzan,
    scheduleUnifiedPrayerNotifications,
    listAllScheduledNotifications,
    cancelAllNotifications,
    isInitialized,
  }
}
