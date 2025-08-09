import Constants from "expo-constants";
import { Dimensions } from "react-native";


export const { width, height } = Dimensions.get("window")
export const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY;