import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MessageCircle } from "lucide-react-native";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { loadTensorflowModel } from "react-native-fast-tflite";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";


// === CUSTOM IMPORTS ===
// Make sure this component exists! I will provide code for it below if you don't have it.
import SaveToHistoryPopup from "../../components/SaveToHistoryPopUp";
import { saveLesion, updateLesion } from "../../database/queries";
// Add this with your other useState hooks


const isExpoGo = Constants.appOwnership === "expo";

// ⚠️ ENSURE THIS FILE EXISTS IN YOUR ASSETS FOLDER
const modelAsset = require("../../../assets/melanoscan_model.tflite");

const labels = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc, scc"];

const diagnosisMap: Record<string, string> = {
    akiec: "Actinic Keratosis / Bowen’s Disease",
    bcc: "Basal Cell Carcinoma",
    bkl: "Benign Keratosis",
    df: "Dermatofibroma",
    mel: "Melanoma",
    nv: "Melanocytic Nevus",
    vasc: "Vascular Lesion",
    scc: "Squamous Cell Carcinoma",
};

export default function MelanoScanPredict() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { mode } = route.params || {}; // "camera" or "gallery"
    
  const [savedId, setSavedId] = useState<number | null>(null);
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true); // model loading
  const [busy, setBusy] = useState(false); // inference is running
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
    reason?: string;
    rawClass: string;
  } | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);


