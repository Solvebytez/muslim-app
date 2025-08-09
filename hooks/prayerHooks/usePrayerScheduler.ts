"use client"

import type { PrayerTime } from "@/utils/prayerUtils"
import * as Notifications from "expo-notifications"
import { useCallback, useEffect } from "react"
import { Platform } from "react-native"

export const usePrayerScheduler = (prayerTimes: PrayerTime[], isSoundEnabled: (prayerName: string) => boolean) => {
  // Schedule notifications for all prayer times
  const schedulePrayerNotifications = useCallback(async () => {
    if (!prayerTimes.length) return

    try {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync()

      const today = new Date()
      const daysToSchedule = Platform.OS === "android" ? 7 : 2 // More days for Android

      console.log(
        `📅 Scheduling notifications for ${prayerTimes.length} prayers across ${daysToSchedule} days (Platform: ${Platform.OS})`,
      )

      for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() + dayOffset)

        for (const prayer of prayerTimes) {
          if (prayer.name === "Sunrise") continue // Skip sunrise

          const [hours, minutes] = prayer.originalTime.split(":").map(Number)
          const prayerTime = new Date(targetDate)
          prayerTime.setHours(hours, minutes, 0, 0)

          // Only schedule if the time hasn't passed (for today) or it's a future day
          if (dayOffset === 0 && prayerTime <= new Date()) {
            continue // Skip past prayers for today
          }

          await scheduleNotification(prayer, prayerTime, isSoundEnabled(prayer.name))
        }
      }

      console.log("✅ Prayer notifications scheduled successfully")
    } catch (error) {
      console.log("❌ Error scheduling prayer notifications:", error)
    }
  }, [prayerTimes, isSoundEnabled])

  // Schedule individual notification
  const scheduleNotification = async (prayer: PrayerTime, triggerTime: Date, soundEnabled: boolean) => {
    try {
      const secondsUntilTrigger = Math.floor((triggerTime.getTime() - Date.now()) / 1000)

      if (secondsUntilTrigger <= 0) {
        console.log(`⏭ Skipping past prayer: ${prayer.name}`)
        return
      }

      const hoursUntil = Math.floor(secondsUntilTrigger / 3600)
      const minutesUntil = Math.floor((secondsUntilTrigger % 3600) / 60)

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Prayer Time! 🕌",
          body: `It's time for ${prayer.name} prayer`,
          sound: soundEnabled ? "azan.mp3" : undefined, // This plays the FULL 
          data: {
            prayerName: prayer.name,
            soundEnabled,
          },
        },
        trigger: {
          type: "timeInterval",
          seconds: secondsUntilTrigger,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput,
      })

      console.log(
        `✅ Scheduled ${prayer.name} in ${hoursUntil}h ${minutesUntil}m (${triggerTime.toLocaleTimeString()})`,
      )
    } catch (error) {
      console.log(`❌ Error scheduling ${prayer.name} notification:`, error)
    }
  }

  // Platform-specific recurring notifications
  const scheduleRecurringNotifications = useCallback(async () => {
    if (!prayerTimes.length) return

    try {
      console.log(`🔄 Setting up recurring notifications for ${Platform.OS}...`)

      if (Platform.OS === "ios") {
        // ✅ iOS supports calendar triggers
        for (const prayer of prayerTimes) {
          if (prayer.name === "Sunrise") continue

          const [hours, minutes] = prayer.originalTime.split(":").map(Number)

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Prayer Time! 🕌",
              body: `It's time for ${prayer.name} prayer`,
              sound: isSoundEnabled(prayer.name) ? "default" : undefined,
              data: {
                prayerName: prayer.name,
                soundEnabled: isSoundEnabled(prayer.name),
                recurring: true,
              },
            },
            trigger: {
              type: "calendar",
              hour: hours,
              minute: minutes,
              repeats: true,
            } as Notifications.CalendarTriggerInput,
          })

          console.log(
            `🍎 iOS: Set recurring notification for ${prayer.name} at ${hours}:${minutes.toString().padStart(2, "0")}`,
          )
        }
      } else {
        // ✅ Android: Skip calendar triggers, rely on multi-day scheduling
        console.log("🤖 Android: Skipping calendar triggers (not supported). Using time intervals instead.")
        console.log("📅 Multi-day scheduling will handle recurring notifications")
      }
    } catch (error) {
      console.log("❌ Error setting up recurring notifications:", error)
    }
  }, [prayerTimes, isSoundEnabled])

  // Setup when prayer times change
  useEffect(() => {
    if (prayerTimes.length > 0) {
      // Schedule immediate notifications
      schedulePrayerNotifications()

      // Only try recurring notifications on iOS
      if (Platform.OS === "ios") {
        scheduleRecurringNotifications()
      }
    }
  }, [prayerTimes, schedulePrayerNotifications, scheduleRecurringNotifications])

  // Cleanup function to cancel all notifications
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      console.log("🗑️ All notifications cancelled")
    } catch (error) {
      console.log("❌ Error cancelling notifications:", error)
    }
  }, [])

  // Debug function to list all scheduled notifications
  const listScheduledNotifications = useCallback(async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync()
      console.log(`📋 ${notifications.length} notifications scheduled (Platform: ${Platform.OS}):`)
      notifications.forEach((notif, index) => {
        const data = notif.content.data || {}
        console.log(`${index + 1}. ${data.prayerName || "Unknown"} - ${notif.content.title}`)
      })
      return notifications
    } catch (error) {
      console.log("❌ Error listing notifications:", error)
      return []
    }
  }, [])

  return {
    schedulePrayerNotifications,
    scheduleRecurringNotifications,
    cancelAllNotifications,
    listScheduledNotifications,
  }
}
