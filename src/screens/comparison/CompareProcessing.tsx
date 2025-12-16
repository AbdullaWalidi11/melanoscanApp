import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, Animated, Easing, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { compareLesionsWithGemini } from "../../services/comparisonService";
import ABCDECarousel from "../../components/ABCDECarousel";
import { useTranslation } from "react-i18next";
import CustomAlert, { AlertAction } from "../../components/CustomAlert";

export default function CompareProcessing() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();

  const { oldLesionId, oldImageUri, newImageUri, region } = route.params;
  const { width } = Dimensions.get("window");

  // Load Fonts
  let [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  // Animation Value (0 -> 1)
  const scanAnim = useRef(new Animated.Value(0)).current;

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

  // --- 1. ANIMATION LOOP (Vertical Scan Line) ---
  useEffect(() => {
    const startAnimation = () => {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000, // Slower, smoother scan
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0, // Reset instantly
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startAnimation();
  }, []);

  // --- 2. LOGIC (Call Gemini) ---
  useEffect(() => {
    const runComparison = async () => {
      try {
        // Validation + Analysis
        const result = await compareLesionsWithGemini(
          oldImageUri,
          newImageUri,
          i18n.language
        );

        if (!result.valid) {
          showCustomAlert(
            t("comparison_processing.failed_title"),
            result.message || "",
            [
              {
                text: t("comparison_processing.go_back"),
                onPress: () => {
                  hideAlert();
                  navigation.goBack();
                },
              },
            ]
          );
          return;
        }

        // Success -> Navigate
        navigation.replace("CompareResult", {
          result: result.analysis,
          oldLesionId: oldLesionId,
          oldImageUri: oldImageUri,
          newImageUri: newImageUri,
        });
      } catch (error) {
        showCustomAlert(
          t("comparison_processing.failed_title"),
          t("comparison_processing.generic_error"),
          [
            {
              text: "OK",
              onPress: () => {
                hideAlert();
                navigation.goBack();
              },
            },
          ]
        );
        // navigation.goBack(); // Let the alert action handle navigation
      }
    };

    // Delay to let animation play
    setTimeout(runComparison, 2500);
  }, []);

  if (!fontsLoaded) return <View className="flex-1 bg-[#FAF9F6]" />;

  // Helper component for the Corner Brackets
  const CornerBrackets = () => (
    <>
      <View className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gray-400" />
      <View className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gray-400" />
      <View className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gray-400" />
      <View className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gray-400" />
    </>
  );

  return (
    <View className="flex-1 bg-[#FAF9F6] items-center pt-24 px-6">
      {/* Title */}
      <Text
        style={{ fontFamily: "Montserrat_700Bold" }}
        className="text-[#8B5E5E] text-2xl mb-12"
      >
        {t("comparison_processing.title")}
      </Text>

      {/* Images Container */}
      <View className="flex-row justify-between w-full mb-10 px-2">
        {/* OLD IMAGE */}
        <View className="relative w-36 h-36 p-3">
          <CornerBrackets />
          <View className="w-full h-full overflow-hidden rounded-md relative">
            <Image
              source={{ uri: oldImageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Vertical Scan Line */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: "#59C1D0", // Cyan Blue
                zIndex: 10,
                transform: [
                  {
                    translateX: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 140], // Moves across the width
                    }),
                  },
                ],
              }}
            />
          </View>
        </View>

        {/* NEW IMAGE */}
        <View className="relative w-36 h-36 p-3">
          <CornerBrackets />
          <View className="w-full h-full overflow-hidden rounded-md relative">
            <Image
              source={{ uri: newImageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Vertical Scan Line (Synced) */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: "#59C1D0", // Cyan Blue
                zIndex: 10,
                transform: [
                  {
                    translateX: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 140],
                    }),
                  },
                ],
              }}
            />
          </View>
        </View>
      </View>

      {/* Loading Text */}
      <Text
        style={{ fontFamily: "Montserrat_600SemiBold" }}
        className="text-[#8B5E5E] text-lg mb-16"
      >
        {t("comparison_processing.loading")}
      </Text>

      {/* Dynamic ABCDE Carousel */}
      <ABCDECarousel />

      {/* Footer Disclaimer */}
      <Text className="absolute bottom-8 text-gray-400 text-[10px] text-center px-8 leading-4">
        {t("comparison_processing.footer_disclaimer")}
      </Text>

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
