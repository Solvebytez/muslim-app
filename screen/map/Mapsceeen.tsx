"use client";

import AddToWishlist from "@/components/AddToWishlist";
import { ThemedText } from "@/components/ThemedText";
import { useStableCoordinates } from "@/hooks/prayerHooks/useCurrentuserlocateion";
import {
  type Restaurant,
  useNearestRestaurants,
} from "@/hooks/queries/useGetresturentLists";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationButton } from "../Hotels/navigation";
import NextPrayerCard from "../Prayer/NextPrayerCard";

export default function Mapscreen() {
  const defaultLat = 43.6532;
  const defaultLng = -79.3832;

  const { coordinates: location, isLoading: locationLoading } =
    useStableCoordinates(defaultLat, defaultLng);

  const coordinates = useMemo(() => {
    const lat = location?.latitude ?? defaultLat;
    const lng = location?.longitude ?? defaultLng;
    return { latitude: lat, longitude: lng };
  }, [defaultLat, defaultLng, location?.latitude, location?.longitude]);

  // Optimized API call with smart caching
  const {
    data: restaurantsData,
    isLoading: restaurantsLoading,
    refetch: refetchRestaurants,
  } = useNearestRestaurants(
    {
      lat: coordinates.latitude ?? defaultLat,
      lng: coordinates.longitude ?? defaultLng,
    },
    {
      resetOnMount: false, // Use cache
      forceRefresh: false, // Allow caching
    }
  );

  // Track if we've already fetched with real location
  const hasFetchedWithRealLocation = useRef(false);

  // Refetch restaurants when real location becomes available
  useEffect(() => {
    const isRealLocation =
      coordinates.latitude !== defaultLat ||
      coordinates.longitude !== defaultLng;

    if (isRealLocation && !hasFetchedWithRealLocation.current) {
      hasFetchedWithRealLocation.current = true;
      refetchRestaurants();
    }
  }, [
    coordinates.latitude,
    coordinates.longitude,
    defaultLat,
    defaultLng,
    refetchRestaurants,
  ]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await refetchRestaurants();
  }, [refetchRestaurants]);

  // Memoized RestaurantCard component for better performance
  const RestaurantCard = React.memo(
    ({ restaurant }: { restaurant: Restaurant }) => (
      <View style={styles.restaurantCard}>
        <AddToWishlist
          isInWishlist={restaurant.isInWishlist}
          hotelID={restaurant._id}
        />
        <Image
          source={{ uri: restaurant.image?.url ?? "" }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
        <View style={styles.restaurantOverlay}>
          <View style={styles.restaurantHeader}>
            <ThemedText style={styles.restaurantName}>
              {restaurant.name}
            </ThemedText>
          </View>

          <ThemedText style={styles.hotelDescription}>
            <ThemedText style={styles.boldText}>Cuisine:</ThemedText>
            {` ${restaurant.cuisine.join(", ")}`}
          </ThemedText>

          <ThemedText style={styles.hotelDescription}>
            <ThemedText style={styles.boldText}>Suppliers:</ThemedText>
            {` ${restaurant.suppliers.join(", ")}`}
          </ThemedText>

          <View style={styles.restaurantDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#10ac84" />
              <ThemedText style={styles.addressText}>
                {restaurant.address}
              </ThemedText>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#ffa502" />
                <ThemedText style={styles.ratingText}>
                  {restaurant.rating}
                </ThemedText>
              </View>

              <ThemedText style={styles.distanceText}>
                {restaurant.calculatedDistance} {restaurant.distanceUnit}
              </ThemedText>
            </View>

            <NavigationButton
              latitude={restaurant.location.coordinates[0]}
              longitude={restaurant.location.coordinates[1]}
              label={restaurant.address}
              placeId={restaurant.placeId ?? ""}
            />
          </View>
        </View>
      </View>
    )
  );

  // Add display name for debugging
  RestaurantCard.displayName = "RestaurantCard";

  // Optimized loading state - only show loading when restaurants are loading and no data
  const isLoadingData = useMemo(() => {
    return restaurantsLoading && !restaurantsData;
  }, [restaurantsLoading, restaurantsData]);

  // Memoized restaurant data
  const restaurants = useMemo(() => {
    return (restaurantsData?.data as any)?.restaurants || [];
  }, [restaurantsData]);

  // Render item for FlatList
  const renderRestaurantItem = useCallback(
    ({ item }: { item: Restaurant }) => <RestaurantCard restaurant={item} />,
    [RestaurantCard]
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Restaurant) => item._id, []);

  // Dynamic content container style - full height when empty
  const contentContainerStyle = useMemo(() => {
    return restaurants.length === 0
      ? [styles.listContent, { flexGrow: 1 }]
      : styles.listContent;
  }, [restaurants.length]);

  // Empty component
  const EmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          No restaurants found nearby.
        </ThemedText>
      </View>
    ),
    []
  );

  // Loading component
  const LoadingComponent = useCallback(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10ac84" />
        <ThemedText style={styles.loadingText}>
          Loading restaurants...
        </ThemedText>
      </View>
    ),
    []
  );

  // Location waiting component for first-time users
  const LocationWaitingComponent = useCallback(
    () => (
      <View style={styles.locationWaitingContainer}>
        <View style={styles.locationWaitingCard}>
          <ActivityIndicator size="large" color="#10ac84" />
          <ThemedText style={styles.locationWaitingTitle}>
            Getting Your Location
          </ThemedText>
          <ThemedText style={styles.locationWaitingMessage}>
            We&apos;re finding your current location to show you the nearest
            halal restaurants and accurate prayer times.
          </ThemedText>
          <ThemedText style={styles.locationWaitingSubtext}>
            This may take a few moments...
          </ThemedText>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#10ac84"
        translucent
      />

      {/* Header with dynamic safe area padding */}
      <SafeAreaView style={styles.header} edges={["top"]}>
        <ThemedText style={styles.headerTitle}>Halal Places</ThemedText>
        {coordinates.latitude === defaultLat &&
          coordinates.longitude === defaultLng && (
            <ThemedText style={styles.locationStatus}>
              Using default location - Getting your location...
            </ThemedText>
          )}
      </SafeAreaView>

      {!locationLoading && <NextPrayerCard />}

      <View style={styles.contentContainer}>
        {locationLoading ? (
          <LocationWaitingComponent />
        ) : isLoadingData ? (
          <LoadingComponent />
        ) : (
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            refreshControl={
              <RefreshControl
                refreshing={restaurantsLoading}
                onRefresh={onRefresh}
                colors={["#10ac84"]}
                tintColor="#10ac84"
              />
            }
            ListEmptyComponent={EmptyComponent}
            ListHeaderComponent={
              restaurants.length > 0 ? (
                <ThemedText style={styles.sectionTitle}>
                  Nearby Halal Restaurants
                </ThemedText>
              ) : null
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={5}
            getItemLayout={(data, index) => ({
              length: 300, // Approximate item height
              offset: 300 * index,
              index,
            })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10ac84",
  },
  header: {
    backgroundColor: "#10ac84",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  locationStatus: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  prayerTimer: {
    backgroundColor: "#ffa502",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  prayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  prayerText: {
    fontSize: 16,
    color: "#2c2c54",
    marginLeft: 8,
    fontWeight: "500",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c2c54",
  },
  restaurantsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10ac84",
    marginBottom: 14,
    textAlign: "center",
  },
  restaurantCard: {
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantImage: {
    width: "100%",
    height: 200,
  },
  restaurantOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    padding: 14,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c2c54",
  },
  restaurantDetails: {
    gap: 6,
  },
  cuisineText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  supplierText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  distanceText: {
    fontSize: 14,
    color: "#10ac84",
    fontWeight: "bold",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 0,
  },
  navigateText: {
    fontSize: 16,
    color: "#10ac84",
    fontWeight: "600",
  },
  hotelDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#10ac84",
    fontWeight: "500",
  },
  locationWaitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  locationWaitingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 320,
  },
  locationWaitingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  locationWaitingMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  locationWaitingSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
