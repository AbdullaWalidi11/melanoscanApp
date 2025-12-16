import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";
import { saveUserProfile } from "../../database/queries";
import { useTranslation } from "react-i18next";
import { useState } from "react"; // Added useState
import CustomAlert, { AlertAction } from "../../components/CustomAlert"; // Added CustomAlert

export default function SurveyPage2() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();
  const { t } = useTranslation();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  const handleChange = (key: keyof typeof surveyData, value: string) => {
    setSurveyData({ ...surveyData, [key]: value });
  };

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

  const handleSubmit = async () => {
    // 1. Validation Logic
    const allAnswers = Object.values(surveyData);
    const isIncomplete = allAnswers.some((answer) => answer.trim() === "");

    if (isIncomplete) {
      setAlertConfig({
        visible: true,
        title: t("survey.alerts.complete_profile_title"),
        message: t("survey.alerts.complete_profile_msg"),
        actions: [{ text: "OK", onPress: hideAlert }],
      });
      return;
    }

    try {
      // 2. ✅ SAVE TO DATABASE
      await saveUserProfile(surveyData);
      console.log("Risk Profile Saved to DB");

      // 3. NAVIGATE TO MAIN APP
      navigation.replace("MainTabs");
    } catch (e) {
      console.error(e);
      setAlertConfig({
        visible: true,
        title: t("auth.login.alerts.error"),
        message: t("survey.alerts.save_error"),
        actions: [{ text: "OK", onPress: hideAlert }],
      });
    }
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFC5C8]">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    // 1. Base Background
    <View className="flex-1 bg-[#ffc0b5] pt-16 relative overflow-hidden">
      {/* === BACKGROUND GEOMETRY START === */}

      {/* Layer 1: Deepest/Furthest Left */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-20 rotate-45 -z-20">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* Layer 2: Middle Layer */}
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-40 rotate-45 -z-10 opacity-60">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* Layer 3: Top Layer (The one we tweaked to be further right) */}
      <View className="absolute inset-0 transform -translate-x-20 -translate-y-32 rotate-45 -z-0 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* === BACKGROUND GEOMETRY END === */}

      {/* Header Text */}
      <View className="px-8 mb-8 z-10">
        <Text
          className="text-center text-lg text-white"
          style={{ fontFamily: "Montserrat_600SemiBold", lineHeight: 28 }}
        >
          {t("survey.header")}
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-[40px] pt-8 overflow-hidden px-5 shadow-xl z-10">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Q11: Personal History */}
          <Dropdown
            label={t("survey.history_personal_label")}
            selectedValue={surveyData.personalHistory}
            onValueChange={(v) => handleChange("personalHistory", v)}
            options={[
              t("survey.options.history_personal.no"),
              t("survey.options.history_personal.melanoma"),
              t("survey.options.history_personal.non_melanoma"),
              t("survey.options.history_personal.unsure"),
            ]}
          />

          {/* Q12: Family History */}
          <Dropdown
            label={t("survey.history_family_label")}
            selectedValue={surveyData.familyHistory}
            onValueChange={(v) => handleChange("familyHistory", v)}
            options={[
              t("survey.options.history_family.no"),
              t("survey.options.history_family.parent_sibling"),
              t("survey.options.history_family.distant"),
              t("survey.options.history_family.unsure"),
            ]}
          />

          {/* Q13: Childhood Burns */}
          <Dropdown
            label={t("survey.sunburns_label")}
            selectedValue={surveyData.childhoodSunburns}
            onValueChange={(v) => handleChange("childhoodSunburns", v)}
            options={[
              t("survey.options.sunburns.no"),
              t("survey.options.sunburns.once_twice"),
              t("survey.options.sunburns.frequently"),
            ]}
          />

          {/* Q14: Tanning Beds */}
          <Dropdown
            label={t("survey.tanning_beds_label")}
            selectedValue={surveyData.tanningBeds}
            onValueChange={(v) => handleChange("tanningBeds", v)}
            options={[
              t("survey.options.tanning_beds.never"),
              t("survey.options.tanning_beds.few_past"),
              t("survey.options.tanning_beds.regularly_past"),
              t("survey.options.tanning_beds.currently"),
            ]}
          />

          {/* Q15: Mole Count */}
          <Dropdown
            label={t("survey.mole_count_label")}
            selectedValue={surveyData.moleCount}
            onValueChange={(v) => handleChange("moleCount", v)}
            options={[
              t("survey.options.mole_count.few"),
              t("survey.options.mole_count.average"),
              t("survey.options.mole_count.many"),
            ]}
          />

          {/* Q16: Ugly Duckling */}
          <Dropdown
            label={t("survey.ugly_duckling_label")}
            selectedValue={surveyData.uglyDuckling}
            onValueChange={(v) => handleChange("uglyDuckling", v)}
            options={[
              t("survey.options.ugly_duckling.no"),
              t("survey.options.ugly_duckling.yes"),
              t("survey.options.ugly_duckling.not_sure"),
            ]}
          />

          {/* Q17: Recent Changes */}
          <Dropdown
            label={t("survey.changes_label")}
            selectedValue={surveyData.recentChanges}
            onValueChange={(v) => handleChange("recentChanges", v)}
            options={[
              t("survey.options.recent_changes.no"),
              t("survey.options.recent_changes.slight"),
              t("survey.options.recent_changes.significant"),
            ]}
          />

          {/* Q18: Sunscreen */}
          <Dropdown
            label={t("survey.sunscreen_label")}
            selectedValue={surveyData.sunscreen}
            onValueChange={(v) => handleChange("sunscreen", v)}
            options={[
              t("survey.options.sunscreen.daily"),
              t("survey.options.sunscreen.sunny_days"),
              t("survey.options.sunscreen.rarely"),
            ]}
          />

          {/* Q19: Protection */}
          <Dropdown
            label={t("survey.protection_label")}
            selectedValue={surveyData.protection}
            onValueChange={(v) => handleChange("protection", v)}
            options={[
              t("survey.options.protection.always"),
              t("survey.options.protection.sometimes"),
              t("survey.options.protection.rarely"),
            ]}
          />

          {/* Q20: Checkups */}
          <Dropdown
            label={t("survey.checkups_label")}
            selectedValue={surveyData.checkups}
            onValueChange={(v) => handleChange("checkups", v)}
            options={[
              t("survey.options.checkups.yearly"),
              t("survey.options.checkups.few_years"),
              t("survey.options.checkups.issue_only"),
              t("survey.options.checkups.never"),
            ]}
          />
        </ScrollView>

        {/* Navigation Buttons - Updated to Match Page 1 */}
        <View className="flex-row justify-end mt-4 mb-8 gap-x-4">
          <Pressable
            onPress={handleSkip}
            className="py-4 px-14 border border-[#fe948d] rounded-xl items-center justify-center"
          >
            <Text
              style={{ fontFamily: "Montserrat_600SemiBold" }}
              className="text-[#fe948d] text-base"
            >
              {t("survey.skip")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            className="py-4 px-12 bg-[#fe948d] rounded-xl items-center justify-center shadow-sm"
          >
            <Text
              style={{ fontFamily: "Montserrat_600SemiBold" }}
              className="text-white text-base"
            >
              {t("survey.submit")}
            </Text>
          </Pressable>
        </View>
      </View>
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
