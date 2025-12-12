import React, { useState, useCallback } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; 

// Database & Validation
import { deleteLesionById, getLesionsByRegion } from "../database/queries";
import { validateImageQuality } from "../services/imageValidation";

type Lesion = {
  id: number;
  description?: string;
  date: string;
  createdAt: string;
  imageUri?: string;
  resultLabel?: string; 
  confidence?: number; 
};

export default function LesionsByRegionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>(); 
  
  const regionParam = route.params?.region || ''; 
  const regionString = Array.isArray(regionParam) ? regionParam[0] : regionParam;
  
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(false);

  if (!regionString) return null; 

  const title = regionString.toString().replace(/\b\w/g, (c: string) => c.toUpperCase());
  const correctRegion = regionString.toLowerCase(); 

  // --- LOAD DATA ---
  const loadLesions = useCallback(async () => {
    try {
      const data = await getLesionsByRegion(correctRegion);
      setLesions(data as Lesion[]);
    } catch (error) {
      console.error("Error loading lesions:", error);
    }
  }, [correctRegion]);

  useFocusEffect(
    useCallback(() => {
      loadLesions();
    }, [loadLesions])
  );

  // --- DELETE LOGIC ---
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteLesionById(id);
      setLesions((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      Alert.alert("Error", "Failed to delete scan locally.");
    }
  }, []);

  // --- OPTION A: START NEW COMPARISON (Frame 27) ---
  const handleStartComparison = async (originalLesion: Lesion) => {
    Alert.alert(
      "Start Comparison",
      "Take a new photo to compare against this baseline scan.",
      [
        {
          text: "Camera",
          onPress: () => pickImageForComparison(originalLesion, true),
        },
        {
          text: "Gallery",
          onPress: () => pickImageForComparison(originalLesion, false),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // --- OPTION B: VIEW PAST LOGS (Frame 26) ---
  const handleViewLogs = (originalLesion: Lesion) => {
     // Navigate to the "Comparison History" screen, passing ONLY this lesion's ID
     navigation.navigate("ComparisonHistory", { 
        parentLesionId: originalLesion.id,
        imageUri: originalLesion.imageUri // Pass thumbnail for header visuals
     });
  };

  // --- IMAGE PICKER HELPER ---
  const pickImageForComparison = async (originalLesion: Lesion, fromCamera: boolean) => {
    try {
      if (fromCamera) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return alert('Camera permission needed.');
      } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return alert('Gallery permission needed.');
      }

      setLoading(true);
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: fromCamera, 
        aspect: [1, 1],
        quality: 1,
      };

      let result;
      if (fromCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const newImageUri = result.assets[0].uri;

      // VALIDATE IMAGE QUALITY 🛡️
      const qualityCheck = await validateImageQuality(newImageUri);
      if (!qualityCheck.isValid) {
        setLoading(false);
        Alert.alert("Poor Image Quality", qualityCheck.error);
        return;
      }

      setLoading(false);

      // NAVIGATE TO PROCESSING (Frame 27)
      navigation.navigate("CompareProcessing", { 
        oldLesionId: originalLesion.id,
        oldImageUri: originalLesion.imageUri,
        newImageUri: newImageUri,
        region: title
      });

    } catch (error) {
      console.error("Comparison Error:", error);
      setLoading(false);
      Alert.alert("Error", "Could not capture image.");
    }
  };

  return (
    <View className="flex-1 bg-white pt-12">
      
      {/* HEADER */}
      <View className="w-full h-24 bg-[#ff9aa8] items-center justify-center rounded-b-3xl shadow-sm mb-4">
        <Text className="text-2xl font-bold text-white mt-4">{title} Scans</Text>
        <Text className="text-white opacity-90 text-xs">{lesions.length} records found</Text>
      </View>

      {loading && (
        <View className="absolute z-50 w-full h-full justify-center items-center bg-black/20">
            <ActivityIndicator size="large" color="#ff9aa8" />
        </View>
      )}

      {/* LIST */}
      <ScrollView className="px-4 pt-2 pb-20">
        {lesions.length === 0 && (
          <View className="items-center mt-10">
            <Text className="text-gray-400 text-lg">No scans yet.</Text>
            <Text className="text-gray-400 text-xs text-center px-10 mt-2">
              Tap the camera button on the home screen to add your first scan.
            </Text>
          </View>
        )}

        {lesions.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate("LesionDetails", { lesionId: item.id })}
            className="bg-white rounded-2xl border border-gray-100 p-3 flex-row items-center mb-3 shadow-sm"
            style={{ elevation: 2 }} 
          >
            {/* THUMBNAIL */}
            <Image
              source={item.imageUri ? { uri: item.imageUri } : require("../../assets/images/icon.png")}
              className="w-16 h-16 rounded-xl bg-gray-100"
            />

            {/* INFO */}
            <View className="flex-1 ml-4">
              <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
                {item.resultLabel || "Analysis Pending"}
              </Text>
              
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric"
                })}
              </Text>
              
              <Text className="text-[#ff9aa8] text-xs font-medium mt-1 uppercase">
                {title}
              </Text>
            </View>

            {/* ✅ THREE DOTS MENU (Updated Flow) */}
            <TouchableOpacity
              className="p-2"
              onPress={() =>
                Alert.alert(
                  "Lesion Options",
                  "What would you like to do with this scan?",
                  [
                    {
                      text: "Start New Comparison",
                      onPress: () => handleStartComparison(item), // Frame 27
                    },
                    {
                      text: "View Comparison Logs",
                      onPress: () => handleViewLogs(item), // Frame 26
                    },
                    {
                      text: "Delete",
                      onPress: () => handleDelete(item.id),
                      style: "destructive",
                    },
                    { text: "Cancel", style: "cancel" },
                  ]
                )
              }
            >
               <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}