import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScanMethodPopup from "../components/ScanMethodPopup";

// 1. IMPORT DATABASE FUNCTIONS
import { getLastThreeScans, Scan } from "../database/queries";

// Define Props
type Props = {
  navigation: any;
};

export default function Home({ navigation }: Props) {
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
    <View className="flex-1 bg-white pt-12">
      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-28">
        <ScanMethodPopup
          visible={showScanMethodPopup}
          onClose={() => setShowScanMethodPopup(false)}
          onTakePhoto={() =>
            navigation.navigate("ModelScan", { mode: "camera" })
          }
          onUploadImage={() =>
            navigation.navigate("ModelScan", { mode: "gallery" })
          }
        />

        {/* ----- HEADER ----- */}
        <View className="flex flex-row items-center justify-between py-3">
          <Text className="text-2xl font-bold text-[#e2728f]">MelanoScan</Text>
          <View className="w-7 h-7 bg-gray-300 rounded-md" />
        </View>

        {/* ----- SCAN CTA CARD ----- */}
        <View className="bg-[#ffe1e8] rounded-2xl p-4 mt-2">
          <Text className="text-[#444] font-semibold">
            Early checks save lives — A small step today can make a big
            difference tomorrow, check your skin now!
          </Text>

          {/* Images still commented out for safety */}
          {/* <Image ... /> */}
          <View className="w-full h-32 bg-gray-300 rounded-xl my-3 opacity-50" />

          <TouchableOpacity
            className="bg-[#e2728f] rounded-full py-3 w-36"
            onPress={() => setShowScanMethodPopup(true)}
          >
            <Text className="text-center text-white font-semibold">
              Scan Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* ----- SURVEY CTA ----- */}
        <TouchableOpacity onPress={() => navigation.navigate("SurveyPage1")}>
          <View className="bg-[#ffb6c6] rounded-2xl p-4 mt-4">
            <Text className="text-white font-bold text-lg">
              Answer Survey ? ? ?
            </Text>
            <Text className="text-white mt-1">
              to get even more accurate results — don't hesitate answering the
              survey
            </Text>
          </View>
        </TouchableOpacity>

        {/* ----- LAST SCANNING SECTION (DYNAMIC) ----- */}
        <Text className="text-lg font-semibold mt-4">Your Last Scanning</Text>

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
                No scans found. Take your first photo!
              </Text>
            </View>
          ) : (
            // Map over Database Results
            recentScans.map((scan) => (
              <View
                key={scan.id}
                className="mr-3 bg-white shadow-sm border border-gray-100 rounded-xl p-2 w-[140px]"
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
                  className="text-xs font-bold text-[#e2728f]"
                  numberOfLines={1}
                >
                  {scan.resultLabel || "Analyzing..."}
                </Text>
                <Text
                  className="text-xs font-semibold text-gray-700"
                  numberOfLines={1}
                >
                  {scan.region}
                </Text>
                <Text className="text-[10px] text-gray-400">
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* ----- EDUCATION CARD ----- */}
        <View className="bg-white rounded-2xl shadow border border-gray-100 mt-5 p-3">
          <View className="w-full h-28 bg-gray-200 rounded-lg mb-3" />
          <Text className="font-semibold text-[#333] mb-1">
            Educating yourself about the ABCDE rule is so crucial for early skin
            diagnosis.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Disclaimer")}
            className="bg-[#000] px-4 py-2 rounded-xl self-start mt-2"
          >
            <Text className="text-white">Read more</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
