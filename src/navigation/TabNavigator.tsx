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

// Dummy Component for Camera Tab
const EmptyComponent = () => null;

export default function TabNavigator() {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const navigation = useNavigation<any>();

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
          tabBarStyle: {
            height: 80,
            backgroundColor: "#fff",
            borderTopWidth: 0,
            elevation: 5, // Reduced from 10
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05, // Reduced from 0.1
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 4,
            marginBottom: 10,
          },
          tabBarActiveTintColor: "#fe948d",
          tabBarInactiveTintColor: "rgba(254, 141, 147, 0.5)",
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t("components.sidebar.menu.home"),
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Disclaimer"
          component={DisclaimerScreen}
          options={{
            tabBarLabel: t("components.sidebar.menu.disclaimer"),
            tabBarIcon: ({ color }) => <Info size={24} color={color} />,
          }}
        />

        {/* === CENTRAL CAMERA BUTTON === */}
        <Tab.Screen
          name="Scan"
          component={EmptyComponent}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent navigation
              setPopupVisible(true);
            },
          }}
          options={{
            tabBarLabel: () => null, // No label for camera
            tabBarIcon: () => (
              <View className="absolute -top-10 items-center justify-center">
                <View className="bg-[#fe948d] w-[65px] h-[65px] rounded-2xl items-center justify-center shadow-2xl shadow-black-500/50">
                  <Image
                    source={require("../../assets/images/camera.png")}
                    className="w-[50px] h-[50px] rounded-2xl"
                  />
                </View>
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: t("components.sidebar.menu.history"),
            tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: t("components.sidebar.menu.profile"),
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </>
  );
}
