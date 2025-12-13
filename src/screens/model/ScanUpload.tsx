import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
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

export default function ScanUpload() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mode } = route.params || {};
  const { user } = useAuth();

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
      Alert.alert(
        "Permission Denied",
        `We need ${fromCamera ? "camera" : "gallery"} permissions.`
      );
      navigation.goBack();
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

      // ✅ START VALIDATION PHASE
      setScanState("VALIDATING");
      setImageUri(uri);

      // Simulate Validation Delay (3 seconds)
      setTimeout(async () => {
        const qualityCheck = await validateImageQuality(uri);
        // For now, we proceed even if qualityCheck is false, as per the "happy path" request.
        // In a real scenario, you'd handle the failure here.
        setScanState("VALIDATED_SUCCESS");
      }, 3000);
    } else {
      // User cancelled selection
      navigation.goBack();
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
    <View className="flex-1 bg-[#FFC5C8] relative overflow-hidden">
      {/* === BACKGROUND GEOMETRY (Replicated from SurveyPage) === */}
      {/* 3. Third Geometric Shape (Far Left Layer) */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      {/* 2. The Geometric Gradient Background Effect */}
      <View className="absolute inset-0 transform -translate-x-[420px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#ff9da1", "#ff9da1", "#fe8d93"]}
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
            Upload photo
          </Text>

          {imageUri && (
            // Container with green border on success
            <View
              className={`relative w-full aspect-square rounded-2xl mb-8 overflow-hidden bg-gray-100 
                ${scanState === "VALIDATED_SUCCESS" ? "border-2 border-green-500" : "border border-gray-300"}`}
            >
              {/* IMAGE */}
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />

              {/* LOADING SPINNER OVERLAY (Matches Screenshot 3) */}
              {scanState === "VALIDATING" && (
                <View className="absolute inset-0 items-center justify-center bg-white/80 z-30">
                  {/* Custom pink color for loader */}
                  <ActivityIndicator color={"#FF8080"} size={50} />
                  <Text
                    style={{ fontFamily: "Montserrat_400Regular" }}
                    className="text-[#888] mt-4 text-sm"
                  >
                    uploading . . .
                  </Text>
                </View>
              )}

              {/* SUCCESS STATE (Matches Screenshot 1) */}
              {scanState === "VALIDATED_SUCCESS" && (
                <View className="absolute bottom-0 left-0 right-0 py-3 bg-white/90 items-center justify-center flex-row z-30">
                  <Text className="text-green-500 text-lg mr-2">✓</Text>
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-green-500 text-sm"
                  >
                    upload succeeded
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Helper Text below image */}
          <Text
            style={{ fontFamily: "Montserrat_400Regular" }}
            className="text-center text-gray-500 text-xs px-4 mb-8 leading-5"
          >
            Your photo is uploading. It might take a minute so stay patient
          </Text>

          {/* CONTROLS AREA */}
          <View className="mb-12">
            {/* ANALYZE BUTTON (Pink) */}
            <TouchableOpacity
              onPress={handleAnalyzePress}
              disabled={scanState !== "VALIDATED_SUCCESS"}
              // Opacity changes if disabled
              className={`bg-[#fe8d93] py-4 rounded-full shadow-sm items-center mb-4 ${scanState !== "VALIDATED_SUCCESS" ? "opacity-50" : "opacity-100"}`}
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-white text-base"
              >
                Analyze Photo
              </Text>
            </TouchableOpacity>

            {/* CANCEL BUTTON (White with pink border) */}
            <TouchableOpacity
              onPress={handleCancel}
              className="bg-white border border-[#fe8d93] py-4 rounded-full items-center shadow-sm"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-[#fe8d93] text-base"
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
