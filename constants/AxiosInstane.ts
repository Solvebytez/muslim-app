
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from "react-native";
const apiBaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_URL;
const localBaseURL=`http://192.168.0.131:5000`
const axiosInstance = axios.create({
    baseURL: `${apiBaseUrl}/api/v1/`,
    headers: {
        "Content-Type": "application/json",
    },
});

const configureGoogleSignin = () => {
  if (Platform.OS === "android") {
    GoogleSignin.configure({
      webClientId: "587652399701-3lhoo7eb0d5917ctn4vamusqgorl2748.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }
};

// ✅ Add this interceptor to attach token to *every* request
axiosInstance.interceptors.request.use(
    
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    console.log("token", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error?.request) { 
  console.log("No response received. Request:", error.request);
}
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Only check status if response exists
    if (error?.response?.status === 401 && !originalRequest._retry) {
      console.log("401 login failed", error);

      originalRequest._retry = true;
      await SecureStore.deleteItemAsync("accessToken");
       configureGoogleSignin(); // Configure first
       const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          await GoogleSignin.signOut();
          console.log('Google Sign-in logout successful');
        }

      Alert.alert("Session Expired", "Please log in again", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
    }

    return Promise.reject({ ...error, silent: true });
  }
);


export const setAuthToken = async () => {
  const token = await SecureStore.getItemAsync('accessToken'); // ✅ Use getItemAsync
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"]; // optional fallback
  }
};

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return (
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`
      );
    } else if (error.request) {
      return 'Network error: Unable to connect to server';
    }
  }

  // Non-Axios or unknown errors
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}
export default axiosInstance