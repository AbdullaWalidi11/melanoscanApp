import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// ✅ 1. IMPORT ICONS
import { Home, FileText, Info, User } from "lucide-react-native";

import MainHeader from "../components/MainHeader";
import ScanMethodPopup from "../components/ScanMethodPopup";

// ... Screen Imports ...
import HomeScreen from "../screens/Home";
import HistoryScreen from "../screens/History";
import ProfileScreen from "../screens/Profile";
import DisclaimerScreen from "../screens/Disclaimer";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const navigation = useNavigation<any>();

  const handleCameraPress = () => {
    setPopupVisible(true);
  };

  const handlePhotoSelect = (mode: "camera" | "gallery") => {
    setPopupVisible(false);
    navigation.navigate("ModelScan", { mode });
  };

  return (
    <>
      <ScanMethodPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onTakePhoto={() => handlePhotoSelect("camera")}
        onUploadImage={() => handlePhotoSelect("gallery")}
      />

      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          header: () => <MainHeader />,
          tabBarStyle: { height: 80, backgroundColor: "#fff" },
        }}
        tabBar={({ state, descriptors, navigation }) => {
          const isHomeFocused = state.index === 0;
          const isDisclaimerFocused = state.index === 1;
          const isHistoryFocused = state.index === 2;
          const isProfileFocused = state.index === 3;

          // ✅ HELPER: Returns the correct color (Same pink, different opacity)
          const getColor = (focused: boolean) =>
            focused ? "#fe948d" : "rgba(254, 141, 147, 0.5)";

          // ✅ HELPER: Returns the correct text style
          const getTextStyle = (focused: boolean) =>
            `text-[10px] mt-1 text-[#fe948d] ${focused ? "font-bold opacity-100" : "font-normal opacity-50"}`;

          return (
            <View className="flex-row bg-white border-t border-white justify-between items-center px-10 pb-5 mb-10 h-24 shadow-2xl shadow-black">
              {/* === HOME === */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Home")}
                className="items-center"
              >
                {/* Replace Image with Icon */}
                <Home size={28} color={getColor(isHomeFocused)} />
                <Text className={getTextStyle(isHomeFocused)}>
                  {t("components.sidebar.menu.home")}
                </Text>
              </TouchableOpacity>

              {/* === DISCLAIMER === */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Disclaimer")}
                className="items-center mr-6"
              >
                <Info size={28} color={getColor(isDisclaimerFocused)} />
                <Text className={getTextStyle(isDisclaimerFocused)}>
                  {t("components.sidebar.menu.disclaimer")}
                </Text>
              </TouchableOpacity>

              {/* === CAMERA (Keep Image or use Camera Icon) === */}
              <TouchableOpacity
                onPress={handleCameraPress}
                className="absolute left-1/2 -top-12 ml-2 bg-[#fe948d] w-[65px] h-[65px] rounded-2xl items-center justify-center shadow-2xl shadow-white"
              >
                {/* You can keep your custom image here if you prefer, or switch to an Icon */}
                <Image
                  source={require("../../assets/images/camera.png")}
                  className="w-[50px] h-[50px] rounded-2xl"
                />
              </TouchableOpacity>

              {/* === HISTORY === */}
              <TouchableOpacity
                onPress={() => navigation.navigate("History")}
                className="items-center ml-2"
              >
                <FileText size={28} color={getColor(isHistoryFocused)} />
                <Text className={getTextStyle(isHistoryFocused)}>
                  {t("components.sidebar.menu.history")}
                </Text>
              </TouchableOpacity>

              {/* === PROFILE === */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Profile")}
                className="items-center"
              >
                <User size={28} color={getColor(isProfileFocused)} />
                <Text className={getTextStyle(isProfileFocused)}>
                  {t("components.sidebar.menu.profile")}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Disclaimer" component={DisclaimerScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
}
