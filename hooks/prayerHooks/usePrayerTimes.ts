"use client";

import { offlineCacheManager } from "@/utils/offlineCacheManager";
import NetInfo from "@react-native-community/netinfo";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

interface PrayerData {
  timings: PrayerTimings;
  date: {
    readable: string;
    gregorian: {
      date: string;
      weekday: {
        en: string;
      };
    };
    hijri: {
      date: string;
      weekday: {
        en: string;
        ar: string;
      };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

interface UsePrayerTimesReturn {
  prayerData: PrayerData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isOffline: boolean;
}

const fetchPrayerTimes = async (
  date: string,
  latitude: number,
  longitude: number
): Promise<PrayerData> => {
  const response = await fetch(
    `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch prayer times");
  }

  const result = await response.json();

  console.log("🌐 Aladhan API Response:", {
    code: result.code,
    hasData: !!result.data,
    dataKeys: result.data ? Object.keys(result.data) : [],
    hasTimings: result.data?.timings ? Object.keys(result.data.timings) : [],
  });

  if (result.code === 200 && result.data) {
    const data = result.data;

    // Validate that timings exist
    if (!data.timings) {
      console.error(
        "❌ API Response missing timings:",
        JSON.stringify(data).substring(0, 500)
      );
      throw new Error("API response missing timings data");
    }

    // Ensure hijri data exists, if not add default
    if (!data.date?.hijri) {
      data.date = data.date || {};
      data.date.hijri = {
        date: "1445-06-15", // Placeholder Hijri date
        weekday: {
          en: "Monday",
          ar: "الاثنين",
        },
      };
    }

    console.log(
      "✅ API Response valid, timings found:",
      Object.keys(data.timings)
    );
    return data;
  } else {
    console.error("❌ Invalid API response:", result);
    throw new Error(`Invalid API response: ${result.code || "unknown"}`);
  }
};

export const usePrayerTimes = (
  date: string,
  latitude: number,
  longitude: number
): UsePrayerTimesReturn => {
  const [isOffline, setIsOffline] = useState(false);

  const {
    data: prayerData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["prayer-times", date, latitude, longitude],
    queryFn: async () => {
      try {
        const result = await fetchPrayerTimes(date, latitude, longitude);

        // Cache the result for offline use
        if (result) {
          const locationData = {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
          };
          await offlineCacheManager.cachePrayerTimes(
            date,
            locationData,
            result
          );
        }

        return result;
      } catch (error) {
        // If online fetch fails, try to load from cache
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          setIsOffline(true);
          const cachedData = await offlineCacheManager.loadCachedPrayerTimes(
            date,
            latitude,
            longitude
          );
          if (cachedData) {
            return cachedData;
          }
        }
        throw error;
      }
    },
    enabled: !!(date && latitude && longitude),
    staleTime: 5 * 60 * 1000, // 5 minutes - prayer times don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: true, // Changed to true to always fetch fresh data
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 1000,
    // Override global network mode to allow offline queries
    networkMode: "always",
  });

  // Check network status on mount
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };

    checkNetworkStatus();
  }, []);

  // Validate prayerData structure before using it
  const isValidPrayerData = (data: any): data is PrayerData => {
    return (
      data &&
      data.timings &&
      typeof data.timings === "object" &&
      data.timings.Fajr &&
      data.timings.Dhuhr
    );
  };

  // Always return data - use default if no data available or data is invalid
  let finalPrayerData: PrayerData | null = prayerData ?? null;

  // If prayerData exists but is invalid, log and use default
  if (prayerData && !isValidPrayerData(prayerData)) {
    console.error("❌ Invalid prayerData structure detected:", {
      hasPrayerData: !!prayerData,
      keys: Object.keys(prayerData || {}),
      hasTimings: !!(prayerData as any)?.timings,
    });
    finalPrayerData = null;
  }

  finalPrayerData =
    finalPrayerData || offlineCacheManager.getDefaultPrayerTimes();

  // Final validation - ensure we always return valid data
  const safePrayerData: PrayerData = isValidPrayerData(finalPrayerData)
    ? finalPrayerData
    : offlineCacheManager.getDefaultPrayerTimes();

  return {
    prayerData: safePrayerData,
    isLoading: isLoading && !isOffline && !safePrayerData,
    error: isOffline ? null : error?.message || null,
    refetch,
    isOffline,
  };
};
