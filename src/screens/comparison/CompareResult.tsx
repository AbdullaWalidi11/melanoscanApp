import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { saveComparisonLog } from "../../database/queries";

export default function CompareResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { result, oldLesionId, oldImageUri, newImageUri } = route.params;

  const [saving, setSaving] = useState(false);

  // Logic: Is it good news or bad news?
  const isStable = result.status === "STABLE";
  const statusColor = isStable ? "#4CAF50" : "#FF5252"; // Green vs Red
  const statusIcon = isStable ? "checkmark-circle" : "alert-circle";

  const handleAddToHistory = async () => {
    try {
      setSaving(true);
      await saveComparisonLog({
        parentLesionId: oldLesionId,
        oldImageUri,
        newImageUri,
        status: result.status,
        score: result.score,
        reasoning: result.reasoning,
        advice: result.advice,
      });

      Alert.alert("Saved", "Comparison added to history.");

      // Navigate to the HISTORY LIST (Frame 26) so user sees it immediately
      navigation.replace("ComparisonHistory", {
        parentLesionId: oldLesionId,
        imageUri: oldImageUri,
      });
    } catch (error) {
      Alert.alert("Error", "Could not save result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. HEADER / CLOSE BUTTON */}
      <View className="flex-row justify-end p-4 mt-8">
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="close" size={28} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 2. THE CARD (Frame 28 Design) */}
      <View className="items-center px-6">
        {/* Status Box */}
        <View
          className="w-full rounded-3xl items-center p-6 border-2"
          style={{
            borderColor: statusColor,
            backgroundColor: isStable ? "#F0FFF4" : "#FFF0F0",
          }}
        >
          {/* Color Block (The Square in your Figma) */}
          {/* Image from Comparison */}
          <Image
            source={{ uri: newImageUri }}
            className="w-32 h-32 rounded-2xl mb-4 shadow-sm"
            resizeMode="cover"
          />

          <Text
            className="text-xl font-bold mb-1"
            style={{ color: statusColor }}
          >
            {isStable ? "No Change Detected" : "Changes Detected"}
          </Text>
          <Ionicons name={statusIcon} size={32} color={statusColor} />
        </View>

        {/* 3. AI EXPLANATION */}
        <View className="mt-8 bg-gray-50 p-6 rounded-2xl w-full">
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 bg-orange-100 rounded-full justify-center items-center mr-3">
              <Text className="font-bold text-orange-800 text-lg">A</Text>
            </View>
            <Text className="font-bold text-gray-800 text-lg">AI Analysis</Text>
          </View>

          <Text className="text-gray-600 leading-6 text-base">
            {result.reasoning}
          </Text>

          <Text className="text-gray-500 text-sm mt-4 italic">
            Advice: {result.advice}
          </Text>
        </View>
      </View>

      {/* 4. ACTION BUTTON */}
      <View className="px-6 mt-10">
        <TouchableOpacity
          onPress={handleAddToHistory}
          disabled={saving}
          className="w-full bg-[#ff9aa8] py-4 rounded-full items-center shadow-md active:bg-[#ff7b8a]"
        >
          <Text className="text-white font-bold text-lg">
            {saving ? "Saving..." : "Add to History"}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs text-center mt-6 px-4">
          This result is not a diagnosis. Please consult a doctor for accurate
          diagnosis.
        </Text>
      </View>
    </ScrollView>
  );
}
