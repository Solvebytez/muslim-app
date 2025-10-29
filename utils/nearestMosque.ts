import { GOOGLE_PLACES_API_KEY } from "@/constants/GblobalVar";
import axios from "axios";

export type MosqueResult = {
  name: string;
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type NearestMosqueProps = {
  lat: number;
  lng: number;
  setLoading?: (loading: boolean) => void;
  setError?: (error: string | null) => void;
};

// Cache configuration - Short duration since mosque data should be fresh
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes only
const CACHE_KEY_PREFIX = "mosques_cache_";

export async function getNearestMosques({
  lat,
  lng,
  setLoading,
  setError,
}: NearestMosqueProps): Promise<MosqueResult[]> {
  const radius = 20000; // 20km in meters
  const apiKey = GOOGLE_PLACES_API_KEY;
  const cacheKey = `${CACHE_KEY_PREFIX}${lat.toFixed(4)}_${lng.toFixed(4)}`;

  // Clear any previous errors
  if (setError) setError(null);
  if (setLoading) setLoading(true);

  try {
    // Validate API key
    if (!apiKey) {
      throw new Error("Google Places API key is not configured");
    }

    console.log("🌐 Fetching mosques from Google Places API...");

    // Fetch all pages of results (no caching to get fresh data)
    const allMosques = await fetchAllMosquePages(lat, lng, radius, apiKey);

    if (allMosques.length === 0) {
      console.log("📍 No mosques found in the area");
      return [];
    }

    // Process all mosques and calculate distances
    const processedMosques = allMosques.map((mosque: any) => {
      const { lat: mosqueLat, lng: mosqueLng } = mosque.geometry.location;
      const distance = calculateDistance(lat, lng, mosqueLat, mosqueLng);

      return {
        name: mosque.name,
        distance: `${distance.toFixed(1)} km`,
        coordinates: {
          lat: mosqueLat,
          lng: mosqueLng,
        },
      };
    });

    // Sort by distance (nearest first)
    processedMosques.sort((a: MosqueResult, b: MosqueResult) => {
      const distA = parseFloat(a.distance.replace(" km", ""));
      const distB = parseFloat(b.distance.replace(" km", ""));
      return distA - distB;
    });

    console.log(`✅ Found ${processedMosques.length} mosques`);

    return processedMosques;
  } catch (error: any) {
    console.error("❌ Error fetching mosques:", error);

    // Set user-friendly error message
    let errorMessage = "Failed to load nearby mosques";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === "NETWORK_ERROR") {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.code === "TIMEOUT") {
      errorMessage = "Request timed out. Please try again.";
    }

    if (setError) setError(errorMessage);

    return [];
  } finally {
    if (setLoading) setLoading(false);
  }
}

// Helper function to fetch all pages of mosque results
async function fetchAllMosquePages(
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Promise<any[]> {
  const allResults: any[] = [];
  let nextPageToken: string | null = null;
  let pageCount = 0;
  const maxPages = 3; // Google Places API returns max 60 results (3 pages × 20 results)

  do {
    try {
      // Build URL with or without page token
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=mosque&key=${apiKey}`;

      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
        // Google requires a short delay before using the next_page_token
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const res = await axios.get(url, { timeout: 10000 });

      // Check for API errors
      if (res.data.status === "REQUEST_DENIED") {
        throw new Error(
          "Google Places API request denied. Please check your API key."
        );
      }
      if (res.data.status === "OVER_QUERY_LIMIT") {
        throw new Error(
          "Google Places API quota exceeded. Please try again later."
        );
      }
      if (res.data.status === "INVALID_REQUEST" && pageCount === 0) {
        throw new Error("Invalid request to Google Places API.");
      }

      // If ZERO_RESULTS or no results, break
      if (res.data.status === "ZERO_RESULTS" || !res.data.results) {
        break;
      }

      // Add results from this page
      const mosques = res.data.results;
      if (mosques && mosques.length > 0) {
        allResults.push(...mosques);
        console.log(
          `📄 Fetched page ${pageCount + 1}: ${
            mosques.length
          } mosques (total: ${allResults.length})`
        );
      }

      // Get next page token
      nextPageToken = res.data.next_page_token || null;
      pageCount++;

      // Break if no more pages or reached max pages
      if (!nextPageToken || pageCount >= maxPages) {
        break;
      }
    } catch (error: any) {
      // If it's a page token error, break the loop
      if (error.response?.data?.status === "INVALID_REQUEST") {
        console.log("📄 No more pages available");
        break;
      }
      throw error; // Re-throw other errors
    }
  } while (nextPageToken && pageCount < maxPages);

  return allResults;
}

// Helper: Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
