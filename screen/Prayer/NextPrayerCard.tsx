import useDateTimeLocation from "@/hooks/prayerHooks/useCurrentuserlocateion";
import { usePrayerTimes } from "@/hooks/prayerHooks/usePrayerTimes";
import {
  calculateCountdown,
  findCurrentAndNextPrayer,
  formatPrayerTimes,
} from "@/utils/prayerUtils";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const NextPrayerCard = () => {
  const { date, location, isLoading: locationLoading } = useDateTimeLocation();
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
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

  // Memoize prayer times to prevent recalculation
  const prayerTimes = useMemo(() => {
    return prayerData ? formatPrayerTimes(prayerData.timings) : [];
  }, [prayerData]);

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

  const isLoadingData = isLoading || locationLoading;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isLoadingData ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Text style={styles.prayerLabel}>
              {nextPrayer
                ? `Next Prayer: ${nextPrayer.name}`
                : 'No upcoming prayer'}
            </Text>
            {nextPrayer && (
              <Text style={styles.countdown}>
                {`${countdown.hours.toString().padStart(2, '0')}:${countdown.minutes
                  .toString()
                  .padStart(2, '0')}:${countdown.seconds
                  .toString()
                  .padStart(2, '0')}`}
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
    backgroundColor:"#fff",
  },
  card: {
    backgroundColor: '#ffa502',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  prayerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 0,
    textAlign: 'center',
  },
  countdown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },
});

export default NextPrayerCard;
