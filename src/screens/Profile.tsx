import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
// ✅ Import the database wipe function for Scenario 5
import { clearDatabase } from "../database/queries";
import { AUTH } from "../services/Firebase";
// Icons to match the design
import {
  ChevronLeft,
  Settings,
  Camera,
  User,
  Bell,
  Globe,
  Shield,
  ChevronRight,
  LogOut,
  LogIn,
} from "lucide-react-native";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  // Get user info and the setter to log out
  const { user, setUser } = useAuth();

  const isCloudUser = user && user.uid !== 'offline_guest';
  
  // --- LOGOUT FUNCTION (Modified to sign out from Firebase Native SDK) ---
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out? All local data will be cleared from this device for your privacy.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out - Wipe Data",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Wipe the local SQLite database (Scenario 5)
              await clearDatabase();
              
              // 2. Sign out from Firebase Native SDK (if they were a registered user)
              if (AUTH.currentUser) {
                await AUTH.signOut();
              }

              // 3. Clear local context (triggers navigation back to Splash/Login)
              setUser(null); 
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
      // Navigate to the Login screen where they can sign up or sign in, 
      // triggering the Grand Merge (Scenario 2) upon success.
      navigation.navigate("Login"); 
  };

  // Helper component for menu items to keep code clean
  const MenuItem = ({
    icon,
    text,
    onPress,
  }: {
    icon: React.ReactNode;
    text: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
    >
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-4 text-lg text-gray-700">{text}</Text>
      </View>
      <ChevronRight color="#999" size={20} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      {/* ----- HEADER ----- */}
      <View className="bg-[#e2728f] pt-12 pb-4 px-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Profile</Text>
        <TouchableOpacity>
          <Settings color="white" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ----- PROFILE IMAGE & NAME ----- */}
        <View className="items-center mt-8 mb-8">
          <View className="w-32 h-32 bg-[#ffb6c6] rounded-full items-center justify-center mb-4 shadow-sm">
            <Camera color="white" size={48} />
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            {user?.displayName || "Guest User"}
          </Text>
          <Text className="text-[#e2728f] font-medium">
            {user?.isAnonymous ? "Offline Account" : "Skin Health Enthusiast"}
          </Text>
        </View>

        {/* ----- PERSONAL INFORMATION ----- */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center mb-3">
            <User color="#555" size={24} />
            <Text className="text-lg font-semibold ml-3 text-gray-700">
              Personal Information
            </Text>
          </View>
          <View className="pl-11">
            <Text className="text-gray-600 py-1">
              <Text className="font-medium">Email:</Text>{" "}
              {user?.email || "Not linked"}
            </Text>
            {/* Placeholders for future data */}
            <Text className="text-gray-400 py-1">Phone: +1 234 567 890</Text>
            <Text className="text-gray-400 py-1">DOB: Jan 1, 1990</Text>
          </View>
        </View>

        {/* ----- MENU ITEMS ----- */}
        <View className="px-6 border-t border-gray-100 pt-4">
          <MenuItem
            icon={<Settings color="#555" size={24} />}
            text="Account Settings"
          />
          <MenuItem
            icon={<Bell color="#555" size={24} />}
            text="Notifications"
          />
          <MenuItem
            icon={<Globe color="#555" size={24} />}
            text="Language"
          />
          <MenuItem
            icon={<Shield color="#555" size={24} />}
            text="Privacy Policy"
          />
        </View>

        {/* ----- LOGOUT/LOGIN BUTTON (Dynamic) ----- */}
        <View className="px-6 mt-10 mb-12">
          <TouchableOpacity
            onPress={isCloudUser ? handleLogout : handleLogin} // <-- LOGIC SWITCH
            className="bg-[#e2728f] flex-row justify-center items-center py-4 rounded-full shadow-md active:opacity-80"
          >
            {isCloudUser ? (
              // SHOW LOGOUT BUTTON
              <>
                <LogOut color="white" size={20} style={{ marginRight: 8 }} />
                <Text className="text-white text-lg font-semibold">Log Out</Text>
              </>
            ) : (
              // SHOW LOGIN/SYNC BUTTON for GUEST USER
              <>
                <LogIn color="white" size={20} style={{ marginRight: 8 }} />
                <Text className="text-white text-lg font-semibold">Log In / Sync Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}