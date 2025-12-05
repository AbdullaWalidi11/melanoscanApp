import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, MessageCircle, Trash2 } from "lucide-react-native";

// Database
import { deleteLesionById} from "../database/queries";
import { getDB } from "../database/db";

export default function LesionDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lesionId } = route.params || {};

  const [lesion, setLesion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            }
        }
    ]);
  };

 // 3. Handle Chat
  const handleChat = () => {
    // We just pass the ID. The ChatScreen will fetch the full context 
    // (Image + Risk + User Profile) from the database automatically.
    navigation.navigate("ChatScreen", { 
        lesionId: lesion.id
    });
  };

  if (loading) return <View className="flex-1 bg-white justify-center items-center"><ActivityIndicator size="large" color="#e2728f"/></View>;
  if (!lesion) return <View className="flex-1 bg-white pt-20 items-center"><Text>Scan not found.</Text></View>;

  // Formatting helpers
  const isMalignant = lesion.resultLabel === "Malignant";
  const isBenign = lesion.resultLabel === "Benign";
  const statusColor = isMalignant ? "bg-red-100 border-red-400" : isBenign ? "bg-green-100 border-green-400" : "bg-yellow-100 border-yellow-400";
  
  return (
    <View className="flex-1 bg-white">
      
      {/* HEADER */}
      <View className="bg-[#e2728f] pt-12 pb-4 px-4 flex-row items-center justify-between shadow-sm">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Scan Analysis</Text>
        <TouchableOpacity onPress={handleDelete}>
            <Trash2 color="white" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        
        {/* IMAGE */}
        <View className="shadow-sm bg-white rounded-2xl mb-6">
            <Image 
                source={{ uri: lesion.imageUri }} 
                className="w-full h-72 rounded-2xl bg-gray-200"
                resizeMode="cover"
            />
        </View>

        {/* RISK CARD (Reused Style) */}
        <View className={`rounded-xl p-4 mb-6 border ${statusColor}`}>
            <Text className="font-semibold text-lg text-gray-800">
                {lesion.resultLabel || "Suspicious"}
            </Text>
            <Text className="mt-2 text-gray-700 leading-5">
                AI Confidence: <Text className="font-bold">{Math.round(lesion.confidence * 100)}%</Text>
                {"\n"}
                {isBenign ? "This lesion appears to have low risk characteristics." : "This lesion shows characteristics that may require medical attention."}
            </Text>
        </View>

        {/* DETAILS GRID */}
        <View className="bg-gray-50 rounded-xl p-4 mb-8">
            <Text className="text-gray-500 text-xs uppercase font-bold mb-3">Scan Details</Text>
            <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Date</Text>
                <Text className="font-medium text-gray-900">{new Date(lesion.createdAt).toLocaleDateString()}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Location</Text>
                <Text className="font-medium text-gray-900 capitalize">{lesion.region}</Text>
            </View>
            <View className="flex-row justify-between">
                <Text className="text-gray-600">User Note</Text>
                <Text className="font-medium text-gray-900 max-w-[60%] text-right" numberOfLines={1}>{lesion.description || "None"}</Text>
            </View>
        </View>

        {/* ✅ THE CHAT BUTTON */}
        <TouchableOpacity 
            onPress={handleChat}
            className="flex-row items-center justify-center bg-black py-4 rounded-full shadow-lg mb-10"
        >
            <MessageCircle color="white" size={24} fill="white" />
            <Text className="text-white font-bold text-lg ml-3">Ask AI Assistant</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}