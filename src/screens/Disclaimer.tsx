import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, TriangleAlert, Info } from "lucide-react-native";

export default function DisclaimerScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white">
      {/* ----- HEADER ----- */}
      <View className="bg-[#e2728f] pt-12 pb-4 px-4 flex-row items-center relative">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="absolute left-4 bottom-4 z-10"
        >
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        
        <View className="flex-1 items-center">
          <Text className="text-white text-xl font-bold">Disclaimer & Learn</Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-[#fff0f3]" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ----- IMPORTANT DISCLAIMER CARD ----- */}
        <View className="bg-white mx-4 mt-6 p-4 rounded-xl shadow-sm border-l-8 border-red-500 flex-row items-start">
          <View className="mr-4 mt-1">
            <TriangleAlert color="#ef4444" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              IMPORTANT DISCLAIMER
            </Text>
            <Text className="text-gray-700 leading-5">
              This app is a screening aid, <Text className="font-bold">NOT</Text> a diagnostic tool. 
              Always consult a professional dermatologist for any skin concerns.
            </Text>
          </View>
        </View>

        {/* ----- UNDERSTANDING SKIN CANCER ----- */}
        <View className="bg-white mx-4 mt-4 p-5 rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Understanding Skin Cancer
          </Text>
          <View className="flex-row">
            {/* Image Placeholder */}
            <View className="w-24 h-24 bg-gray-200 rounded-lg mr-4" />
            <Text className="flex-1 text-gray-600 leading-5">
              Early detection is a pivotal form of defense. Skin cancer is the abnormal growth of skin cells, 
              most often developing on skin exposed to the sun. However, this common form of cancer can also 
              occur on areas of your skin not ordinarily exposed to sunlight.
            </Text>
          </View>
        </View>

        {/* ----- THE ABCDE RULE ----- */}
        <View className="mx-4 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4 ml-1">
            The ABCDE Rule
          </Text>

          {/* A - Asymmetry */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-lg mr-4 items-center justify-center">
               <Text className="text-orange-400 font-bold">Img A</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">A - Asymmetry</Text>
              <Text className="text-gray-600">
                One half of the mole does not match the other half.
              </Text>
            </View>
          </View>

          {/* B - Border */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-lg mr-4 items-center justify-center">
               <Text className="text-orange-400 font-bold">Img B</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">B - Border</Text>
              <Text className="text-gray-600">
                The edges are irregular, ragged, notched, or blurred.
              </Text>
            </View>
          </View>

          {/* C - Color */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-lg mr-4 items-center justify-center">
               <Text className="text-orange-400 font-bold">Img C</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">C - Color</Text>
              <Text className="text-gray-600">
                The color is not the same all over and may include shades of brown or black.
              </Text>
            </View>
          </View>

          {/* D - Diameter */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-lg mr-4 items-center justify-center">
               <Text className="text-orange-400 font-bold">Img D</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">D - Diameter</Text>
              <Text className="text-gray-600">
                The spot is larger than 6 millimeters across (about ¼ inch).
              </Text>
            </View>
          </View>

          {/* E - Evolving */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-lg mr-4 items-center justify-center">
               <Text className="text-orange-400 font-bold">Img E</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">E - Evolving</Text>
              <Text className="text-gray-600">
                The mole is changing in size, shape, or color over time.
              </Text>
            </View>
          </View>
        </View>

        {/* ----- STAY VIGILANT ----- */}
        <View className="bg-white mx-4 mt-2 p-5 rounded-2xl shadow-sm border-t-4 border-[#e2728f]">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            Stay Vigilant
          </Text>
          <Text className="text-gray-600 leading-6">
            Perform regular self-checks on your skin. Look for new growths or existing moles that change. 
            If you notice anything suspicious, book an appointment with a doctor immediately.
          </Text>
        </View>

        {/* ----- EXTRA CONTENT (SCROLLABLE AREA) ----- */}
        
        {/* Prevention Tips */}
        <View className="mx-4 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-3 ml-1">
            Prevention Tips
          </Text>
          
          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">Apply sunscreen (SPF 30+) every 2 hours when outdoors.</Text>
          </View>
          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">Seek shade, especially between 10 AM and 4 PM.</Text>
          </View>
          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">Avoid tanning beds and sunlamps entirely.</Text>
          </View>
        </View>

        {/* When to see a doctor */}
        <View className="bg-white mx-4 mt-6 p-5 rounded-2xl shadow-sm mb-8">
          <View className="flex-row items-center mb-3">
            <Info color="#e2728f" size={24} />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              When to see a doctor?
            </Text>
          </View>
          <Text className="text-gray-600 leading-6">
            You should consult a dermatologist if you notice:
            {"\n\n"}
            1. A sore that doesn't heal.
            {"\n"}
            2. Spread of pigment from the border of a spot into surrounding skin.
            {"\n"}
            3. Redness or a new swelling beyond the border of the mole.
            {"\n"}
            4. Change in sensation, such as itchiness, tenderness, or pain.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}