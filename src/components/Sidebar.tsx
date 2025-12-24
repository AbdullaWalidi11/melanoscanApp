import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { AUTH } from "../services/Firebase";
import { clearDatabase } from "../database/queries";
import {
  X,
  Home,
  FileText,
  User,
  Info,
  LogOut,
  LogIn,
  Globe,
  ChevronRight,
  MapPin,
} from "lucide-react-native";
import { openNearestDermatologist } from "../services/linkingService";

import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";
import CustomAlert, { AlertAction } from "./CustomAlert";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuth();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isCloudUser = user && user.uid !== "offline_guest";

  // Internal state to keep Modal visible during exit animation
  const [showModal, setShowModal] = useState(false);

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

  const showAlert = (
    title: string,
    message: string | undefined,
    actions: AlertAction[]
  ) => {
    setAlertConfig({ visible: true, title, message, actions });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleNavigation = (screen: string) => {
    onClose();
    // Navigation will happen after parent updates state, triggering exit animation
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  const handleLogout = () => {
    showAlert(t("sidebar.logout"), t("components.sidebar.logout_confirm_msg"), [
      {
        text: t("home.cancel"),
        style: "cancel",
        onPress: hideAlert,
      },
      {
        text: t("sidebar.logout"),
        style: "destructive",
        onPress: async () => {
          hideAlert();
          onClose();
          try {
            await clearDatabase();
            if (AUTH.currentUser) {
              await AUTH.signOut();
            }
            setUser(null);
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleLogin = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate("Login");
    }, 300);
  };

  const handleLanguageChange = () => {
    showAlert(t("sidebar.language"), undefined, [
      {
        text: "English",
        onPress: () => {
          setLanguage("en");
          hideAlert();
        },
      },
      {
        text: "Türkçe",
        onPress: () => {
          setLanguage("tr");
          hideAlert();
        },
      },
    ]);
  };

  // Safe check if needed, though local state handles it
  if (!showModal) return null;

  const MenuItem = ({
    icon,
    text,
    onPress,
  }: {
    icon: React.ReactNode;
    text: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
    >
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-4 text-lg text-gray-700 font-medium">{text}</Text>
      </View>
      <ChevronRight color="#ccc" size={20} />
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.overlay}>
        {/* Dark overlay background */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Sidebar Web */}
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
        >
          {/* Header */}
          <View className="pt-12 pb-6 px-6 bg-[#fe948d] items-center">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3 shadow-sm">
              <User color="#fe8d93" size={40} />
            </View>
            <Text className="text-xl font-bold text-white">
              {user?.displayName || t("components.sidebar.guest_user")}
            </Text>
            <Text className="text-white/80 text-sm">
              {user?.isAnonymous
                ? t("components.sidebar.offline_account")
                : t("components.sidebar.member")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="absolute top-12 right-4 p-1"
            >
              <X color="white" size={28} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View className="flex-1 px-6 pt-4 bg-white">
            <MenuItem
              icon={<Home color="#555" size={24} />}
              text={t("components.sidebar.menu.home")}
              onPress={() => handleNavigation("Home")}
            />
            <MenuItem
              icon={<FileText color="#555" size={24} />}
              text={t("components.sidebar.menu.history")}
              onPress={() => handleNavigation("History")}
            />
            <MenuItem
              icon={<User color="#555" size={24} />}
              text={t("components.sidebar.menu.profile")}
              onPress={() => handleNavigation("Profile")}
            />
            <MenuItem
              icon={<Globe color="#555" size={24} />}
              text={t("sidebar.language")}
              onPress={handleLanguageChange}
            />
            <MenuItem
              icon={<Info color="#555" size={24} />}
              text={t("components.sidebar.menu.disclaimer")}
              onPress={() => handleNavigation("Disclaimer")}
            />
            <MenuItem
              icon={<MapPin color="#555" size={24} />}
              text={t("sidebar.find_clinic")}
              onPress={() => {
                onClose();
                openNearestDermatologist();
              }}
            />
            <MenuItem
              icon={<FileText color="#555" size={24} />}
              text={t("sidebar.clinical_report")}
              onPress={() => handleNavigation("ReportSelection")}
            />
          </View>

          {/* Footer */}
          <View className="p-6 border-t border-gray-100 bg-white pb-10">
            <TouchableOpacity
              onPress={isCloudUser ? handleLogout : handleLogin}
              className="flex-row items-center justify-center bg-[#fe948d] py-3 rounded-xl border border-gray-200"
            >
              {isCloudUser ? (
                <>
                  <LogOut color="#fe8d93" size={20} />
                  <Text className="ml-2 text-[#f8f9fa] font-bold">
                    {t("sidebar.logout")}
                  </Text>
                </>
              ) : (
                <>
                  <LogIn color="#fe8d93" size={20} />
                  <Text className="ml-2 text-[#f8f9fa] font-bold">
                    {t("components.sidebar.menu.login")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
