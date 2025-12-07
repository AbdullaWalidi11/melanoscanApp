import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

import MainHeader from "../components/MainHeader";
// === NEW IMPORT ===
import ScanMethodPopup from "../components/ScanMethodPopup";

// Screen Imports
import HomeScreen from "../screens/Home";
import HistoryScreen from "../screens/History";
import ProfileScreen from "../screens/Profile";
import DisclaimerScreen from "../screens/Disclaimer";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const [popupVisible, setPopupVisible] = useState(false);
  const navigation = useNavigation<any>();

  // 1. Handle "Center Button" Press
  const handleCameraPress = () => {
    setPopupVisible(true);
  };

  // 2. Handle Selection from Popup
  const handlePhotoSelect = (mode: 'camera' | 'gallery') => {
    setPopupVisible(false);
    // Navigate to the Model stack (we will create this screen soon)
    navigation.navigate('ModelScan', { mode }); 
  };

  return (
    <>
      {/* === REAL POPUP COMPONENT === */}
      <ScanMethodPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onTakePhoto={() => handlePhotoSelect('camera')}
        onUploadImage={() => handlePhotoSelect('gallery')}
      />

      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          header: () => <MainHeader />,
          tabBarStyle: { height: 80, backgroundColor: "#fff" },
        }}
        tabBar={({ state, descriptors, navigation }) => {
          return (
            <View className="flex-row bg-zinc-50 border-t border-white justify-between items-center px-10 pb-5 mb-10 h-24">
              
              {/* HOME */}
              <TouchableOpacity onPress={() => navigation.navigate("Home")} className="items-center">
                <Image source={require("../../assets/images/home.png")} className="w-10 h-10" />
                <Text className="text-[10px] text-[#e2728f] mt-1">Home</Text>
              </TouchableOpacity>

              {/* DISCLAIMER */}
              <TouchableOpacity onPress={() => navigation.navigate("Disclaimer")} className="items-center">
                <Image source={require("../../assets/images/disclaimer.png")} className="w-10 h-10" />
                <Text className="text-[10px] text-[#e2728f] mt-1">Disclaimer</Text>
              </TouchableOpacity>

              {/* CENTER CAMERA BUTTON */}
              <TouchableOpacity
                onPress={handleCameraPress}
                className="absolute left-1/2 -top-24 bg-[#e2728f] w-24 h-24 rounded-2xl items-center justify-center shadow-xl"
              >
                 <Image source={require("../../assets/images/camera.png")} className="w-20 h-20 rounded-2xl" />
              </TouchableOpacity>

              {/* HISTORY */}
              <TouchableOpacity onPress={() => navigation.navigate("History")} className="items-center">
                <Image source={require("../../assets/images/history.png")} className="w-10 h-10" />
                <Text className="text-[10px] text-[#e2728f] mt-1">History</Text>
              </TouchableOpacity>

              {/* PROFILE */}
              <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="items-center">
                <Image source={require("../../assets/images/profile.png")} className="w-10 h-10 rounded-2xl" />
                <Text className="text-[10px] text-[#e2728f] mt-1">Profile</Text>
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