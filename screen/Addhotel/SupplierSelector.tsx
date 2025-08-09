"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

interface SupplierSelectorProps {
  selectedSuppliers: string[]
  onSuppliersChange: (suppliers: string[]) => void
  onValidationChange?: (error: string | null) => void
  editable?: boolean
}

const PREDEFINED_SUPPLIERS = [
  "Pine Valley Farms / Riz Global Foods",
  "AA Halal Wholesale",
  "Afghan Halal Farm",
  "Azka Halal Distributions Inc.",
  "Canada Finest Meat Packers Ltd",
  "Imran Halal Meat",
  "JJ Meat Distributing Ltd",
  "Montpak International",
  "Prime Halal Distributors",
  "Pine Ridge Meat Packers",
  "Selecto Meats",
  "St. Helen's Meat Packers Limited",
  "Toronto Halal Meat Inc.",
  "Al Ameen Halal Poultry",
  "Madina Fine Foods Inc.",
  "Sargent Farms",
  "Al-Ahad Foods Inc.",
  "Sufra",
  "Bellwood Poultry",
  "Sheikh Halal Farms",
  "Zabeeha Poultry Supplies Inc",
  "Chicken Thika Farm",
  "Clarington Poultry Inc.",
  "Cilicia Foods & Poultry",
  "Halal Bounty",
]

