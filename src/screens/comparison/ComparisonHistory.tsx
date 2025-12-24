import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getComparisonLogs } from "../../database/queries";
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

export default function ComparisonHistory() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // Handle undefined params safely
  const params = route.params || {};
  const [currentParentId, setCurrentParentId] = useState<number | null>(
    params.parentLesionId || null
  );
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(
    params.imageUri || null
  );
  const [currentDescription, setCurrentDescription] = useState<string | null>(
    params.description || null
  );

  const { t } = useTranslation();

  const [logs, setLogs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [allLesions, setAllLesions] = useState<any[]>([]); // For selection mode
  const [selectionMode, setSelectionMode] = useState<boolean>(!currentParentId);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Load all lesions if in selection mode
  useFocusEffect(
    useCallback(() => {
      if (!currentParentId) {
        setSelectionMode(true);
        loadAllLesions();
      } else {
        setSelectionMode(false);
        loadTimeline(currentParentId, currentImageUri);
      }
    }, [currentParentId, currentImageUri])
  );

  async function loadAllLesions() {
    try {
      // Import this function (we need to import it at top)
      const { getAllLesions } = require("../../database/queries");
      const data = await getAllLesions();
      setAllLesions(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadTimeline(id: number, uri: string | null) {
    try {
      const data = await getComparisonLogs(id);
      setLogs(data);

      // Construct Timeline
      // Baseline Item (The original lesion)
      const baselineItem = {
        type: "BASELINE",
        id: "baseline",
        date: "Original",
        imageUri: uri,
        status: "START",
      };

      const historyItems = data.map((log: any) => ({
        type: "LOG",
        id: log.id,
        date: log.date,
        imageUri: log.newImageUri,
        status: log.status,
        logData: log,
      }));

      setTimeline([baselineItem, ...historyItems]);
    } catch (e) {
      console.error(e);
    }
  }

  if (!fontsLoaded) return <View className="flex-1 bg-white" />;

  const handleItemPress = (item: any) => {
    if (item.type === "BASELINE") {
      return;
    } else {
      navigation.navigate("LogDetailScreen", { log: item.logData });
    }
  };

  const handleSelectLesion = (item: any) => {
    setCurrentParentId(item.id);
    setCurrentImageUri(item.imageUri);
    setCurrentDescription(item.description || item.region);
    setSelectionMode(false);
  };

  return (
    // 1. Base Background with Pink/Coral Color
    <View className="flex-1 bg-[#ffc0b5] relative overflow-hidden">
      {/* === TOP HEADER (Back Button) === */}
      <View className="absolute top-12 left-6 z-50 flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            if (selectionMode) {
              navigation.goBack();
            } else {
              // If we are in detail mode but came from global menu, go back to list?
              // Or just go back to previous screen.
              // Let's go back to selection mode if we started there?
              // For simplicity, just navigation.goBack()
              // NO wait, if we are in detail view and press back, we should go back to list if !params.parentLesionId
              if (!params.parentLesionId) {
                setSelectionMode(true);
                setCurrentParentId(null);
              } else {
                navigation.goBack();
              }
            }
          }}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Background Geometry... */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* === MAIN CONTENT (White Sheet) === */}
      <View className="flex-1 bg-white mt-28 rounded-t-[40px] overflow-hidden shadow-2xl">
        {/* TITLE SECTION */}
        <View className="items-center px-6 pt-8 pb-4">
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-2xl text-[#5a3e3e] text-center mb-1"
          >
            {selectionMode
              ? "Tracking History"
              : currentDescription || t("comparison_history.title")}
          </Text>
          {selectionMode && (
            <Text className="text-gray-400 text-sm">
              {t("comparison_history.select_prompt")}
            </Text>
          )}
        </View>

        {/* CONTENT */}
        <View className="flex-1 mt-4">
          {selectionMode ? (
            // SELECTION LIST
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
              {allLesions.length === 0 ? (
                <Text className="text-center text-gray-400 mt-10">
                  No scans found.
                </Text>
              ) : (
                allLesions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center"
                    onPress={() => handleSelectLesion(item)}
                  >
                    <Image
                      source={{ uri: item.imageUri }}
                      className="w-16 h-16 rounded-xl bg-gray-200"
                    />
                    <View className="ml-4 flex-1">
                      <Text
                        style={{ fontFamily: "Montserrat_600SemiBold" }}
                        className="text-[#5a3e3e] text-lg"
                      >
                        {item.region}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                      <Text
                        className={`text-xs mt-1 font-bold ${item.resultLabel === "Malignant" ? "text-red-500" : "text-green-600"}`}
                      >
                        {item.resultLabel}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#fe948d"
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            // TIMELINE GRID (Existing Logic)
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 40,
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "flex-start",
              }}
            >
              {timeline.map((item, index) => {
                const itemSize = Math.floor((width - 48) / 3);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item)}
                    style={{ width: itemSize }}
                    className="mb-4 items-center"
                    activeOpacity={0.8}
                  >
                    <View className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 w-[95%] items-center">
                      <Image
                        source={{ uri: item.imageUri }}
                        className="w-full aspect-square rounded-xl bg-gray-100 mb-2"
                        resizeMode="cover"
                      />
                      <Text
                        style={{ fontFamily: "Montserrat_700Bold" }}
                        className="text-[#c4a4a4] text-[9px] mb-1"
                        numberOfLines={1}
                      >
                        {item.date}
                      </Text>
                      {item.status !== "START" && (
                        <View
                          className={`h-1 w-6 rounded-full mt-0.5`}
                          style={{
                            backgroundColor:
                              item.status === "IMPROVED"
                                ? "#4CAF50"
                                : item.status === "UNCHANGED"
                                  ? "#FF9800"
                                  : item.status === "NON_COMPARABLE"
                                    ? "#9E9E9E"
                                    : "#FF5252", // WORSENED
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}
