import React from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native"; // CHANGED
import Dropdown from "../../components/Dropdown"; // CHANGED: Path
import { useSurvey } from "../../context/SurveyContext"; // CHANGED: Path
import { useAuth } from "../../context/AuthContext";

export default function SurveyPage1() {
  const navigation = useNavigation<any>();
  const { surveyData, setSurveyData } = useSurvey();
  const { user, setUser } = useAuth(); // <--- GET THIS

  const handleChange = (key: keyof typeof surveyData, value: string) => {
    setSurveyData({ ...surveyData, [key]: value });
  };

  const handleNext = () => {
    if (!surveyData.age || isNaN(Number(surveyData.age))) {
      Alert.alert('Error', 'Please enter a valid age.');
      return;
    }
    if (!surveyData.gender) {
      Alert.alert('Error', 'Please select your gender.');
      return;
    }
    if (!surveyData.skinType) {
      Alert.alert('Error', 'Please select your skin type.');
      return;
    }
    // CHANGED: Use navigate with screen name
    // We haven't created SurveyPage2 yet, so this might crash if clicked.
    navigation.navigate("SurveyPage2"); 
  };

  const handleSkip = () => {
   navigation.navigate("MainTabs");
  };

  return (
    <View className="flex-1 bg-[#e2728f] pt-20"> 
       {/* Note: I used a hex code for 'bg-primary' just to be safe if tailwind config isn't loaded */}

      <View className="absolute top-20 left-30 right-0 bottom-0 items-center justify-center bg-black w-10 h-10 ">
      </View>
      <View className="px-5">
      </View>

        <Text className="text-center text-base text-white font-bold mb-6 px-8">
          Answering this survey will allow us to personalize your experience with our AI assistant.
        </Text>
        
      <View className="flex-1 bg-white border-t-0 rounded-t-3xl pt-5">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-5 pt-10">
        
        {/* Age Input */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Age</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="Enter your age"
            value={surveyData.age}
            onChangeText={(text) => handleChange("age", text)}
            className="border border-gray-700 rounded-xl px-4 py-5"
          />
        </View>

        {/* Gender Dropdown */}
        <Dropdown
          label="What is your gender?"
          selectedValue={surveyData.gender}
          onValueChange={(v) => handleChange("gender", v)}
          options={["Male", "Female", "Other"]}
        />

        {/* Skin Type */}
        <Dropdown
          label="What is your skin type?"
          selectedValue={surveyData.skinType}
          onValueChange={(v) => handleChange("skinType", v)}
          options={[
            "Type I (Very fair)",
            "Type II (Fair)",
            "Type III (Medium)",
            "Type IV (Olive)",
            "Type V (Brown)",
            "Type VI (Dark Brown/Black)",
          ]}
        />

        {/* Family History */}
        <Dropdown
          label="Do you have a family history of skin cancer?"
          selectedValue={surveyData.familyHistory}
          onValueChange={(v) => handleChange("familyHistory", v)}
          options={["Yes", "No", "Not sure"]}
        />

        {/* Sun Exposure */}
        <Dropdown
          label="How often are you exposed to the sun?"
          selectedValue={surveyData.sunExposure}
          onValueChange={(v) => handleChange("sunExposure", v)}
          options={["Rarely", "Sometimes", "Often", "Daily"]}
        />

        {/* Sunscreen */}
        <Dropdown
          label="Do you regularly use sunscreen?"
          selectedValue={surveyData.sunscreenUsage}
          onValueChange={(v) => handleChange("sunscreenUsage", v)}
          options={["Always", "Sometimes", "Rarely", "Never"]}
        />

        {/* Mole Changes */}
        <Dropdown
          label="Have you noticed any recent changes in your moles?"
          selectedValue={surveyData.moleChanges}
          onValueChange={(v) => handleChange("moleChanges", v)}
          options={["Yes", "No"]}
        />

        {/* Tanning Bed */}
        <Dropdown
          label="Do you use tanning beds?"
          selectedValue={surveyData.tanningBedUsage}
          onValueChange={(v) => handleChange("tanningBedUsage", v)}
          options={["Never", "Occasionally", "Regularly"]}
        />

            </ScrollView>
        {/* Navigation Buttons */}
        <View className="flex-row justify-end mt-6 mb-12">
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