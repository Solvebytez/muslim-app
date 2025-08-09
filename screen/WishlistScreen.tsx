import { useGetWishlist } from "@/hooks/queries/useGetWishlist"
import { useGetuser } from "@/hooks/useGetuser"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "expo-router"
import { useCallback } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import HotelCard, { type Hotel } from "./Hotels/HotelCard"
import NextPrayerCard from "./Prayer/NextPrayerCard"

const WishlistScreen = ({ title }: { title?: string }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    refetch,
    isFetchingNextPage,
  } = useGetWishlist({
    endpoint: "/get-wishlist",
    queryKey: "user-wishlist",
  })

  const navigation = useNavigation()
  const { user } = useGetuser()

  const wishlistRestaurants = data?.pages?.flatMap((page: any) => page.restaurants) || []

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  const handleCardPress = (hotel: Hotel) => {
    console.log("Card pressed:", hotel.name)
  }

  const handleHeartPress = (hotel: Hotel) => {
    console.log("Heart pressed:", hotel.name)
  }

  const handleNavigatePress = (hotel: Hotel) => {
    console.log("Navigate pressed:", hotel.name)
  }

  const ItemSeparator = () => <View style={styles.separator} />

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <NextPrayerCard />

      {/* Wishlist Cards */}
      {wishlistRestaurants.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No restaurants in wishlist</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistRestaurants}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View key={item._id} style={{ marginBottom: 25 }}>
              <HotelCard
                isUserVendor={user?.role}
                hotel={item}
                onPress={handleCardPress}
                onHeartPress={handleHeartPress}
                onNavigatePress={handleNavigatePress}
              />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          windowSize={10}
          initialNumToRender={4}
          style={styles.flatList}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="large" color="#888" style={{ margin: 15, alignSelf: "center" }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c8566",
  },
  backButton: {
    marginRight: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#10ac84",
    backgroundColor: "#10ac84",
    justifyContent: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  flatList: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flatListContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {},
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  noResultsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
})

export default WishlistScreen
