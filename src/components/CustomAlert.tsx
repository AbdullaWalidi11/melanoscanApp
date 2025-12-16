import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Montserrat_600SemiBold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";

export interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: AlertAction[];
  onClose?: () => void; // Optional fallback to close
}

/**
 * A reusable modal that mimics the design of SaveToHistoryPopUp.
 * Usage is similar to Alert.alert but declarative.
 */
export default function CustomAlert({
  visible,
  title,
  message,
  actions,
  onClose,
}: CustomAlertProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/30 items-center justify-center px-6 z-50">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-xl w-[250px] overflow-hidden shadow-lg border border-gray-200">
              {/* Optional Title/Message Header */}
              {(title || message) && (
                <View className="p-4 border-b border-gray-100 items-center">
                  {title ? (
                    <Text
                      className="text-[#8B5E3C] text-base text-center mb-1"
                      style={{ fontFamily: "Montserrat_600SemiBold" }}
                    >
                      {title}
                    </Text>
                  ) : null}
                  {message ? (
                    <Text
                      className="text-gray-500 text-xs text-center leading-4"
                      style={{ fontFamily: "Montserrat_400Regular" }}
                    >
                      {message}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Actions List */}
              {actions.map((action, index) => {
                const isDestructive = action.style === "destructive";
                // const isCancel = action.style === "cancel";
                // In this style, 'Cancel' is just another list item, usually at the bottom.

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={action.onPress}
                    className="p-4 items-center justify-center border-b border-gray-100 last:border-b-0"
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{ fontFamily: "Montserrat_600SemiBold" }}
                      className={`text-base ${
                        isDestructive ? "text-red-500" : "text-[#8B5E3C]"
                      }`}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
