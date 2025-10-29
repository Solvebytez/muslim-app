import { width } from "@/constants/GblobalVar";
import { getNearestMosques, MosqueResult, NearestMosqueProps } from "@/utils/nearestMosque";

import React, { useCallback, useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Linking, 
  RefreshControl, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from "react-native";

const MosqueCard = ({ lat, lng }: NearestMosqueProps) => {
  const [mosques, setMosques] = useState<MosqueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMosques = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const result = await getNearestMosques({ 
        lat, 
        lng, 
        setLoading: isRefresh ? undefined : setLoading,
        setError 
      });
      setMosques(result);
    } catch (err) {
      console.error('Error in fetchMosques:', err);
      setError('Failed to load nearby mosques');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [lat, lng]);

  useEffect(() => {
    fetchMosques();
  }, [fetchMosques]);

  const handleRefresh = useCallback(() => {
    fetchMosques(true);
  }, [fetchMosques]);

  const handleGetDirections = (mosque: MosqueResult) => {
    const destLat = mosque.coordinates.lat;
    const destLng = mosque.coordinates.lng;
    const label = encodeURIComponent(mosque.name);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving&dir_action=navigate`;

    Linking.openURL(url).catch((err) => {
      console.error("Failed to open Google Maps:", err);
    });
  };

  // Skeleton loading component
  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonText, { width: '60%' }]} />
          </View>
          <View style={styles.skeletonButton} />
          {i < 3 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );

  // Error component
  const ErrorComponent = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchMosques()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🕌</Text>
      <Text style={styles.emptyText}>No mosques found nearby</Text>
      <Text style={styles.emptySubtext}>Try expanding your search area</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Mosques</Text>
      <View style={styles.card}>
        {error ? (
          <ErrorComponent />
        ) : loading ? (
          <SkeletonLoader />
        ) : mosques.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#10ac84']}
                tintColor="#10ac84"
              />
            }
          >
            {mosques.map((mosque, index) => (
              <View key={`${mosque.name}-${index}`} style={styles.mosqueContainer}>
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Text style={styles.iconText}>📍</Text>
                  </View>
                  <Text style={styles.locationName}>{mosque.name}</Text>
                </View>
                <View style={styles.distanceRow}>
                  <View style={styles.distanceIcon}>
                    <Text style={styles.iconText}>🧭</Text>
                  </View>
                  <Text style={styles.distanceText}>Distance: {mosque.distance}</Text>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => handleGetDirections(mosque)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Get Directions</Text>
                </TouchableOpacity>
                {index < mosques.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </ScrollView>
        ) : (
          <EmptyState />
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: width,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // For Android shadow
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669", // Green color matching the original
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  locationIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  distanceIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  locationName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  directionsButton: {
    backgroundColor: "#10ac84",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
   mosqueContainer: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  // Skeleton loading styles
  skeletonContainer: {
    paddingVertical: 10,
  },
  skeletonItem: {
    marginBottom: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    flex: 1,
  },
  skeletonButton: {
    height: 44,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  // Error state styles
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#10ac84',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default MosqueCard;
