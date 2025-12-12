import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { X } from "lucide-react-native";
import Icon from "react-native-vector-icons/Feather";

interface ScanMethodPopupProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUploadImage: () => void;
}

export default function ScanMethodPopup({
  visible,
  onClose,
  onTakePhoto,
  onUploadImage,
}: ScanMethodPopupProps) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/40 z-50 items-center justify-center px-6">
      <View className="bg-white w-full rounded-2xl p-8 items-center">
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} className="absolute right-4 top-4">
          <X size={24} color="#444" />
        </TouchableOpacity>

        <Text className="text-lg font-medium text-center">
          Choose a method to scan{"\n"}and get result
        </Text>

        {/* Take Photo */}
        <TouchableOpacity
          onPress={onTakePhoto}
          className="bg-[#fe8d93] w-44 py-4 rounded-xl mt-6  flex-row items-center justify-center space-x-2"
        >
          <Icon name="camera" size={20} color="#fff" />
          <Text className="text-center text-white font-semibold ml-3">
            Take photo
          </Text>
        </TouchableOpacity>

        {/* Upload Image */}
        <TouchableOpacity
          onPress={onUploadImage}
          className="border border-[#e2728f] w-44 py-4 rounded-xl mt-3 flex-row items-center justify-center space-x-2"
        >
          <Icon name="upload" size={20} color="#fe8d93" />
          <Text className="text-center text-[#fe8d93] font-semibold ml-2">
            Upload image
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
