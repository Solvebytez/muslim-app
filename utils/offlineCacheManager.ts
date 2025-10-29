import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";

// Cache keys
const PRAYER_TIMES_CACHE_PREFIX = "prayer_times_cache_";
const COMMON_LOCATIONS_CACHE = "common_locations_cache";
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export interface PrayerData {
  timings: {
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
  };
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

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  street?: string;
}

export interface CachedPrayerData {
  data: PrayerData;
  timestamp: number;
  location: LocationData;
}

export interface CachedLocationData {
  data: LocationData;
  timestamp: number;
}

class OfflineCacheManager {
  // Generate cache key for prayer times
  private getPrayerTimesCacheKey(
    date: string,
    lat: number,
    lng: number
  ): string {
    return `${PRAYER_TIMES_CACHE_PREFIX}${date}_${lat.toFixed(4)}_${lng.toFixed(
      4
    )}`;
  }

  // Cache prayer times for a specific date and location
  async cachePrayerTimes(
    date: string,
    location: LocationData,
    prayerData: PrayerData
  ): Promise<void> {
    try {
      const cacheKey = this.getPrayerTimesCacheKey(
        date,
        location.latitude,
        location.longitude
      );
      const cachedData: CachedPrayerData = {
        data: prayerData,
        timestamp: Date.now(),
        location: location,
      };

      await SecureStore.setItemAsync(cacheKey, JSON.stringify(cachedData));
    } catch (error) {}
  }

  // Load cached prayer times
  async loadCachedPrayerTimes(
    date: string,
    lat: number,
    lng: number
  ): Promise<PrayerData | null> {
    try {
      const cacheKey = this.getPrayerTimesCacheKey(date, lat, lng);
      const cached = await SecureStore.getItemAsync(cacheKey);

      if (cached) {
        const { data, timestamp }: CachedPrayerData = JSON.parse(cached);

        // Check if cache is still valid (less than 24 hours old)
        if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
          return data;
        } else {
          // Cache expired, remove it
          await SecureStore.deleteItemAsync(cacheKey);
        }
      }
    } catch (error) {}

    return null;
  }

  // Get default prayer times for Toronto (fallback)
  getDefaultPrayerTimes(): PrayerData {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    return {
      timings: {
        Fajr: "05:30",
        Sunrise: "07:00",
        Dhuhr: "12:15",
        Asr: "15:30",
        Sunset: "17:45",
        Maghrib: "18:00",
        Isha: "19:30",
        Imsak: "05:20",
        Midnight: "00:15",
        Firstthird: "22:30",
        Lastthird: "02:00",
      },
      date: {
        readable: today.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        gregorian: {
          date: dateStr,
          weekday: {
            en: today.toLocaleDateString("en-US", { weekday: "long" }),
          },
        },
        hijri: {
          date: "1445-06-15", // Placeholder Hijri date
          weekday: {
            en: "Monday",
            ar: "الاثنين",
          },
        },
      },
      meta: {
        latitude: 43.6532,
        longitude: -79.3832,
        timezone: "America/Toronto",
      },
    };
  }

  // Pre-cache common locations
  async preCacheCommonLocations(): Promise<void> {
    const commonLocations: LocationData[] = [
      {
        latitude: 43.6532,
        longitude: -79.3832,
        timestamp: new Date().toISOString(),
        city: "Toronto",
        region: "Ontario",
        country: "Canada",
      },
      {
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: new Date().toISOString(),
        city: "New York",
        region: "New York",
        country: "United States",
      },
      {
        latitude: 51.5074,
        longitude: -0.1278,
        timestamp: new Date().toISOString(),
        city: "London",
        region: "England",
        country: "United Kingdom",
      },
      {
        latitude: 25.2048,
        longitude: 55.2708,
        timestamp: new Date().toISOString(),
        city: "Dubai",
        region: "Dubai",
        country: "United Arab Emirates",
      },
      {
        latitude: 24.7136,
        longitude: 46.6753,
        timestamp: new Date().toISOString(),
        city: "Riyadh",
        region: "Riyadh",
        country: "Saudi Arabia",
      },
    ];

    try {
      const cachedData: CachedLocationData[] = commonLocations.map(
        (location) => ({
          data: location,
          timestamp: Date.now(),
        })
      );

      await SecureStore.setItemAsync(
        COMMON_LOCATIONS_CACHE,
        JSON.stringify(cachedData)
      );
    } catch (error) {}
  }

  // Load common locations
  async loadCommonLocations(): Promise<LocationData[]> {
    try {
      const cached = await SecureStore.getItemAsync(COMMON_LOCATIONS_CACHE);
      if (cached) {
        const { data }: { data: CachedLocationData[] } = JSON.parse(cached);
        return data.map((item) => item.data);
      }
    } catch (error) {}

    return [];
  }

  // Check if we're online
  async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected ?? false;
    } catch (error) {
      return false;
    }
  }

  // Clear all cached data
  async clearAllCache(): Promise<void> {
    try {
      // Delete common locations cache
      await SecureStore.deleteItemAsync(COMMON_LOCATIONS_CACHE);

      // Note: SecureStore doesn't support getAllKeysAsync, so we can't clear all prayer cache entries
      // Individual prayer cache entries will expire after 24 hours automatically
    } catch (error) {}
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    prayerTimesEntries: number;
    totalCacheSize: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    // Note: SecureStore doesn't support getAllKeysAsync, so we can't get accurate cache stats
    return {
      prayerTimesEntries: 0,
      totalCacheSize: 0,
      oldestEntry: 0,
      newestEntry: 0,
    };
  }
}

// Export singleton instance
export const offlineCacheManager = new OfflineCacheManager();
export default offlineCacheManager;
