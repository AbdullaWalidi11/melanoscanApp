import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Trash2, Info, Circle } from "lucide-react-native"; // Make sure you have these
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { loadTensorflowModel } from "react-native-fast-tflite";
import * as jpeg from "jpeg-js";
import { Buffer } from "buffer";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

import { useAuth } from "../../context/AuthContext";
import SaveToHistoryPopup from "../../components/SaveToHistoryPopUp";
import ABCDECarousel from "../../components/ABCDECarousel";
import {
  saveLesion,
  updateLesion,
  countTotalScans,
} from "../../database/queries";
import { scheduleRescanReminder } from "../../services/notificationService";

const isExpoGo = Constants.appOwnership === "expo";
const modelAsset = require("../../../assets/melanoscan_model.tflite");

// LABELS
const labels = ["akiec", "bcc", "bkl", "df", "mel", "nv", "scc", "vasc"];
const diagnosisMap: Record<string, string> = {
  akiec: "Actinic Keratosis",
  bcc: "Basal Cell Carcinoma",
  bkl: "Benign Keratosis",
  df: "Dermatofibroma",
  mel: "Melanoma",
  nv: "Melanocytic Nevus",
  scc: "Squamous Cell Carcinoma",
  vasc: "Vascular Lesion",
};

export default function AnalysisResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { imageUri } = route.params || {};
  const { user } = useAuth();
  const { width } = Dimensions.get("window");
  const { t } = useTranslation();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  // --- STATE ---
  const [scanState, setScanState] = useState<"ANALYZING" | "RESULT">(
    "ANALYZING"
  );
  const scanAnim = useRef(new Animated.Value(0)).current;

  const [savedId, setSavedId] = useState<number | null>(null);
  const [model, setModel] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
    reason?: string;
    rawClass: string;
  } | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);

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

  // --- 1. LOAD MODEL ---
  useEffect(() => {
    if (isExpoGo) {
      setModelLoading(false);
      return;
    }
    (async () => {
      try {
        const m = await loadTensorflowModel(modelAsset);
        setModel(m);
      } catch (e) {
        console.error("Model load error:", e);
      } finally {
        setModelLoading(false);
      }
    })();
  }, []);

  // --- 2. START ANALYSIS ---
  useEffect(() => {
    if (imageUri && !result) {
      startAnalysisSequence();
    }
  }, [imageUri, model]);

  const startAnalysisSequence = () => {
    setScanState("ANALYZING");

    // Start Scanning Animation
    scanAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Delay 3.5s then Inference
    setTimeout(() => {
      if (!model && !isExpoGo) return;
      runInference(imageUri);
    }, 3500);
  };

  const runInference = async (uri: string) => {
    if (isExpoGo) {
      // Mock result for Expo Go
      setResult({
        label: "Benign",
        confidence: 0.85,
        rawClass: "nv",
        reason: "",
      });
      scanAnim.stopAnimation();
      setScanState("RESULT");
      return;
    }
    if (!model) return;

    try {
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const base64 = manip.base64!;
      const imgBuffer = Buffer.from(base64, "base64");
      const rawData = jpeg.decode(imgBuffer, { useTArray: true });
      const floatData = new Float32Array(224 * 224 * 3);
      let p = 0;
      for (let i = 0; i < rawData.data.length; i += 4) {
        floatData[p++] = rawData.data[i];
        floatData[p++] = rawData.data[i + 1];
        floatData[p++] = rawData.data[i + 2];
      }

      const output = await model.run([floatData]);
      const scores = output[0];
      const maxIdx = scores.indexOf(Math.max(...scores));
      const confidence = scores[maxIdx];
      const predictedLabel = labels[maxIdx] || "unknown";

      let mappedLabel = "Suspicious";
      let reason = "";

      if (confidence < 0.5) {
        reason = "Model uncertain (<50% confidence)";
      } else if (["mel", "bcc", "akiec", "scc"].includes(predictedLabel)) {
        mappedLabel = "Malignant";
      } else if (["nv", "bkl", "df", "vasc"].includes(predictedLabel)) {
        mappedLabel = "Benign";
      }

      setResult({
        label: mappedLabel,
        confidence,
        reason,
        rawClass: predictedLabel,
      });

      // ✅ AUTO-SAVE LOGIC
      // Automatically save as "Unspecified" immediately after analysis
      try {
        const saved = await saveLesion({
          region: "Unspecified",
          description: t("analysis_result.auto_saved"),
          imageUri: uri, // Use the uri passed to this function
          resultLabel: mappedLabel,
          confidence: confidence,
          diagnosis: diagnosisMap[predictedLabel] || predictedLabel,
        });
        if (saved.success) {
          setSavedId(saved.id);
          console.log("Auto-saved scan with ID:", saved.id);
        }
      } catch (e) {
        console.error("Auto-save failed:", e);
      }

      scanAnim.stopAnimation();
      setScanState("RESULT");
    } catch (err) {
      console.error("Inference error:", err);
      showCustomAlert(
        t("analysis_result.error_title"),
        t("analysis_result.analysis_failed")
      );
      scanAnim.stopAnimation();
      navigation.goBack();
    }
  };

  // Helper for restarting logic
  const handleScanAgain = () => {
    setResult(null);
    setScanState("ANALYZING");
    startAnalysisSequence();
  };

  // Safe helper to render fonts only when loaded
  if (!fontsLoaded) return <View className="flex-1 bg-white" />;

  const handleChat = async () => {
    try {
      if (savedId) {
        navigation.navigate("ChatScreen", { lesionId: savedId });
        return;
      }
      // If not saved yet (shouldn't happen with auto-save, but fallback), save automatically
      const saved = await saveLesion({
        region: "Unspecified",
        description: "Started chat from analysis",
        imageUri,
        resultLabel: result?.label,
        confidence: result?.confidence,
        diagnosis: result ? diagnosisMap[result.rawClass] : undefined,
      });

      if (saved.success) {
        setSavedId(saved.id);
        navigation.navigate("ChatScreen", { lesionId: saved.id });
      }
    } catch (e) {
      console.error("Failed to start chat:", e);
      showCustomAlert(t("analysis_result.error_title"), "Could not start chat");
    }
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* ============================================================
          STATE 1: ANALYZING (Matches visual reference image_934fae)
         ============================================================ */}
      {scanState === "ANALYZING" && (
        <View className="flex-1 px-6 items-center">
          {/* 1. Header Title */}
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-[#8B5E5E] text-3xl text-center mt-8 mb-12"
          >
            {t("analysis_result.title")}
          </Text>

          {/* 2. Image Viewfinder Container */}
          <View className="relative w-64 h-64 mb-16">
            {/* Corner Brackets Visuals */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gray-400" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gray-400" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gray-400" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gray-400" />

            {/* The Image */}
            <View className="w-full h-full p-4">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />

              {/* Vertical Blue Scanning Line */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 16,
                  bottom: 16, // match padding
                  width: 3,
                  backgroundColor: "#59C1D0", // Cyan/Blue color from image
                  zIndex: 40,
                  transform: [
                    {
                      translateX: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 224], // approximate width of inner box
                      }),
                    },
                  ],
                }}
              />
            </View>
          </View>

          {/* 3. Bottom Card (ABCDE Info Carousel) */}
          <ABCDECarousel />
        </View>
      )}

      {/* ============================================================
          STATE 2: RESULT (Matches visual reference image_934f96)
         ============================================================ */}
      {scanState === "RESULT" && result && (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header Nav */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate("MainTabs")}
              className="flex-row items-center"
            >
              <ChevronLeft color="black" size={28} />
              <Text
                style={{ fontFamily: "Montserrat_700Bold" }}
                className="text-xl ml-1"
              >
                {t("analysis_result.back")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
              <Trash2 color="#FF8080" size={24} />
            </TouchableOpacity>
          </View>

          {/* 2. Image with Dynamic Border */}
          <View
            className={`self-center p-1 rounded-xl border-4 mb-6 ${
              result.label === "Malignant"
                ? "border-red-500"
                : result.label === "Suspicious"
                  ? "border-orange-400"
                  : "border-[#32CD32]"
            }`}
          >
            <Image
              source={{ uri: imageUri }}
              className="w-48 h-48 rounded-lg"
              resizeMode="cover"
            />
          </View>

          {/* 3. Risk Banner */}
          <View
            className={`p-4 rounded-xl mb-6 ${
              result.label === "Malignant"
                ? "bg-red-100"
                : result.label === "Suspicious"
                  ? "bg-orange-100"
                  : "bg-[#D6F5D6]"
            }`}
          >
            <Text
              style={{ fontFamily: "Montserrat_700Bold" }}
              className="text-black text-sm mb-1"
            >
              {result.label === "Malignant"
                ? t("analysis_result.high_risk")
                : result.label === "Suspicious"
                  ? t("analysis_result.medium_risk")
                  : t("analysis_result.low_risk")}
              <Text
                style={{ fontFamily: "Montserrat_400Regular" }}
                className="font-normal"
              >
                {result.label === "Malignant"
                  ? t("analysis_result.high_risk_desc")
                  : result.label === "Suspicious"
                    ? t("analysis_result.medium_risk_desc")
                    : t("analysis_result.low_risk_desc")}
              </Text>
            </Text>
          </View>

          {/* 4. Text Details */}
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-md mb-2"
          >
            {t("analysis_result.result")}{" "}
            <Text
              className={`${
                result.label === "Malignant"
                  ? "text-red-500"
                  : result.label === "Suspicious"
                    ? "text-orange-400"
                    : "text-green-600"
              } font-light`}
            >
              {(result.confidence * 100).toFixed(0)}%{" "}
              {result.label === "Suspicious"
                ? "Medium Risk"
                : t(`analysis_result.${result.label.toLowerCase()}`, {
                    defaultValue: result.label,
                  })}{" "}
              {t("analysis_result.lesions")}
            </Text>
          </Text>

          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-md mb-2"
          >
            {t("analysis_result.diagnosis")}{" "}
            <Text className="font-light">
              {diagnosisMap[result.rawClass] || result.rawClass}
            </Text>
          </Text>

          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-base mb-6"
          >
            {t("analysis_result.advice")}{" "}
            <Text className="font-light">
              {t("analysis_result.advice_desc")}
            </Text>
          </Text>

          {/* 5. Sub-text */}
          <Text className="text-center text-gray-600 text-sm mb-6 px-4">
            {t("analysis_result.uncertain_title")}
          </Text>

          {/* 6. Action Buttons */}
          <View className="items-center mb-8 gap-y-3">
            <TouchableOpacity
              onPress={handleScanAgain}
              className="bg-[#fe948d] w-72 py-3 rounded-full shadow-sm items-center"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-white text-lg"
              >
                {t("analysis_result.scan_again")}
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-400">or</Text>

            <TouchableOpacity
              onPress={() => setShowSavePopup(true)}
              className="bg-white border border-[#fe948d] w-72 py-3 rounded-full shadow-sm items-center"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-[#fe948d] text-lg"
              >
                {t("analysis_result.save_history")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 7. "You can also" / AI Section */}
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-lg mb-3"
          >
            {t("analysis_result.you_can_also")}
          </Text>

          <View className="flex-row items-center justify-between mb-8">
            {/* Yellow Box (Informational) */}
            <View className="bg-[#F9EAB8] p-4 rounded-xl flex-1 mr-4">
              <View className="flex-row items-start">
                <Info color="#333" size={20} className="mt-1 mr-2" />
                <Text
                  style={{ fontFamily: "Montserrat_400Regular" }}
                  className="text-xs text-[#5A4E38] flex-1"
                >
                  {t("analysis_result.ai_insight")}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Disclaimer */}
          <Text className="text-gray-400 text-[10px] text-center mb-10 px-4">
            {t("analysis_result.footer_disclaimer")}
          </Text>
        </ScrollView>
      )}

      {/* ✅ FLOATING ROBOT BUTTON (Absolute Bottom Right) */}
      {scanState === "RESULT" && (
        <TouchableOpacity
          onPress={handleChat}
          className="absolute bottom-6 right-6 w-24 h-24 bg-[#fe948d] rounded-full items-center justify-center overflow-hidden border-2 border-[#fe948d] shadow-md shadow-[#000] z-50 elevation-10"
          activeOpacity={0.8}
        >
          <Image
            source={require("../../../assets/images/chatbot.png")}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Database Save Popup (Logic Preserved) */}
      <SaveToHistoryPopup
        visible={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        onSave={async (data: any) => {
          try {
            if (savedId) {
              await updateLesion(savedId, data.region, data.description);
            } else {
              // Just in case, though savedId should be present
              const res = await saveLesion({
                region: data.region,
                description: data.description,
                imageUri,
                resultLabel: result?.label,
                confidence: result?.confidence,
                diagnosis: result ? diagnosisMap[result.rawClass] : undefined,
              });
              if (res.success) setSavedId(res.id);
            }

            const isHighRisk = result?.label === "Malignant";
            const daysLater = isHighRisk ? 7 : 30;
            await scheduleRescanReminder(data.region, daysLater);

            if (user?.isAnonymous) {
              const totalScans = await countTotalScans();
              if (totalScans > 0 && totalScans % 3 === 0) {
                // ... notification logic
              }
            }
            setShowSavePopup(false);
            // Navigate to history or stay?
            // User usually expects confirmation. Let's just navigate back as per previous logic.
            navigation.navigate("MainTabs", { screen: "History" });
          } catch (err: any) {
            showCustomAlert(t("analysis_result.error_title"), err.toString());
          }
        }}
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
