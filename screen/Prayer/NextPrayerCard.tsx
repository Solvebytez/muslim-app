import useDateTimeLocation from "@/hooks/prayerHooks/useCurrentuserlocateion";
import { usePrayerTimes } from "@/hooks/prayerHooks/usePrayerTimes";
import {
  calculateCountdown,
  findCurrentAndNextPrayer,
  formatPrayerTimes,
} from "@/utils/prayerUtils";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NextPrayerCard = () => {
  const { date, location, isLoading: locationLoading } = useDateTimeLocation();
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const defaultLat = 43.6532;
  const defaultLng = -79.3832;

  const coordinates = useMemo(() => {
    const lat = location?.latitude ?? defaultLat;
    const lng = location?.longitude ?? defaultLng;
    return { latitude: lat, longitude: lng };
  }, [location?.latitude, location?.longitude]);

  const { prayerData, isLoading, error, refetch } = usePrayerTimes(
    date,
    coordinates.latitude,
    coordinates.longitude
  );

  // Track if we've already fetched with real location
  const hasFetchedWithRealLocation = useRef(false);

  // Network monitoring effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Refetch prayer times when real location becomes available
  useEffect(() => {
    const isRealLocation =
      coordinates.latitude !== defaultLat ||
      coordinates.longitude !== defaultLng;

    if (isRealLocation && !hasFetchedWithRealLocation.current) {
      hasFetchedWithRealLocation.current = true;
      refetch();
    }
  }, [
    coordinates.latitude,
    coordinates.longitude,
    defaultLat,
    defaultLng,
    refetch,
  ]);

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
    } finally {
      setRefreshing(false);
    }
  }, [refetch, isOnline]);

  // Memoize prayer times to prevent recalculation
  const prayerTimes = useMemo(() => {
    return prayerData ? formatPrayerTimes(prayerData.timings) : [];
  }, [prayerData]); // Fixed dependency to include full prayerData

  // Memoize current and next prayer
  const { current: currentPrayer, next: nextPrayer } = useMemo(() => {
    return findCurrentAndNextPrayer(prayerTimes);
  }, [prayerTimes]);

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

  const isLoadingData = isLoading && !prayerData;
  const isCalculatingNextPrayer = prayerData && !nextPrayer;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Offline indicator */}
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="wifi-outline" size={14} color="#FF6B6B" />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}

        {isLoadingData || refreshing || isCalculatingNextPrayer ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <View style={styles.prayerLabelContainer}>
              <Text style={styles.prayerLabel}>
                {nextPrayer
                  ? `Next Prayer: ${nextPrayer.name}`
                  : "No upcoming prayer"}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color={isOnline ? "#333" : "#999"}
                />
              </TouchableOpacity>
            </View>
            {coordinates.latitude === defaultLat &&
              coordinates.longitude === defaultLng && (
                <Text style={styles.locationStatus}>
                  Using default location
                </Text>
              )}
            {nextPrayer && (
              <Text style={styles.countdown}>
                {`${countdown.hours
                  .toString()
                  .padStart(2, "0")}:${countdown.minutes
                  .toString()
                  .padStart(2, "0")}:${countdown.seconds
                  .toString()
                  .padStart(2, "0")}`}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#ffa502",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  prayerLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginLeft: 8,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: "#FF6B6B",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  prayerLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  countdown: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B1B1B",
  },
  locationStatus: {
    fontSize: 12,
    color: "#333",
    opacity: 0.7,
    marginTop: 2,
    textAlign: "center",
  },
});

export default NextPrayerCard;
