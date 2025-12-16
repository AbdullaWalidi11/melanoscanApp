import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, TriangleAlert, Info } from "lucide-react-native";
import { useTranslation, Trans } from "react-i18next";

export default function DisclaimerScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-white">
      {/* ----- HEADER ----- */}

      <ScrollView
        className="flex-1 bg-[#fff0f3]"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ----- IMPORTANT DISCLAIMER CARD ----- */}
        <View className="bg-white mx-4 mt-6 p-4 rounded-xl shadow-sm border-l-8 border-red-500 flex-row items-start">
          <View className="mr-4 mt-1">
            <TriangleAlert color="#ef4444" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {t("disclaimer.title")}
            </Text>
            <Text className="text-gray-700 leading-5">
              <Trans
                i18nKey="disclaimer.body"
                components={{ bold: <Text className="font-bold" /> }}
              />
            </Text>
          </View>
        </View>

        {/* ----- UNDERSTANDING SKIN CANCER ----- */}
        <View className="bg-white mx-4 mt-4 p-5 rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            {t("disclaimer.understanding_title")}
          </Text>
          <View className="flex-row">
            {/* Understanding Skin Cancer Image */}
            <Image
              source={require("../../assets/images/understanding.png")}
              className="w-24 h-24 rounded-lg mr-2"
              resizeMode="cover"
            />
            <Text className="flex-1 text-gray-600 leading-5">
              {t("disclaimer.understanding_body")}
            </Text>
          </View>
        </View>

        {/* ----- THE ABCDE RULE ----- */}
        <View className="mx-4 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4 ml-1">
            {t("disclaimer.abcde_title")}
          </Text>

          {/* A - Asymmetry */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <Image
              source={require("../../assets/images/A.png")}
              className="w-16 h-16 rounded-lg mr-4"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">
                {t("disclaimer.a_title")}
              </Text>
              <Text className="text-gray-600">{t("disclaimer.a_desc")}</Text>
            </View>
          </View>

          {/* B - Border */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <Image
              source={require("../../assets/images/B.png")}
              className="w-16 h-16 rounded-lg mr-4"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">
                {t("disclaimer.b_title")}
              </Text>
              <Text className="text-gray-600">{t("disclaimer.b_desc")}</Text>
            </View>
          </View>

          {/* C - Color */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <Image
              source={require("../../assets/images/C.png")}
              className="w-16 h-16 rounded-lg mr-4"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">
                {t("disclaimer.c_title")}
              </Text>
              <Text className="text-gray-600">{t("disclaimer.c_desc")}</Text>
            </View>
          </View>

          {/* D - Diameter */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <Image
              source={require("../../assets/images/D.png")}
              className="w-16 h-16 rounded-lg mr-4"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">
                {t("disclaimer.d_title")}
              </Text>
              <Text className="text-gray-600">{t("disclaimer.d_desc")}</Text>
            </View>
          </View>

          {/* E - Evolving */}
          <View className="bg-white p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
            <Image
              source={require("../../assets/images/E.png")}
              className="w-16 h-16 rounded-lg mr-4"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-gray-800">
                {t("disclaimer.e_title")}
              </Text>
              <Text className="text-gray-600">{t("disclaimer.e_desc")}</Text>
            </View>
          </View>
        </View>

        {/* ----- STAY VIGILANT ----- */}
        <View className="bg-white mx-4 mt-2 p-5 rounded-2xl shadow-sm border-t-4 border-[#e2728f]">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            {t("disclaimer.vigilant_title")}
          </Text>
          <Text className="text-gray-600 leading-6">
            {t("disclaimer.vigilant_body")}
          </Text>
        </View>

        {/* ----- EXTRA CONTENT (SCROLLABLE AREA) ----- */}

        {/* Prevention Tips */}
        <View className="mx-4 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-3 ml-1">
            {t("disclaimer.prevention_title")}
          </Text>

          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">
              {t("disclaimer.tip_1")}
            </Text>
          </View>
          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">
              {t("disclaimer.tip_2")}
            </Text>
          </View>
          <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row">
            <Text className="text-blue-500 font-bold mr-2">•</Text>
            <Text className="text-gray-700 flex-1">
              {t("disclaimer.tip_3")}
            </Text>
          </View>
        </View>

        {/* When to see a doctor */}
        <View className="bg-white mx-4 mt-6 p-5 rounded-2xl shadow-sm mb-8">
          <View className="flex-row items-center mb-3">
            <Info color="#e2728f" size={24} />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              {t("disclaimer.doctor_title")}
            </Text>
          </View>
          <Text className="text-gray-600 leading-6">
            {t("disclaimer.doctor_body")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
