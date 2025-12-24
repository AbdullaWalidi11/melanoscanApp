import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { saveComparisonLog } from "../../database/queries";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

export default function CompareResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { result, oldLesionId, oldImageUri, newImageUri } = route.params;
  const { t } = useTranslation();

  const [saving, setSaving] = useState(false);
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

  // Logic: Is it good news or bad news?
  // New Statuses: "UNCHANGED", "IMPROVED", "WORSENED"
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "IMPROVED":
        return {
          color: "#4CAF50", // Green
          bgColor: "#F0FFF4",
          icon: "checkmark-circle" as const,
          label: t("compare_result.improved") || "Improved",
        };
      case "UNCHANGED":
        return {
          color: "#FF9800", // Orange
          bgColor: "#FFF8E1",
          icon: "remove-circle" as const,
          label: t("compare_result.no_change") || "No Change",
        };
      case "NON_COMPARABLE":
        return {
          color: "#9E9E9E", // Grey
          bgColor: "#F5F5F5",
          icon: "help-circle" as const,
          label: t("compare_result.non_comparable") || "Not Comparable",
        };
      case "WORSENED":
      default:
        return {
          color: "#FF5252", // Red
          bgColor: "#FFF0F0",
          icon: "alert-circle" as const,
          label: t("compare_result.changes_detected") || "Worsened",
        };
    }
  };

  const { color, bgColor, icon, label } = getStatusConfig(result.status);

  const handleAddToHistory = async () => {
    try {
      setSaving(true);
      await saveComparisonLog({
        parentLesionId: oldLesionId,
        oldImageUri,
        newImageUri,
        status: result.status,
        score: result.score,
        reasoning: result.reasoning,
        advice: result.advice,
      });

      setAlertConfig({
        visible: true,
        title: t("compare_result.saved_title"),
        message: t("compare_result.saved_body"),
        actions: [
          {
            text: "OK",
            onPress: () => {
              hideAlert();
              // Navigate only after user acknowledges
              navigation.replace("ComparisonHistory", {
                parentLesionId: oldLesionId,
                imageUri: oldImageUri,
              });
            },
          },
        ],
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: t("compare_result.error_title"),
        message: t("compare_result.error_body"),
        actions: [{ text: "OK", onPress: hideAlert }],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. HEADER / CLOSE BUTTON */}
      <View className="flex-row justify-end p-4 mt-8">
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="close" size={28} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 2. THE CARD (Frame 28 Design) */}
      <View className="items-center px-6">
        {/* Status Box */}
        <View
          className="w-full rounded-3xl items-center p-6 border-2"
          style={{
            borderColor: color,
            backgroundColor: bgColor,
          }}
        >
          {/* Color Block (The Square in your Figma) */}
          {/* Image from Comparison */}
          <Image
            source={{ uri: newImageUri }}
            className="w-32 h-32 rounded-2xl mb-4 shadow-sm"
            resizeMode="cover"
          />

          <Text className="text-xl font-bold mb-1" style={{ color: color }}>
            {label}
          </Text>
          <Ionicons name={icon} size={32} color={color} />
        </View>

        {/* 3. AI EXPLANATION */}
        <View className="mt-8 bg-gray-50 p-6 rounded-2xl w-full">
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 bg-orange-100 rounded-full justify-center items-center mr-3">
              <Text className="font-bold text-orange-800 text-lg">A</Text>
            </View>
            <Text className="font-bold text-gray-800 text-lg">
              {t("compare_result.ai_analysis")}
            </Text>
          </View>

          <Text className="text-gray-600 leading-6 text-base">
            {result.reasoning}
          </Text>

          <Text className="text-gray-500 text-sm mt-4 italic">
            {t("compare_result.advice_label")} {result.advice}
          </Text>
        </View>
      </View>

      {/* 4. ACTION BUTTON */}
      {result.status !== "NON_COMPARABLE" && (
        <View className="px-6 mt-10">
          <TouchableOpacity
            onPress={handleAddToHistory}
            disabled={saving}
            className="w-full bg-[#fe948d] py-4 rounded-full items-center shadow-md active:bg-[#ff7b8a]"
          >
            <Text className="text-white font-bold text-lg">
              {saving
                ? t("compare_result.saving")
                : t("compare_result.add_to_history")}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs text-center mt-6 px-4">
            {t("comparison_processing.footer_disclaimer")}
          </Text>
        </View>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
    </ScrollView>
  );
}
