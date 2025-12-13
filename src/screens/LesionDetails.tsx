import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Trash2, Info } from "lucide-react-native";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";

// Database
import {
  deleteLesionById,
  updateLesion,
  countTotalScans,
} from "../database/queries";
import { getDB } from "../database/db";
import SaveToHistoryPopup from "../components/SaveToHistoryPopUp";
import { scheduleRescanReminder } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

export default function LesionDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lesionId } = route.params || {};
  const { user } = useAuth();

  const [lesion, setLesion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  // 1. Fetch Data from SQLite
  useEffect(() => {
    async function fetchLesion() {
      const db = getDB();
      try {
        const result = await db.getFirstAsync(
          `SELECT * FROM lesions WHERE id = ?`,
          [lesionId]
        );
        setLesion(result);
      } catch (e) {
        console.error("Error fetching lesion details:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLesion();
  }, [lesionId]);

  // 2. Handle Delete
  const handleDelete = () => {
    Alert.alert("Delete Scan", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLesionById(lesionId);
          navigation.goBack();
        },
      },
    ]);
  };

  // 3. Handle Chat
  const handleChat = () => {
    navigation.navigate("ChatScreen", {
      lesionId: lesion.id,
    });
  };

  if (!fontsLoaded || loading)
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#fe8d93" />
      </View>
    );

  if (!lesion)
    return (
      <View className="flex-1 bg-white pt-20 items-center">
        <Text>Scan not found.</Text>
      </View>
    );

  // Logic for UI
  const isMalignant = lesion.resultLabel === "Malignant";
  const isSuspicious = lesion.resultLabel === "Suspicious";
  // Default to Benign if not Malignant/Suspicious
  const isBenign = !isMalignant && !isSuspicious;

  return (
    <View className="flex-1 bg-white pt-12">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* 1. Header Nav */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center"
          >
            <ChevronLeft color="black" size={28} />
            <Text
              style={{ fontFamily: "Montserrat_700Bold" }}
              className="text-xl ml-1"
            >
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Trash2 color="#FF8080" size={24} />
          </TouchableOpacity>
        </View>

        {/* 2. Title / Description */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-2xl text-[#5a3e3e] text-center mb-1"
        >
          {lesion.description || "Lesion Details"}
        </Text>
        <Text className="text-gray-400 text-xs text-center mb-6">
          Scanned on {new Date(lesion.createdAt).toLocaleDateString()}
        </Text>

        {/* 3. Image with Dynamic Border */}
        <View
          className={`self-center p-1 rounded-xl border-4 mb-6 ${
            isMalignant
              ? "border-red-500"
              : isSuspicious
                ? "border-orange-400"
                : "border-[#32CD32]"
          }`}
        >
          <Image
            source={{ uri: lesion.imageUri }}
            className="w-48 h-48 rounded-lg"
            resizeMode="cover"
          />
        </View>

        {/* 4. Risk Banner */}
        <View
          className={`p-4 rounded-xl mb-6 ${
            isMalignant ? "bg-red-100" : "bg-[#D6F5D6]"
          }`}
        >
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-black text-sm mb-1"
          >
            {isMalignant ? "High Risk:" : "Low Risk:"}
            <Text
              style={{ fontFamily: "Montserrat_400Regular" }}
              className="font-normal"
            >
              {isMalignant
                ? " This lesion shows characteristics that may require professional attention. Please consult a dermatologist."
                : " Our analysis suggests that your skin spot appears benign and carries a very low risk. While this is reassuring, we recommend you continue monitoring the area regularly."}
            </Text>
          </Text>
        </View>

        {/* 5. Text Details */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-md mb-2"
        >
          Result:{" "}
          <Text className="text-[#fe8d93] font-light">
            {(lesion.confidence * 100).toFixed(0)}%{" "}
            {lesion.resultLabel || "Unknown"} Lesions
          </Text>
        </Text>

        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-md mb-2"
        >
          Diagnosis:{" "}
          <Text className="font-light">
            {lesion.diagnosis || "Not specified"}
          </Text>
        </Text>

        {lesion.region && (
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-md mb-2"
          >
            Location:{" "}
            <Text className="font-light capitalize">{lesion.region}</Text>
          </Text>
        )}

        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-base mb-6"
        >
          Advice:{" "}
          <Text className="font-light">
            If you ever feel unsure, don't hesitate to consult a healthcare
            professional.
          </Text>
        </Text>

        {/* ✅ NEW: Conditional Save Button for Unspecified Regions */}
        {lesion.region === "Unspecified" && (
          <View className="items-center mb-6 mt-6">
            <TouchableOpacity
              onPress={() => setShowSavePopup(true)}
              className="bg-[#fe8d93] px-14 py-4 rounded-full shadow-sm"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-white text-md"
              >
                Save to History
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. "You can also" / AI Section */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-lg mb-3 mt-4"
        >
          You can also:
        </Text>

        <View className="flex-row items-center justify-between mb-8">
          {/* Yellow Box (Informational) */}
          <View className="bg-[#F9EAB8] p-4 py-6 rounded-xl flex-1 mr-4">
            <View className="flex-row items-start">
              <Info color="#333" size={20} className="mt-1 mr-2" />
              <Text
                style={{ fontFamily: "Montserrat_400Regular" }}
                className="text-sm text-[#5A4E38] flex-1"
              >
                Get tailored insights from our AI assistant. Click the robot to
                start a chat for more accurate guidance.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Disclaimer */}
        <Text className="text-gray-400 text-[10px] text-center mb-10 px-4">
          This scan result is not a diagnosis. Please, consult a doctor for an
          accurate diagnosis and treatment recommendations
        </Text>
      </ScrollView>

      {/* ✅ FLOATING ROBOT BUTTON (Absolute Bottom Right) */}
      <TouchableOpacity
        onPress={handleChat}
        className="absolute bottom-8 right-8 w-24 h-24 bg-[#fbd3d5] rounded-full items-center justify-center overflow-hidden border-2 border-[#fdccce] shadow-md shadow-[#000] z-50 elevation-10"
        activeOpacity={0.8}
      >
        <Text className="text-3xl">🤖</Text>
      </TouchableOpacity>

      {/* ✅ SAVE POPUP for UPGRADING 'Unspecified' -> 'Region' */}
      <SaveToHistoryPopup
        visible={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        onSave={async (data: any) => {
          try {
            await updateLesion(lesion.id, data.region, data.description);

            // Update Local State to reflect changes immediately
            setLesion((prev: any) => ({
              ...prev,
              region: data.region,
              description: data.description,
            }));

            // Notifications logic (optional but good to keep consistent)
            const isHighRisk = lesion.resultLabel === "Malignant";
            const daysLater = isHighRisk ? 7 : 30;
            await scheduleRescanReminder(data.region, daysLater);

            if (user?.isAnonymous) {
              const totalScans = await countTotalScans();
              if (totalScans > 0 && totalScans % 3 === 0) {
                // ... logic
              }
            }

            setShowSavePopup(false);
            Alert.alert("Saved", "Lesion details updated successfully.");
          } catch (err: any) {
            Alert.alert("Error", "Failed to update lesion details.");
          }
        }}
      />
    </View>
  );
}
