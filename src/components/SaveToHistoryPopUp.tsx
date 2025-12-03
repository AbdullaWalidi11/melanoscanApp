import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";

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
  if (!visible) return null;

  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const bodyParts = [
    "face",
    "body",
    "right arm",
    "left arm",
    "right leg",
    "left leg",
  ];

  return (
    // Added 'z-50' to ensure it floats above everything
    <View className="absolute inset-0 bg-black/40 items-center justify-center px-6 z-50">

      <View className="bg-white w-full rounded-2xl p-6 items-center shadow-xl">

        <Text className="text-center text-lg font-semibold mb-4 text-[#333]">
          Choose which part of your body{"\n"}is the mole located in
        </Text>

        {/* CUSTOM DROPDOWN */}
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-4 flex-row justify-between items-center"
        >
          <Text className={region ? "text-black capitalize" : "text-gray-400"}>
            {region || "Choose body part"}
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
                    setRegion(part);
                    setDropdownOpen(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                >
                  <Text className="text-gray-800 capitalize">{part}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* DESCRIPTION INPUT */}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (e.g., small mole)"
          placeholderTextColor="#999"
          className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-6 text-black"
        />

        {/* Save */}
        <TouchableOpacity
          className={`w-40 py-3 rounded-full ${region ? "bg-[#e2728f]" : "bg-gray-300"}`}
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
          <Text className="text-center text-white font-semibold">Save</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} className="mt-4 p-2">
          <Text className="text-gray-500 font-medium">Cancel</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}