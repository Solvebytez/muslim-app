"use client";

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as Notifications from "expo-notifications";
import type { TaskManagerTaskBody } from "expo-task-manager";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

const BACKGROUND_NOTIFICATION_TASK = "background-notification-task";

// Enhanced notification handler for background azan
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { soundEnabled, prayerName, isAzanNotification } =
      notification.request.content.data || {};

    // For azan notifications, we want maximum priority
    if (isAzanNotification && soundEnabled) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        // Use custom sound for azan
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

// Background task for handling notifications - Fixed to return Promise
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }: TaskManagerTaskBody<any>) => {
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
        // The system will handle playing the custom sound
        console.log(`Playing azan for ${prayerName} in background`);
      }
    }
  }
);

export const useBackgroundAzan = () => {
  const appState = useRef(AppState.currentState);

  // Setup background audio configuration
  useEffect(() => {
    const setupBackgroundAudio = async () => {
      try {
        // Configure audio for background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });

        console.log("✅ Background audio configured");
      } catch (error) {
        console.error("❌ Error configuring background audio:", error);
      }
    };

    setupBackgroundAudio();
  }, []);

  // Register background task
  useEffect(() => {
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

    registerBackgroundTask();

    return () => {
      // Cleanup if needed
      TaskManager.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(
        console.error
      );
    };
  }, []);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  // Enhanced notification permissions request
  const requestEnhancedPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          allowProvisional: false,
          // allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      if (status === "granted") {
        // Setup notification channels for Android
        if (Platform.OS === "android") {
          await setupAndroidNotificationChannels();
        }

        console.log("✅ Enhanced notification permissions granted");
        return true;
      } else {
        console.log("⚠️ Enhanced notification permissions denied");
        return false;
      }
    } catch (error) {
      console.error("❌ Error requesting enhanced permissions:", error);
      return false;
    }
  }, []);

  // Setup Android notification channels with high priority
  const setupAndroidNotificationChannels = async () => {
    try {
      // High priority channel for azan
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

      // Regular prayer notifications
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
    } catch (error) {
      console.error("❌ Error setting up Android channels:", error);
    }
  };

  return {
    requestEnhancedPermissions,
    setupAndroidNotificationChannels,
  };
};
