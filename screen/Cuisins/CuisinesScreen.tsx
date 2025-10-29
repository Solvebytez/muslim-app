import { useGetAllHotels } from "@/hooks/queries/useGetresturentLists";
import { useGetuser } from "@/hooks/useGetuser";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HotelCard, { Hotel } from "../Hotels/HotelCard";

const CuisinesScreen = React.memo(({ title }: { title?: string }) => {
  const { cuisineName, cuisineId } = useLocalSearchParams();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    refetch,
    isFetchingNextPage,
    isRefetching,
  } = useGetAllHotels({
    endpoint: "/get-hotels-by-user",
    queryKey: "user-hotels",
    cuisineName: cuisineName as string,
    resetOnMount: true, // ← resets old cache on mount
  });

  const cuisineGroups = data?.pages?.flatMap((page: any) => page.groups) || [];

  const { user } = useGetuser();
  const navigation = useNavigation();
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

  // FlatList item separator
  const ItemSeparator = () => <View style={styles.separator} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          {/* Or use <Text style={styles.backText}>←</Text> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter by Cuisine</Text>
      </View>

      {/* 
      <NextPrayerCard />

  */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : cuisineGroups.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No hotels found</Text>
        </View>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          data={cuisineGroups}
          keyExtractor={(item, index) => item._id}
          overScrollMode="always"
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View key={item._id}>
              <Text style={styles.cuisineTitle}>{item.cuisine}</Text>
              {item.restaurants.map((hotel: Hotel) => (
                <View key={hotel._id} style={{ marginBottom: 25 }}>
                  <HotelCard
                    isUserVendor={user?.role}
                    hotel={hotel}
                    onPress={handleCardPress}
                    onHeartPress={handleHeartPress}
                    onNavigatePress={handleNavigatePress}
                  />
                </View>
              ))}
            </View>
          )}
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
                size="large"
                color="#888"
                style={{ margin: 15, alignSelf: "center" }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
});

CuisinesScreen.displayName = "CuisinesScreen";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c8566",
  },
  cuisineTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    backgroundColor: "#fff",
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
    // height: 10,
    // backgroundColor: "red",
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
  backButton: {
    padding: 8,
    marginLeft: -17,
  },
});

export default CuisinesScreen;
