import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";

export default function ABCDECarousel() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  // Load fonts locally if needed, though they are usually loaded in App.js or parent
  // But to be safe and self-contained we can check or just use them if loaded.
  // Ideally, fonts are loaded at the root. We'll assume parents load them or we use what's available.

  const tips = [
    {
      letter: "A",
      title: t("analysis_result.asymmetry_title"),
      desc: t("analysis_result.asymmetry_desc"),
      img: require("../../assets/images/assymetry.png"),
    },
    {
      letter: "B",
      title: t("analysis_result.border_title"),
      desc: t("analysis_result.border_desc"),
      img: require("../../assets/images/border.png"),
    },
    {
      letter: "C",
      title: t("analysis_result.color_title"),
      desc: t("analysis_result.color_desc"),
      img: require("../../assets/images/color.png"),
    },
    {
      letter: "D",
      title: t("analysis_result.diameter_title"),
      desc: t("analysis_result.diameter_desc"),
      img: require("../../assets/images/diameter.png"),
    },
    {
      letter: "E",
      title: t("analysis_result.evolving_title"),
      desc: t("analysis_result.evolving_desc"),
      img: require("../../assets/images/evolving.png"),
    },
  ];

  // Auto-rotate every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 4000); // 4 Seconds for better reading time
    return () => clearInterval(interval);
  }, []);

  const item = tips[index];

  return (
    <View
      className="w-full bg-[#fafafa] border border-gray-400 rounded-3xl p-5 flex-row items-center shadow-2xl"
      style={{ elevation: 3 }}
    >
      {/* LEFT COL: Icon + Title */}
      <View className="flex-col items-center justify-center mr-4 w-24">
        {/* Image Container with Shadow & Border */}
        <View
          className="w-20 h-20 rounded-full bg-[#FFDAB9] items-center justify-center mb-2 "
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}
        >
          <Image
            source={item.img}
            className="w-[90px] h-[90px]"
            resizeMode="contain"
          />
        </View>

        <Text
          style={{ fontFamily: "Montserrat_400Regular" }}
          className="text-sm text-[#333] text-center"
        >
          {item.title}
        </Text>
      </View>

      {/* RIGHT COL: Letter + Desc */}
      <View className="flex-1 items-center justify-center pl-2">
        {/* Letter Centered */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-4xl mb-1 text-black"
        >
          {item.letter}
        </Text>

        {/* Desc Bigger and readable */}
        <Text
          style={{ fontFamily: "Montserrat_400Regular" }}
          className="text-xs text-gray-600 text-center leading-4"
        >
          {item.desc}
        </Text>
      </View>
    </View>
  );
}
