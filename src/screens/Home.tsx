import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScanMethodPopup from "../components/ScanMethodPopup";

// 1. IMPORT DATABASE FUNCTIONS
import { getLastThreeScans, Scan } from "../database/queries";

import { useTranslation } from "react-i18next";

// Define Props
type Props = {
  navigation: any;
};

export default function Home({ navigation }: Props) {
  const { t } = useTranslation();
  const [showScanMethodPopup, setShowScanMethodPopup] = useState(false);

  // 2. STATE FOR SCANS
  const [recentScans, setRecentScans] = useState<Scan[]>([]);

  // 3. RELOAD DATA WHENEVER SCREEN COMES INTO FOCUS
  useFocusEffect(
    useCallback(() => {
      loadRecentScans();
    }, [])
  );

  // 4. ASYNC FUNCTION TO FETCH DATA
  async function loadRecentScans() {
    try {
      const scans = await getLastThreeScans();
      setRecentScans(scans);
    } catch (e) {
      console.error("Failed to load scans", e);
    }
  }

  return (
    // Keeping the safe "View" structure
    <View className="flex-1 bg-white pt-2">
      <ScanMethodPopup
        visible={showScanMethodPopup}
        onClose={() => setShowScanMethodPopup(false)}
        onTakePhoto={() => navigation.navigate("ModelScan", { mode: "camera" })}
        onUploadImage={() =>
          navigation.navigate("ModelScan", { mode: "gallery" })
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} className="px-2 pb-28">
        {/* ----- SCAN CTA CARD ----- */}
        <View className="flex-row items-center bg-white rounded-3xl shadow-md p-4 mt-2">
          {/* Left Column: Text and Button */}
          <View className="flex-1 flex-col pr-2 relative items-center">
            <Text className="text-[#444] font-semibold mb-4 text-base text-center leading-5 ">
              {t("home.early_check")}
            </Text>

            <TouchableOpacity
              className="bg-[#fe948d] rounded-full py-3 w-36 shadow-sm items-center justify-center"
              onPress={() => setShowScanMethodPopup(true)}
            >
              <Text className="text-white font-semibold text-lg">
                {t("home.scan_now")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: Image */}
          <Image
            source={require("../../assets/images/scan now.png")} // Ensure this path is correct
            resizeMode="contain"
            className="w-40 h-40 self-end"
          />
        </View>

        {/* ----- SURVEY CTA ----- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("SurveyPage1")}
          style={styles.surveyButton}
        >
          <View className="bg-[#fe948d] rounded-3xl p-5 mt-4 relative overflow-hidden min-h-[120px] justify-center px-4">
            {/* === DECORATIVE BACKGROUND === */}
            {/* Faint circles */}
            <View className="absolute -top-6 left-8 w-24 h-24 bg-white rounded-full opacity-10" />
            <View className="absolute -bottom-4 left-32 w-10 h-10 bg-white rounded-full opacity-20" />
            <View className="absolute top-4 right-16 w-8 h-8 bg-white rounded-full opacity-20" />
            <View className="absolute -bottom-8 -right-4 w-20 h-20 bg-white rounded-full opacity-10" />

            {/* Question Marks (Positioned on the right) */}
            <Text className="absolute top-2 right-4 text-white font-semibold text-6xl opacity-40 transform rotate-12">
              ?
            </Text>
            <Text className="absolute bottom-[-10] right-16 text-white font-semibold text-7xl opacity-20 -rotate-12">
              ?
            </Text>
            <Text className="absolute top-10 right-28 text-white font-semibold text-4xl opacity-30 rotate-45">
              ?
            </Text>

            {/* === TEXT CONTENT === */}
            {/* Constrained width to prevent overlap */}
            <View className="z-10 relative w-[65%] py-2">
              <Text className="text-white font-bold text-3xl mb-1">
                {t("home.answer_survey")}
              </Text>
              <Text className="text-white/90 text-sm font-medium leading-5 ">
                {t("home.survey_desc")}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ----- LAST SCANNING SECTION (DYNAMIC) ----- */}
        <Text className="text-lg font-semibold mt-4">
          {t("home.last_scans")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
        >
          {/* 5. DYNAMIC RENDERING LOGIC */}
          {recentScans.length === 0 ? (
            // Empty State
            <View className="mt-3 bg-gray-50 p-4 rounded-xl w-64 border border-dashed border-gray-300">
              <Text className="text-gray-400 text-center">
                {t("home.no_scans")}
              </Text>
            </View>
          ) : (
            // Map over Database Results
            recentScans.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                className="mr-3 bg-white shadow-sm border border-gray-100 rounded-xl p-2 w-[140px]"
                onPress={() =>
                  navigation.navigate("LesionDetails", { lesionId: scan.id })
                }
              >
                {/* CONTAINER FOR IMAGE */}
                <View className="w-full h-24 bg-gray-200 rounded-md mb-2 relative overflow-hidden">
                  {/* ✅ FIXED IMAGE SOURCE */}
                  <Image
                    source={{ uri: scan.imageUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                <Text
                  className="text-xs font-bold text-[#fe948d]"
                  numberOfLines={1}
                >
                  {scan.resultLabel || t("home.analyzing")}
                </Text>
                <Text
                  className="text-xs font-semibold text-gray-700"
                  numberOfLines={1}
                >
                  {scan.region === "Unspecified"
                    ? t("analysis_result.unspecified")
                    : scan.region}
                </Text>
                <Text className="text-[10px] text-gray-400">
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* ----- EDUCATION CARD ----- */}
        <View className="bg-gray-100 rounded-2xl flex-row items-center shadow border border-gray-200 mt-5 p-3">
          {/* IMAGE LEFT */}
          <Image
            source={require("../../assets/images/ABCDE.jpg")}
            resizeMode="cover"
            className="w-32 h-32 rounded-xl mr-3"
          />

          {/* TEXT + BUTTON RIGHT */}
          <View className="flex-1 items-center">
            <Text className="font-semibold text-[#333] mb-2 text-center">
              {t("home.abcde_education")}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Disclaimer")}
              className="bg-[#000] px-4 py-2 rounded-xl mt-1"
            >
              <Text className="text-white">{t("home.read_more")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  surveyButton: {
    shadowColor: "#111",
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
};
