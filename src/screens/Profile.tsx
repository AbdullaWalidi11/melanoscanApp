import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
// ✅ Import the database wipe function for Scenario 5
import { clearDatabase } from "../database/queries";
import { AUTH } from "../services/Firebase";
import { useTranslation } from "react-i18next";
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
import CustomAlert, { AlertAction } from "../components/CustomAlert";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  // Get user info and the setter to log out
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const isCloudUser = user && user.uid !== "offline_guest";

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    actions: AlertAction[];
  }>({
    visible: false,
    title: "",
    message: "",
    actions: [],
  });

  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const showCustomAlert = (
    title: string,
    message: string,
    actions: AlertAction[]
  ) => {
    setAlertConfig({ visible: true, title, message, actions });
  };

  // --- LOGOUT FUNCTION (Modified to sign out from Firebase Native SDK) ---
  const handleLogout = () => {
    showCustomAlert(
      t("profile.logout_alert_title"),
      t("profile.logout_alert_body"),
      [
        { text: t("profile.cancel"), style: "cancel", onPress: hideAlert },
        {
          text: t("profile.confirm_logout"),
          style: "destructive",
          onPress: async () => {
            hideAlert();
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
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ----- PROFILE IMAGE & NAME ----- */}
        <View className="items-center mt-8 mb-8">
          <View className="w-32 h-32 bg-[#fdaaa4] rounded-full items-center justify-center mb-4 shadow-sm">
            <User color="white" size={48} />
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            {user?.displayName || t("profile.guest_user")}
          </Text>
          <Text className="text-[#fe948d] font-medium">
            {user?.isAnonymous
              ? t("profile.offline_account")
              : t("profile.enthusiast")}
          </Text>
        </View>

        {/* ----- MENU ITEMS ----- */}
        <View className="px-6 border-t border-gray-100 pt-4">
          <MenuItem
            icon={<Settings color="#555" size={24} />}
            text={t("profile.account_settings")}
          />
          <MenuItem
            icon={<Bell color="#555" size={24} />}
            text={t("profile.notifications")}
          />
          <MenuItem
            icon={<Globe color="#555" size={24} />}
            text={t("profile.language")}
          />
          <MenuItem
            icon={<Shield color="#555" size={24} />}
            text={t("profile.privacy_policy")}
          />
        </View>

        {/* ----- LOGOUT/LOGIN BUTTON (Dynamic) ----- */}
        <View className="px-6 mt-10 mb-12">
          <TouchableOpacity
            onPress={isCloudUser ? handleLogout : handleLogin} // <-- LOGIC SWITCH
            className="bg-[#fe948d] flex-row justify-center items-center py-4 rounded-full shadow-md active:opacity-80"
          >
            {isCloudUser ? (
              // SHOW LOGOUT BUTTON
              <>
                <LogOut color="white" size={20} style={{ marginRight: 8 }} />
                <Text className="text-white text-lg font-semibold">
                  {t("profile.log_out")}
                </Text>
              </>
            ) : (
              // SHOW LOGIN/SYNC BUTTON for GUEST USER
              <>
                <LogIn color="white" size={20} style={{ marginRight: 8 }} />
                <Text className="text-white text-lg font-semibold">
                  {t("profile.log_in")}{" "}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
