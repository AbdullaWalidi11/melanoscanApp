import React, { useEffect, useState } from "react";
import { View, Text, Image, Animated, Easing, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { compareLesionsWithGemini } from "../../services/comparisonService";

export default function CompareProcessing() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { oldLesionId, oldImageUri, newImageUri, region } = route.params;

  const [scanLine] = useState(new Animated.Value(0));

  // --- 1. ANIMATION LOOP (The "Scanner" visual) ---
  useEffect(() => {
    const startAnimation = () => {
      scanLine.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLine, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true, // Use native driver for smoothness
          }),
          Animated.timing(scanLine, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startAnimation();
  }, []);

  // --- 2. THE LOGIC (Call Gemini) ---
  useEffect(() => {
    const runComparison = async () => {
      try {
        // A. Call the service (Validation + Analysis in one go)
        const result = await compareLesionsWithGemini(oldImageUri, newImageUri);

        // B. Handle Validation Failure (The "If/Else" Blocks)
        if (!result.valid) {
            Alert.alert(
                "Comparison Failed",
                result.message, // e.g. "Image is irrelevant"
                [{ text: "Go Back", onPress: () => navigation.goBack() }]
            );
            return;
        }

        // C. Handle Success -> Navigate to Result (Frame 28)
        // We pass the analysis data to the next screen to display it
        navigation.replace("CompareResult", {
            result: result.analysis,
            oldLesionId: oldLesionId,
            oldImageUri: oldImageUri,
            newImageUri: newImageUri,
        });

      } catch (error) {
        Alert.alert("Error", "Something went wrong during analysis.");
        navigation.goBack();
      }
    };

    // Small delay to let the animation start and user settle in
    setTimeout(runComparison, 1000);

  }, []);

  // --- 3. THE UI (Frame 27 Look) ---
  return (
    <View className="flex-1 bg-white items-center pt-20">
      
      {/* Title */}
      <Text className="text-[#8B4513] text-xl font-bold mb-8">
        comparing images
      </Text>

      {/* Images Container */}
      <View className="flex-row justify-center items-center space-x-4 mb-10">
        
        {/* Old Image */}
        <View className="relative">
             <Image 
                source={{ uri: oldImageUri }} 
                className="w-36 h-36 rounded-xl border-2 border-gray-200" 
             />
             <View className="absolute bottom-0 w-full bg-white/80 p-1 rounded-b-xl">
                 <Text className="text-[10px] text-center font-bold text-gray-600">BASELINE</Text>
             </View>
        </View>

        {/* New Image */}
        <View className="relative">
             <Image 
                source={{ uri: newImageUri }} 
                className="w-36 h-36 rounded-xl border-2 border-gray-200" 
             />
             <View className="absolute bottom-0 w-full bg-white/80 p-1 rounded-b-xl">
                 <Text className="text-[10px] text-center font-bold text-gray-600">TODAY</Text>
             </View>

             {/* The "Scanner" Overlay (Only on New Image) */}
             <Animated.View 
                style={{
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    height: 4, // Thickness of scan line
                    backgroundColor: '#00E5FF', // Cyan color like in Figma
                    shadowColor: "#00E5FF",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 10,
                    transform: [{
                        translateY: scanLine.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 144] // Height of image (36 * 4 = 144px approx)
                        })
                    }]
                }}
             />
        </View>
      </View>

      {/* Loading Text */}
      <Text className="text-[#8B4513] text-lg font-medium mt-4">
        checking evolving state . . .
      </Text>

      {/* Disclaimer (Bottom) */}
      <View className="absolute bottom-10 px-8">
        <Text className="text-gray-400 text-xs text-center leading-4">
           Analyzing texture, asymmetry, and border irregularities using Gemini AI.
        </Text>
      </View>

    </View>
  );
}