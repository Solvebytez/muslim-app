import AddToWishlist from "@/components/AddToWishlist";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NavigationButton } from "./navigation";

type ImageProps = {
  url: string;
};

export interface LocationProps {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Hotel {
  _id: string;
  name: string;
  address: string;
  cuisine: string[];

  rating: number;
  userId: string;
  isInWishlist: boolean;
  isApproved: string; // e.g., "approved", "pending"
  image: ImageProps | null;
  location: LocationProps | null;
  googleMapsPlaceId: string;
  googleMapsUrl: string;
  distanceUnit: string;
  suppliers: string[]; // or another array of objects if needed
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface HotelCardProps {
  isUserVendor?: string;
  hotel: Hotel;
  onPress?: (hotel: Hotel) => void;
  onHeartPress?: (hotel: Hotel) => void;
  onNavigatePress?: (hotel: Hotel) => void;
}

const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  onPress,
  onHeartPress,
  onNavigatePress,
  isUserVendor,
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    return stars;
  };

  const handleCardPress = () => {
    onPress?.(hotel);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress}>
      {/* Hotel Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: hotel.image?.url }} style={styles.cardImage} />
        {isUserVendor === "user" && (
          <AddToWishlist
            isInWishlist={hotel.isInWishlist}
            hotelID={hotel._id}
          />
        )}
        {hotel.isApproved !== "approved" && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>
              {hotel.isApproved === "pending"
                ? "Waiting for approval"
                : "Rejected"}
            </Text>
          </View>
        )}
      </View>

      {/* Hotel Content */}
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
        </View>

        <Text style={styles.hotelDescription}>
          <ThemedText
            style={{
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            Cuisine:
          </ThemedText>{" "}
          {hotel.cuisine.join(", ")}
        </Text>

        <ThemedText style={styles.hotelDescription}>
          <ThemedText
            style={{
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            Suppliers:
          </ThemedText>{" "}
          {hotel.suppliers.join(", ")}
        </ThemedText>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#10ac84" />
          <Text style={styles.locationText}>{hotel.address}</Text>
        </View>

        {/* <View style={styles.supplierRow}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.supplierText}>Suppliers: Premium Hotel Partners</Text>
        </View> */}

        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(hotel.rating)}
            </View>
            <Text style={styles.rating}>{hotel.rating}</Text>
          </View>
          {/* <Text style={styles.distance}>{hotel.distance}</Text> */}
        </View>

        <NavigationButton
          placeId={hotel.googleMapsPlaceId}
          latitude={hotel.location?.coordinates[0]!}
          longitude={hotel.location?.coordinates[1]!}
          label={hotel.name}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10ac84",
    flex: 1,
  },
  hotelDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  supplierText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 6,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  distance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10ac84",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigateText: {
    fontSize: 14,
    color: "#10ac84",
    fontWeight: "500",
    marginRight: 4,
  },
  pendingText: {
    backgroundColor: "#ED3500",
    fontSize: 12,
    padding: 8,
    borderRadius: 4,
    width: 90,
    textAlign: "center",
    textTransform: "capitalize",
    color: "#fff",
    fontWeight: "600",
  },
  pendingContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    textAlign: "center",
  },
});

export default HotelCard;