const handleChat = async () => {
  try {
    setBusy(true);

    // 1. Check if we already saved it (e.g. user clicked Save first, then Chat)
    if (savedId) {
         navigation.navigate("ChatScreen", { lesionId: savedId });
         return;
    }

    // 2. If not saved, create a "Draft" record
    const saved = await saveLesion({
      region: "Unspecified", 
      description: "Started chat immediately",
      imageUri,
      resultLabel: result?.label,
      confidence: result?.confidence,
    });

    if (saved.success) {
      setSavedId(saved.id); // <--- REMEMBER THIS ID
      navigation.navigate("ChatScreen", { lesionId: saved.id });
    }
  } catch (e) {
    console.error("Failed to start chat:", e);
  } finally {
    setBusy(false);
  }
};

  // -------------------------------
  // Load model on mount
  // -------------------------------
  useEffect(() => {
    if (isExpoGo) {
      setLoading(false);
      return; 
    }

    (async () => {
      try {
        const m = await loadTensorflowModel(modelAsset);
        setModel(m);
      } catch (e) {
        console.error("Model load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -------------------------------
  // Auto-trigger camera/gallery based on popup choice
  // -------------------------------
  useEffect(() => {
    if (isExpoGo) return; 
    if (!model) return;

    // Only trigger if we haven't taken an image yet
    if (!imageUri) {
        if (mode === "camera") pickImage(true);
        if (mode === "gallery") pickImage(false);
    }
  }, [mode, model]);

  // -------------------------------
  // Request permissions (Android)
  // -------------------------------
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        // Android 13+ might need READ_MEDIA_IMAGES
      ]);
      return (
        granted["android.permission.CAMERA"] ===
          PermissionsAndroid.RESULTS.GRANTED
        // Note: Logic for storage permission varies by Android version
        // We assume true for simplicity here, library handles most cases
      );
    }
    return true;
  };

  // -------------------------------
  // Camera or Gallery
  // -------------------------------
  const pickImage = async (fromCamera = false) => {
    // Basic permission check
    // if (!(await requestPermissions())) return; 

    const result = fromCamera
      ? await launchCamera({ mediaType: "photo", quality: 1 })
      : await launchImageLibrary({ mediaType: "photo", quality: 1 });

    if (result.didCancel) {
        // If user cancels initial pick, go back to home
        if (!imageUri) navigation.goBack();
        return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setImageUri(asset.uri);
    setResult(null);
    setLatencyMs(null);

    runInference(asset.uri);
  };

  // -------------------------------
  // Inference Pipeline
  // -------------------------------
  const runInference = async (uri: string) => {
    if (isExpoGo) {
      console.log("Inference disabled in Expo Go mode.");
      return;
    }
    if (!model) return console.warn("Model not ready");

    setBusy(true);
    const start = performance.now();

    try {
      // Resize image to 240x240 (Standard for MobileNet/EfficientNet)
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64 = manip.base64!;
      const raw = atob(base64);
      const pixels = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) pixels[i] = raw.charCodeAt(i);

      // Normalize [-1, 1]
      const floatData = new Float32Array(pixels.length);
      for (let i = 0; i < pixels.length; i++) {
        floatData[i] = pixels[i];
      }

      const input = [floatData];

      const output = await model.run(input);

      const scores = output[0]; // Assuming output shape is [1, 7]
      const maxIdx = scores.indexOf(Math.max(...scores));
      const confidence = scores[maxIdx];
      const predictedLabel = labels[maxIdx] || "unknown";

      let mappedLabel = "Suspicious";
      let reason = "";

      if (confidence < 0.5) {
        reason = "Model uncertain (<50% confidence)";
      } else if (["mel", "bcc", "akiec"].includes(predictedLabel)) {
        mappedLabel = "Malignant";
      } else if (["nv", "bkl", "df", "vasc"].includes(predictedLabel)) {
        mappedLabel = "Benign";
      }

      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      setResult({
        label: mappedLabel,
        confidence,
        reason,
        rawClass: predictedLabel,
      });
    } catch (err) {
      console.error("Inference error:", err);
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------
  // Rendering
  // -------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading AI Model...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-12">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Back Button */}
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-lg font-semibold text-[#444]">← Back</Text>
        </Pressable>

        {/* Image Preview */}
        {imageUri && (
          <Image
            source={{ uri: imageUri as string }}
            className="w-full h-64 rounded-2xl mb-4 bg-gray-200"
            resizeMode="cover"
          />
        )}

        {/* Loading Spinner */}
        {busy && (
          <View className="items-center justify-center mt-4">
            <ActivityIndicator size="large" color="#e2728f" />
            <Text className="text-gray-500 mt-2">Analyzing scan…</Text>
          </View>
        )}

        {/* RESULT CONTENT */}
        {result && !busy && (
          <View>
            {/* Risk Card */}
            <View
              className={`
              rounded-xl p-4 mb-4
              ${
                result.label === "Malignant"
                  ? "bg-red-100 border border-red-400"
                  : result.label === "Benign"
                    ? "bg-green-100 border border-green-400"
                    : "bg-yellow-100 border border-yellow-400"
              }
            `}
            >
              <Text className="font-semibold text-lg">
                {result.label === "Malignant" && "High Risk"}
                {result.label === "Benign" && "Low Risk"}
                {result.label === "Suspicious" && "Uncertain Scan"}
              </Text>

              <Text className="mt-2 text-gray-700">
                Our analysis suggests a {result.label.toLowerCase()} likelihood.
                {result.label === "Benign" &&
                  " Your lesion appears benign."}
                {result.label === "Malignant" &&
                  " This lesion may show malignant characteristics; please consult a doctor."}
              </Text>
            </View>

            {/* Confidence + Diagnosis */}
            <Text className="text-base mb-1">
              <Text className="font-bold">Result:</Text>{" "}
              {(result.confidence * 100).toFixed(2)}% {result.label} Lesion
            </Text>

            <Text className="text-base mb-1">
              <Text className="font-bold">Diagnosis:</Text>{" "}
              {diagnosisMap[result.rawClass] || "Unknown lesion type"}
            </Text>

            <Text className="text-base mb-4">
              <Text className="font-bold">Advice:</Text> If you're unsure, don’t
              hesitate to consult a healthcare professional.
            </Text>

            <TouchableOpacity 
                onPress={handleChat}
                className="flex-row items-center justify-center bg-black py-4 rounded-full shadow-lg mb-6 mt-4"
            >
                <MessageCircle color="white" size={24} fill="white" />
                <Text className="text-white font-bold text-lg ml-3">Ask AI Assistant</Text>
            </TouchableOpacity>

            {/* Buttons */}
            <View className="items-center mb-6">
              <Pressable
                onPress={() => pickImage(true)}
                className="bg-[#e2728f] w-56 py-3 rounded-full mb-3"
              >
                <Text className="text-white text-center font-semibold">
                  Scan again
                </Text>
              </Pressable>

              {/* Save to History Button */}
              <Pressable
                onPress={() => setShowSavePopup(true)}
                className="border border-[#e2728f] w-56 py-3 rounded-full"
              >
                <Text className="text-[#e2728f] text-center font-semibold">
                  Save to History
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Popup Component */}
      <SaveToHistoryPopup
    visible={showSavePopup}
    onClose={() => setShowSavePopup(false)}
    onSave={async (data: any) => {
      try {
        if (savedId) {
            // ✅ UPDATE EXISTING ROW (User chatted first)
            await updateLesion(savedId, data.region, data.description);
            console.log("Updated existing lesion record");
        } else {
            // ✅ CREATE NEW ROW (User saved first)
            await saveLesion({
              region: data.region,
              description: data.description,
              imageUri,
              resultLabel: result?.label,
              confidence: result?.confidence,
            });
            console.log("Created new lesion record");
        }

        setShowSavePopup(false);
        navigation.navigate("MainTabs", { screen: "History" });
      } catch (err) {
        console.error("Error saving/updating lesion:", err);
      }
    }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});