import React from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Montserrat_400Regular, Montserrat_600SemiBold, useFonts } from "@expo-google-fonts/montserrat";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";

export default function SurveyPage1() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();

  // Load fonts for consistent styling with the landing page
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

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

  if (!fontsLoaded) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;
  }

  return (
    // 1. Updated Base Background Color to match landing page
    <View className="flex-1 bg-[#FFC5C8] pt-10 relative overflow-hidden">
      
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
      {/* 2. The Geometric Gradient Background Effect (Replicated from Landing Page) */}
      {/* This places a large rotated gradient square in the background */}
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#ff9da1", "#ff9da1", "#fe8d93"]}
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
          Answering this survey will allow us to personalize your experience with our AI assistant.
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-[40px] pt-8 overflow-hidden px-5 shadow-xl">
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
            options={["Male", "Female"]}
          />

          {/* Q3: Hair Color */}
          <Dropdown
            label="Natural Hair Color "
            selectedValue={surveyData.hairColor}
            onValueChange={(v) => handleChange("hairColor", v)}
            options={["Red / Auburn", "Blonde", "Brown", "Black"]}
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

        {/* Navigation Buttons - Updated colors and fonts */}
        <View className="flex-row justify-end mt-4 mb-8 gap-x-4">
          <Pressable
            onPress={handleSkip}
            // Updated border color to #FF8080
            className="py-4 px-14 border border-[#fe8d93] rounded-xl items-center justify-center"
          >
            {/* Updated text color and font */}
            <Text style={{ fontFamily: "Montserrat_600SemiBold" }} className="text-[#fe8d93] text-base">Skip</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            // Updated bg color to #FF8080
            className="py-4 px-14 bg-[#fe8d93] rounded-xl items-center justify-center shadow-sm"
          >
             {/* Updated font */}
            <Text style={{ fontFamily: "Montserrat_600SemiBold" }} className="text-white text-base">Next</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}