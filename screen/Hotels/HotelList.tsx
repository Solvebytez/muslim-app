import { useGetHotelsByStatus } from "@/hooks/queries/useGetresturentLists";
import { useGetuser } from "@/hooks/useGetuser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NextPrayerCard from "../Prayer/NextPrayerCard";
import HotelCard, { Hotel } from "./HotelCard";

const hotels  = [
  {
    id: "1",
    name: "Luxury Resort and Spa",
    description: "Premium Beachfront Resort",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
    rating: 4.8,
    reviewCount: 124,
    distance: "2.8 km",
    price: 15000,
    originalPrice: 18000,
    discount: "18% OFF",
    category: "Luxury",
  },
  {
    id: "2",
    name: "Garden View Hotel",
    description: "Boutique Hotel with Garden",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop",
    rating: 4.6,
    reviewCount: 89,
    distance: "4.2 km",
    price: 8500,
    category: "Boutique",
  },
  {
    id: "3",
    name: "City Center Hotel",
    description: "Modern Business Hotel",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
    rating: 4.4,
    reviewCount: 156,
    distance: "1.5 km",
    price: 12000,
    originalPrice: 14000,
    discount: "15% OFF",
    category: "Business",
  },
  {
    id: "4",
    name: "Heritage Palace Hotel",
    description: "Traditional Heritage Stay",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop",
    rating: 4.7,
    reviewCount: 203,
    distance: "3.4 km",
    price: 9500,
    category: "Heritage",
  },
  {
    id: "5",
    name: "Mountain View Resort",
    description: "Scenic Mountain Resort",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop",
    rating: 4.9,
    reviewCount: 87,
    distance: "6.7 km",
    price: 11000,
    originalPrice: 13000,
    discount: "16% OFF",
    category: "Resort",
  },
  {
    id: "6",
    name: "Seaside Villa",
    description: "Oceanfront Villa Resort",
    image:
      "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400&h=250&fit=crop",
    rating: 4.5,
    reviewCount: 76,
    distance: "5.2 km",
    price: 13500,
    category: "Villa",
  },
  {
    id: "7",
    name: "Urban Boutique Hotel",
    description: "Contemporary City Hotel",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop",
    rating: 4.3,
    reviewCount: 142,
    distance: "0.8 km",
    price: 7500,
    originalPrice: 9000,
    discount: "17% OFF",
    category: "Boutique",
  },
];

const filterOptions = ["All", "Recommended", "Luxury", "Business", "Heritage"];

const HotelCardsUI = ({ title }: { title: string }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    refetch,
    isFetchingNextPage,
    isRefetching,
  } = useGetHotelsByStatus({
   endpoint: "/get-approved-hotels-by-user",
  queryKey: "approved-hotels",
  });

  console.log("data", data);

const restaurantsData =
  data?.pages?.flatMap((page) => page.restaurants) || [];

const uniqueRestaurants = Array.from(
  new Map(restaurantsData.map(item => [item._id, item])).values()
);

  const [selectedFilter, setSelectedFilter] = useState("All");
  const { user } = useGetuser();

  

  // const filteredHotels =
  //   selectedFilter === "All"
  //     ? hotels
  //     : hotels.filter(
  //         (hotel) =>
  //           hotel.category === selectedFilter ||
  //           (selectedFilter === "Recommended" && hotel.rating >= 4.7)
  //       );

  // Handle card interactions
  const handleCardPress = (hotel: Hotel) => {
    console.log("Card pressed:", hotel.name);
    // Navigate to hotel details screen
  };

  const handleHeartPress = (hotel: Hotel) => {
    console.log("Heart pressed:", hotel.name);
    // Add/remove from favorites
  };

  const handleNavigatePress = (hotel: Hotel) => {
    console.log("Navigate pressed:", hotel.name);
    // Open maps with hotel location
  };



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
    );
  };

  // FlatList item separator
  const ItemSeparator = () => <View style={styles.separator} />;



  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Hotels</Text>
      </View>

      <NextPrayerCard/>

      {/* Hotel Cards with FlatList */}
    {/* Hotel Cards with FlatList */}
      {restaurantsData.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No hotels found</Text>
        </View>
      ) : (
       <FlatList
  refreshControl={
    <RefreshControl
      refreshing={isFetching}
      onRefresh={refetch}
    />
  }
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  data={uniqueRestaurants}
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
    isFetchingNextPage ? (
      <ActivityIndicator
        size={"large"}
        color={"#888"}
        style={{ margin: 15, alignSelf: "center" }}
      />
    ) : null
  }
/>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c8566",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#10ac84",
    backgroundColor: "#10ac84",
    justifyContent: "center",
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default HotelCardsUI;
