import React, { useState, useCallback } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { getComparisonLogs } from "../../database/queries";

export default function ComparisonHistory() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { parentLesionId, imageUri } = route.params; // Passed from List Screen

  const [logs, setLogs] = useState<any[]>([]);

  // Load logs whenever screen opens
  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const data = await getComparisonLogs(parentLesionId);
          setLogs(data);
        } catch (e) {
          console.error(e);
        }
      }
      load();
    }, [parentLesionId])
  );

  return (
    <View className="flex-1 bg-white pt-12">
        
        {/* HEADER */}
        <View className="px-4 flex-row items-center mb-6">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Comparison Log</Text>
        </View>

        {/* THUMBNAIL OF MOLE (Context) */}
        <View className="items-center mb-8">
            <Image 
                source={imageUri ? { uri: imageUri } : require("../../../assets/images/face.png")} 
                className="w-20 h-20 rounded-full border-4 border-gray-100"
            />
            <Text className="text-gray-500 text-xs mt-2">Tracking History</Text>
        </View>

        {/* TIMELINE LIST */}
        <ScrollView className="px-6">
            {logs.length === 0 && (
                <Text className="text-center text-gray-400 mt-10">No comparisons recorded yet.</Text>
            )}

            {logs.map((log, index) => {
                const isStable = log.status === "STABLE";
                return (
                    <View key={log.id} className="flex-row mb-8">
                        {/* Timeline Line */}
                        <View className="items-center mr-4">
                            <View 
                                className={`w-4 h-4 rounded-full ${isStable ? "bg-green-500" : "bg-red-500"}`} 
                            />
                            {/* Vertical Line (don't show for last item) */}
                            {index !== logs.length - 1 && (
                                <View className="w-0.5 h-full bg-gray-200 mt-1" />
                            )}
                        </View>

                        {/* Content Card */}
                        <View className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <View className="flex-row justify-between mb-2">
                                <Text className="font-bold text-gray-800">{log.date}</Text>
                                <Text 
                                    className="font-bold text-xs px-2 py-1 rounded"
                                    style={{ 
                                        color: isStable ? "#2E7D32" : "#C62828",
                                        backgroundColor: isStable ? "#E8F5E9" : "#FFEBEE"
                                    }}
                                >
                                    {log.status}
                                </Text>
                            </View>

                            {/* Images Row */}
                            <View className="flex-row space-x-2 mb-3">
                                <Image source={{ uri: log.oldImageUri }} className="w-12 h-12 rounded bg-gray-200" />
                                <Ionicons name="arrow-forward" size={16} color="#999" style={{ alignSelf: 'center' }} />
                                <Image source={{ uri: log.newImageUri }} className="w-12 h-12 rounded bg-gray-200" />
                            </View>

                            <Text className="text-gray-600 text-sm leading-5">
                                {log.reasoning}
                            </Text>
                        </View>
                    </View>
                );
            })}
             <View className="h-20" />
        </ScrollView>
    </View>
  );
}