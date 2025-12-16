import React from "react";
import { View, Text } from "react-native";
// simple mock dropdown using a picker or just a text for now to prevent crash
// For a real dropdown, you'd usually use a library or a modal.
// Here is a simplified version using a mapped list for selection.

import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

interface DropdownProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: string[];
}

export default function Dropdown({
  label,
  selectedValue,
  onValueChange,
  options,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-semibold mb-2">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="border border-gray-700 rounded-xl px-4 py-4 bg-white"
      >
        <Text className={selectedValue ? "text-black" : "text-gray-400"}>
          {selectedValue || t("components.dropdown.placeholder")}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View className="bg-gray-50 border border-gray-200 mt-1 rounded-xl overflow-hidden">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              className="p-3 border-b border-gray-100"
              onPress={() => {
                onValueChange(option);
                setIsOpen(false);
              }}
            >
              <Text
                className={
                  selectedValue === option
                    ? "text-[#e2728f] font-bold"
                    : "text-gray-800"
                }
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
