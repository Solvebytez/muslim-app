"use client";

import { ThemedText } from "@/components/ThemedText";
import axiosInstance, { handleApiError } from "@/constants/AxiosInstane";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CuisineSelector from "./CuisineSelector";
import HotelSearchInput, { type HotelDetails } from "./HotelSearchInput";
import SelectedHotelComponent from "./selectedHotel";
import SupplierSelector from "./SupplierSelector";

export default function HotelFormScreen() {
  const [hotelName, setHotelName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [phonenumber, setPhoneNumber] = useState("");
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelDetails | null>(null);
  const [name, setName] = useState("");
  const [contectEMail, setContectEMail] = useState("");
  const [suppliers, setSuppliers] = useState<string[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload images.",
          [{ text: "OK" }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    Alert.alert("Select Image", "Choose an option", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleHotelSelect = (hotel: HotelDetails | null) => {
    setSelectedHotel(hotel);
    console.log("Selected hotel:hotel.geometry.location", hotel?.geometry.location);
    if (hotel === null) return;
    console.log("Selected hotel details:", {
      name: hotel.name,
      rating: hotel.rating,
      coordinates: hotel.geometry.location,
      googleMapsPlaceId: hotel.place_id,
      googleMapsUrl: hotel.googleMapsUrl,
      country: hotel.country,
      fullDetails: hotel,
    });
  };

  // Modified handleSubmit to show modal first
  const handleSubmit = async () => {
    // Validate form fields first
    if (!selectedHotel) {
      Alert.alert("Validation Error", "Please enter a hotel name.");
      return;
    }
    if (!selectedImage) {
      Alert.alert("Validation Error", "Please select an image.");
      return;
    }
    if (!phonenumber) {
      Alert.alert("Validation Error", "Please enter a phone number.");
      return;
    }
    if (cuisines.length === 0) {
      Alert.alert("Validation Error", "Please select at least one cuisine.");
      return;
    }
    if (suppliers.length === 0) {
      Alert.alert("Validation Error", "Please add at least one supplier.");
      return;
    }

    // Show modal for name and email
    setModalVisible(true);
  };

  // Handle modal form submission
  const handleModalSubmit = async () => {
    // Validate modal fields
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name.");
      return;
    }
    if (!contectEMail.trim()) {
      Alert.alert("Validation Error", "Please enter your email.");
      return;
    }
    if (!validateEmail(contectEMail)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    setModalSubmitting(true);

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      const file = {
        uri: selectedImage.uri,
        type: selectedImage.mimeType || "image/jpeg",
        name: selectedImage.fileName || `hotel-${Date.now()}.jpg`,
      };
      formData.append("image", file as any);

      // Add hotel data
      const hotelPayload = {
        name: selectedHotel?.name,
        place_id: selectedHotel?.place_id,
        formatted_address: selectedHotel?.formatted_address,
        rating: selectedHotel?.rating,
        country: selectedHotel?.country,
        coordinates: selectedHotel?.geometry.location,
        googleMapsUrl: selectedHotel?.googleMapsUrl,
        url: selectedHotel?.url,
      };
      formData.append("hotelData", JSON.stringify(hotelPayload));
      formData.append("phoneNumber", phonenumber);
      formData.append("cuisines", JSON.stringify(cuisines));
      formData.append("suppliers", JSON.stringify(suppliers));
      formData.append("contactName", name);
      formData.append("contactEmail", contectEMail);

      const response = await axiosInstance.post("/add-hotel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status !== 201) {
        Alert.alert(
          "Error",
          "Failed to submit hotel data. Please try again later or Contact Admin."
        );
        return;
      }

      console.log("✅ Hotel data submitted successfully:", response.data);
      setModalVisible(false);
      setSelectedHotel(null);
      setSelectedImage(null);
      setCuisines([]);
      setPhoneNumber("");
      setSuppliers([]);
      setName("");
      setContectEMail("");
      return router.push("/status");
    } catch (error) {
      console.log("❌ Error submitting hotel data:", error);
      const errorMessage = handleApiError(error);
      Alert.alert("Error", errorMessage);
    } finally {
      setModalSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!modalSubmitting) {
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <ThemedText style={styles.sectionTitle}>
                Add Hotel Information
              </ThemedText>

              {/* Image Upload Section */}
              <View style={styles.imageSection}>
                <ThemedText style={styles.label}>Hotel Image</ThemedText>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={pickImage}
                >
                  {selectedImage ? (
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.uploadedImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeImage}
                        disabled={submitting}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#ff4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={40} color="#333" />
                      <ThemedText style={styles.imagePlaceholderText}>
                        Tap to add image
                      </ThemedText>
                      <ThemedText style={styles.imagePlaceholderSubtext}>
                        Camera or Gallery
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Hotel Name Input */}
              <View style={styles.inputSection}>
                <ThemedText style={styles.label}>Hotel name</ThemedText>
                <View style={styles.inputContainer}>
                  <HotelSearchInput
                    onHotelSelect={handleHotelSelect}
                    placeholder="Search for hotels..."
                    style={styles.input}
                    editable={!submitting}
                  />
                </View>
              </View>

              {selectedHotel && (
                <SelectedHotelComponent
                  item={selectedHotel}
                  editable={!submitting}
                />
              )}

              <View style={styles.inputSection}>
                <ThemedText style={styles.label}>Select Cuisines</ThemedText>
                <CuisineSelector
                  selectedCuisines={cuisines}
                  onCuisinesChange={setCuisines}
                  editable={!submitting}
                />
              </View>

              {/* Suppliers Section */}
              <View style={styles.inputSection}>
                <ThemedText style={styles.label}>Suppliers:</ThemedText>
                <SupplierSelector
                  selectedSuppliers={suppliers}
                  onSuppliersChange={setSuppliers}
                  editable={!submitting}
                />
              </View>

              <View style={styles.inputSection}>
                <ThemedText style={styles.label}>Phone number</ThemedText>
                <View style={styles.inputContainer}>
                  <TextInput
                    editable={!submitting}
                    value={phonenumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Type your phone number"
                    placeholderTextColor="#999"
                    style={[
                      styles.input,
                      {
                        height: 50,
                        backgroundColor: "white",
                        borderRadius: 50,
                        paddingHorizontal: 20,
                        fontSize: 14,
                        color: "#333",
                        opacity: submitting ? 0.5 : 1,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Hotel</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Contact Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Contact Information
              </ThemedText>
              <TouchableOpacity
                onPress={closeModal}
                disabled={modalSubmitting}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalInputSection}>
                <ThemedText style={styles.modalLabel}>Name</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  style={styles.modalInput}
                  editable={!modalSubmitting}
                />
              </View>

              <View style={styles.modalInputSection}>
                <ThemedText style={styles.modalLabel}>Email</ThemedText>
                <TextInput
                  value={contectEMail}
                  onChangeText={setContectEMail}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.modalInput}
                  editable={!modalSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  { opacity: modalSubmitting ? 0.7 : 1 },
                ]}
                onPress={handleModalSubmit}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Submit Hotel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 34,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  imageSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  imageUploadContainer: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#333",
    borderRadius: 12,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    borderRadius: 15,
  },
  imagePlaceholderText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 10,
  },
  imagePlaceholderSubtext: {
    color: "#333",
    fontSize: 14,
    marginTop: 5,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    paddingHorizontal: 0,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#333",
    fontSize: 14,
  },
  submitButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#44A08D",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalInputSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  modalInput: {
    height: 50,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 50,
  },
  modalSubmitButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#44A08D",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  modalSubmitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
