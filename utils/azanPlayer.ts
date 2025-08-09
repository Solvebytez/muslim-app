"use client"

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"

let azanSound: Audio.Sound | null = null
let isInitialized = false

// Initialize the azan player
export const initializeAzanPlayer = async () => {
  if (isInitialized) return

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    })

    const { sound } = await Audio.Sound.createAsync(require("@/assets/azan.mp3"), {
      shouldPlay: false,
      isLooping: false,
      volume: 1.0,
    })

    azanSound = sound
    isInitialized = true
    console.log("✅ Azan player initialized")
  } catch (error) {
    console.error("❌ Failed to initialize azan player:", error)
  }
}

// Play azan function for use in notifications
export const playAzan = async (prayerName?: string) => {
  if (!azanSound) {
    await initializeAzanPlayer()
  }

  if (!azanSound) {
    console.error("❌ Azan sound not available")
    return
  }

  try {
    console.log(`🔊 Playing azan for ${prayerName || "prayer"}`)
    await azanSound.replayAsync()
  } catch (error) {
    console.error("❌ Failed to play azan:", error)
  }
}

// Stop azan function
export const stopAzan = async () => {
  if (azanSound) {
    try {
      await azanSound.stopAsync()
      console.log("🛑 Azan stopped")
    } catch (error) {
      console.error("❌ Failed to stop azan:", error)
    }
  }
}

// Cleanup function
export const cleanupAzanPlayer = async () => {
  if (azanSound) {
    try {
      await azanSound.unloadAsync()
      azanSound = null
      isInitialized = false
      console.log("🧹 Azan player cleaned up")
    } catch (error) {
      console.error("❌ Failed to cleanup azan player:", error)
    }
  }
}
