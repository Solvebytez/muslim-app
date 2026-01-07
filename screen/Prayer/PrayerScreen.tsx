"use client";

import { AntDesign, Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HijriCalendar from "@/components/HijriCalendar";
import useDateTimeLocation from "@/hooks/prayerHooks/useCurrentuserlocateion";
import { usePrayerSoundSettings } from "@/hooks/prayerHooks/usePrayerSoundSettings";
import { usePrayerTimes } from "@/hooks/prayerHooks/usePrayerTimes";
import { useUnifiedPrayerNotifications } from "@/hooks/prayerHooks/useUnifiedPrayerNotifications";

import {
  calculateCountdown,
  findCurrentAndNextPrayer,
  formatPrayerTimes,
} from "@/utils/prayerUtils";
import MosqueCard from "./MosqueCard";

const STORAGE_KEY = "completed_prayers";
const DATE_KEY = "last_completed_date";

const MosqueSilhouette = () => (
  <View style={styles.mosqueContainer}>
    <View style={styles.mosqueBase}>
      {/* Domes */}
      <View style={[styles.dome, { left: 20, width: 40, height: 20 }]} />
      <View style={[styles.dome, { left: 70, width: 50, height: 25 }]} />
      <View style={[styles.dome, { left: 130, width: 45, height: 22 }]} />
      <View style={[styles.dome, { left: 185, width: 35, height: 18 }]} />
      <View style={[styles.dome, { left: 230, width: 40, height: 20 }]} />

      {/* Minarets */}
      <View style={[styles.minaret, { left: 45, height: 60 }]}>
        <View style={styles.minaretTop} />
      </View>
      <View style={[styles.minaret, { left: 95, height: 80 }]}>
        <View style={styles.minaretTop} />
      </View>
      <View style={[styles.minaret, { left: 155, height: 70 }]}>
        <View style={styles.minaretTop} />
      </View>
      <View style={[styles.minaret, { left: 205, height: 55 }]}>
        <View style={styles.minaretTop} />
      </View>

      {/* Main building */}
      <View style={styles.mainBuilding} />
    </View>
  </View>
);

export default function PrayerScreen() {
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);
  const [showHijriCalendar, setShowHijriCalendar] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  const INFO_KEY = "has_seen_intro_info";
  const [showIntroInfo, setShowIntroInfo] = useState(false);

  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasSeen = await SecureStore.getItemAsync(INFO_KEY);
      if (!hasSeen) {
        setShowIntroInfo(true);
      }
    };
    checkFirstVisit();
  }, []);

  const handleIntroDismiss = async () => {
    await SecureStore.setItemAsync(INFO_KEY, "true");
    setShowIntroInfo(false);
  };

  const defaultLat = 43.6532;
  const defaultLng = -79.3832;

  const { date, location, isLoading: locationLoading } = useDateTimeLocation();
  console.log("🕌 PrayerScreen - Location state:", {
    location,
    locationLoading,
    date,
  });

  // Prayer sound settings hook
  const {
    soundSettings,
    isLoading: soundSettingsLoading,
    togglePrayerSound,
    isSoundEnabled,
  } = usePrayerSoundSettings();
  console.log("🔊 PrayerScreen - Sound settings:", {
    soundSettingsLoading,
    isSoundEnabled,
  });

  // Create stable coordinates that only change when location actually changes
  const coordinates = useMemo(() => {
    const lat = location?.latitude ?? defaultLat;
    const lng = location?.longitude ?? defaultLng;
    const coords = { latitude: lat, longitude: lng };
    console.log("📍 PrayerScreen - Coordinates:", coords);
    return coords;
  }, [location?.latitude, location?.longitude, defaultLat, defaultLng]);

  const { prayerData, isLoading, error, refetch } = usePrayerTimes(
    date,
    coordinates.latitude,
    coordinates.longitude
  );
  console.log("🕐 PrayerScreen - Prayer times state:", {
    hasPrayerData: !!prayerData,
    isLoading,
    error: error?.message || error,
    date,
    coordinates: `${coordinates.latitude}, ${coordinates.longitude}`,
  });

  // Memoize prayer times to prevent recalculation
  const prayerTimes = useMemo(() => {
    if (!prayerData) {
      console.log("📿 PrayerScreen - No prayer data available");
      return [];
    }
    
    // Debug: Log the entire prayerData structure to see what we have
    console.log("📿 PrayerScreen - Raw prayer data structure:", {
      hasPrayerData: !!prayerData,
      prayerDataKeys: Object.keys(prayerData),
      hasTimings: !!prayerData.timings,
      timingsType: typeof prayerData.timings,
      timingsValue: prayerData.timings,
      fullDataSample: JSON.stringify(prayerData).substring(0, 500),
    });
    
    // Try to get timings - might be nested differently
    const timings = prayerData.timings || prayerData.data?.timings || null;
    
    if (!timings) {
      console.error("❌ PrayerScreen - No timings found in prayerData structure!");
      return [];
    }
    
    console.log("📿 PrayerScreen - Found timings:", {
      timingsKeys: Object.keys(timings),
      timingsSample: {
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
      },
    });
    
    const times = formatPrayerTimes(timings);
    console.log("📿 PrayerScreen - Formatted prayer times:", {
      count: times.length,
      times: times.map(t => `${t.name}: ${t.time}`),
    });
    
    return times;
  }, [prayerData]); // Fixed dependency to include full prayerData

  // Memoize current and next prayer
  const { current: currentPrayer, next: nextPrayer } = useMemo(() => {
    const result = findCurrentAndNextPrayer(prayerTimes);
    console.log("🕌 PrayerScreen - Current/Next prayer:", {
      current: currentPrayer?.name || "None",
      next: nextPrayer?.name || "None",
    });
    return result;
  }, [prayerTimes]);

  // Use unified prayer notifications hook instead of multiple hooks
  const {
    isAzanPlaying,
    currentPlayingPrayer,
    playAzan,
    stopAzan,
    scheduleUnifiedPrayerNotifications,
    listAllScheduledNotifications,
    cancelAllNotifications,
    isInitialized,
  } = useUnifiedPrayerNotifications(prayerTimes, isSoundEnabled);

  // Countdown effect - only runs when nextPrayer changes
  useEffect(() => {
    if (!nextPrayer) {
      setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const nextPrayerTime = nextPrayer.originalTime;

    const updateCountdown = () => {
      const newCountdown = calculateCountdown(nextPrayerTime);
      setCountdown(newCountdown);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer]);

  // Network monitoring effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      setIsOnline(state.isConnected ?? false);

      // Show offline alert when going offline
      if (wasOffline && state.isConnected) {
        setShowOfflineAlert(false);
      } else if (!wasOffline && !state.isConnected) {
        setShowOfflineAlert(true);
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
      return;
    }

    setRefreshing(true);
    try {
      await refetch();
      // Re-schedule notifications when data is refreshed
      if (prayerTimes.length > 0 && isInitialized) {
        scheduleUnifiedPrayerNotifications();
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    refetch,
    scheduleUnifiedPrayerNotifications,
    prayerTimes,
    isInitialized,
    isOnline,
  ]);

  const handleStopAzan = useCallback(() => {
    stopAzan();
  }, [stopAzan]);

  const handleSoundToggle = useCallback(
    (prayerName: string) => {
      if (prayerName === "Sunrise") {
        Alert.alert(
          "Info",
          "Sunrise is not a prayer time, so azan is not applicable."
        );
        return;
      }

      const currentlyEnabled = isSoundEnabled(prayerName);
      const action = currentlyEnabled ? "mute" : "enable";
      const icon = currentlyEnabled ? "🔇" : "🔊";

      Alert.alert(
        `${icon} ${prayerName} Azan`,
        `Do you want to ${action} azan for ${prayerName} prayer?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: currentlyEnabled ? "Mute" : "Enable",
            onPress: () => {
              togglePrayerSound(prayerName);
              // Re-schedule notifications with updated settings
              setTimeout(() => {
                scheduleUnifiedPrayerNotifications();
              }, 100);
            },
            style: currentlyEnabled ? "destructive" : "default",
          },
          {
            text: "Play Now",
            onPress: () => playAzan(prayerName),
          },
        ]
      );
    },
    [
      isSoundEnabled,
      togglePrayerSound,
      playAzan,
      scheduleUnifiedPrayerNotifications,
    ]
  );

  useEffect(() => {
    const loadPrayer = async () => {
      const storedTodayDate = await SecureStore.getItemAsync(DATE_KEY);

      if (storedTodayDate !== date) {
        setCompletedPrayers([]);
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify([]));
        await SecureStore.setItemAsync(DATE_KEY, date);
      } else {
        const storedPrayers = await SecureStore.getItemAsync(STORAGE_KEY);
        if (storedPrayers) {
          setCompletedPrayers(JSON.parse(storedPrayers));
        }
      }
    };

    loadPrayer();
  }, [date]);

  const savePrayers = async (prayers: string[]) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prayers));
  };

  const handlePrayerComplete = (prayerName: string) => {
    setCompletedPrayers((prev) => {
      let updated;
      if (prev.includes(prayerName)) {
        updated = prev.filter((name) => name !== prayerName);
      } else {
        updated = [...prev, prayerName];
      }
      savePrayers(updated);
      return updated;
    });
  };

  const handleHijriCalendarOpen = useCallback(() => {
    setShowHijriCalendar(true);
  }, []);

  const handleHijriCalendarClose = useCallback(() => {
    setShowHijriCalendar(false);
  }, []);

  // Debug functions
  const handleDebugNotifications = useCallback(async () => {
    const notifications = await listAllScheduledNotifications();
    Alert.alert(
      "Debug Info",
      `${notifications.length} notifications scheduled. Check console for details.`
    );
  }, [listAllScheduledNotifications]);

  const handleCancelAllNotifications = useCallback(async () => {
    Alert.alert(
      "Cancel All Notifications",
      "Are you sure you want to cancel all scheduled notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Cancel All",
          style: "destructive",
          onPress: cancelAllNotifications,
        },
      ]
    );
  }, [cancelAllNotifications]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load prayer times</Text>
          <Text style={styles.errorDetails}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Add timeout to prevent infinite loading - show content after max 3 seconds
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    console.log("⏱️ PrayerScreen - Starting loading timeout (3 seconds)");
    const timeout = setTimeout(() => {
      console.log("⏱️ PrayerScreen - Loading timeout reached, showing content");
      setLoadingTimeout(true);
    }, 3000); // 3 second max loading time
    
    return () => {
      console.log("⏱️ PrayerScreen - Clearing loading timeout");
      clearTimeout(timeout);
    };
  }, []);

  // Show content if we have prayer data OR if timeout has passed OR if we have coordinates
  // This prevents infinite loading when location is taking too long
  // Since we have default coordinates (Toronto), we can show prayer data immediately
  const hasValidCoordinates = coordinates.latitude && coordinates.longitude;
  const hasLocationData = !!location; // Check if we have actual location object, not just coordinates
  
  // Don't wait for locationLoading if we already have location data AND prayer data
  // locationLoading can stay true while getting fresh location in background
  const isLoadingData =
    !loadingTimeout && 
    !prayerData &&
    (isLoading || 
     (locationLoading && !hasLocationData && !hasValidCoordinates) || 
     soundSettingsLoading);
  
  console.log("🔄 PrayerScreen - Loading states:", {
    loadingTimeout,
    hasPrayerData: !!prayerData,
    hasValidCoordinates,
    hasLocationData,
    isLoading,
    locationLoading,
    soundSettingsLoading,
    isLoadingData,
    finalDecision: isLoadingData ? "SHOWING LOADING" : "SHOWING CONTENT",
    reason: isLoadingData 
      ? `Waiting for: ${!prayerData ? 'prayerData' : ''} ${isLoading ? 'isLoading' : ''} ${locationLoading && !hasLocationData ? 'location' : ''} ${soundSettingsLoading ? 'soundSettings' : ''}`
      : "All data ready or timeout passed",
  });
  const isCalculatingPrayerData = prayerData && prayerTimes.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />
      {/* Intro Info Modal */}
      <Modal visible={showIntroInfo} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              marginHorizontal: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
              Notification Info
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 5 }}>
              ✅ App is not in battery optimization
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 5 }}>
              ✅ Notifications are enabled for the app
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 15 }}>
              ✅ {"Do Not Disturb"} is not blocking notifications
            </Text>
            <TouchableOpacity
              onPress={handleIntroDismiss}
              style={{ alignSelf: "flex-end", padding: 10 }}
            >
              <Text style={{ color: "#4A5FBF", fontWeight: "600" }}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Offline Alert Modal */}
      <Modal visible={showOfflineAlert} transparent animationType="fade">
        <View style={styles.offlineModalOverlay}>
          <View style={styles.offlineModalContent}>
            <View style={styles.offlineIconContainer}>
              <Ionicons name="wifi-outline" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.offlineTitle}>No Internet Connection</Text>
            <Text style={styles.offlineMessage}>
              The app is currently offline. Please check your internet
              connection and pull down to refresh when you&apos;re back online.
            </Text>
            <TouchableOpacity
              style={styles.offlineButton}
              onPress={() => setShowOfflineAlert(false)}
            >
              <Text style={styles.offlineButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <LinearGradient
        colors={["#4A5FBF", "#7B68EE", "#DDA0DD"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header with next prayer */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>

          {/* Azan control button */}
          {isAzanPlaying && (
            <TouchableOpacity
              style={styles.azanButton}
              onPress={handleStopAzan}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          )}

          {/* Debug button */}
          {/* <TouchableOpacity style={[styles.azanButton, { left: 70 }]} onPress={handleDebugNotifications}>
            <Ionicons name="bug" size={20} color="white" />
          </TouchableOpacity> */}

          {isLoadingData || isCalculatingPrayerData ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              {/* Offline indicator */}
              {!isOnline && (
                <View style={styles.offlineIndicator}>
                  <Ionicons name="wifi-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}

              <Text style={styles.currentPrayerName}>
                {nextPrayer ? `Next: ${nextPrayer.name}` : "No upcoming prayer"}
              </Text>
              {location?.latitude && location?.longitude && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={styles.locationText}>
                    📍{" "}
                    {location.city +
                      ", " +
                      location.region +
                      ", " +
                      location.country}
                  </Text>
                </View>
              )}
              {(!location?.latitude || !location?.longitude) && (
                <Text style={styles.locationText}>
                  📍 Using default location (Toronto)
                </Text>
              )}
              <Text style={styles.currentTime}>
                {nextPrayer ? `${nextPrayer.time} ` : ""}
                <Text style={styles.period}>{nextPrayer?.period || ""}</Text>
              </Text>
              {nextPrayer && (
                <Text style={styles.countdownText}>
                  {`${countdown.hours
                    .toString()
                    .padStart(2, "0")}:${countdown.minutes
                    .toString()
                    .padStart(2, "0")}:${countdown.seconds
                    .toString()
                    .padStart(2, "0")}`}
                </Text>
              )}
              {isAzanPlaying && (
                <Text style={styles.azanPlayingText}>
                  🔊 Playing Azan{" "}
                  {currentPlayingPrayer ? `for ${currentPlayingPrayer}` : ""}
                </Text>
              )}
              {!isInitialized && (
                <Text style={styles.initializingText}>
                  🔄 Initializing notifications...
                </Text>
              )}
            </>
          )}
        </View>

        {/* Mosque silhouette */}
        <MosqueSilhouette />

        {/* Prayer times list */}
        <View style={styles.prayerListContainer}>
          <ScrollView
            style={styles.prayerList}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#4A5FBF"]}
                tintColor="#4A5FBF"
                title={isOnline ? "Pull to refresh" : "No internet connection"}
                titleColor="#666"
              />
            }
          >
            {isLoadingData || isCalculatingPrayerData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A5FBF" />
                <Text style={styles.loadingText}>Loading prayer times...</Text>
              </View>
            ) : (
              <>
                {prayerData && prayerData.date && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {prayerData.date.readable}
                    </Text>
                    {prayerData?.date?.hijri &&
                      prayerData?.date?.hijri?.date && (
                        <Text style={styles.hijriText}>
                          Hijri: {prayerData.date.hijri.date}
                        </Text>
                      )}
                    <TouchableOpacity
                      onPress={handleHijriCalendarOpen}
                      style={styles.hijriDateButton}
                    >
                      <Text style={{}}>📅 Hijri Calendar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {prayerTimes.map((prayer, index) => {
                  const isCurrent = currentPrayer?.name === prayer.name;
                  const isNext = nextPrayer?.name === prayer.name;
                  const soundEnabled = isSoundEnabled(prayer.name);
                  const isPlayingThis = currentPlayingPrayer === prayer.name;

                  // Determine sound icon
                  let soundIcon = "volume-mute-outline";
                  let soundColor = "#999";

                  if (prayer.name === "Sunrise") {
                    soundIcon = "sunny-outline";
                    soundColor = "#FFA500";
                  } else if (isPlayingThis) {
                    soundIcon = "volume-high";
                    soundColor = "#4A5FBF";
                  } else if (soundEnabled) {
                    soundIcon = "volume-medium-outline";
                    soundColor = isCurrent || isNext ? "#4A5FBF" : "#666";
                  } else {
                    soundIcon = "volume-mute-outline";
                    soundColor = "#999";
                  }

                  return (
                    <TouchableOpacity
                      key={`${prayer.name}-${index}`}
                      style={[
                        styles.prayerItem,
                        isCurrent && styles.currentPrayerItem,
                        isNext && styles.nextPrayerItem,
                      ]}
                    >
                      <View style={styles.prayerNameContainer}>
                        <Text
                          style={[
                            styles.prayerName,
                            (isCurrent || isNext) &&
                              styles.highlightedPrayerText,
                          ]}
                        >
                          {prayer.name}
                        </Text>
                        <View style={styles.statusContainer}>
                          {isCurrent && (
                            <Text style={styles.statusText}>Current</Text>
                          )}
                          {isNext && (
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  backgroundColor: "#FFA500",
                                  color: "#000",
                                  paddingHorizontal: 10,
                                  borderRadius: 10,
                                  fontWeight: "bold",
                                },
                              ]}
                            >
                              Next
                            </Text>
                          )}
                          {prayer.name !== "Sunrise" && (
                            <Text
                              style={[
                                styles.soundStatusText,
                                { color: soundEnabled ? "#10ac84" : "#999" },
                              ]}
                            >
                              {soundEnabled ? "🔊 Enabled" : "🔇 Muted"}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.prayerTimeContainer}>
                        <Text
                          style={[
                            styles.prayerTime,
                            (isCurrent || isNext) &&
                              styles.highlightedPrayerText,
                          ]}
                        >
                          {prayer.time} {prayer.period}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.soundButton,
                            !soundEnabled &&
                              prayer.name !== "Sunrise" &&
                              styles.mutedSoundButton,
                          ]}
                          onPress={() => handleSoundToggle(prayer.name)}
                        >
                          <Ionicons
                            name={soundIcon as any}
                            size={20}
                            color={soundColor}
                          />
                        </TouchableOpacity>
                        {prayer.name !== "Sunrise" && (
                          <TouchableOpacity
                            style={[
                              styles.soundButton,
                              !soundEnabled &&
                                prayer.name !== "Sunrise" &&
                                styles.mutedSoundButton,
                            ]}
                            onPress={() => handlePrayerComplete(prayer.name)}
                          >
                            {completedPrayers.includes(prayer.name) ? (
                              <Text>
                                {" "}
                                <AntDesign
                                  name="checkcircle"
                                  size={20}
                                  color="#10ac84"
                                />
                              </Text>
                            ) : (
                              <Text>
                                {" "}
                                <AntDesign
                                  name="checkcircleo"
                                  size={20}
                                  color="#999"
                                />
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {location && (
                  <MosqueCard
                    lat={location.latitude}
                    lng={location.longitude}
                  />
                )}

                {/* Background Azan Setup Component */}
                {/* <BackgroundAzanSetup prayerTimes={prayerTimes} /> */}

                {/* Debug section */}
                {/* <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>🔧 Debug Controls</Text>
                  <TouchableOpacity style={styles.debugButton} onPress={handleDebugNotifications}>
                    <Text style={styles.debugButtonText}>📋 List Scheduled Notifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.debugButton, styles.dangerButton]}
                    onPress={handleCancelAllNotifications}
                  >
                    <Text style={[styles.debugButtonText, { color: "white" }]}>🗑️ Cancel All Notifications</Text>
                  </TouchableOpacity>
                  <Text style={styles.debugInfo}>Initialization: {isInitialized ? "✅ Ready" : "⏳ Loading"}</Text>
                  <Text style={styles.debugInfo}>System: Unified notifications with deduplication</Text>
                </View> */}
              </>
            )}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Hijri Calendar Modal */}
      <HijriCalendar
        visible={showHijriCalendar}
        onClose={handleHijriCalendarClose}
        currentHijriDate={prayerData?.date?.hijri?.date || "1445-06-15"}
        currentGregorianDate={
          prayerData?.date?.readable || new Date().toLocaleDateString()
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10ac84",
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    position: "relative",
  },
  refreshButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 8,
  },
  azanButton: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  currentPrayerName: {
    fontSize: 24,
    fontWeight: "300",
    color: "white",
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: "200",
    color: "white",
  },
  period: {
    fontSize: 24,
    fontWeight: "300",
  },
  countdownText: {
    fontSize: 18,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
  },
  azanPlayingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFD700",
    marginTop: 8,
  },
  initializingText: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  mosqueContainer: {
    height: 130,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 3,
  },
  mosqueBase: {
    position: "relative",
    height: 80,
  },
  dome: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    bottom: 30,
  },
  minaret: {
    position: "absolute",
    width: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    bottom: 30,
  },
  minaretTop: {
    width: 12,
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
    position: "absolute",
    top: -4,
    left: -2,
  },
  mainBuilding: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  prayerListContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  prayerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  hijriDateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#4A5FBF10",
    borderRadius: 8,
    marginBottom: 8,
  },
  hijriText: {
    fontSize: 14,
    color: "#10ac84",
    fontWeight: "600",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#fff",
    fontStyle: "italic",
  },
  prayerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  currentPrayerItem: {
    backgroundColor: "#10ac8410",
    borderWidth: 1,
    borderColor: "#10ac84",
  },
  nextPrayerItem: {
    backgroundColor: "#4A5FBF10",
    borderWidth: 1,
    borderColor: "#4A5FBF",
  },
  prayerNameContainer: {
    flexDirection: "column",
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#4A5FBF",
    fontWeight: "600",
  },
  soundStatusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  highlightedPrayerText: {
    color: "#4A5FBF",
    fontWeight: "600",
  },
  prayerTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  prayerTime: {
    fontSize: 16,
    color: "#666",
    marginRight: 12,
  },
  soundButton: {
    padding: 8,
    borderRadius: 20,
  },
  mutedSoundButton: {
    backgroundColor: "#f0f0f0",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  errorDetails: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4A5FBF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: "#4A5FBF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  debugButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  debugInfo: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  // Offline styles
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  offlineText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  offlineModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  offlineModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: "center",
    maxWidth: 320,
  },
  offlineIconContainer: {
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  offlineMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  offlineButton: {
    backgroundColor: "#4A5FBF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  offlineButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
