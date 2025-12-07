import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from "react-native";
import * as Notifications from 'expo-notifications';
import { scheduleRescanReminder } from "../../services/notificationService";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MessageCircle } from "lucide-react-native";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { loadTensorflowModel } from "react-native-fast-tflite";
// import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../../context/AuthContext"; // Add useAuth to check if guest

// ✅ 1. NEW IMPORTS FOR DECODING
import * as jpeg from "jpeg-js";
import { Buffer } from "buffer";

import SaveToHistoryPopup from "../../components/SaveToHistoryPopUp";
import { saveLesion, updateLesion, countTotalScans } from "../../database/queries";

const isExpoGo = Constants.appOwnership === "expo";
const modelAsset = require("../../../assets/melanoscan_model.tflite");

// ✅ 2. CORRECT LABELS (8 Classes, Alphabetical)
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

export default function MelanoScanPredict() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mode } = route.params || {};
  const { user } = useAuth();

  const [savedId, setSavedId] = useState<number | null>(null);
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
    reason?: string;
    rawClass: string;
  } | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);

  // --- MODEL LOADING ---
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

  // --- AUTO TRIGGER ---
  useEffect(() => {
    if (isExpoGo) return; 
    if (!model) return;
    if (!imageUri) {
        if (mode === "camera") pickImage(true);
        if (mode === "gallery") pickImage(false);
    }
  }, [mode, model]);

  // --- IMAGE PICKER ---
  // --- IMAGE PICKER (With Cropping) ---
  // --- IMAGE PICKER ---
  const pickImage = async (fromCamera = false) => {
    // 1. Permission Checks (Keep existing logic)
    if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!');
            return;
        }
    } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need gallery permissions!');
            return;
        }
    }

    // 2. Configure Options
    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        
        // ✅ CHANGED: Only enable cropping if taking a photo
        allowsEditing: fromCamera, 
        
        aspect: [1, 1], // This is ignored if allowsEditing is false
        quality: 1,
    };

    let result;
    if (fromCamera) {
        result = await ImagePicker.launchCameraAsync(options);
    } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
    }

    // 3. Handle Result (Keep existing logic)
    if (result.canceled) {
        if (!imageUri) navigation.goBack();
        return;
    }

    if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        setImageUri(uri);
        setResult(null);
        setLatencyMs(null);

        runInference(uri);
    }
  };

  // --- 3. THE FIXED INFERENCE PIPELINE ---
  const runInference = async (uri: string) => {
    if (isExpoGo) return;
    if (!model) return console.warn("Model not ready");

    setBusy(true);
    const start = performance.now();

    try {
      // A. Resize to 224x224 (Matches EfficientNet Input)
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64 = manip.base64!;
      
      // B. Decode JPEG to Raw Pixel Data (Buffer)
      // We use Buffer to convert base64 -> binary, then jpeg-js to get pixels
      const imgBuffer = Buffer.from(base64, 'base64');
      const rawData = jpeg.decode(imgBuffer, { useTArray: true }); 
      // rawData.data is a Uint8Array: [R, G, B, A, R, G, B, A, ...]

      // C. Pre-process & Normalize
      // We need to convert RGBA (4 channels) to RGB (3 channels) 
      // AND normalize from [0, 255] to [-1, 1]
      const floatData = new Float32Array(224 * 224 * 3);
      let p = 0; // Pointer for floatData (RGB)
      
      for (let i = 0; i < rawData.data.length; i += 4) {
        const r = rawData.data[i];
        const g = rawData.data[i + 1];
        const b = rawData.data[i + 2];
        // Ignore [i+3] which is Alpha

        // EfficientNet Normalization: (value / 127.5) - 1.0
        floatData[p++] = r;
        floatData[p++] = g;
        floatData[p++] = b;      }

      // D. Run Model
      const output = await model.run([floatData]);
      const scores = output[0]; // Output shape is [1, 8]

      // E. Process Results
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

  const handleChat = async () => {
    try {
      setBusy(true);
      if (savedId) {
           navigation.navigate("ChatScreen", { lesionId: savedId });
           return;
      }
      const saved = await saveLesion({
        region: "Unspecified", 
        description: "Started chat immediately",
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
    } finally {
      setBusy(false);
    }
  };

  // --- RENDERING ---
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
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-lg font-semibold text-[#444]">← Back</Text>
        </Pressable>

        {imageUri && (
          <Image source={{ uri: imageUri }} className="w-full h-64 rounded-2xl mb-4 bg-gray-200" resizeMode="cover" />
        )}

        {busy && (
          <View className="items-center justify-center mt-4">
            <ActivityIndicator size="large" color="#e2728f" />
            <Text className="text-gray-500 mt-2">Processing...</Text>
          </View>
        )}

        {result && !busy && (
          <View>
            <View className={`rounded-xl p-4 mb-4 ${result.label === "Malignant" ? "bg-red-100 border border-red-400" : result.label === "Benign" ? "bg-green-100 border border-green-400" : "bg-yellow-100 border border-yellow-400"}`}>
              <Text className="font-semibold text-lg">
                {result.label === "Malignant" && "High Risk"}
                {result.label === "Benign" && "Low Risk"}
                {result.label === "Suspicious" && "Uncertain"}
              </Text>
              <Text className="mt-2 text-gray-700">
                AI Prediction: {result.rawClass.toUpperCase()} ({(result.confidence * 100).toFixed(1)}%)
              </Text>
            </View>

            <TouchableOpacity 
                onPress={handleChat}
                className="flex-row items-center justify-center bg-black py-4 rounded-full shadow-lg mb-6 mt-4"
            >
                <MessageCircle color="white" size={24} fill="white" />
                <Text className="text-white font-bold text-lg ml-3">Ask AI Assistant</Text>
            </TouchableOpacity>

            <View className="items-center mb-6">
              <Pressable onPress={() => pickImage(true)} className="bg-[#e2728f] w-56 py-3 rounded-full mb-3">
                <Text className="text-white text-center font-semibold">Scan again</Text>
              </Pressable>
              <Pressable onPress={() => setShowSavePopup(true)} className="border border-[#e2728f] w-56 py-3 rounded-full">
                <Text className="text-[#e2728f] text-center font-semibold">Save to History</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <SaveToHistoryPopup
        visible={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        onSave={async (data: any) => {
          try {
            // 1. Save or Update Logic (Existing)
            if (savedId) {
                await updateLesion(savedId, data.region, data.description);
            } else {
                await saveLesion({
                  region: data.region,
                  description: data.description,
                  imageUri,
                  resultLabel: result?.label,
                  confidence: result?.confidence,
                  diagnosis: result ? diagnosisMap[result.rawClass] : undefined,
                });
            }

            // 2. ✅ LOGIC: Smart Schedule (Weekly vs Monthly)
            // If Malignant/High Risk -> 7 Days. Else -> 30 Days.
            const isHighRisk = result?.label === "Malignant";
            const daysLater = isHighRisk ? 7 : 30;
            
            await scheduleRescanReminder(data.region, daysLater);
            
            // 3. ✅ LOGIC: Persistent Guest Check (> 3 Scans)
            // We use a small timeout to let the DB save finish first
            if (isExpoGo) { /* skip in expo go if needed */ }
            
            // We need to verify if user is guest. 
            // Since we can't easily access 'user' from context inside this callback without 
            // wrapping the whole component in AuthContext, we'll do a quick DB check.
            // 3. ✅ LOGIC: Smart Guest Nag
            // Only annoy them if they are ACTUALLY a guest (isAnonymous)
            if (user?.isAnonymous) {
                const totalScans = await countTotalScans();
            
            // If we have 3, 6, 9... scans, nag the user
            if (totalScans > 0 && totalScans % 3 === 0) {
                 // Trigger a local notification immediately
                 Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Don't lose your progress!",
                        body: `You have ${totalScans} scans saved locally. Sign in now to back them up safely to the cloud.`,
                    },
                    trigger: null, // Show immediately
                 });
            }
          }

            setShowSavePopup(false);
            navigation.navigate("MainTabs", { screen: "History" });
          } catch (err) {
            console.error("Error saving:", err);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});