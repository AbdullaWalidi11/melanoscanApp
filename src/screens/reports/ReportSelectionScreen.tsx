import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAllLesions } from "../../database/queries";
import ReportDisclaimerModal from "../../components/ReportDisclaimerModal";
import {
  generateAndShareReport,
  ReportLesion,
} from "../../services/pdfService";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";

export default function ReportSelectionScreen() {
  const navigation = useNavigation<any>();
  const [lesions, setLesions] = useState<ReportLesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesion, setSelectedLesion] = useState<ReportLesion | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const { t, i18n } = useTranslation();

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllLesions();
      const filtered = data.filter(
        (item: any) => item.region && item.region !== "Unspecified"
      );
      setLesions(filtered as ReportLesion[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: ReportLesion) => {
    setSelectedLesion(item);
    setModalVisible(true);
  };

  const handleGenerate = async () => {
    if (!selectedLesion) return;
    setModalVisible(false); // Close modal first
    await generateAndShareReport(selectedLesion);
  };

  if (!fontsLoaded) return <View />;

  // Helper to translate regions/body parts
  const getTranslatedRegion = (region: string) => {
    // Check if the region key exists in components.save_popup.body_parts
    // The keys are usually lowercase and snake_case in the json.
    // However, the stored region might be "Face", "Right Arm" etc. (Title Case).
    // Let's try to map typical values to keys.
    const keyMap: { [key: string]: string } = {
      Face: "face",
      Body: "body",
      "Right Arm": "right_arm",
      "Left Arm": "left_arm",
      "Right Leg": "right_leg",
      "Left Leg": "left_leg",
    };

    const key = keyMap[region] || region.toLowerCase().replace(" ", "_");
    // Try to get translation
    const translation = t(`components.save_popup.body_parts.${key}`);
    // If translation key is returned (meaning missing), fallback to original region
    return translation.includes("components.save_popup.body_parts")
      ? region
      : translation;
  };

  return (
    <View className="flex-1 bg-[#ffc0b5] relative overflow-hidden">
      {/* === BACKGROUND GEOMETRY (Replicated from SurveyPage/ScanUpload) === */}
      {/* 3. Third Geometric Shape (Far Left Layer) */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      {/* 2. The Geometric Gradient Background Effect */}
      <View className="absolute inset-0 transform -translate-x-[420px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      <ReportDisclaimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleGenerate}
      />

      {/* Header */}
      <View className="pt-10 px-6 pb-6 flex-row items-center mt-8">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-white text-2xl"
        >
          {t("report_selection.title")}
        </Text>
      </View>

      {/* Content Sheet */}
      <View className="flex-1 bg-white rounded-t-[40px] overflow-hidden shadow-xl ">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#fe948d" size="large" />
          </View>
        ) : lesions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400">
              {t("report_selection.no_scans")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={lesions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center"
                onPress={() => handleSelect(item)}
              >
                <Image
                  source={{ uri: item.imageUri }}
                  className="w-16 h-16 rounded-xl bg-gray-200"
                />
                <View className="ml-4 flex-1">
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-[#5a3e3e] text-lg capitalize"
                  >
                    {getTranslatedRegion(item.region)}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(item.date).toLocaleDateString(
                      i18n.language === "tr" ? "tr-TR" : "en-US"
                    )}
                  </Text>
                  <Text
                    className={`text-xs mt-1 font-bold ${item.resultLabel === "Malignant" ? "text-red-500" : "text-green-600"}`}
                  >
                    {/* Translate the result label dynamically if possible, or fallback to English text */}
                    {t(`analysis_result.${item.resultLabel.toLowerCase()}`) ||
                      item.resultLabel}
                  </Text>
                </View>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#fe948d"
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
