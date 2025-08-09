"use client"

import { Ionicons } from "@expo/vector-icons"
import type React from "react"
import { useState } from "react"
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface CuisineSelectorProps {
  selectedCuisines: string[]
  onCuisinesChange: (cuisines: string[]) => void
  editable?: boolean
}

const CUISINE_CATEGORIES = {
  "Indian": ["Hyderabadi", "Mughlai", "Punjabi", "Awadhi / Lucknowi cuisine", "Delhi street food", "South Indian", "Tamil Food", "Kerala Food", "Andhra Food"],
  "Pakistani": ["Pakistani"],
  "Middle Eastern/ Mediterranean": ["Lebanese", "Syrian", "Palestinian", "Egyptian", "Iraqi", "Persian (Iranian)", "Turkish"],
  "Hakka Chinese": ["Hakka Chinese"],
  "South Asian": ["Bangladeshi", "Afghan"],
  "Southeast Asian": ["Malaysian", "Indonesian", "Singaporean food", "Thai Food", "Burmese food"],
  "African & North African": ["Somali", "Ethiopian (halal-specific)", "Moroccan", "Algerian", "Tunisian", "Sudanese"],
  "Western & Fusion": ["American", "Italian", "BBQ & Smokehouse", "Mexican", "Chinese", "Korean", "Japanese (sushi, ramen)"],
  "Street Food": ["Street Food / Food Trucks"],
  "Vegetarian/Vegan": ["Vegan/Vegetarian"],
  "🥙 Other Useful Categories": ["Shawarma", "Halal Breakfast / Brunch", "Halal Bakeries & Desserts"]
}

const CuisineSelector: React.FC<CuisineSelectorProps> = ({ selectedCuisines, onCuisinesChange, editable = true }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(CUISINE_CATEGORIES))

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      onCuisinesChange(selectedCuisines.filter((c) => c !== cuisine))
    } else {
      onCuisinesChange([...selectedCuisines, cuisine])
    }
  }

  const openModal = () => {
    if (editable) {
      setModalVisible(true)
      // Expand all categories by default when opening
      setExpandedCategories(Object.keys(CUISINE_CATEGORIES))
    }
  }

  const closeModal = () => {
    setModalVisible(false)
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, { opacity: editable ? 1 : 0.5 }]}
        onPress={openModal}
        disabled={!editable}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.selectorText}>
            {selectedCuisines.length > 0
              ? `${selectedCuisines.length} cuisine${selectedCuisines.length > 1 ? "s" : ""} selected`
              : "Select cuisines"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
        {selectedCuisines.length > 0 && (
          <View style={styles.selectedPreview}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedCuisines.slice(0, 3).map((cuisine, index) => (
                <View key={index} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{cuisine}</Text>
                </View>
              ))}
              {selectedCuisines.length > 3 && (
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>+{selectedCuisines.length - 3} more</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Cuisines</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedCuisines.length} cuisine{selectedCuisines.length !== 1 ? "s" : ""} selected
                {selectedCuisines.length === 0 && " (select at least one)"}
              </Text>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              {Object.entries(CUISINE_CATEGORIES).map(([category, cuisines]) => (
                <View key={category} style={styles.categoryContainer}>
                  <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category)}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Ionicons
                      name={expandedCategories.includes(category) ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {expandedCategories.includes(category) && (
                    <View style={styles.cuisinesList}>
                      {cuisines.map((cuisine) => (
                        <TouchableOpacity
                          key={cuisine}
                          style={[styles.cuisineItem, selectedCuisines.includes(cuisine) && styles.cuisineItemSelected]}
                          onPress={() => toggleCuisine(cuisine)}
                        >
                          <Text
                            style={[
                              styles.cuisineText,
                              selectedCuisines.includes(cuisine) && styles.cuisineTextSelected,
                            ]}
                          >
                            {cuisine}
                          </Text>
                          {selectedCuisines.includes(cuisine) && (
                            <Ionicons name="checkmark" size={18} color="#44A08D" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.doneButton, selectedCuisines.length === 0 && styles.doneButtonDisabled]}
                onPress={closeModal}
                disabled={selectedCuisines.length === 0}
              >
                <Text style={[styles.doneButtonText, selectedCuisines.length === 0 && styles.doneButtonTextDisabled]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: "white",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectorContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 14,
    color: "#333",
  },
  selectedPreview: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  selectedTag: {
    backgroundColor: "#44A08D",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedTagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%", // Changed from maxHeight to height for better control
    flexDirection: "column", // Ensure proper flex direction
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
  selectedCount: {
    paddingHorizontal: 20,
    paddingVertical: 15, // Increased padding for better spacing
    backgroundColor: "#f8f8f8",
  },
  selectedCountText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalContent: {
    flex: 1, // This will take up all available space
    paddingHorizontal: 20,
    paddingVertical: 15, // Increased padding
    marginBottom: 10, // Add margin to separate from footer
  },
  categoryContainer: {
    marginBottom: 15, // Increased margin for better spacing
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15, // Increased padding
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8, // Increased margin
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cuisinesList: {
    paddingLeft: 8, // Increased padding
    marginBottom: 8, // Increased margin
  },
  cuisineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12, // Increased padding
    paddingHorizontal: 15,
    marginVertical: 2, // Increased margin
    borderRadius: 8, // Increased border radius
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 44, // Ensure minimum touch target size
  },
  cuisineItemSelected: {
    backgroundColor: "#f0f9f7",
    borderColor: "#44A08D",
  },
  cuisineText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  cuisineTextSelected: {
    color: "#44A08D",
    fontWeight: "500",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20, // Increased padding
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff", // Ensure footer has background
  },
  doneButton: {
    backgroundColor: "#44A08D",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    minHeight: 50, // Ensure minimum button height
  },
  doneButtonDisabled: {
    backgroundColor: "#ccc",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  doneButtonTextDisabled: {
    color: "#999",
  },
})

export default CuisineSelector