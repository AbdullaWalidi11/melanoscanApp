import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native"; 
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

// ✅ 1. Import Real Services
import { signUpWithEmail } from "../services/authService";
import { syncLocalToCloud } from "../services/SyncService";

export default function SignUpScreen() {
  const navigation = useNavigation<any>(); 
  const { setUser } = useAuth(); // To auto-login after signup

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // ✅ Real Firebase Sign Up
      const { user } = await signUpWithEmail(name, email, password);
      
      Alert.alert(
        "Success", 
        "Account created! Please check your email for a verification link."
      );

      // Auto-login logic
      if (user) {
        setUser(user);
        // Navigate to the main app immediately
        navigation.replace("Login");
      } else {
        // Fallback to login screen if something weird happens
        navigation.navigate("Login");
      }

    } catch (error: any) {
      console.error(error);
      let msg = "Sign up failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') msg = "That email is already in use.";
      if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (error.code === 'auth/weak-password') msg = "Password is too weak.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        <View className="flex-1 justify-center mt-20">
          {/* Title */}
          <Text className="text-3xl font-bold text-center mb-8 py-8">
            Create an Account
          </Text>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-2 text-gray-700">Name</Text>
            <View className="absolute left-5 top-14 z-10">
              <User size={20} color="gray" />
            </View>
            <TextInput
              placeholder="User Name"
              value={name}
              onChangeText={setName}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              autoCapitalize="words"
              placeholderTextColor="#777"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-2 text-gray-700">Email Address</Text>
            <View className="absolute left-5 top-14 z-10">
              <Mail size={20} color="gray" />
            </View>
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#777"
            />
          </View>

          {/* Password */}
          <View className="mb-2">
            <Text className="text-lg font-medium mb-2 text-gray-700">Create Password</Text>
            <View className="absolute left-5 top-14 z-10">
              <Lock size={20} color="gray" />
            </View>
            <TextInput
              placeholder="Create Password"
              value={password}
              onChangeText={setPassword}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
              secureTextEntry={!showPassword}
              placeholderTextColor="#777"
            />
            <TouchableOpacity
              className="absolute right-5 top-[52px]"
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye size={20} color="gray" />
              ) : (
                <EyeOff size={20} color="gray" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View className="mb-8">
            <Text className="text-lg font-medium mb-2 text-gray-700">Confirm Password</Text>
            <View className="absolute left-5 top-14 z-10">
              <Lock size={20} color="gray" />
            </View>
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="w-full border pl-14 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base"
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#777"
            />
            <TouchableOpacity
              className="absolute right-5 top-[52px]"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye size={20} color="gray" />
              ) : (
                <EyeOff size={20} color="gray" />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            className="bg-[#fe8d93] py-5 rounded-full shadow-md mb-6"
            onPress={signUp}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Redirect to login */}
          <Text className="text-center text-sm text-gray-600 mb-10">
            Already have an account?{" "}
            <Text
              className="text-[#fe8d93] font-semibold"
              onPress={() => navigation.navigate("Login")}
            >
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}