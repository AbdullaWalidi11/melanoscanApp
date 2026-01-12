import { View, Text, TouchableOpacity, Modal } from "react-native";
import React from "react";
import { X } from "lucide-react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white w-full rounded-2xl p-8 items-center">
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute right-4 top-4"
          >
            <X size={24} color="#444" />
          </TouchableOpacity>

          <Text className="text-lg font-medium text-center">
            {t("components.scan_popup.title")}
          </Text>

          {/* Take Photo */}
          <TouchableOpacity
            onPress={onTakePhoto}
            className="bg-[#fe948d] w-44 py-4 rounded-xl mt-6  flex-row items-center justify-center space-x-2"
          >
            <Icon name="camera" size={20} color="#fff" />
            <Text className="text-center text-white font-semibold ml-3">
              {t("components.scan_popup.take_photo")}
            </Text>
          </TouchableOpacity>

          {/* Upload Image */}
          <TouchableOpacity
            onPress={onUploadImage}
            className="border border-[#fe948d] w-44 py-4 rounded-xl mt-3 flex-row items-center justify-center space-x-2"
          >
            <Icon name="upload" size={20} color="#fe948d" />
            <Text className="text-center text-[#fe948d] font-semibold ml-2">
              {t("components.scan_popup.upload_image")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
