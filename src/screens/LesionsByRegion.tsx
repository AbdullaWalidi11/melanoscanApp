import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";

// 1. IMPORT DATABASE FUNCTIONS
import { deleteLesionById, getLesionsByRegion } from "../database/queries";

// 2. DEFINE TYPES
// We'll define the required props/types here for simplicity.
// The data from the database should match this structure.
type Lesion = {
  id: number;
  description?: string;
  date: string;
  createdAt: string;
  imageUri?: string;
  resultLabel?: string; // Added from database structure
  confidence?: number; // Added from database structure
};

export default function LesionsByRegionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>(); // Get route object to access params
  
  // Get the 'region' parameter that was passed from HistoryScreen
  const regionParam = route.params?.region || ''; 
  
  // 3. LOGIC TO CLEAN AND CAPITALIZE REGION NAME
  const regionString = Array.isArray(regionParam) ? regionParam[0] : regionParam;
  
  if (!regionString) return null; // Safety check

  const [lesions, setLesions] = useState<Lesion[]>([]);

  // Convert route region (e.g., "right leg") to Title case
  const title = regionString
    .toString()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const correctRegion = regionString.toLowerCase(); // Ensure lower case for database query

  // 4. FUNCTION TO LOAD DATA (Will run on screen focus)
  const loadLesions = useCallback(async () => {
    try {
      // Data is already clean ("right arm", "face", etc.) from HistoryScreen
      const data = await getLesionsByRegion(correctRegion);
      setLesions(data as Lesion[]);
    } catch (error) {
      console.error("Error loading lesions:", error);
    }
  }, [correctRegion]);

  // Use focus effect to refresh the list automatically when returning
  useFocusEffect(
  useCallback(() => {
    loadLesions();
  }, [loadLesions])
);

  // 5. FUNCTION TO HANDLE DELETION
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteLesionById(id);
      // Optimistically refresh the state after deletion
      setLesions((prev) => prev.filter((l) => l.id !== id));
      
      // Optional: Inform the previous screen (HistoryScreen) to refresh its counts
      // This requires advanced navigation listeners, but a full reload (useFocusEffect) handles it.

    } catch (error) {
      console.error("Failed to delete lesion:", error);
      Alert.alert("Error", "Failed to delete scan locally.");
    }
  }, []);


  return (
    // 6. SAFE VIEW STRUCTURE (using View + padding)
    <View className="flex-1 bg-white pt-12"> 
      
      {/* Header (Styled to match previous screens) */}
      <View className="w-full h-20 bg-[#ff9aa8] items-center justify-center rounded-b-2xl mb-4">
        <Text className="text-xl font-bold text-white">{title} Scans ({lesions.length})</Text>
      </View>

      <ScrollView className="px-4 pt-6 pb-20">
        {lesions.length === 0 && (
          <Text className="text-center text-gray-500 mt-10">
            No saved scans for {title} yet.
          </Text>
        )}

        {lesions.map((item) => (
          <TouchableOpacity
            key={item.id}
            // Navigate to LesionDetails screen when tapping the card
            onPress={() => {
                // Note: You need to register "LesionDetails" in AppNavigator
                navigation.navigate("LesionDetails", { lesionId: item.id }); 
            }}
            className="bg-white rounded-2xl border border-gray-300 p-3 flex-row items-center mb-4"
          >
            {/* Image (Using local image or fallback) */}
            <Image
              source={
                item.imageUri
                  ? { uri: item.imageUri } 
                  : require("../../assets/images/icon.png") // Ensure this fallback asset exists!
              }
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                marginRight: 16,
              }}
            />

            <View className="flex-1">
              {/* Added Result Label */}
              <Text className="font-semibold text-[#e2728f]">
                {item.resultLabel || "Analysis Pending"}
              </Text>
              
              <Text className="font-semibold text-gray-700">
                {item.description || "No description"}
              </Text>
              
              <Text className="text-gray-500 text-sm">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            {/* DELETE / OPTIONS BUTTON */}
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Lesion Options",
                  "What do you want to do?",
                  [
                    {
                      text: "Delete",
                      onPress: () => handleDelete(item.id),
                      style: "destructive",
                    },
                    {
                      text: "Compare",
                      onPress: () => {
                        // Action for comparison
                      },
                    },
                    { text: "Cancel", style: "cancel" },
                  ]
                )
              }
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#ccc",
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 8,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>⋮</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}