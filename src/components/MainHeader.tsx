import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
} from "react-native";
import { Bell, Menu } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
// ✅ IMPORT THE SERVICE
import { registerForPushNotificationsAsync } from "../services/notificationService";
// ✅ IMPORT SIDEBAR
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "./CustomAlert";

export default function MainHeader() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [monthlyTips, setMonthlyTips] = useState(true);
  const [weeklyReminders, setWeeklyReminders] = useState(true);

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

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const showCustomAlert = (
    title: string,
    message: string,
    actions: AlertAction[] = [{ text: "OK", onPress: hideAlert }]
  ) => {
    setAlertConfig({ visible: true, title, message, actions });
  };

  // ✅ SMART LOGIC: Checks permission before toggling
  const handleToggle = async (
    currentValue: boolean,
    setter: (val: boolean) => void
  ) => {
    if (!currentValue) {
      console.log("👉 Attempting to turn ON notifications...");

      // Asking service...
      const hasPermission = await registerForPushNotificationsAsync();
      console.log("👉 Permission Result:", hasPermission);

      if (hasPermission) {
        setter(true);
        console.log("✅ Switch turned ON");
      } else {
        showCustomAlert(
          t("home.permission_required"),
          t("home.enable_notifications")
        );
        setter(false);
      }
    } else {
      setter(false);
      console.log("marketing switch OFF");
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 pt-8  bg-[#fe948d] shadow-lg shadow-black">
      {/* 3. Menu Button */}
      <TouchableOpacity
        onPress={() => setSidebarVisible(true)}
        className="ml-3"
      >
        <Menu color="white" size={36} />
      </TouchableOpacity>

      <Text style={styles.appName}>MelanoScan</Text>

      {/* 1. Notification Bell */}
      <TouchableOpacity onPress={() => setModalVisible(true)} className="mr-3">
        <Bell color="white" size={32} fill="white" />
      </TouchableOpacity>

      {/* --- NOTIFICATION SETTINGS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              {t("header.notifications_title")}
            </Text>
            <Text className="text-gray-500 mb-6 text-sm">
              {t("header.notifications_desc")}
            </Text>

            {/* Option 1: Monthly Tips */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-gray-800">
                  {t("header.monthly_tips")}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {t("header.monthly_tips_desc")}
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#ffcaca" }}
                thumbColor={monthlyTips ? "#fe948d" : "#f4f3f4"}
                // ✅ Connects to smart logic
                onValueChange={() => handleToggle(monthlyTips, setMonthlyTips)}
                value={monthlyTips}
              />
            </View>

            {/* Option 2: Weekly Reminders */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-gray-800">
                  {t("header.weekly_reminders")}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {t("header.weekly_reminders_desc")}
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#ffcaca" }}
                thumbColor={weeklyReminders ? "#fe948d" : "#f4f3f4"}
                // ✅ Connects to smart logic
                onValueChange={() =>
                  handleToggle(weeklyReminders, setWeeklyReminders)
                }
                value={weeklyReminders}
              />
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              className="bg-[#fe948d] py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">
                {t("home.done")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ✅ SIDEBAR COMPONENT */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
    </View>
  );
}

const styles = {
  appName: {
    fontFamily: "Italianno_400Regular",
    fontSize: 45,
    color: "#ffffffff",
    textShadowColor: "#B08C8C",
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 1,
    zIndex: 2,
  },
};
