"use client"

import AddToWishlist from "@/components/AddToWishlist"
import { ThemedText } from "@/components/ThemedText"
import { useStableCoordinates } from "@/hooks/prayerHooks/useCurrentuserlocateion"
import { type Restaurant, useNearestRestaurants } from "@/hooks/queries/useGetresturentLists"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from "react-native"
import { NavigationButton } from "../Hotels/navigation"
import NextPrayerCard from "../Prayer/NextPrayerCard"

export default function Mapscreen() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 35,
    seconds: 22,
  })

  const defaultLat = 43.6532
  const defaultLng = -79.3832

  const { coordinates: location, isLoading: locationLoading } = useStableCoordinates(defaultLat, defaultLng)

  const coordinates = useMemo(() => {
    const lat = location?.latitude ?? defaultLat
    const lng = location?.longitude ?? defaultLng
    return { latitude: lat, longitude: lng }
  }, [defaultLat, defaultLng, location?.latitude, location?.longitude])

  // Use the updated hook with refresh options
  const {
    data: restaurantsData,
    isLoading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useNearestRestaurants(
    {
      lat: defaultLat ?? defaultLat,
      lng: defaultLng ?? defaultLng,
    },
    {
      resetOnMount: true, // Reset cache on mount
      forceRefresh: true, // Always fetch fresh data
    },
  )

  const formatTime = (time: number) => time.toString().padStart(2, "0")

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await refetchRestaurants()
  }, [refetchRestaurants])

  console.log("coordinates@@@@@@@@@@@@@@@@@", coordinates)

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    console.log("restaurant", restaurant),
    (
      <View style={styles.restaurantCard}>
        <AddToWishlist isInWishlist={restaurant.isInWishlist} hotelID={restaurant._id} />
        <Image source={{ uri: restaurant.image?.url ?? "" }} style={styles.restaurantImage} />
        <View style={styles.restaurantOverlay}>
          <View style={styles.restaurantHeader}>
            <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
          </View>

            <ThemedText style={styles.hotelDescription}>
                    <ThemedText style={{
                      fontWeight: "bold",
                      fontSize:14
                    }}>Cuisine:
                      </ThemedText>
                       {""} {restaurant.cuisine.join(", ")}
                  </ThemedText>

                   <ThemedText style={styles.hotelDescription}>
                     <ThemedText style={{
                      fontWeight: "bold",
                      fontSize:14
                    }}>Suppliers:
                      </ThemedText> {""} {restaurant.suppliers.join(", ")}
                  </ThemedText>

          <View style={styles.restaurantDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#10ac84" />
              <ThemedText style={styles.addressText}>{restaurant.address}</ThemedText>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#ffa502" />
                <ThemedText style={styles.ratingText}>{restaurant.rating}</ThemedText>
              </View>

              <ThemedText style={styles.distanceText}>
                {restaurant.calculatedDistance} {restaurant.distanceUnit}
              </ThemedText>
            </View>

            <NavigationButton
              latitude={coordinates.longitude}
              longitude={coordinates.latitude}
              label={restaurant.address}
              placeId={restaurant.placeId ?? ""}
            />
          </View>
        </View>
      </View>
    )
  )

  const isLoadingData = locationLoading || restaurantsLoading

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Halal Places</ThemedText>
        <ThemedText style={styles.headerSubtitle}>(Fresh Data on Every Load)</ThemedText>
      </View>

      <NextPrayerCard />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1,paddingBottom:30 }}
        refreshControl={
          <RefreshControl
            refreshing={restaurantsLoading}
            onRefresh={onRefresh}
            colors={["#10ac84"]}
            tintColor="#10ac84"
          />
        }
      >
        {isLoadingData ? (
          <ActivityIndicator size="large" color="white" style={{ marginTop: 40 }} />
        ) : (restaurantsData?.data as any)?.restaurants?.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#333",
                textAlign: "center",
              }}
            >
              No restaurants found nearby.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.restaurantsSection}>
            <ThemedText style={styles.sectionTitle}>Nearby Halal Restaurants</ThemedText>
            {(restaurantsData?.data as any).restaurants?.map((restaurant: Restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#10ac84",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
   
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
})
