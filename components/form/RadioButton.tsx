import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


type RadioButtonProps = {
        label: string;
        selected: boolean;
        onPress: () => void;
    };

  const RadioButton = ({ label, selected, onPress }:RadioButtonProps) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
      <View style={styles.radioCircle}>{selected && <View style={styles.radioSelected} />}</View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  )

  const styles = StyleSheet.create({
   
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1e88e5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1e88e5",
  },
  radioLabel: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  
  })

  export default RadioButton