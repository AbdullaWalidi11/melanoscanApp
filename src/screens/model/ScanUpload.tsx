import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useAuth } from "../../context/AuthContext";
import { validateImageQuality } from "../../services/imageValidation";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

export default function ScanUpload() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mode } = route.params || {};
  const { user } = useAuth();
  const { t } = useTranslation();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_400Regular,
  });

  // --- STATE ---
  const [scanState, setScanState] = useState<
    "IDLE" | "VALIDATING" | "VALIDATED_SUCCESS" | "VALIDATED_FAIL"
  >("IDLE");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

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

  // --- AUTO TRIGGER (from Home) ---
  useEffect(() => {
    if (!imageUri && (mode === "camera" || mode === "gallery")) {
      pickImage(mode === "camera");
    }
  }, [mode]);

  // --- IMAGE PICKER ---
  const pickImage = async (fromCamera = false) => {
    const permissionMethod = fromCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionMethod();
    if (status !== "granted") {
      showCustomAlert(
        t("scan_upload.permission_denied"),
        t("scan_upload.permission_msg", {
          type: fromCamera ? t("home.camera") : t("home.gallery"),
        }),
        [
          {
            text: "OK",
            onPress: () => {
              hideAlert();
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: fromCamera,
      aspect: [1, 1],
      quality: 1,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      runValidation(uri);
    } else {
      // User cancelled selection, only go back if we haven't selected anything yet
      if (!imageUri) navigation.goBack();
    }
  };

  // --- VALIDATION SEQUENCER ---
  const runValidation = async (uri: string) => {
    setImageUri(uri);
    setScanState("VALIDATING");
    setValidationError("");

    // 1. Fake Steps for UX
    setValidationMessage("Checking Focus...");
    await new Promise((r) => setTimeout(r, 800));

    setValidationMessage("Verifying Lighting...");
    await new Promise((r) => setTimeout(r, 800));

    setValidationMessage("Confirming Skin Tones...");
    await new Promise((r) => setTimeout(r, 800));

    // 2. Real Check
    const qualityCheck = await validateImageQuality(uri);

    if (qualityCheck.isValid) {
      setScanState("VALIDATED_SUCCESS");
      setValidationMessage(t("scan_upload.upload_succeeded"));
    } else {
      setScanState("VALIDATED_FAIL");
      setValidationError(qualityCheck.error || "Unknown validation error");
    }
  };

  const handleAnalyzePress = () => {
    if (imageUri) {
      // Navigate to result and clear state so it doesn't show again on back press
      setScanState("IDLE");
      setImageUri(null);
      navigation.navigate("AnalysisResult", { imageUri });
    }
  };

  const handleRetry = () => {
    // Determine mode based on initial param or default to gallery if unknown
    // Actually, we can just ask the user or default to the same mode.
    // Let's just re-open the picker based on what they used last?
    // For simplicity, let's open a selection alert or just re-run the picker logic if we stored the mode.
    // Since 'mode' param might be stale, we can just let them pick again.
    showCustomAlert(t("home.start_scan"), t("home.choose_method"), [
      {
        text: t("home.camera"),
        onPress: () => {
          hideAlert();
          pickImage(true);
        },
      },
      {
        text: t("home.gallery"),
        onPress: () => {
          hideAlert();
          pickImage(false);
        },
      },
      { text: t("home.cancel"), style: "cancel", onPress: hideAlert },
    ]);
  };

  const handleCancel = () => {
    setScanState("IDLE");
    setImageUri(null);
    navigation.goBack();
  };

  if (!fontsLoaded) {
    return <View className="flex-1 bg-[#FFC5C8]" />;
  }

  return (
    // 1. Base Background with Pink/Coral Color
    <View className="flex-1 bg-[#ffc0b5] relative overflow-hidden">
      {/* === BACKGROUND GEOMETRY (Replicated from SurveyPage) === */}
      {/* 3. Third Geometric Shape (Far Left Layer) */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      {/* 2. The Geometric Gradient Background Effect */}
      <View className="absolute inset-0 transform -translate-x-[420px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* === MAIN CONTENT (White Sheet) === */}
      {/* Added 'mt-24' to push it down from top, 'rounded-t-[40px]' for the sheet look */}
      <View className="flex-1 bg-[#fff5f5] mt-28 rounded-t-[40px] overflow-hidden shadow-2xl">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          {/* Header Style Title */}
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-xl text-[#5a3e3e] mb-6 text-left"
          >
            {t("scan_upload.upload_photo")}
          </Text>

          {imageUri && (
            // Container with dynamic border color
            <View
              className={`relative w-full aspect-square rounded-2xl mb-8 overflow-hidden bg-gray-100 
                ${
                  scanState === "VALIDATED_SUCCESS"
                    ? "border-4 border-green-400"
                    : scanState === "VALIDATED_FAIL"
                      ? "border-4 border-red-400"
                      : "border border-gray-300"
                }`}
            >
              {/* IMAGE */}
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />

              {/* OVERLAYS */}

              {/* 1. LOADING STATE */}
              {scanState === "VALIDATING" && (
                <View className="absolute inset-0 items-center justify-center bg-white/80 z-30">
                  <ActivityIndicator color={"#FF8080"} size={50} />
                  <Text
                    style={{ fontFamily: "Montserrat_400Regular" }}
                    className="text-[#5a3e3e] mt-4 text-sm font-bold"
                  >
                    {validationMessage}
                  </Text>
                </View>
              )}

              {/* 2. SUCCESS STATE */}
              {scanState === "VALIDATED_SUCCESS" && (
                <View className="absolute bottom-0 left-0 right-0 py-3 bg-white/90 items-center justify-center flex-row z-30">
                  <Text className="text-green-500 text-lg mr-2">✓</Text>
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-green-500 text-sm"
                  >
                    {t("scan_upload.upload_succeeded")}
                  </Text>
                </View>
              )}

              {/* 3. FAILURE STATE */}
              {scanState === "VALIDATED_FAIL" && (
                <View className="absolute inset-0 items-center justify-center bg-black/40 z-30">
                  <View className="bg-white p-5 rounded-2xl items-center w-[80%]">
                    <AlertCircle size={40} color="#ff6b6b" />
                    <Text
                      style={{ fontFamily: "Montserrat_600SemiBold" }}
                      className="text-[#ff6b6b] text-center mt-3 mb-2 text-lg"
                    >
                      {t("scan_upload.check_failed", {
                        defaultValue: "Issue Detected",
                      })}
                    </Text>
                    <Text
                      style={{ fontFamily: "Montserrat_400Regular" }}
                      className="text-gray-600 text-center mb-4"
                    >
                      {validationError}
                    </Text>

                    <TouchableOpacity
                      onPress={handleRetry}
                      className="bg-[#ff6b6b] px-6 py-2 rounded-full"
                    >
                      <Text className="text-white font-bold">Try Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Helper Text below image */}
          {scanState !== "VALIDATED_FAIL" && (
            <Text
              style={{ fontFamily: "Montserrat_400Regular" }}
              className="text-center text-gray-500 text-xs px-4 mb-8 leading-5"
            >
              {scanState === "VALIDATED_SUCCESS"
                ? "Image looks great! Ready to analyze."
                : t("scan_upload.wait_message")}
            </Text>
          )}

          {/* CONTROLS AREA */}
          <View className="mb-12">
            {/* ANALYZE BUTTON (Pink) */}
            <TouchableOpacity
              onPress={handleAnalyzePress}
              disabled={scanState !== "VALIDATED_SUCCESS"}
              // Opacity changes if disabled
              className={`bg-[#fe948d] py-4 rounded-full shadow-sm items-center mb-4 ${scanState !== "VALIDATED_SUCCESS" ? "opacity-30" : "opacity-100"}`}
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-white text-base"
              >
                {t("scan_upload.analyze_photo")}
              </Text>
            </TouchableOpacity>

            {/* CANCEL BUTTON (White with pink border) */}
            <TouchableOpacity
              onPress={handleCancel}
              className="bg-white border border-[#fe948d] py-4 rounded-full items-center shadow-sm"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-[#fe948d] text-base"
              >
                {t("home.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
