import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";

export default function SurveyPage1() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();

  const handleChange = (key: keyof typeof surveyData, value: string) => {
    setSurveyData({ ...surveyData, [key]: value });
  };

  const handleNext = () => {
    // Basic validation to ensure at least some data is entered
    if (!surveyData.age || !surveyData.gender || !surveyData.skinTone) {
      Alert.alert('Missing Info', 'Please answer the basic questions to proceed.');
      return;
    }
    navigation.navigate("SurveyPage2");
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  return (
    <View className="flex-1 bg-[#e2728f] pt-16">
      
      {/* Header Text */}
      <View className="px-8 mb-8">
        <Text className="text-center text-base text-white font-bold">
          Answering this survey will allow us to personalize your experience with our AI assistant.
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-3xl pt-8 overflow-hidden px-5">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Q1: Age */}
          <Dropdown
            label="What is your age group?"
            selectedValue={surveyData.age}
            onValueChange={(v) => handleChange("age", v)}
            options={["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]}
          />

          {/* Q2: Gender */}
          <Dropdown
            label="What is your gender?"
            selectedValue={surveyData.gender}
            onValueChange={(v) => handleChange("gender", v)}
            options={["Male", "Female", "Other"]}
          />

          {/* Q3: Hair Color */}
          <Dropdown
            label="Natural Hair Color (at age 20)"
            selectedValue={surveyData.hairColor}
            onValueChange={(v) => handleChange("hairColor", v)}
            options={["Red / Auburn", "Blonde", "Light Brown", "Dark Brown", "Black"]}
          />

          {/* Q4: Eye Color */}
          <Dropdown
            label="Natural Eye Color"
            selectedValue={surveyData.eyeColor}
            onValueChange={(v) => handleChange("eyeColor", v)}
            options={["Blue / Grey", "Green / Hazel", "Light Brown", "Dark Brown"]}
          />

          {/* Q5: Skin Tone */}
          <Dropdown
            label="What is your skin type?"
            selectedValue={surveyData.skinTone}
            onValueChange={(v) => handleChange("skinTone", v)}
            options={[
              "Type I (Very fair, always burns)",
              "Type II (Fair, burns easily)",
              "Type III (Medium, sometimes burns)",
              "Type IV (Olive, rarely burns)",
              "Type V (Brown, never burns)",
              "Type VI (Black)",
            ]}
          />

          {/* Q6: Sun Reaction */}
          <Dropdown
            label="Reaction to 1 hour of sun (no protection)?"
            selectedValue={surveyData.sunReaction}
            onValueChange={(v) => handleChange("sunReaction", v)}
            options={[
              "Painful blister / Burn",
              "Mild burn, then peel",
              "Burn then tan",
              "Tan immediately",
              "Nothing / Darken slightly"
            ]}
          />

          {/* Q7: Freckles */}
          <Dropdown
            label="Do you have freckles?"
            selectedValue={surveyData.freckling}
            onValueChange={(v) => handleChange("freckling", v)}
            options={["None", "A few on face/shoulders", "Many / All over"]}
          />

          {/* Q8: Work Environment */}
          <Dropdown
            label="Where do you spend most of your day?"
            selectedValue={surveyData.workEnvironment}
            onValueChange={(v) => handleChange("workEnvironment", v)}
            options={["Mostly Indoors", "Mixed / Commuting", "Mostly Outdoors"]}
          />

          {/* Q9: Climate */}
          <Dropdown
            label="How sunny is the place you live?"
            selectedValue={surveyData.climate}
            onValueChange={(v) => handleChange("climate", v)}
            options={["Cloudy / Rainy", "Moderate", "Very Sunny / Tropical"]}
          />

          {/* Q10: Ancestry */}
          <Dropdown
            label="Do you have Northern European ancestry?"
            selectedValue={surveyData.ancestry}
            onValueChange={(v) => handleChange("ancestry", v)}
            options={["Yes", "No", "Unsure"]}
          />

        </ScrollView>

        {/* Navigation Buttons */}
        <View className="flex-row justify-end mt-4 mb-8">
          <Pressable
            onPress={handleSkip}
            className="py-4 px-14 mr-2 border border-[#e2728f] rounded-xl items-center"
          >
            <Text className="text-[#e2728f] font-semibold">Skip</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            className="py-4 px-14 ml-2 bg-[#e2728f] rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Next</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}