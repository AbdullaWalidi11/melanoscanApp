import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { AbhayaLibre_400Regular } from "@expo-google-fonts/abhaya-libre";
import { Montserrat_400Regular, useFonts } from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";

export default function Page3() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    AbhayaLibre_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-[#ffc5c5] items-center justify-center relative">
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-20 rotate-45">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#fe948d", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      <View className="flex-1 items-center justify-center pb-64">
        <View className="bg-white rounded-[50px] p-8 shadow-md mb-8">
          <Image
            source={require("../../assets/images/onboarding3.png")}
            className="w-48 h-48"
            resizeMode="contain"
          />
        </View>

        <Text
          className="text-[35px] text-center text-white mb-4"
          style={{
            fontFamily: "AbhayaLibre_400Regular",
            textShadowColor: "rgba(0, 0, 0, 0.25)",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 8,
          }}
        >
          {t("landing.page3.title")}
        </Text>
      </View>

      <View className="absolute bg-white rounded-t-[60px] px-8 pt-8 pb-52 w-full translate-y-[340px] items-center shadow-lg">
        <Text
          className="text-center text-gray-700 mb-8"
          style={{
            fontFamily: "Montserrat_400Regular",
            lineHeight: 26,
            fontSize: 17,
            fontWeight: "bold",
          }}
        >
          {t("landing.page3.desc")}
        </Text>

        {/* Get Started -> Goes to LOGIN (Replce acts like router.replace) */}
        <TouchableOpacity
          className="border bg-black border-[#2D2D2D] rounded-full px-20 py-4 mb-8"
          onPress={() => navigation.replace("SurveyPage1")}
        >
          <Text
            className="text-white"
            style={{ fontFamily: "Montserrat_400Regular", fontSize: 16 }}
          >
            {t("landing.get_started")}
          </Text>
        </TouchableOpacity>

        <View className="flex-row gap-x-2">
          <View className="w-3 h-3 bg-gray-300 rounded-full" />
          <View className="w-3 h-3 bg-gray-300 rounded-full" />
          <View className="w-3 h-3 bg-black rounded-full" />
        </View>

        <View className="flex-row items-end justify-end w-full mt-6">
          <TouchableOpacity onPress={() => navigation.replace("SurveyPage1")}>
            <Text
              className="text-gray-500"
              style={{ fontFamily: "Montserrat_400Regular", fontSize: 16 }}
            >
              {t("landing.skip")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
