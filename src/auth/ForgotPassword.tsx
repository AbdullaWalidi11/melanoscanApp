import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Mail, LockKeyhole } from "lucide-react-native";
import { sendPasswordReset } from "../services/authService";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../components/CustomAlert";

export default function ForgotPassword() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

  const showCustomAlert = (title: string, message: string, actions: AlertAction[] = [{ text: "OK", onPress: hideAlert }]) => {
    setAlertConfig({ visible: true, title, message, actions });
  };


  const handleResetPassword = async () => {
    if (!email) {
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.forgot.alerts.enter_email")
      );
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);

      showCustomAlert(
        t("auth.forgot.alerts.check_email_title"),
        t("auth.forgot.alerts.check_email_msg"),
        [{ text: "OK", onPress: () => { hideAlert(); navigation.goBack(); } }]
      );
    } catch (error: any) {
      console.error("Reset Error:", error);
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.forgot.alerts.fail_msg")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6">
      {/* 1. Top Navigation (Back Button) */}
      <View className="mt-14 mb-8">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* 2. Hero Icon & Title */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-[#fff0ee] rounded-full items-center justify-center mb-6">
            <LockKeyhole size={40} color="#fe948d" />
          </View>
          <Text className="text-3xl font-bold text-[#5a3e3e] mb-2">
            {t("auth.forgot.title")}
          </Text>
          <Text className="text-center text-gray-500 px-4">
            {t("auth.forgot.desc")}
          </Text>
        </View>

        {/* 3. Input Field */}
        <View className="mb-8">
          <Text className="text-lg font-medium mb-2 text-gray-700">
            {t("auth.login.email_label")}
          </Text>
          <View className="relative justify-center">
            <TextInput
              placeholder={t("auth.login.email_placeholder")}
              value={email}
              onChangeText={setEmail}
              className="w-full border pl-12 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {/* Mail Icon inside Input */}
            <View className="absolute left-4">
              <Mail size={20} color="gray" />
            </View>
          </View>
        </View>

        {/* 4. Send Button */}
        <TouchableOpacity
          className="bg-[#fe948d] py-5 rounded-full shadow-md mb-6"
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? t("auth.forgot.sending") : t("auth.forgot.send_btn")}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

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
