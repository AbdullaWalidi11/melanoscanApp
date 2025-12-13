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

const { width } = Dimensions.get("window");

export default function ComparisonHistory() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { parentLesionId, imageUri, description } = route.params;

  const [logs, setLogs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Load logs
  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const data = await getComparisonLogs(parentLesionId);
          setLogs(data);

          // Construct Timeline: [Baseline Item, ...Log Items]
          // Baseline Item (The original lesion)
          const baselineItem = {
            type: "BASELINE",
            id: "baseline",
            date: "Original", // You might want to pass the real creation date if available
            imageUri: imageUri,
            status: "START",
          };

          // Logs (Each log represents a new snapshot in time)
          // We use the `newImageUri` of the log as the snapshot image for that point in time
          const historyItems = data.map((log: any) => ({
            type: "LOG",
            id: log.id,
            date: log.date,
            imageUri: log.newImageUri, // This snapshot
            status: log.status,
            logData: log, // Keep full log data to pass to details
          }));

          setTimeline([baselineItem, ...historyItems]);
        } catch (e) {
          console.error(e);
        }
      }
      load();
    }, [parentLesionId, imageUri])
  );

  if (!fontsLoaded) return <View className="flex-1 bg-white" />;

  const handleItemPress = (item: any) => {
    if (item.type === "BASELINE") {
      // Maybe show a simple large view or just do nothing for now?
      // For now, let's just ignore or show an alert
      // alert("This is the original baseline scan.");
    } else {
      // Navigate to Detail View for this specific comparison log
      navigation.navigate("LogDetailScreen", { log: item.logData });
    }
  };

  return (
    // 1. Base Background with Pink/Coral Color
    <View className="flex-1 bg-[#FFC5C8] relative overflow-hidden">
      {/* === TOP HEADER (Back Button) === */}
      <View className="absolute top-12 left-6 z-50">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* === BACKGROUND GEOMETRY (Replicated from LesionsByRegion) === */}
      {/* 3. Third Geometric Shape (Far Left Layer) */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      {/* 2. The Geometric Gradient Background Effect */}
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#ff9da1", "#ff9da1", "#fe8d93"]}
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
            {description || "Lesion History"}
          </Text>
        </View>

        {/* GRID TIMELINE SCROLL */}
        <View className="flex-1 mt-4">
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
              // Calculate 3 items per row
              // Math.floor is essential to avoid sub-pixel rounding causing the 3rd item to wrap
              const itemSize = Math.floor((width - 48) / 3);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={{ width: itemSize }}
                  className="mb-4 items-center"
                  activeOpacity={0.8}
                >
                  {/* Card Container - Adjusted size to fit */}
                  <View className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 w-[95%] items-center">
                    {/* Image */}
                    <Image
                      source={{ uri: item.imageUri }}
                      className="w-full aspect-square rounded-xl bg-gray-100 mb-2"
                      resizeMode="cover"
                    />

                    {/* Date */}
                    <Text
                      style={{ fontFamily: "Montserrat_700Bold" }}
                      className="text-[#c4a4a4] text-[9px] mb-1"
                      numberOfLines={1}
                    >
                      {item.date}
                    </Text>

                    {/* Status Dot */}
                    {item.status !== "START" && (
                      <View
                        className={`h-1 w-6 rounded-full mt-0.5 ${
                          item.status === "STABLE"
                            ? "bg-green-300"
                            : "bg-red-300"
                        }`}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
