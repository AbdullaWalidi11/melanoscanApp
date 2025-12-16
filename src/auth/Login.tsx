import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Eye, EyeOff, Check } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../components/CustomAlert";

// ✅ Correct Native Import
import { signInWithGoogle } from "../services/Firebase";

// Services
import { emailSignIn } from "../services/authService";
import { runFullSync } from "../services/SyncService";

export default function Login() {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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

  // --- Email/Password Login ---
  const handleEmailLogin = async () => {
    if (!email || !password) {
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("auth.login.alerts.fill_all")
      );
      return;
    }

    setLoading(true);
    try {
      const user = await emailSignIn(email, password);
      setUser(user);

      // ✅ Run full sync logic (Push local -> Pull cloud)
      await runFullSync();

      navigation.replace("MainTabs");
    } catch (error: any) {
      console.error("Login error:", error);
      showCustomAlert(
        t("auth.login.alerts.login_failed"),
        t("auth.login.alerts.check_creds")
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Google Sign-In (Native) ---
  const handleNativeGoogleLogin = async () => {
    setLoading(true);
    try {
      // 1. Sign In
      const userCredential = await signInWithGoogle();

      // 2. Force Context Update (Don't wait for listener)
      setUser(userCredential.user);

      // 3. Sync Data (Just like Email Login)
      await runFullSync();

      // 4. Force Navigation (The missing piece!)
      navigation.replace("MainTabs");
    } catch (e) {
      console.log("Google Sign-In cancelled/failed", e);
      showCustomAlert(
        t("auth.login.alerts.google_fail_title"),
        t("auth.login.alerts.google_fail_msg")
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Guest Mode ---
  const handleNoSignIn = () => {
    const offlineUser = {
      uid: "offline_guest",
      isAnonymous: true,
      email: null,
      displayName: "Guest",
    };

    setUser(offlineUser);
    navigation.navigate("LandingPage1");
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-center text-4xl font-bold mb-24 ">
        {t("auth.login.title")}
      </Text>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-lg font-medium mb-2 text-gray-700">
          {t("auth.login.email_label")}
        </Text>
        <TextInput
          placeholder={t("auth.login.email_placeholder")}
          value={email}
          onChangeText={setEmail}
          className="w-full border pl-6 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      {/* Password */}
      <View className="mb-2">
        <Text className="text-lg font-medium mb-2 text-gray-700">
          {t("auth.login.password_label")}
        </Text>
        <TextInput
          placeholder={t("auth.login.password_placeholder")}
          value={password}
          onChangeText={setPassword}
          className="w-full border pl-6 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
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

      {/* Remember me + Forgot password */}
      <View className="flex-row justify-between items-center mb-9">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setRemember(!remember)}
        >
          <View
            className={`w-5 h-5 mr-2 rounded border items-center justify-center ${
              remember ? "border-[#e2728f]" : "border-gray-400"
            }`}
          >
            {remember && <Check size={14} color="#e2728f" strokeWidth={4} />}
          </View>
          <Text className="text-sm text-gray-600">
            {t("auth.login.remember_me")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text className="text-sm text-[#fe948d] font-medium">
            {t("auth.login.forgot_password")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        className="bg-[#fe948d] py-5 rounded-full mb-3 shadow-md"
        onPress={handleEmailLogin}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-base">
          {loading ? t("auth.login.logging_in") : t("auth.login.login_btn")}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-8 py-3">
        <View className="flex-1 h-[1px] bg-gray-300" />
        <Text className="mx-3 text-gray-600 text-sm">
          {t("auth.login.or_sign_in_with")}
        </Text>
        <View className="flex-1 h-[1px] bg-gray-300" />
      </View>

      {/* ✅ CLEANED GOOGLE BUTTON */}
      <TouchableOpacity
        className="flex-row items-center bg-white border border-gray-300 py-4 pl-2 rounded-full mb-5 shadow-sm"
        disabled={loading}
        onPress={handleNativeGoogleLogin}
      >
        <Image
          source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
          className="w-9 h-9 ml-4"
        />
        <Text className="flex-1 text-center text-base font-medium mr-8 text-gray-700">
          {t("auth.login.google_btn")}
        </Text>
      </TouchableOpacity>

      {/* Guest */}
      <TouchableOpacity
        className="flex-row items-center bg-neutral-800 py-4 rounded-full pl-2 shadow-sm"
        onPress={handleNoSignIn}
        disabled={loading}
      >
        <Image
          source={{
            uri: "https://img.icons8.com/ios-filled/50/ffffff/user.png",
          }}
          className="w-9 h-9 ml-4"
        />
        <Text className="flex-1 text-center text-base font-medium text-white mr-10">
          {t("auth.login.guest_btn")}
        </Text>
      </TouchableOpacity>

      {/* Sign up link */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-600 text-sm">
          {t("auth.login.no_account")}{" "}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text className="text-[#fe948d] font-medium text-sm">
            {t("auth.login.signup_link")}
          </Text>
        </TouchableOpacity>
      </View>

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
