import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { X } from "lucide-react-native";
interface ScanMethodPopupProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUploadImage: () => void;
}

export default function ScanMethodPopup({ visible, onClose, onTakePhoto, onUploadImage }: ScanMethodPopupProps) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/40 z-50 items-center justify-center px-6">
      <View className="bg-white w-full rounded-2xl p-6 items-center">

        {/* Close Button */}
        <TouchableOpacity 
          onPress={onClose} 
          className="absolute right-4 top-4"
        >
          <X size={22} color="#000" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-center">
          Choose a method to scan{"\n"}and get result
        </Text>

        {/* Take Photo */}
        <TouchableOpacity
          onPress={onTakePhoto}
          className="bg-[#e2728f] w-44 py-3 rounded-full mt-6"
        >
          <Text className="text-center text-white font-semibold">
            Take photo
          </Text>
        </TouchableOpacity>

        {/* Upload Image */}
        <TouchableOpacity
          onPress={onUploadImage}
          className="border border-[#e2728f] w-44 py-3 rounded-full mt-3"
        >
          <Text className="text-center text-[#e2728f] font-semibold">
            Upload image
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
