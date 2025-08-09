import { useGetCuisines } from "@/hooks/queries/useGetresturentLists";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NextPrayerCard from "../Prayer/NextPrayerCard";


const FilterCuisines = () => {
  const { data, isFetching, isLoading, refetch, isRefetching } =
    useGetCuisines();
    const router = useRouter();

  const cuisineGroups = data?.cuisineList || [];

   const handleCuisinePress = (cuisine: any) => {
   router.push({
  pathname: "/resturent-by-cuisin",
  params: {
    cuisineName: cuisine.name,
    cuisineId: cuisine._id,
  },
});
  };

  const renderCuisineCard = (item: any) => (
    <TouchableOpacity onPress={() => handleCuisinePress(item)} key={item._id} style={styles.cuisineCard}>
      <Text style={styles.cuisineName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCuisineRow = (
    rowData: any[],
    index: React.Key | null | undefined
  ) => (
    <View key={index} style={styles.cuisineRow}>
      {rowData.map(renderCuisineCard)}
    </View>
  );

  const cuisineRows = [];
  for (let i = 0; i < cuisineGroups.length; i += 2) {
    cuisineRows.push(cuisineGroups.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{"Categories"}</Text>
      </View>

      <NextPrayerCard />

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : cuisineGroups.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No hotels found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.cuisineList}
          showsVerticalScrollIndicator={false}
        >
          {cuisineRows.map(renderCuisineRow)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c8566",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cuisineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  cuisineCard: {
    backgroundColor: "#fff",
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 26,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,  
    justifyContent: "center",
  },
  cuisineName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10ac84",
    textTransform: "capitalize",
    textAlign: "center",
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
  cuisineList: {
    paddingTop: 8,
    paddingBottom: 16,
  },
});

export default FilterCuisines;
