import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

// 1. DATABASE IMPORT
import { countLesionsByRegion } from "../database/queries";

export default function HistoryScreen() {
  const navigation = useNavigation<any>();

  // Initial State
  const [regions, setRegions] = useState([
    { name: "face", count: 0 },
    { name: "body", count: 0 },
    { name: "right arm", count: 0 },
    { name: "left arm", count: 0 },
    { name: "right leg", count: 0 },
    { name: "left leg", count: 0 },
  ]);

  // 2. COMMENTED OUT IMAGES (To prevent crash)
 const regionImages: Record<string, any> = {
    face: require("../../assets/images/face.png"),
    body: require("../../assets/images/body.png"),
    "right arm": require("../../assets/images/right-arm.png"),
    "left arm": require("../../assets/images/left-arm.png"),
    "right leg": require("../../assets/images/right-leg.png"),
    "left leg": require("../../assets/images/left-leg.png"),
  }; 


  // 3. LOAD DATA ON FOCUS
  useFocusEffect(
    useCallback(() => {
      async function loadCounts() {
        try {
          const updated = [];
          for (let item of regions) {
            // Fetch real count from SQLite
            const count = await countLesionsByRegion(item.name);
            updated.push({ ...item, count });
          }
          setRegions(updated);
        } catch (error) {
          console.error("Error loading counts:", error);
        }
      }

      loadCounts();
    }, []) 
  );

  return (
    // 4. SAFE VIEW STRUCTURE (No SafeAreaView)
    <View className="flex-1 bg-[#fff] pt-12">
      
      

      {/* ----- CONTENT ----- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-6 pb-32"
      >
        {/* Grid of 6 Cards */}
        <View className="flex flex-row flex-wrap justify-between">
          {regions.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                // 5. NAVIGATION FIX: Pass params object, not a URL string
                // Note: You need to create a screen named "LesionsByRegion" in AppNavigator later
                navigation.navigate("LesionsByRegion", { region: item.name });
              }}
              className="w-[45%] bg-white rounded-xl border border-[#f5b4b4] shadow-sm mb-6 p-3 items-center"
              activeOpacity={0.8}
            >
              
              <Image
                source={regionImages[item.name]}
                className="w-16 h-16 rounded-xl mb-2"
                resizeMode="contain"
              />

              <Text className="text-center font-semibold text-[#444] capitalize">
                {item.name}
              </Text>

              <Text className="text-center text-3xl font-bold text-[#ff6d7c] mt-1">
                {item.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}