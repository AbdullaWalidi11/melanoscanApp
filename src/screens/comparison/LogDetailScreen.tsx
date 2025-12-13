import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";

export default function LogDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { log } = route.params; // The specific comparison log object

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  if (!fontsLoaded) return <View className="flex-1 bg-white" />;

  const isStable = log.status === "STABLE";

  return (
    <View className="flex-1 bg-white pt-12">
      {/* HEADER */}
      <View className="px-4 flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-2"
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-xl text-[#5a3e3e]"
        >
          Comparison Detail
        </Text>
      </View>

      <ScrollView className="px-6">
        <View className="w-full bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
          {/* Header Row: Date & Status */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              style={{ fontFamily: "Montserrat_400Regular" }}
              className="text-gray-500"
            >
              {log.date}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${isStable ? "bg-green-100" : "bg-red-100"}`}
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className={`${isStable ? "text-green-700" : "text-red-700"} text-xs`}
              >
                {log.status}
              </Text>
            </View>
          </View>

          {/* Score Circle (If score exists) */}
          {log.score !== undefined && (
            <View className="items-center mb-6">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center border-4 ${isStable ? "border-green-100" : "border-red-100"}`}
              >
                <Text
                  style={{ fontFamily: "Montserrat_700Bold" }}
                  className="text-2xl text-[#5a3e3e]"
                >
                  {Math.round(log.score)}%
                </Text>
                <Text
                  style={{ fontFamily: "Montserrat_400Regular" }}
                  className="text-[10px] text-gray-400"
                >
                  Change
                </Text>
              </View>
            </View>
          )}

          {/* Images Comparison */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="items-center flex-1">
              <Image
                source={{ uri: log.oldImageUri }}
                className="w-28 h-28 rounded-xl bg-gray-100 mb-2 border border-gray-200"
              />
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-gray-500 text-xs"
              >
                Previous
              </Text>
            </View>

            <Ionicons name="arrow-forward-circle" size={32} color="#fe8d93" />

            <View className="items-center flex-1">
              <Image
                source={{ uri: log.newImageUri }}
                className="w-28 h-28 rounded-xl bg-gray-100 mb-2 border border-gray-200"
              />
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-gray-500 text-xs"
              >
                This Scan
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 w-full mb-4" />

          {/* Reasoning */}
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-[#5a3e3e] mb-2"
          >
            Analysis
          </Text>
          <Text
            style={{ fontFamily: "Montserrat_400Regular" }}
            className="text-gray-600 leading-6 mb-6"
          >
            {log.reasoning}
          </Text>

          {/* Advice */}
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-[#5a3e3e] mb-2"
          >
            Recommendation
          </Text>
          <Text
            style={{ fontFamily: "Montserrat_400Regular" }}
            className="text-gray-600 leading-6"
          >
            {log.advice}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
