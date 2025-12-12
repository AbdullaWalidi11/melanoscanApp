import React from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Montserrat_400Regular, Montserrat_600SemiBold, useFonts } from "@expo-google-fonts/montserrat";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";
import { saveUserProfile } from "../../database/queries";

export default function SurveyPage2() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  const handleChange = (key: keyof typeof surveyData, value: string) => {
    setSurveyData({ ...surveyData, [key]: value });
  };

  const handleSubmit = async () => {
    // 1. Validation Logic
    const allAnswers = Object.values(surveyData);
    const isIncomplete = allAnswers.some((answer) => answer.trim() === "");

    if (isIncomplete) {
      Alert.alert(
        "Complete the Profile",
        "To give you accurate AI advice, we need a complete risk profile.\n\nPlease answer all questions, or tap 'Skip'."
      );
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
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  if (!fontsLoaded) {
    return <View className="flex-1 items-center justify-center bg-[#FFC5C8]"><ActivityIndicator color="white" /></View>;
  }

  return (
    // 1. Base Background
    <View className="flex-1 bg-[#FFC5C8] pt-16 relative overflow-hidden">
      
      {/* === BACKGROUND GEOMETRY START === */}
      
      {/* Layer 1: Deepest/Furthest Left */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-20 rotate-45 -z-20">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* Layer 2: Middle Layer */}
      <View className="absolute inset-0 transform -translate-x-60 -translate-y-40 rotate-45 -z-10 opacity-60">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fca7ac", "#ff9da1", "#fe8d93"]}
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
          Answering this survey will allow us to personalize your experience with our AI assistant.
        </Text>
      </View>

      {/* White Card Container */}
      <View className="flex-1 bg-white rounded-t-[40px] pt-8 overflow-hidden px-5 shadow-xl z-10">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Q11: Personal History */}
          <Dropdown
            label="Have you ever been diagnosed with skin cancer?"
            selectedValue={surveyData.personalHistory}
            onValueChange={(v) => handleChange("personalHistory", v)}
            options={["No", "Yes, Melanoma", "Yes, Non-Melanoma (BCC/SCC)", "Unsure"]}
          />

          {/* Q12: Family History */}
          <Dropdown
            label="Has anyone in your immediate family had skin cancer?"
            selectedValue={surveyData.familyHistory}
            onValueChange={(v) => handleChange("familyHistory", v)}
            options={["No", "Yes (Parent/Sibling)", "Yes (Distant Relative)", "Unsure"]}
          />

          {/* Q13: Childhood Burns */}
          <Dropdown
            label="Did you have blistering sunburns as a child?"
            selectedValue={surveyData.childhoodSunburns}
            onValueChange={(v) => handleChange("childhoodSunburns", v)}
            options={["No", "Yes, once or twice", "Yes, frequently"]}
          />

          {/* Q14: Tanning Beds */}
          <Dropdown
            label="Have you used tanning beds?"
            selectedValue={surveyData.tanningBeds}
            onValueChange={(v) => handleChange("tanningBeds", v)}
            options={["Never", "A few times in the past", "Yes, regularly (Past)", "Yes, currently"]}
          />

          {/* Q15: Mole Count */}
          <Dropdown
            label="Estimate the number of moles on your body:"
            selectedValue={surveyData.moleCount}
            onValueChange={(v) => handleChange("moleCount", v)}
            options={["Few (< 20)", "Average (20-50)", "Many (> 50)"]}
          />

          {/* Q16: Ugly Duckling */}
          <Dropdown
            label="Do you have a mole that looks different from others?"
            selectedValue={surveyData.uglyDuckling}
            onValueChange={(v) => handleChange("uglyDuckling", v)}
            options={["No", "Yes", "Not sure"]}
          />

          {/* Q17: Recent Changes */}
          <Dropdown
            label="Have you noticed any moles changing recently?"
            selectedValue={surveyData.recentChanges}
            onValueChange={(v) => handleChange("recentChanges", v)}
            options={["No", "Yes, slight change", "Yes, significant change"]}
          />

          {/* Q18: Sunscreen */}
          <Dropdown
            label="How often do you wear sunscreen?"
            selectedValue={surveyData.sunscreen}
            onValueChange={(v) => handleChange("sunscreen", v)}
            options={["Daily / Always", "Only on sunny days", "Rarely / Never"]}
          />

          {/* Q19: Protection */}
          <Dropdown
            label="Do you wear protective clothing in the sun?"
            selectedValue={surveyData.protection}
            onValueChange={(v) => handleChange("protection", v)}
            options={["Always", "Sometimes", "Rarely"]}
          />

          {/* Q20: Checkups */}
          <Dropdown
            label="How often do you get a professional skin check?"
            selectedValue={surveyData.checkups}
            onValueChange={(v) => handleChange("checkups", v)}
            options={["Yearly", "Every few years", "Only when I see an issue", "Never"]}
          />

        </ScrollView>

        {/* Navigation Buttons - Updated to Match Page 1 */}
        <View className="flex-row justify-end mt-4 mb-8 gap-x-4">
          <Pressable
            onPress={handleSkip}
            className="py-4 px-14 border border-[#FF8080] rounded-xl items-center justify-center"
          >
            <Text style={{ fontFamily: "Montserrat_600SemiBold" }} className="text-[#FF8080] text-base">Skip</Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            className="py-4 px-12 bg-[#FF8080] rounded-xl items-center justify-center shadow-sm"
          >
            <Text style={{ fontFamily: "Montserrat_600SemiBold" }} className="text-white text-base">Submit</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}