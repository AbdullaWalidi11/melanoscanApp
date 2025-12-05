import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Dropdown from "../../components/Dropdown";
import { useSurvey } from "../../context/SurveyContext";
import { saveUserProfile } from "../../database/queries";

export default function SurveyPage2() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();

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
      
      Alert.alert(
        "Profile Ready",
        "Your risk profile has been saved. The AI will now use this context to analyze your scans.",
        [{ text: "OK", onPress: () => navigation.replace("MainTabs") }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save profile.");
    }
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
            label="How often do you wear sunscreen (SPF 30+)?"
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

        {/* Navigation Buttons */}
        <View className="flex-row justify-end mt-4 mb-8">
          <Pressable
            onPress={handleSkip}
            className="py-4 px-14 mr-2 border border-[#e2728f] rounded-xl items-center"
          >
            <Text className="text-[#e2728f] font-semibold">Skip</Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            className="py-4 px-14 ml-2 bg-[#e2728f] rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Submit</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}