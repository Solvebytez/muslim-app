"use client";

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import type { PrayerTime } from "@/utils/prayerUtils";

const BACKGROUND_NOTIFICATION_TASK = "background-notification-task";
const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications";
const LAST_SCHEDULE_DATE_KEY = "last_schedule_date";

// Enhanced notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { soundEnabled, prayerName, isAzanNotification } =
      notification.request.content.data || {};

    if (isAzanNotification && soundEnabled) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: "azan.mp3",
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: soundEnabled !== false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// Background task for handling notifications
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.error("Background notification task error:", error);
      return;
    }

    if (data) {
      const { notification } = data as any;
      const { prayerName, soundEnabled, isAzanNotification } =
        notification?.request?.content?.data || {};

      console.log(
        `Background task: ${prayerName} prayer notification received`
      );

      if (isAzanNotification && soundEnabled) {
        console.log(`Playing azan for ${prayerName} in background`);
      }
    }
  }
);

interface ScheduledNotification {
  id: string;
  prayerName: string;
  time: string;
  date: string;
  soundEnabled: boolean;
}

export const useUnifiedPrayerNotifications = (
  prayerTimes: PrayerTime[],
  isSoundEnabled: (prayerName: string) => boolean
) => {
  const [isAzanPlaying, setIsAzanPlaying] = useState(false);
  const [currentPlayingPrayer, setCurrentPlayingPrayer] = useState<
    string | null
  >(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const lastNotifiedPrayerRef = useRef<string | null>(null);
  const azanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);
  const scheduledNotificationsRef = useRef<ScheduledNotification[]>([]);

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
        });

        // Load azan sound
        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require("@/assets/azan.mp3"),
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          },
          (status) => {
            if (
              status.isLoaded &&
              "didJustFinish" in status &&
              status.didJustFinish
            ) {
              stopAzan();
            }
          }
        );
        setSound(loadedSound);

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
        });

        if (status === "granted") {
          await setupNotificationChannels();
          await registerBackgroundTask();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Failed to initialize prayer notifications:", error);
      }
    };

    initialize();

    return () => {
      sound?.unloadAsync();
      if (azanTimeoutRef.current) clearTimeout(azanTimeoutRef.current);
    };
  }, []);

  // Setup notification channels for Android
  const setupNotificationChannels = async () => {
    if (Platform.OS !== "android") return;

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
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync("prayer-times", {
        name: "Prayer Times",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A5FBF",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // Add this after the existing channels
      await Notifications.setNotificationChannelAsync("prayer-reminders", {
        name: "Prayer Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A5FBF",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    } catch (error) {
      console.error("❌ Error setting up Android channels:", error);
    }
  };

  // Register background task
  const registerBackgroundTask = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_TASK
      );
      if (!isRegistered) {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
        console.log("✅ Background notification task registered");
      }
    } catch (error) {
      console.error("❌ Error registering background task:", error);
    }
  };

  // Play azan audio
  const playAzan = useCallback(
    async (prayerName: string) => {
      if (
        !sound ||
        isAzanPlaying ||
        !isSoundEnabled(prayerName) ||
        prayerName === "Sunrise"
      ) {
        return;
      }

      try {
        console.log(`🔊 Playing azan for ${prayerName}`);
        setIsAzanPlaying(true);
        setCurrentPlayingPrayer(prayerName);

        await sound.replayAsync();

        // Auto-stop after 3 minutes
        azanTimeoutRef.current = setTimeout(() => {
          console.log("⏱ Auto-stopping azan after 3 minutes");
          stopAzan();
        }, 180000);
      } catch (error) {
        console.error("❌ Azan play failed:", error);
        stopAzan();
      }
    },
    [sound, isAzanPlaying, isSoundEnabled]
  );

  // Stop azan
  const stopAzan = useCallback(async () => {
    if (!isAzanPlaying || !sound) return;

    try {
      await sound.stopAsync();
      console.log("🛑 Azan stopped");
    } catch (error) {
      console.warn("⚠️ Error stopping azan:", error);
    } finally {
      setIsAzanPlaying(false);
      setCurrentPlayingPrayer(null);
      if (azanTimeoutRef.current) {
        clearTimeout(azanTimeoutRef.current);
        azanTimeoutRef.current = null;
      }
    }
  }, [sound, isAzanPlaying]);

  // Generate unique notification ID to prevent duplicates
  const generateNotificationId = (
    prayerName: string,
    date: string,
    time: string
  ): string => {
    return `prayer-${prayerName}-${date}-${time}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
  };

  // Check if notification already scheduled
  const isNotificationScheduled = (id: string): boolean => {
    return scheduledNotificationsRef.current.some((notif) => notif.id === id);
  };

  // Save scheduled notifications to storage
  const saveScheduledNotifications = async (
    notifications: ScheduledNotification[]
  ) => {
    try {
      await SecureStore.setItemAsync(
        SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(notifications)
      );
      scheduledNotificationsRef.current = notifications;
    } catch (error) {
      console.error("❌ Error saving scheduled notifications:", error);
    }
  };

  // Load scheduled notifications from storage
  const loadScheduledNotifications = async (): Promise<
    ScheduledNotification[]
  > => {
    try {
      const stored = await SecureStore.getItemAsync(
        SCHEDULED_NOTIFICATIONS_KEY
      );
      if (stored) {
        const notifications = JSON.parse(stored) as ScheduledNotification[];
        scheduledNotificationsRef.current = notifications;
        return notifications;
      }
    } catch (error) {
      console.error("❌ Error loading scheduled notifications:", error);
    }
    return [];
  };

  // Schedule prayer notifications with deduplication
  const scheduleUnifiedPrayerNotifications = useCallback(async () => {
    if (!prayerTimes.length || !isInitialized) return;

    try {
      const today = new Date();
      const todayStr = today.toDateString();

      // Check if we already scheduled for today
      const lastScheduleDate = await SecureStore.getItemAsync(
        LAST_SCHEDULE_DATE_KEY
      );
      if (lastScheduleDate === todayStr) {
        return;
      }

      // Load existing scheduled notifications
      await loadScheduledNotifications();

      // Cancel all existing scheduled notifications to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const newScheduledNotifications: ScheduledNotification[] = [];
      const daysToSchedule = Platform.OS === "android" ? 7 : 3;

      console.log(
        `📅 Scheduling unified notifications for ${daysToSchedule} days`
      );

      for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dateStr = targetDate.toDateString();

        for (const prayer of prayerTimes) {
          if (prayer.name === "Sunrise") continue;

          const [hours, minutes] = prayer.originalTime.split(":").map(Number);
          const prayerTime = new Date(targetDate);
          prayerTime.setHours(hours, minutes, 0, 0);

          // Skip past prayers for today
          if (dayOffset === 0 && prayerTime <= new Date()) {
            continue;
          }

          const soundEnabled = isSoundEnabled(prayer.name);
          const notificationId = generateNotificationId(
            prayer.name,
            dateStr,
            prayer.originalTime
          );

          // Check if already scheduled to prevent duplicates
          if (isNotificationScheduled(notificationId)) {
            console.log(`⏭ Skipping duplicate: ${prayer.name} on ${dateStr}`);
            continue;
          }

          // Schedule individual notification
          await scheduleIndividualNotification(
            prayer,
            prayerTime,
            soundEnabled,
            notificationId
          );

          // Schedule 10-minute reminder notification if sound is enabled
          if (soundEnabled) {
            const reminderTime = new Date(
              prayerTime.getTime() - 10 * 60 * 1000
            );
            if (reminderTime > new Date()) {
              const reminderNotificationId = generateNotificationId(
                `${prayer.name}-reminder`,
                dateStr,
                prayer.originalTime
              );
              await scheduleReminderNotification(
                prayer,
                reminderTime,
                reminderNotificationId
              );

              newScheduledNotifications.push({
                id: reminderNotificationId,
                prayerName: `${prayer.name}-reminder`,
                time: prayer.originalTime,
                date: dateStr,
                soundEnabled: false, // Reminders use default sound
              });
            }
          }

          newScheduledNotifications.push({
            id: notificationId,
            prayerName: prayer.name,
            time: prayer.originalTime,
            date: dateStr,
            soundEnabled,
          });
        }
      }

      // Save scheduled notifications and update last schedule date
      await saveScheduledNotifications(newScheduledNotifications);
      await SecureStore.setItemAsync(LAST_SCHEDULE_DATE_KEY, todayStr);

      console.log(
        `✅ Scheduled ${newScheduledNotifications.length} unique notifications`
      );
    } catch (error) {
      console.error("❌ Error scheduling unified prayer notifications:", error);
    }
  }, [prayerTimes, isSoundEnabled, isInitialized]);

  // Schedule individual notification
  const scheduleIndividualNotification = async (
    prayer: PrayerTime,
    triggerTime: Date,
    soundEnabled: boolean,
    notificationId: string
  ) => {
    try {
      const secondsUntilTrigger = Math.floor(
        (triggerTime.getTime() - Date.now()) / 1000
      );

      if (secondsUntilTrigger <= 0) {
        console.log(`⏭ Skipping past prayer: ${prayer.name}`);
        return;
      }

      const timeIntervalTrigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      };

      const trigger =
        Platform.OS === "android"
          ? {
              ...timeIntervalTrigger,
              channelId: soundEnabled ? "azan-channel" : "prayer-times",
            }
          : timeIntervalTrigger;

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
            notificationType: "unified-azan",
          },
        },
        trigger,
        identifier: notificationId,
      });

      const hoursUntil = Math.floor(secondsUntilTrigger / 3600);
      const minutesUntil = Math.floor((secondsUntilTrigger % 3600) / 60);

      console.log(
        `✅ Scheduled ${prayer.name} in ${hoursUntil}h ${minutesUntil}m - Sound: ${soundEnabled}`
      );
    } catch (error) {
      console.error(`❌ Error scheduling ${prayer.name} notification:`, error);
    }
  };

  // Schedule reminder notification (10 minutes before prayer)
  const scheduleReminderNotification = async (
    prayer: PrayerTime,
    triggerTime: Date,
    notificationId: string
  ) => {
    try {
      const secondsUntilTrigger = Math.floor(
        (triggerTime.getTime() - Date.now()) / 1000
      );

      if (secondsUntilTrigger <= 0) {
        console.log(`⏭ Skipping past reminder: ${prayer.name}`);
        return;
      }

      const timeIntervalTrigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      };

      const trigger =
        Platform.OS === "android"
          ? { ...timeIntervalTrigger, channelId: "prayer-times" }
          : timeIntervalTrigger;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${prayer.name} Prayer Reminder`,
          body: `${prayer.name} prayer is in 10 minutes. Prepare for prayer.`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
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
      });

      const hoursUntil = Math.floor(secondsUntilTrigger / 3600);
      const minutesUntil = Math.floor((secondsUntilTrigger % 3600) / 60);

      console.log(
        `⏰ Scheduled ${prayer.name} reminder in ${hoursUntil}h ${minutesUntil}m`
      );
    } catch (error) {
      console.error(`❌ Error scheduling ${prayer.name} reminder:`, error);
    }
  };

  // Handle notification received while app is open
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      ({ request }) => {
        const { prayerName, soundEnabled, isAzanNotification } =
          request.content.data || {};

        if (
          typeof prayerName === "string" &&
          isAzanNotification &&
          soundEnabled &&
          prayerName !== "Sunrise" &&
          AppState.currentState === "active"
        ) {
          setTimeout(() => playAzan(prayerName), 500);
        }
      }
    );

    return () => subscription.remove();
  }, [playAzan]);

  // Handle notification tap
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      ({ notification }) => {
        const { prayerName, soundEnabled, isAzanNotification } =
          notification.request.content.data || {};

        if (
          typeof prayerName === "string" &&
          isAzanNotification &&
          soundEnabled &&
          prayerName !== "Sunrise"
        ) {
          setTimeout(() => playAzan(prayerName), 1000);
        }
      }
    );

    return () => subscription.remove();
  }, [playAzan]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  // Auto-schedule when prayer times change
  useEffect(() => {
    if (prayerTimes.length > 0 && isInitialized) {
      scheduleUnifiedPrayerNotifications();
    }
  }, [prayerTimes, scheduleUnifiedPrayerNotifications, isInitialized]);

  // Debug function to list all scheduled notifications
  const listAllScheduledNotifications = useCallback(async () => {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 ${notifications.length} total notifications scheduled:`);

      notifications.forEach((notif, index) => {
        const data = notif.content.data || {};
        console.log(
          `${index + 1}. ${data.prayerName || "Unknown"} - ${
            notif.content.title
          }`
        );
      });

      return notifications;
    } catch (error) {
      console.error("❌ Error listing notifications:", error);
      return [];
    }
  }, []);

  // Cancel all notifications and clear storage
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await SecureStore.deleteItemAsync(SCHEDULED_NOTIFICATIONS_KEY);
      await SecureStore.deleteItemAsync(LAST_SCHEDULE_DATE_KEY);
      scheduledNotificationsRef.current = [];
      console.log("🗑️ All notifications cancelled and storage cleared");
    } catch (error) {
      console.error("❌ Error cancelling notifications:", error);
    }
  }, []);

  return {
    isAzanPlaying,
    currentPlayingPrayer,
    playAzan,
    stopAzan,
    scheduleUnifiedPrayerNotifications,
    listAllScheduledNotifications,
    cancelAllNotifications,
    isInitialized,
  };
};