export default function SupplierSelector({
  selectedSuppliers,
  onSuppliersChange,
  onValidationChange,
  editable = true,
}: SupplierSelectorProps) {
  const [customSuppliers, setCustomSuppliers] = useState<string[]>([])
  const [customInput, setCustomInput] = useState("")
  const [isOtherSelected, setIsOtherSelected] = useState(false)

  const toggleSupplier = (supplier: string) => {
    if (!editable) return

    if (supplier === "Other") {
      if (isOtherSelected) {
        // Remove "Other" and all custom suppliers
        setIsOtherSelected(false)
        const newSelected = selectedSuppliers.filter((s) => !customSuppliers.includes(s))
        onSuppliersChange(newSelected)
        setCustomSuppliers([])
      } else {
        // Add "Other" - but don't add "Other" to the array, just set the state
        setIsOtherSelected(true)
      }
    } else {
      if (selectedSuppliers.includes(supplier)) {
        onSuppliersChange(selectedSuppliers.filter((s) => s !== supplier))
      } else {
        onSuppliersChange([...selectedSuppliers, supplier])
      }
    }
  }

  const addCustomSupplier = () => {
    if (!customInput.trim() || !editable) return

    const newCustomSupplier = customInput.trim()

    // Check if it already exists
    if (selectedSuppliers.includes(newCustomSupplier) || customSuppliers.includes(newCustomSupplier)) {
      setCustomInput("")
      return
    }

    const newCustomSuppliers = [...customSuppliers, newCustomSupplier]
    setCustomSuppliers(newCustomSuppliers)
    onSuppliersChange([...selectedSuppliers, newCustomSupplier])
    setCustomInput("")
  }

  const removeCustomSupplier = (supplier: string) => {
    if (!editable) return

    const newCustomSuppliers = customSuppliers.filter((s) => s !== supplier)
    setCustomSuppliers(newCustomSuppliers)
    onSuppliersChange(selectedSuppliers.filter((s) => s !== supplier))

    // If no custom suppliers left, uncheck "Other"
    if (newCustomSuppliers.length === 0) {
      setIsOtherSelected(false)
    }
  }

  // Function to check if form is valid for submission
  const getValidationError = () => {
    if (isOtherSelected && customSuppliers.length === 0) {
      return "Please add at least one custom supplier name when 'Other' is selected"
    }
    return null
  }

  // Expose validation function to parent
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(getValidationError())
    }
  }, [isOtherSelected, customSuppliers, onValidationChange])

  const renderSupplierItem = (supplier: string, isCustom = false) => {
    const isSelected = selectedSuppliers.includes(supplier)

    return (
      <TouchableOpacity
        key={supplier}
        style={[styles.supplierItem, isSelected && styles.selectedSupplierItem, !editable && styles.disabledItem]}
        onPress={() => (isCustom ? removeCustomSupplier(supplier) : toggleSupplier(supplier))}
        disabled={!editable}
      >
        <View style={styles.supplierContent}>
          <Text
            style={[styles.supplierText, isSelected && styles.selectedSupplierText, !editable && styles.disabledText]}
          >
            {supplier}
          </Text>
          {isCustom && <Text style={styles.customLabel}>Custom</Text>}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkedBox, !editable && styles.disabledCheckbox]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={isCustom ? "#ff6b35" : "#44A08D"} />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {/* Predefined Suppliers */}
        {PREDEFINED_SUPPLIERS.map((supplier) => renderSupplierItem(supplier))}

        {/* Other Option */}
        <TouchableOpacity
          style={[
            styles.supplierItem,
            styles.otherItem,
            isOtherSelected && styles.selectedOtherItem,
            !editable && styles.disabledItem,
          ]}
          onPress={() => toggleSupplier("Other")}
          disabled={!editable}
        >
          <View style={styles.supplierContent}>
            <Text
              style={[
                styles.supplierText,
                styles.otherText,
                isOtherSelected && styles.selectedOtherText,
                !editable && styles.disabledText,
              ]}
            >
              Other (Custom Supplier)
            </Text>
          </View>
          <View
            style={[
              styles.checkbox,
              styles.otherCheckbox,
              isOtherSelected && styles.checkedOtherBox,
              !editable && styles.disabledCheckbox,
            ]}
          >
            {isOtherSelected && <Ionicons name="checkmark" size={16} color="#ff6b35" />}
          </View>
        </TouchableOpacity>

        {/* Custom Suppliers */}
        {customSuppliers.map((supplier) => renderSupplierItem(supplier, true))}
      </ScrollView>

      {/* Custom Input Section */}
      {isOtherSelected && (
        <View style={styles.customInputSection}>
          <Text style={styles.customInputLabel}>Add Custom Supplier:</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={[styles.customInput, !editable && styles.disabledInput]}
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="Enter custom supplier name"
              placeholderTextColor="#999"
              editable={editable}
              onSubmitEditing={addCustomSupplier}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !customInput.trim() && styles.disabledAddButton,
                !editable && styles.disabledAddButton,
              ]}
              onPress={addCustomSupplier}
              disabled={!customInput.trim() || !editable}
            >
              <Ionicons name="add" size={20} color={customInput.trim() && editable ? "#fff" : "#ccc"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selected Count */}
      <View style={styles.selectedCount}>
        <Text style={styles.selectedCountText}>
          {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? "s" : ""} selected
        </Text>
      </View>

      {/* Validation Error */}
      {isOtherSelected && customSuppliers.length === 0 && (
        <View style={styles.validationError}>
          <Text style={styles.validationErrorText}>Please add at least one custom supplier name</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f8f8",
    borderRadius: 15,
    padding: 15,
  },
  scrollContainer: {
    maxHeight: 300,
  },
  supplierItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 2,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedSupplierItem: {
    backgroundColor: "#e8f5e8",
    borderColor: "#44A08D",
  },
  otherItem: {
    marginTop: 10,
  },
  selectedOtherItem: {
    backgroundColor: "#fff5f0",
    borderColor: "#ff6b35",
  },
  disabledItem: {
    opacity: 0.5,
  },
  supplierContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  supplierText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  selectedSupplierText: {
    color: "#44A08D",
    fontWeight: "500",
  },
  otherText: {
    fontStyle: "italic",
  },
  selectedOtherText: {
    color: "#ff6b35",
    fontWeight: "500",
  },
  disabledText: {
    color: "#999",
  },
  customLabel: {
    fontSize: 10,
    color: "#ff6b35",
    backgroundColor: "#fff5f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkedBox: {
    backgroundColor: "#e8f5e8",
    borderColor: "#44A08D",
  },
  otherCheckbox: {
    borderColor: "#ff6b35",
  },
  checkedOtherBox: {
    backgroundColor: "#fff5f0",
    borderColor: "#ff6b35",
  },
  disabledCheckbox: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  customInputSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff6b35",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  disabledAddButton: {
    backgroundColor: "#f0f0f0",
  },
  selectedCount: {
    marginTop: 10,
    alignItems: "center",
  },
  selectedCountText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  validationError: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  validationErrorText: {
    fontSize: 12,
    color: "#ff4444",
    textAlign: "center",
    fontWeight: "500",
  },
})
