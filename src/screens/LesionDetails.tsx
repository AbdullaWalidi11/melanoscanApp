import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Trash2, Info } from "lucide-react-native";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../components/CustomAlert";

// Database
import {
  deleteLesionById,
  updateLesion,
  countTotalScans,
} from "../database/queries";
import { getDB } from "../database/db";
import SaveToHistoryPopup from "../components/SaveToHistoryPopUp";
import { scheduleRescanReminder } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

export default function LesionDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lesionId } = route.params || {};
  const { user } = useAuth();
  const { t } = useTranslation();

  const [lesion, setLesion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSavePopup, setShowSavePopup] = useState(false);

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

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  // 1. Fetch Data from SQLite
  useEffect(() => {
    async function fetchLesion() {
      const db = getDB();
      try {
        const result = await db.getFirstAsync(
          `SELECT * FROM lesions WHERE id = ?`,
          [lesionId]
        );
        setLesion(result);
      } catch (e) {
        console.error("Error fetching lesion details:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLesion();
  }, [lesionId]);

  // 2. Handle Delete
  const handleDelete = () => {
    showCustomAlert(
      t("lesion_details.delete_title"),
      t("lesion_details.delete_confirm"),
      [
        {
          text: t("analysis_result.cancel"),
          style: "cancel",
          onPress: hideAlert,
        },
        {
          text: t("lesion_details.delete"),
          style: "destructive",
          onPress: async () => {
            hideAlert();
            await deleteLesionById(lesionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // 3. Handle Chat
  const handleChat = () => {
    navigation.navigate("ChatScreen", {
      lesionId: lesion.id,
    });
  };

  if (!fontsLoaded || loading)
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#fe8d93" />
      </View>
    );

  if (!lesion)
    return (
      <View className="flex-1 bg-white pt-20 items-center">
        <Text>Scan not found.</Text>
      </View>
    );

  // Logic for UI
  const isMalignant = lesion.resultLabel === "Malignant";
  const isSuspicious = lesion.resultLabel === "Suspicious";
  // Default to Benign if not Malignant/Suspicious
  const isBenign = !isMalignant && !isSuspicious;

  return (
    <View className="flex-1 bg-white pt-12">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* 1. Header Nav */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center"
          >
            <ChevronLeft color="black" size={28} />
            <Text
              style={{ fontFamily: "Montserrat_700Bold" }}
              className="text-xl ml-1"
            >
              {t("analysis_result.back")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Trash2 color="#FF8080" size={24} />
          </TouchableOpacity>
        </View>

        {/* 2. Title / Description */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-2xl text-[#5a3e3e] text-center mb-1"
        >
          {lesion.description || t("lesion_details.default_title")}
        </Text>
        <Text className="text-gray-400 text-xs text-center mb-6">
          {t("lesion_details.scanned_on", {
            date: new Date(lesion.createdAt).toLocaleDateString(),
          })}
        </Text>

        {/* 3. Image with Dynamic Border */}
        <View
          className={`self-center p-1 rounded-xl border-4 mb-6 ${
            isMalignant
              ? "border-red-500"
              : isSuspicious
                ? "border-orange-400"
                : "border-[#32CD32]"
          }`}
        >
          <Image
            source={{ uri: lesion.imageUri }}
            className="w-48 h-48 rounded-lg"
            resizeMode="cover"
          />
        </View>

        {/* 4. Risk Banner */}
        <View
          className={`p-4 rounded-xl mb-6 ${
            isMalignant ? "bg-red-100" : "bg-[#D6F5D6]"
          }`}
        >
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-black text-sm mb-1"
          >
            {isMalignant
              ? t("analysis_result.high_risk")
              : t("analysis_result.low_risk")}
            <Text
              style={{ fontFamily: "Montserrat_400Regular" }}
              className="font-normal"
            >
              {isMalignant
                ? t("analysis_result.high_risk_desc")
                : t("analysis_result.low_risk_desc")}
            </Text>
          </Text>
        </View>

        {/* 5. Text Details */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-md mb-2"
        >
          {t("analysis_result.result")}{" "}
          <Text className="text-[#fe948d] font-light">
            {(lesion.confidence * 100).toFixed(0)}%{" "}
            {t(
              `analysis_result.${(lesion.resultLabel || "unknown").toLowerCase()}`,
              { defaultValue: lesion.resultLabel }
            )}{" "}
            {t("analysis_result.lesions")}
          </Text>
        </Text>

        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-md mb-2"
        >
          {t("analysis_result.diagnosis")}{" "}
          <Text className="font-light">
            {lesion.diagnosis || "Not specified"}
          </Text>
        </Text>

        {lesion.region && (
          <Text
            style={{ fontFamily: "Montserrat_700Bold" }}
            className="text-md mb-2"
          >
            {t("lesion_details.location")}{" "}
            <Text className="font-light capitalize">
              {lesion.region === "Unspecified"
                ? t("analysis_result.unspecified")
                : lesion.region}
            </Text>
          </Text>
        )}

        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-base mb-6"
        >
          {t("analysis_result.advice")}{" "}
          <Text className="font-light">{t("analysis_result.advice_desc")}</Text>
        </Text>

        {/* ✅ NEW: Conditional Save Button for Unspecified Regions */}
        {lesion.region === "Unspecified" && (
          <View className="items-center mb-6 mt-6">
            <TouchableOpacity
              onPress={() => setShowSavePopup(true)}
              className="bg-[#fe948d] px-14 py-4 rounded-full shadow-sm"
            >
              <Text
                style={{ fontFamily: "Montserrat_600SemiBold" }}
                className="text-white text-md"
              >
                {t("analysis_result.save_history")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. "You can also" / AI Section */}
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-lg mb-3 mt-4"
        >
          {t("analysis_result.you_can_also")}
        </Text>

        <View className="flex-row items-center justify-between mb-8">
          {/* Yellow Box (Informational) */}
          <View className="bg-[#F9EAB8] p-4 py-6 rounded-xl flex-1 mr-4">
            <View className="flex-row items-start">
              <Info color="#333" size={20} className="mt-1 mr-2" />
              <Text
                style={{ fontFamily: "Montserrat_400Regular" }}
                className="text-sm text-[#5A4E38] flex-1"
              >
                {t("analysis_result.ai_insight")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Disclaimer */}
        <Text className="text-gray-400 text-[10px] text-center mb-10 px-4">
          {t("analysis_result.footer_disclaimer")}
        </Text>
      </ScrollView>

      {/* ✅ FLOATING ROBOT BUTTON (Absolute Bottom Right) */}
      <TouchableOpacity
        onPress={handleChat}
        className="absolute bottom-8 right-8 w-24 h-24 bg-[#fe948d] rounded-full items-center justify-center overflow-hidden border-2 border-[#fe948d] shadow-md shadow-[#000] z-50 elevation-10"
        activeOpacity={0.8}
      >
        <Image
          source={require("../../assets/images/chatbot.png")}
          className="w-full h-full"
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* ✅ SAVE POPUP for UPGRADING 'Unspecified' -> 'Region' */}
      <SaveToHistoryPopup
        visible={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        onSave={async (data: any) => {
          try {
            await updateLesion(lesion.id, data.region, data.description);

            // Update Local State to reflect changes immediately
            setLesion((prev: any) => ({
              ...prev,
              region: data.region,
              description: data.description,
            }));

            // Notifications logic (optional but good to keep consistent)
            const isHighRisk = lesion.resultLabel === "Malignant";
            const daysLater = isHighRisk ? 7 : 30;
            await scheduleRescanReminder(data.region, daysLater);

            if (user?.isAnonymous) {
              const totalScans = await countTotalScans();
              if (totalScans > 0 && totalScans % 3 === 0) {
                // ... logic
              }
            }

            setShowSavePopup(false);
            showCustomAlert(
              t("lesion_details.save_saved_title"),
              t("lesion_details.save_saved_body")
            );
          } catch (err: any) {
            showCustomAlert(
              t("analysis_result.error_title"),
              "Failed to update lesion details."
            );
          }
        }}
      />

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
