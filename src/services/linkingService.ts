import { Linking, Platform } from "react-native";

export const openNearestDermatologist = () => {
  const query = "dermatologist near me";
  const url = Platform.select({
    ios: `maps:0,0?q=${query}`,
    android: `geo:0,0?q=${query}`,
  });

  Linking.openURL(url!).catch((err) => {
    console.error("Failed to open map url:", err);
  });
};
