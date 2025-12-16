import React, { useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../components/CustomAlert";

// Database & Validation
import {
  deleteLesionById,
  getLesionsByRegion,
  getLatestComparisonLog,
} from "../database/queries";
import { validateImageQuality } from "../services/imageValidation";
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  useFonts,
  useFonts as useGoogleFonts, // Alias for safety or useFonts hook directly
} from "@expo-google-fonts/montserrat";
import { LinearGradient } from "expo-linear-gradient";

type Lesion = {
  id: number;
  description?: string;
  date: string;
  createdAt: string;
  imageUri?: string;
  resultLabel?: string;
  confidence?: number;
};

export default function LesionsByRegionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  // Load Fonts (HOOK)
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_400Regular,
  });

  const regionParam = route.params?.region || "";
  const regionString = Array.isArray(regionParam)
    ? regionParam[0]
    : regionParam;

  // Safely cast to string for replacement, assuming proper region string
  const regionKey = regionString.replace(" ", "_");

  const [lesions, setLesions] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLesion, setSelectedLesion] = useState<Lesion | null>(null);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    actions: AlertAction[];
  }>({
    visible: false,
    title: "",
    message: "",
    actions: [],
  });

  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const showCustomAlert = (
    title: string,
    message: string,
    actions: AlertAction[] = [{ text: "OK", onPress: hideAlert }]
  ) => {
    setAlertConfig({ visible: true, title, message, actions });
  };

  // We want to translate the region name.
  // We can match it against our known regions or just display it if unknown.
  // Using the key mapping from components.save_popup.body_parts
  const translatedRegion = t(`components.save_popup.body_parts.${regionKey}`, {
    defaultValue: regionString,
  });

  // Title case for English fallback or just use translation
  const title = translatedRegion; // || regionString.replace(/\b\w/g, (c) => c.toUpperCase());

  const correctRegion = regionString ? regionString.toLowerCase() : "";

  // --- LOAD DATA (HOOK) ---
  const loadLesions = useCallback(async () => {
    if (!correctRegion) return;
    try {
      const data = await getLesionsByRegion(correctRegion);
      setLesions(data as Lesion[]);
    } catch (error) {
      console.error("Error loading lesions:", error);
    }
  }, [correctRegion]);

  // (HOOK)
  useFocusEffect(
    useCallback(() => {
      loadLesions();
    }, [loadLesions])
  );

  // --- DELETE LOGIC (HOOK) ---
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteLesionById(id);
      setLesions((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      showCustomAlert(
        t("history.errors.delete_failed"),
        t("history.errors.delete_failed")
      ); // Using same string for title/msg as simplified
    }
  }, []);

  // --- OPTION A: START NEW COMPARISON ---
  // --- OPTION A: START NEW COMPARISON ---
  const handleStartComparison = async (originalLesion: Lesion) => {
    setAlertConfig({
      visible: true,
      title: t("history.start_comparison"),
      message: t("history.start_compare_msg"),
      actions: [
        {
          text: t("history.camera"),
          onPress: () => {
            hideAlert();
            pickImageForComparison(originalLesion, true);
          },
        },
        {
          text: t("history.gallery"),
          onPress: () => {
            hideAlert();
            pickImageForComparison(originalLesion, false);
          },
        },
      ],
    });
  };

  // --- OPTION B: VIEW PAST LOGS ---
  const handleViewLogs = (originalLesion: Lesion) => {
    navigation.navigate("ComparisonHistory", {
      parentLesionId: originalLesion.id,
      imageUri: originalLesion.imageUri,
      description: originalLesion.description, // Pass description for title
    });
  };

  // --- IMAGE PICKER HELPER ---
  const pickImageForComparison = async (
    originalLesion: Lesion,
    fromCamera: boolean
  ) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return alert(t("history.errors.camera_perm"));
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted")
          return alert(t("history.errors.gallery_perm"));
      }

      setLoading(true);
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: fromCamera,
        aspect: [1, 1],
        quality: 1,
      };

      let result;
      if (fromCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const newImageUri = result.assets[0].uri;

      // VALIDATE IMAGE QUALITY
      const qualityCheck = await validateImageQuality(newImageUri);
      if (!qualityCheck.isValid) {
        setLoading(false);
        showCustomAlert(
          t("history.errors.poor_quality"),
          qualityCheck.error || ""
        );
        return;
      }

      setLoading(false);

      // --- FETCH LATEST SNAPSHOT ---
      // Check if there's a more recent comparison image to use as the baseline
      let baselineImageUri = originalLesion.imageUri;
      try {
        const latestLog = await getLatestComparisonLog(originalLesion.id);
        if (latestLog && latestLog.newImageUri) {
          console.log(
            "Using latest comparison image as baseline:",
            latestLog.newImageUri
          );
          baselineImageUri = latestLog.newImageUri;
        }
      } catch (e) {
        console.warn("Failed to fetch latest log, using original image:", e);
      }

      // NAVIGATE TO PROCESSING
      navigation.navigate("CompareProcessing", {
        oldLesionId: originalLesion.id,
        oldImageUri: baselineImageUri, // Use the latest available image!
        newImageUri: newImageUri,
        region: title,
      });
    } catch (error) {
      console.error("Comparison Error:", error);
      setLoading(false);
      showCustomAlert(
        t("auth.login.alerts.error"),
        t("history.errors.capture_error")
      );
    }
  };

  // --- CUSTOM POPUP MODAL ---
  const renderOptionsModal = () => {
    return (
      <Modal
        visible={!!selectedLesion}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedLesion(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedLesion(null)}>
          <View className="flex-1 bg-black/30 justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-xl w-[250px] overflow-hidden shadow-lg border border-gray-200">
                {/* 1. Scan and Compare */}
                <TouchableOpacity
                  className="p-4 items-center justify-center border-b border-gray-100"
                  onPress={() => {
                    if (selectedLesion) {
                      handleStartComparison(selectedLesion);
                      setSelectedLesion(null);
                    }
                  }}
                >
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-[#8B5E3C] text-base"
                  >
                    {t("history.scan_compare")}
                  </Text>
                </TouchableOpacity>

                {/* 2. View Logs */}
                <TouchableOpacity
                  className="p-4 items-center justify-center border-b border-gray-100"
                  onPress={() => {
                    if (selectedLesion) {
                      handleViewLogs(selectedLesion);
                      setSelectedLesion(null);
                    }
                  }}
                >
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-[#8B5E3C] text-base"
                  >
                    {t("history.comparison_history")}
                  </Text>
                </TouchableOpacity>

                {/* 3. Delete */}
                <TouchableOpacity
                  className="p-4 items-center justify-center"
                  onPress={() => {
                    if (selectedLesion) {
                      setAlertConfig({
                        visible: true,
                        title: t("history.delete_lesion"),
                        message: t("history.delete_confirm"),
                        actions: [
                          {
                            text: t("history.cancel"),
                            style: "cancel",
                            onPress: hideAlert,
                          },
                          {
                            text: t("history.delete"),
                            style: "destructive",
                            onPress: () => {
                              handleDelete(selectedLesion.id);
                              setSelectedLesion(null);
                              hideAlert();
                            },
                          },
                        ],
                      });
                    }
                  }}
                >
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-red-500 text-base"
                  >
                    {t("history.delete")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Conditional Return AFTER all hooks
  if (!regionString || !fontsLoaded) return null;

  return (
    // 1. Base Background with Pink/Coral Color
    <View className="flex-1 bg-[#ffc0b5] relative overflow-hidden">
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
      {renderOptionsModal()}
      {/* === TOP HEADER (Back Button) === */}
      <View className="absolute top-12 left-6 z-50">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* === BACKGROUND GEOMETRY (Replicated from SurveyPage) === */}
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
      {/* 'mt-24' pushes it down to reveal background, 'rounded-t-[40px]' gives the sheet look */}
      <View className="flex-1 bg-white mt-28 rounded-t-[40px] overflow-hidden shadow-2xl">
        {/* Header inside the sheet */}
        <View className="pt-8 px-6 pb-2 items-center">
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-[#7b3f3f] text-2xl"
          >
            {title} {t("history.lesions")}
          </Text>
        </View>

        {loading && (
          <View className="absolute z-50 w-full h-full justify-center items-center bg-transparent">
            <ActivityIndicator size="large" color="#fe8d93" />
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {lesions.length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-lg">
                {t("history.no_scans")}
              </Text>
              <Text className="text-gray-400 text-xs text-center px-10 mt-2">
                {t("history.tap_to_add")}
              </Text>
            </View>
          )}

          {lesions.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate("LesionDetails", { lesionId: item.id })
              }
              className="bg-white rounded-2xl border border-[#5c3b3b] p-3 flex-row items-center mb-4 shadow-sm"
              style={{ elevation: 2 }}
            >
              {/* THUMBNAIL (Rounded Square) */}
              <Image
                source={
                  item.imageUri
                    ? { uri: item.imageUri }
                    : require("../../assets/images/icon.png")
                }
                className="w-20 h-20 rounded-2xl bg-gray-100"
                resizeMode="cover"
              />

              {/* INFO */}
              <View className="flex-1 ml-4 justify-center h-20">
                {/* 1. TOP: Description (Dark Brownish) */}
                <Text
                  className="text-[#7b3f3f] text-base mb-1"
                  style={{ fontFamily: "Montserrat_600SemiBold" }}
                  numberOfLines={1}
                >
                  {item.description
                    ? item.description
                    : `${title} ${t("history.scan_suffix")}`}
                </Text>

                {/* 2. MIDDLE: Date (Lighter) */}
                <Text
                  className="text-[#af9c9c] text-sm font-medium"
                  style={{ fontFamily: "Montserrat_600SemiBold" }} // Using semi-bold but lighter color
                >
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              {/* THREE DOTS MENU */}
              <TouchableOpacity
                className="p-2 self-start mt-1 h-full justify-start" // Centered vertically in its area
                onPress={() => setSelectedLesion(item)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#5a3e3e" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
