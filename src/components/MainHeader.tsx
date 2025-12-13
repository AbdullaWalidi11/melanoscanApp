import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Bell, Menu } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
// ✅ IMPORT THE SERVICE
import { registerForPushNotificationsAsync } from "../services/notificationService";
// ✅ IMPORT SIDEBAR
import Sidebar from "./Sidebar";

export default function MainHeader() {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [monthlyTips, setMonthlyTips] = useState(true);
  const [weeklyReminders, setWeeklyReminders] = useState(true);

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
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your phone settings."
        );
        setter(false);
      }
    } else {
      setter(false);
      console.log("marketing switch OFF");
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 pt-8  bg-[#fe8d93] shadow-lg shadow-black">
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
              Notification Settings
            </Text>
            <Text className="text-gray-500 mb-6 text-sm">
              Manage how MelanoScan keeps you informed.
            </Text>

            {/* Option 1: Monthly Tips */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-gray-800">
                  Monthly Skin Tips
                </Text>
                <Text className="text-gray-500 text-xs">
                  Educational info about skin health.
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#F19B9B" }}
                thumbColor={monthlyTips ? "#fe8d93" : "#f4f3f4"}
                // ✅ Connects to smart logic
                onValueChange={() => handleToggle(monthlyTips, setMonthlyTips)}
                value={monthlyTips}
              />
            </View>

            {/* Option 2: Weekly Reminders */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-gray-800">
                  High-Risk Reminders
                </Text>
                <Text className="text-gray-500 text-xs">
                  Weekly nudges to check flagged lesions.
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#F19B9B" }}
                thumbColor={weeklyReminders ? "#fe8d93" : "#f4f3f4"}
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
              className="bg-[#fe8d93] py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ✅ SIDEBAR COMPONENT */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
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
