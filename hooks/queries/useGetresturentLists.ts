"use client";

import axiosInstance from "@/constants/AxiosInstane";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

type HotelResponse = {
  current_page: number;
  hasNextPage: boolean;
  restaurants: any[]; // Replace `any` with your specific restaurant type
  totalRestaurantsByUser: number;
};

export const useGetHotelsByStatus = ({
  endpoint,
  queryKey,
  pageSize = 4,
  resetOnMount = false,
}: {
  endpoint: string;
  queryKey: string;
  pageSize?: number;
  resetOnMount?: boolean;
}) => {
  const queryClient = useQueryClient();

  // Reset query when component mounts if resetOnMount is true
  useEffect(() => {
    if (resetOnMount) {
      queryClient.resetQueries({ queryKey: [queryKey] });
    }
  }, [queryClient, queryKey, resetOnMount]);

  return useInfiniteQuery<HotelResponse>({
    queryKey: [queryKey],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.post(endpoint, {
        pageNumber: pageParam,
        pageSize,
      });

      return response.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.current_page + 1;
      }
      return null;
    },
    // Force fresh data on mount
    staleTime: resetOnMount ? 0 : 30 * 60 * 1000,
    gcTime: resetOnMount ? 0 : 5 * 60 * 1000, // Garbage collection time
    refetchOnMount: "always", // Always refetch, even if data is fresh
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};

type HotelCuisinsResponse = {
  current_page: number;
  hasNextPage: boolean;
  groups: any[];
  totalCuisines: number;
};

export const useGetAllHotels = ({
  endpoint,
  queryKey,
  pageSize = 4,
  resetOnMount = false,
  cuisineName,
}: {
  cuisineName?: string;
  endpoint: string;
  queryKey: string;
  pageSize?: number;
  resetOnMount?: boolean;
}) => {
  const queryClient = useQueryClient();

  // Reset query when component mounts if resetOnMount is true
  useEffect(() => {
    if (resetOnMount) {
      queryClient.resetQueries({ queryKey: [queryKey] });
    }
  }, [queryClient, queryKey, resetOnMount]);

  return useInfiniteQuery<HotelCuisinsResponse>({
    queryKey: [queryKey, cuisineName], // Include cuisineName in query key
    queryFn: async ({ pageParam = 1 }) => {
      console.log("🍽️ Fetching hotels by cuisine:", {
        endpoint,
        pageNumber: pageParam,
        pageSize,
        cuisinsName: cuisineName,
      });
      
      try {
        const response = await axiosInstance.post(endpoint, {
          pageNumber: pageParam,
          pageSize,
          cuisinsName: cuisineName,
        });
        
        console.log("✅ Hotels by cuisine response:", {
          status: response.status,
          hasData: !!response.data?.data,
          groupsCount: response.data?.data?.groups?.length || 0,
          totalCuisines: response.data?.data?.totalCuisines,
          groups: response.data?.data?.groups?.map((g: any) => ({
            cuisine: g.cuisine,
            restaurantsCount: g.restaurants?.length || 0,
          })),
        });
        
        return response.data.data;
      } catch (error: any) {
        console.error("❌ Error fetching hotels by cuisine:", {
          endpoint,
          cuisineName,
          error: error?.response?.data || error?.message,
          status: error?.response?.status,
        });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.current_page + 1;
      }
      return null;
    },
    // Force fresh data on mount
    staleTime: resetOnMount ? 0 : 30 * 60 * 1000,
    gcTime: resetOnMount ? 0 : 5 * 60 * 1000,
    refetchOnMount: "always", // Always refetch, even if data is fresh
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};

export interface Restaurant {
  _id: string;
  name: string;
  cuisine: string[];
  image?: {
    _id: string;
    url: string;
    filename: string;
  };
  address: string;
  rating: number;
  isInWishlist: boolean;
  calculatedDistance: number;
  distanceUnit: string;
  userId: string;
  isApproved: string;
  placeId?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  googleMapsPlaceId?: string;
  googleMapsUrl?: string;
  suppliers: string[];
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface NearestRestaurantsResponse {
  success: boolean;
  data: Restaurant[];
  totalResults: number;
  searchCenter: {
    latitude: number;
    longitude: number;
  };
  maxDistance: number;
}

export interface NearestRestaurantsRequest {
  lat: number;
  lng: number;
  maxDistance?: number;
  limit?: number;
  cuisine?: string[];
  minRating?: number;
}

export const restaurantApi = {
  getNearestRestaurants: async (
    params: NearestRestaurantsRequest
  ): Promise<NearestRestaurantsResponse> => {
    const response = await axiosInstance.post(`/nearest-restaurants`, params);
    return response.data;
  },
};

export const useNearestRestaurants = (
  params: NearestRestaurantsRequest,
  options?: {
    resetOnMount?: boolean;
    forceRefresh?: boolean;
    enabled?: boolean;
  }
) => {
  const queryClient = useQueryClient();
  const {
    resetOnMount = false,
    forceRefresh = false,
    enabled = true,
  } = options || {};

  // Reset query when component mounts if resetOnMount is true
  useEffect(() => {
    if (resetOnMount) {
      queryClient.resetQueries({ queryKey: ["nearest-restaurants", params] });
    }
  }, [queryClient, resetOnMount, params]);

  return useQuery({
    queryKey: ["nearest-restaurants", params],
    queryFn: () => restaurantApi.getNearestRestaurants(params),
    enabled: enabled && !!(params.lat && params.lng),
    // Optimized caching strategy
    staleTime: forceRefresh || resetOnMount ? 0 : 5 * 60 * 1000, // 5 minutes
    gcTime: forceRefresh || resetOnMount ? 0 : 10 * 60 * 1000, // 10 minutes
    refetchOnMount: forceRefresh ? "always" : false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect
    retry: 1, // Reduce retry attempts
    retryDelay: 1000, // Add delay between retries
  });
};

const getCuisnesList = async () => {
  const response = await axiosInstance.get(`/all-cuisines`);
  return response.data.data;
};

export const useGetCuisines = () => {
  return useQuery({
    queryKey: ["cuisines"],
    queryFn: getCuisnesList,
    staleTime: 0, // Always consider data stale
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
