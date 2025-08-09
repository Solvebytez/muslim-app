import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface HotelDetails {
  item: any;
  editable: boolean
}

const SelectedHotel = ({ item, editable }: HotelDetails) => {
  const openGoogleMaps = () => {
    if (item?.googleMapsUrl) {
      Linking.openURL(item.googleMapsUrl);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={16}
          color="#FFD700"
        />
      );
    }

    return stars;
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Selected Hotel Details</Text>

      <View style={styles.detailRow}>
        <Ionicons name="business" size={20} color="#1e88e5" />
        <Text style={styles.hotelName}>{item.name}</Text>
      </View>

      {item.rating && (
        <View style={styles.detailRow}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
          </View>
        </View>
      )}

      <View style={styles.detailRow}>
        <Ionicons name="location" size={20} color="#1e88e5" />
        <View style={styles.coordinatesContainer}>
          <Text style={styles.detailLabel}>Coordinates:</Text>
          <Text style={styles.detailValue}>
            {item.geometry.location.lat.toFixed(6)},{" "}
            {item.geometry.location.lng.toFixed(6)}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="flag" size={20} color="#1e88e5" />
        <View>
          <Text style={styles.detailLabel}>Country:</Text>
          <Text style={styles.detailValue}>{item.country}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="map" size={20} color="#1e88e5" />
        <View style={styles.placeIdContainer}>
          <Text style={styles.detailLabel}>Place ID:</Text>
          <Text style={styles.placeIdText}>{item.place_id}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="home" size={20} color="#1e88e5" />
        <View style={styles.addressContainer}>
          <Text style={styles.detailLabel}>Address:</Text>
          <Text style={styles.addressText}>{item.formatted_address}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mapsButton} onPress={openGoogleMaps} disabled={editable}>
        <Ionicons name="map" size={20} color="#1e88e5" />
        <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  ratingContainer: {
    marginLeft: 10,
    flex: 1,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
  },
  coordinatesContainer: {
    marginLeft: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  placeIdContainer: {
    marginLeft: 10,
    flex: 1,
  },
  placeIdText: {
    fontSize: 12,
    color: "#666",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  addressContainer: {
    marginLeft: 10,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e88e5",
    marginLeft: 8,
  },
});

export default SelectedHotel;