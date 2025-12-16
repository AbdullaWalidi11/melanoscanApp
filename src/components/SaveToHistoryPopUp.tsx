import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { region: string; description: string }) => void;
}

export default function SaveToHistoryPopup({
  visible,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();

  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!visible) return null;

  // Use translation keys for display, but keep original values for logic/saving if needed?
  // The user likely wants the saved region to be readable or translated.
  // If we save "face", we display "Yüz" in Turkish.
  // For now, let's map display labels to values.

  const bodyParts = [
    { label: t("components.save_popup.body_parts.face"), value: "face" },
    { label: t("components.save_popup.body_parts.body"), value: "body" },
    {
      label: t("components.save_popup.body_parts.right_arm"),
      value: "right arm",
    },
    {
      label: t("components.save_popup.body_parts.left_arm"),
      value: "left arm",
    },
    {
      label: t("components.save_popup.body_parts.right_leg"),
      value: "right leg",
    },
    {
      label: t("components.save_popup.body_parts.left_leg"),
      value: "left leg",
    },
  ];

  return (
    // Added 'z-50' to ensure it floats above everything
    <View className="absolute inset-0 bg-black/40 items-center justify-center px-6 z-50">
      <View className="bg-white w-full rounded-2xl p-6 items-center shadow-xl">
        <Text className="text-center text-lg font-semibold mb-4 text-[#333]">
          {t("components.save_popup.title")}
        </Text>

        {/* CUSTOM DROPDOWN */}
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-4 flex-row justify-between items-center"
        >
          <Text className={region ? "text-black capitalize" : "text-gray-400"}>
            {/* Show label corresponding to value, or placeholder */}
            {region
              ? bodyParts.find((p) => p.value === region)?.label || region
              : t("components.save_popup.choose_part")}
          </Text>
          <Text className="text-gray-400">▼</Text>
        </TouchableOpacity>

        {dropdownOpen && (
          <View className="w-full bg-white border border-gray-200 rounded-xl max-h-48 mb-4 overflow-hidden shadow-sm">
            <ScrollView nestedScrollEnabled>
              {bodyParts.map((part, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setRegion(part.value);
                    setDropdownOpen(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                >
                  <Text className="text-gray-800 capitalize">{part.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* DESCRIPTION INPUT */}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("components.save_popup.desc_placeholder")}
          placeholderTextColor="#999"
          className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-6 text-black"
        />

        {/* Save */}
        <TouchableOpacity
          className={`w-40 py-3 rounded-full ${region ? "bg-[#fe948d]" : "bg-gray-300"}`}
          disabled={!region} // Disable save if no region selected
          onPress={() => {
            if (!region) return;
            onSave({ region, description });
            // Reset fields
            setRegion("");
            setDescription("");
            setDropdownOpen(false);
          }}
        >
          <Text className="text-center text-white font-semibold">
            {t("components.save_popup.save")}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} className="mt-4 p-2">
          <Text className="text-gray-500 font-medium">
            {t("components.save_popup.cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
