import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";
import { deleteComparisonLog } from "../../database/queries";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

export default function LogDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { log } = route.params; // The specific comparison log object
  const { t } = useTranslation();

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

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

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const showCustomAlert = (
    title: string,
    message: string,
    actions: AlertAction[] = [{ text: "OK", onPress: hideAlert }]
  ) => {
    setAlertConfig({ visible: true, title, message, actions });
  };

  if (!fontsLoaded) return <View className="flex-1 bg-white" />;

  // Determine styles based on status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "IMPROVED":
        return {
          color: "text-green-700",
          bgColor: "bg-green-100",
          borderColor: "border-green-100",
        };
      case "UNCHANGED":
        return {
          color: "text-orange-700",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-100",
        };
      case "NON_COMPARABLE":
        return {
          color: "text-gray-700",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-100",
        };
      case "WORSENED":
      default:
        return {
          color: "text-red-700",
          bgColor: "bg-red-100",
          borderColor: "border-red-100",
        };
    }
  };

  const { color, bgColor, borderColor } = getStatusConfig(log.status);

  const handleDelete = () => {
    showCustomAlert(t("history.delete_lesion"), t("history.delete_confirm"), [
      { text: t("history.cancel"), style: "cancel", onPress: hideAlert },
      {
        text: t("history.delete"),
        style: "destructive",
        onPress: async () => {
          hideAlert();
          try {
            await deleteComparisonLog(log.id);
            navigation.goBack();
          } catch (error) {
            console.error("Failed to delete log", error);
            showCustomAlert(
              t("compare_result.error_title"),
              t("compare_result.error_body")
            );
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* HEADER */}
      <View className="px-4 flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-xl text-[#5a3e3e]"
          >
            {t("log_detail.title")}
          </Text>
        </View>

        <TouchableOpacity onPress={handleDelete} className="p-2">
          <Ionicons name="trash-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <ScrollView className="px-6">
        <View className="w-full bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
          {/* Header Row: Date & Status */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              style={{ fontFamily: "Montserrat_400Regular" }}
              className="text-gray-500"
            >
              {log.date}
            </Text>
            <View className={`px-3 py-1 rounded-full ${bgColor}`}>
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className={`${color} text-xs`}
              >
                {t(`compare_result.${log.status.toLowerCase()}`) || log.status}
              </Text>
            </View>
          </View>

          {/* Score Circle (If score exists) */}
          {log.score !== undefined && (
            <View className="items-center mb-6">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center border-4 ${borderColor}`}
              >
                <Text
                  style={{ fontFamily: "Montserrat_700Bold" }}
                  className="text-2xl text-[#5a3e3e]"
                >
                  {Math.round(log.score)}%
                </Text>
                <Text
                  style={{ fontFamily: "Montserrat_400Regular" }}
                  className="text-[10px] text-gray-400"
                >
                  {t("log_detail.change")}
                </Text>
              </View>
            </View>
          )}

          {/* Images Comparison */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="items-center flex-1">
              <Image
                source={{ uri: log.oldImageUri }}
                className="w-28 h-28 rounded-xl bg-gray-100 mb-2 border border-gray-200"
              />
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-gray-500 text-xs"
              >
                {t("log_detail.previous")}
              </Text>
            </View>

            <Ionicons name="arrow-forward-circle" size={32} color="#fe8d93" />

            <View className="items-center flex-1">
              <Image
                source={{ uri: log.newImageUri }}
                className="w-28 h-28 rounded-xl bg-gray-100 mb-2 border border-gray-200"
              />
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-gray-500 text-xs"
              >
                {t("log_detail.this_scan")}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 w-full mb-4" />

          {/* Reasoning */}
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-[#5a3e3e] mb-2"
          >
            {t("log_detail.analysis")}
          </Text>
          <Text
            style={{ fontFamily: "Montserrat_400Regular" }}
            className="text-gray-600 leading-6 mb-6"
          >
            {log.reasoning}
          </Text>

          {/* Advice */}
          <Text
            style={{ fontFamily: "Montserrat_600SemiBold" }}
            className="text-[#5a3e3e] mb-2"
          >
            {t("log_detail.recommendation")}
          </Text>
          <Text
            style={{ fontFamily: "Montserrat_400Regular" }}
            className="text-gray-600 leading-6"
          >
            {log.advice}
          </Text>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        onClose={hideAlert}
      />
    </View>
  );
}
