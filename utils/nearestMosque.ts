import { GOOGLE_PLACES_API_KEY } from '@/constants/GblobalVar';
import axios from 'axios';

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
}

export async function getNearestMosques({ lat, lng, setLoading }: NearestMosqueProps): Promise<MosqueResult[]> {
  const radius = 2500; // 15km in meters
  const apiKey = GOOGLE_PLACES_API_KEY;

  if (setLoading) setLoading(true);

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=mosque&key=${apiKey}`;

    const res = await axios.get(url);
    const mosques = res.data.results;

    if (mosques.length === 0) {
      return [];
    }

    // Process all mosques (up to 10) and calculate distances
    const processedMosques = mosques.slice(0, 10).map((mosque : any) => {
     
      const { lat: mosqueLat, lng: mosqueLng } = mosque.geometry.location;
      const distance = calculateDistance(lat, lng, mosqueLat, mosqueLng);
      
      return {
        name: mosque.name,
        distance: `${distance.toFixed(1)} km`,
        coordinates: {
          lat: mosqueLat,
          lng: mosqueLng
        }
      };
    });

    // Sort by distance (nearest first)
    processedMosques.sort((a: MosqueResult, b: MosqueResult) => {
      const distA = parseFloat(a.distance.replace(' km', ''));
      const distB = parseFloat(b.distance.replace(' km', ''));
      return distA - distB;
    });

    return processedMosques;
  } catch (error) {
    console.error('❌ Error fetching mosques:', error);
    return [];
  } finally {
    if (setLoading) setLoading(false);
  }
}
// Helper: Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
