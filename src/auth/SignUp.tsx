import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../components/CustomAlert";

// ✅ 1. Import Real Services
import { signUpWithEmail } from "../services/authService";
import { syncLocalToCloud } from "../services/SyncService";

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth(); // To auto-login after signup
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const signUp = async () => {
    if (!name || !email || !password) {
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.signup.alerts.fill_all")
      );
      return;
    }
    if (password.length < 6) {
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.signup.alerts.pass_length")
      );
      return;
    }
    if (password !== confirmPassword) {
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.signup.alerts.pass_mismatch")
      );
      return;
    }

    setLoading(true);
    try {
      // ✅ Real Firebase Sign Up
      const { user } = await signUpWithEmail(name, email, password);

      showCustomAlert(
        t("auth.signup.alerts.success_title"),
        t("auth.signup.alerts.success_msg"),
        [
          {
            text: "OK",
            onPress: () => {
              hideAlert();
              navigation.replace("Login");
            },
          },
        ]
      );

      // Auto-login logic
      if (user) {
        setUser(user);
        // Navigation handled in alert callback or context listener usually,
        // but here we wait for alert confirm or just let it replace.
        // Actually, if we show alert, we should wait.
        // But the previous code navigated immediately after alert?
        // Previous code: Alert.alert(...); navigation.replace("Login");
        // Alert.alert is non-blocking in logic but blocks interaction.
        // Let's rely on the OK button to navigate.
      }
    } catch (error: any) {
      console.error(error);
      let msg = t("auth.signup.alerts.fail_msg");
      // Could map specific Firebase error codes to translations if desired, but general is fine for now
      if (error.code === "auth/email-already-in-use")
        msg = "That email is already in use.";
      if (error.code === "auth/invalid-email") msg = "Invalid email address.";
      if (error.code === "auth/weak-password") msg = "Password is too weak.";
      showCustomAlert(t("auth.login.alerts.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        <View className="flex-1 justify-center mt-20">
          {/* Title */}
          <Text className="text-3xl font-bold text-center mb-8 py-8">
            {t("auth.signup.title")}
          </Text>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-2 text-gray-700">
              {t("auth.signup.name_label")}
            </Text>
            <View className="absolute left-5 top-14 z-10">
              <User size={20} color="gray" />
            </View>
            <TextInput
              placeholder={t("auth.signup.name_placeholder")}
              value={name}
              onChangeText={setName}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              autoCapitalize="words"
              placeholderTextColor="#777"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-2 text-gray-700">
              {t("auth.login.email_label")}
            </Text>
            <View className="absolute left-5 top-14 z-10">
              <Mail size={20} color="gray" />
            </View>
            <TextInput
              placeholder={t("auth.login.email_placeholder")}
              value={email}
              onChangeText={setEmail}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#777"
            />
          </View>

          {/* Password */}
          <View className="mb-2">
            <Text className="text-lg font-medium mb-2 text-gray-700">
              {t("auth.signup.create_pass_label")}
            </Text>
            <View className="absolute left-5 top-14 z-10">
              <Lock size={20} color="gray" />
            </View>
            <TextInput
              placeholder={t("auth.signup.create_pass_placeholder")}
              value={password}
              onChangeText={setPassword}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              secureTextEntry={!showPassword}
              placeholderTextColor="#777"
            />
            <TouchableOpacity
              className="absolute right-5 top-[52px]"
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye size={20} color="gray" />
              ) : (
                <EyeOff size={20} color="gray" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View className="mb-8">
            <Text className="text-lg font-medium mb-2 text-gray-700">
              {t("auth.signup.confirm_pass_label")}
            </Text>
            <View className="absolute left-5 top-14 z-10">
              <Lock size={20} color="gray" />
            </View>
            <TextInput
              placeholder={t("auth.signup.confirm_pass_placeholder")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base"
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#777"
            />
            <TouchableOpacity
              className="absolute right-5 top-[52px]"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye size={20} color="gray" />
              ) : (
                <EyeOff size={20} color="gray" />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            className="bg-[#fe948d] py-5 rounded-full shadow-md mb-6"
            onPress={signUp}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading
                ? t("auth.signup.creating_account")
                : t("auth.signup.signup_btn")}
            </Text>
          </TouchableOpacity>

          {/* Redirect to login */}
          <Text className="text-center text-sm text-gray-600 mb-10">
            {t("auth.signup.have_account")}{" "}
            <Text
              className="text-[#fe948d] font-semibold"
              onPress={() => navigation.navigate("Login")}
            >
              {t("auth.signup.login_link")}
            </Text>
          </Text>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
}
