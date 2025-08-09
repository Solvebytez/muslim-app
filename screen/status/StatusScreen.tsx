import { useGetHotelsByStatus } from "@/hooks/queries/useGetresturentLists"
import { useGetuser } from "@/hooks/useGetuser"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import HotelCard, { type Hotel } from "../Hotels/HotelCard"
import NextPrayerCard from "../Prayer/NextPrayerCard"

const StatusScreen = ({ title }: { title: string }) => {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, refetch, isRefetching, isFetchingNextPage } =
    useGetHotelsByStatus({
      endpoint: "/get-pending-hotels-by-user",
      queryKey: "pending-hotels",
      resetOnMount: true, // Add this to reset query on mount
    })
const navigation = useNavigation();
  console.log("data", data)

  const restaurantsData = data?.pages?.flatMap((page) => page.restaurants) || []

  console.log("restaurantsData", restaurantsData[0])

  const { user } = useGetuser()

  // Handle card interactions
  const handleCardPress = (hotel: Hotel) => {
    console.log("Card pressed:", hotel.name)
    // Navigate to hotel details screen
  }

  const handleHeartPress = (hotel: Hotel) => {
    console.log("Heart pressed:", hotel.name)
    // Add/remove from favorites
  }

  const handleNavigatePress = (hotel: Hotel) => {
    console.log("Navigate pressed:", hotel.name)
    // Open maps with hotel location
  }

  // FlatList render item function
  const renderHotelCard: ListRenderItem<Hotel> = ({ item }) => {
    return (
      <HotelCard
        isUserVendor={user?.role}
        hotel={item}
        onPress={handleCardPress}
        onHeartPress={handleHeartPress}
        onNavigatePress={handleNavigatePress}
      />
    )
  }

  // FlatList item separator
  const ItemSeparator = () => <View style={styles.separator} />

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10ac84" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#fff" />
    {/* Or use <Text style={styles.backText}>←</Text> */}
  </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <NextPrayerCard />

      {/* Hotel Cards with FlatList */}
      {restaurantsData.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No hotels found</Text>
        </View>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          data={restaurantsData}
          keyExtractor={(item) => item._id}
          overScrollMode="always"
          scrollEventThrottle={16}
          renderItem={renderHotelCard}
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
            isFetchingNextPage || isFetching ? (
              <ActivityIndicator size={"large"} color={"#888"} style={{ margin: 15, alignSelf: "center" }} />
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
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  filterScrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
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
  separator: {
    height: 16,
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  }
})

export default StatusScreen
