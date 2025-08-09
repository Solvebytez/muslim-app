"use client"

import { useBackgroundAzan } from "@/hooks/prayerHooks/useBackgroundAzan"
import { useEnhancedPrayerScheduler } from "@/hooks/prayerHooks/useEnhancedPrayerScheduler"
import { usePrayerSoundSettings } from "@/hooks/prayerHooks/usePrayerSoundSettings"

import type { PrayerTime } from "@/utils/prayerUtils"
import { Audio } from "expo-av"
import type { TimeIntervalTriggerInput } from "expo-notifications"
import * as Notifications from "expo-notifications"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Alert, Linking, Platform, StyleSheet, View } from "react-native"

interface BackgroundAzanSetupProps {
  prayerTimes: PrayerTime[]
}

export const BackgroundAzanSetup: React.FC<BackgroundAzanSetupProps> = ({ prayerTimes }) => {
  const [isBackgroundAzanEnabled, setIsBackgroundAzanEnabled] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState<string>("unknown")

  const { requestEnhancedPermissions } = useBackgroundAzan()
  const { isSoundEnabled } = usePrayerSoundSettings()
  const { scheduleEnhancedPrayerNotifications, listAllScheduledNotifications } = useEnhancedPrayerScheduler(
    prayerTimes,
    isSoundEnabled,
  )

  // Check notification permissions on mount
  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    try {
      const settings = await Notifications.getPermissionsAsync()
      setNotificationStatus(settings.status)
      setIsBackgroundAzanEnabled(settings.status === "granted")
    } catch (error) {
      console.error("Error checking notification status:", error)
    }
  }

  const handleBackgroundAzanToggle = useCallback(async () => {
    if (!isBackgroundAzanEnabled) {
      // Request permissions and enable
      const granted = await requestEnhancedPermissions()
      if (granted) {
        setIsBackgroundAzanEnabled(true)
        await scheduleEnhancedPrayerNotifications()

        Alert.alert(
          "🕌 Background Azan Enabled",
          "Your device will now play the azan at prayer times even when the app is closed. Make sure your device volume is up and Do Not Disturb allows notifications from this app.",
          [{ text: "Got it!", style: "default" }],
        )
      } else {
        Alert.alert(
          "⚠️ Permissions Required",
          "To play azan in the background, please enable notifications in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:")
    } else {
      Linking.openSettings()
    }
}},
          ],
        )
      }
    } else {
      // Disable background azan
      Alert.alert(
        "🔇 Disable Background Azan?",
        "This will stop playing azan when the app is closed. You can still hear azan when the app is open.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await Notifications.cancelAllScheduledNotificationsAsync()
              setIsBackgroundAzanEnabled(false)
            },
          },
        ],
      )
    }
  }, [isBackgroundAzanEnabled, requestEnhancedPermissions, scheduleEnhancedPrayerNotifications])

  const handleTestNotification = useCallback(async () => {
    try {
      const trigger: TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🕌 Test Azan Notification",
          body: "This is how your azan notification will appear",
          sound: false, // We handle sound manually
          data: {
            prayerName: "Fajr", // Use a valid prayer name instead of "Test"
            soundEnabled: true,
            isAzanNotification: true,
            notificationType: "test",
          },
        },
        trigger,
      })

      Alert.alert("✅ Test Sent", "A test azan notification will appear in 2 seconds and should play the azan audio.")
    } catch (error) {
      console.error("❌ Error sending test notification:", error)
      Alert.alert("❌ Test Failed", "Could not send test notification")
    }
  }, [])

  // Add a new function to test audio directly
  const handleTestAudioDirectly = useCallback(async () => {
    try {
      // Configure audio mode first
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      })

      const { sound } = await Audio.Sound.createAsync(require("@/assets/azan.mp3"), {
        shouldPlay: true,
        volume: 1.0,
      })

      Alert.alert("🔊 Testing Audio", "Playing azan directly to test audio file")

      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync()
        }
      })
    } catch (error) {
      Alert.alert("❌ Audio Test Failed", `Could not play audio: ${error}`)
    }
  }, [])

  const handleViewScheduledNotifications = useCallback(async () => {
    const notifications = await listAllScheduledNotifications()
    const azanCount = notifications.filter((n) => n.content.data?.isAzanNotification).length
    const reminderCount = notifications.filter((n) => n.content.data?.notificationType === "reminder").length

    Alert.alert(
      "📋 Scheduled Notifications",
      `Total: ${notifications.length}\nAzan notifications: ${azanCount}\nReminder notifications: ${reminderCount}`,
      [{ text: "OK" }],
    )
  }, [listAllScheduledNotifications])

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="notifications" size={24} color="#4A5FBF" />
          <Text style={styles.title}>Background Azan</Text>
        </View>
        <Switch
          value={isBackgroundAzanEnabled}
          onValueChange={handleBackgroundAzanToggle}
          trackColor={{ false: "#E5E5E5", true: "#4A5FBF40" }}
          thumbColor={isBackgroundAzanEnabled ? "#4A5FBF" : "#999"}
        />
      </View> */}

      {/* <Text style={styles.description}>
        {isBackgroundAzanEnabled
          ? "✅ Azan will play at prayer times even when the app is closed"
          : "❌ Enable to hear azan when the app is closed"}
      </Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Notification Status:</Text>
        <Text style={[styles.statusValue, { color: notificationStatus === "granted" ? "#10ac84" : "#e74c3c" }]}>
          {notificationStatus === "granted" ? "✅ Enabled" : "❌ Disabled"}
        </Text>
      </View> */}

      {/* {isBackgroundAzanEnabled && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Ionicons name="notifications" size={16} color="#4A5FBF" />
            <Text style={styles.actionButtonText}>Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTestAudioDirectly}>
            <Ionicons name="play" size={16} color="#4A5FBF" />
            <Text style={styles.actionButtonText}>Test Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewScheduledNotifications}>
            <Ionicons name="list" size={16} color="#4A5FBF" />
            <Text style={styles.actionButtonText}>View Scheduled</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips for Best Experience:</Text>
        <Text style={styles.tipText}>• Keep your device volume up</Text>
        <Text style={styles.tipText}>• Allow notifications in Do Not Disturb settings</Text>
        <Text style={styles.tipText}>• Enable {"Critical Alerts"} in iOS settings if available</Text>
        <Text style={styles.tipText}>• Custom notification sounds {"don't"} work in simulator</Text>
        <Text style={styles.tipText}>• Test on real device for full azan functionality</Text>
        <Text style={styles.tipText}>• Use {"Test Audio"} button to verify azan file works</Text>
      </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    marginVertical: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A5FBF10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#4A5FBF",
    fontWeight: "500",
  },
  tipsContainer: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 4,
  },
})
