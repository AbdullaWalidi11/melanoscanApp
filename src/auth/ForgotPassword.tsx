import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Mail, LockKeyhole } from "lucide-react-native";
import { sendPasswordReset } from "../services/authService"; 

export default function ForgotPassword() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      
      Alert.alert(
        "Check your email",
        "We have sent a password reset link to your email address.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error("Reset Error:", error);
      Alert.alert("Error", "Could not send reset email. Please check the email provided.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6">
      {/* 1. Top Navigation (Back Button) */}
      <View className="mt-14 mb-8">
        <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* 2. Hero Icon & Title */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-pink-50 rounded-full items-center justify-center mb-6">
            <LockKeyhole size={40} color="#e2728f" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</Text>
          <Text className="text-center text-gray-500 px-4">
            Don't worry! It happens. Please enter the email associated with your account.
          </Text>
        </View>

        {/* 3. Input Field */}
        <View className="mb-8">
          <Text className="text-lg font-medium mb-2 text-gray-700">Email Address</Text>
          <View className="relative justify-center">
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              className="w-full border pl-12 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {/* Mail Icon inside Input */}
            <View className="absolute left-4">
                <Mail size={20} color="gray" />
            </View>
          </View>
        </View>

        {/* 4. Send Button */}
        <TouchableOpacity 
          className="bg-[#e2728f] py-5 rounded-full shadow-md mb-6" 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </View>
  );
}