import { StyleSheet } from "react-native";
import { useGetuser } from "@/hooks/useGetuser";
import Mapscreen from "@/screen/map/Mapsceeen";

export default function HomeScreen() {
  const { user } = useGetuser();

  // Allow guest access to map - users can browse without login
  // Some features may require login, but browsing is allowed
  return <Mapscreen />;
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
