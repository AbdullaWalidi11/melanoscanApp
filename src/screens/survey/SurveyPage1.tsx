import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

export default function SurveyPage1() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();
  const { t } = useTranslation();

  // Load fonts for consistent styling with the landing page
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

  const handleNext = () => {
    // Basic validation to ensure at least some data is entered
    if (!surveyData.age || !surveyData.gender || !surveyData.skinTone) {
      setAlertConfig({
        visible: true,
        title: t("survey.alerts.missing_info_title"),
        message: t("survey.alerts.missing_info_msg"),
        actions: [{ text: "OK", onPress: hideAlert }],
      });
      return;
    }
    navigation.navigate("SurveyPage2");
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    // 1. Updated Base Background Color to match landing page
    <View className="flex-1 bg-[#ffc0b5] pt-10 relative overflow-hidden">
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
      {/* 2. The Geometric Gradient Background Effect (Replicated from Landing Page) */}
      {/* This places a large rotated gradient square in the background */}
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* Header Text */}
      <View className="px-8 mb-8">
        {/* Added Montserrat font family for consistency */}
        <Text
          className="text-center text-lg text-white"
          style={{ fontFamily: "Montserrat_600SemiBold", lineHeight: 28 }}
        >
          {t("survey.header")}
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-[40px] pt-8 overflow-hidden px-5 shadow-xl">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Q1: Age */}
          <Dropdown
            label={t("survey.age_label")}
            selectedValue={surveyData.age}
            onValueChange={(v) => handleChange("age", v)}
            options={[
              t("survey.options.age.under_18"),
              t("survey.options.age.18_24"),
              t("survey.options.age.25_34"),
              t("survey.options.age.35_44"),
              t("survey.options.age.45_54"),
              t("survey.options.age.55_64"),
              t("survey.options.age.65_plus"),
            ]}
          />

          {/* Q2: Gender */}
          <Dropdown
            label={t("survey.gender_label")}
            selectedValue={surveyData.gender}
            onValueChange={(v) => handleChange("gender", v)}
            options={[
              t("survey.options.gender.male"),
              t("survey.options.gender.female"),
            ]}
          />

          {/* Q3: Hair Color */}
          <Dropdown
            label={t("survey.hair_label")}
            selectedValue={surveyData.hairColor}
            onValueChange={(v) => handleChange("hairColor", v)}
            options={[
              t("survey.options.hair_color.red_auburn"),
              t("survey.options.hair_color.blonde"),
              t("survey.options.hair_color.brown"),
              t("survey.options.hair_color.black"),
            ]}
          />

          {/* Q4: Eye Color */}
          <Dropdown
            label={t("survey.eye_label")}
            selectedValue={surveyData.eyeColor}
            onValueChange={(v) => handleChange("eyeColor", v)}
            options={[
              t("survey.options.eye_color.blue_grey"),
              t("survey.options.eye_color.green_hazel"),
              t("survey.options.eye_color.light_brown"),
              t("survey.options.eye_color.dark_brown"),
            ]}
          />

          {/* Q5: Skin Tone */}
          <Dropdown
            label={t("survey.skin_label")}
            selectedValue={surveyData.skinTone}
            onValueChange={(v) => handleChange("skinTone", v)}
            options={[
              t("survey.options.skin_tone.type_1"),
              t("survey.options.skin_tone.type_2"),
              t("survey.options.skin_tone.type_3"),
              t("survey.options.skin_tone.type_4"),
              t("survey.options.skin_tone.type_5"),
              t("survey.options.skin_tone.type_6"),
            ]}
          />

          {/* Q6: Sun Reaction */}
          <Dropdown
            label={t("survey.sun_reaction_label")}
            selectedValue={surveyData.sunReaction}
            onValueChange={(v) => handleChange("sunReaction", v)}
            options={[
              t("survey.options.sun_reaction.blister_burn"),
              t("survey.options.sun_reaction.mild_burn"),
              t("survey.options.sun_reaction.burn_tan"),
              t("survey.options.sun_reaction.tan_immediately"),
              t("survey.options.sun_reaction.nothing"),
            ]}
          />

          {/* Q7: Freckles */}
          <Dropdown
            label={t("survey.freckles_label")}
            selectedValue={surveyData.freckling}
            onValueChange={(v) => handleChange("freckling", v)}
            options={[
              t("survey.options.freckles.none"),
              t("survey.options.freckles.few"),
              t("survey.options.freckles.many"),
            ]}
          />

          {/* Q8: Work Environment */}
          <Dropdown
            label={t("survey.work_label")}
            selectedValue={surveyData.workEnvironment}
            onValueChange={(v) => handleChange("workEnvironment", v)}
            options={[
              t("survey.options.work_env.indoors"),
              t("survey.options.work_env.mixed"),
              t("survey.options.work_env.outdoors"),
            ]}
          />

          {/* Q9: Climate */}
          <Dropdown
            label={t("survey.climate_label")}
            selectedValue={surveyData.climate}
            onValueChange={(v) => handleChange("climate", v)}
            options={[
              t("survey.options.climate.cloudy"),
              t("survey.options.climate.moderate"),
              t("survey.options.climate.sunny"),
            ]}
          />

          {/* Q10: Ancestry */}
          <Dropdown
            label={t("survey.ancestry_label")}
            selectedValue={surveyData.ancestry}
            onValueChange={(v) => handleChange("ancestry", v)}
            options={[
              t("survey.options.ancestry.yes"),
              t("survey.options.ancestry.no"),
              t("survey.options.ancestry.unsure"),
            ]}
          />
        </ScrollView>

        {/* Navigation Buttons - Updated colors and fonts */}
        <View className="flex-row justify-end mt-4 mb-8 gap-x-4">
          <Pressable
            onPress={handleSkip}
            // Updated border color to #FF8080
            className="py-4 px-14 border border-[#fe948d] rounded-xl items-center justify-center"
          >
            {/* Updated text color and font */}
            <Text
              style={{ fontFamily: "Montserrat_600SemiBold" }}
              className="text-[#fe948d] text-base"
            >
              {t("survey.skip")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            // Updated bg color to #FF8080
            className="py-4 px-14 bg-[#fe948d] rounded-xl items-center justify-center shadow-sm"
          >
            {/* Updated font */}
            <Text
              style={{ fontFamily: "Montserrat_600SemiBold" }}
              className="text-white text-base"
            >
              {t("survey.next")}
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
