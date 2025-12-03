import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Google from "expo-auth-session/providers/google";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

// Services
import { emailSignIn, googleSignIn } from "../services/authService"; // Removed guestSignIn import
import { syncLocalToCloud, runFullSync } from "../services/SyncService";

export default function Login() {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Email/Password Login ---
  const handleEmailLogin = async () => {
    if (!email || !password) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }

    setLoading(true);
    try {
        const user = await emailSignIn(email, password);
        setUser(user); // Set real Firebase user

        // ❌ DELETE: syncLocalToCloud().catch(...);  <- This is redundant

        // ✅ AWAIT: Run the full sync (Push local data, then Pull cloud history).
        await runFullSync(); 

        // ✅ Navigate: Only navigate once the data restore is complete.
        navigation.replace("MainTabs");

    } catch (error: any) {
        console.error("Login error:", error);
        // Note: You can add more specific error alerts here using error.code
        Alert.alert("Login Failed", "Please check your credentials.");
    } finally {
        // Stop loading spinner after all network activity is done.
        setLoading(false);
    }
};

  // --- Google Sign-In ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: "240587310989-lmji3qktn8pdr4os4soeshk4i96e7064.apps.googleusercontent.com",
    clientId: "240587310989-fie4a1hjgml2pqeuec9akjjl45uc5eha.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (token: string) => {
    setLoading(true);
    try {
      const user = await googleSignIn(token);
      setUser(user); // Set real Firebase user
      syncLocalToCloud().catch(console.error); // Sync offline data
      navigation.replace("MainTabs");
    } catch (error) {
      Alert.alert("Error", "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // --- TRUE OFFLINE GUEST MODE ---
  const handleNoSignIn = () => {
    // 1. DO NOT call firebase.auth().
    // 2. Just update the local UI state so the user can pass the 'gate'.
    const offlineUser = { 
        uid: 'offline_guest', 
        isAnonymous: true, 
        email: null, 
        displayName: 'Guest' 
    };
    
    setUser(offlineUser);
    
    // 3. Go to Onboarding (Landing Pages)
    navigation.navigate("LandingPage1"); 
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-center text-4xl font-bold mb-24 text-[#e2728f]">Login</Text>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-lg font-medium mb-2 text-gray-700">Email Address</Text>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          className="w-full border pl-6 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      {/* Password */}
      <View className="mb-2">
        <Text className="text-lg font-medium mb-2 text-gray-700">Password</Text>
        <TextInput
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          className="w-full border pl-6 bg-stone-50 border-gray-300 rounded-full px-4 py-4 text-base mb-1"
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          className="absolute right-5 top-[52px]"
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <Eye size={20} color="gray" /> : <EyeOff size={20} color="gray" />}
        </TouchableOpacity>
      </View>

      {/* Remember me + Forgot password */}
      <View className="flex-row justify-between items-center mb-9">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setRemember(!remember)}
        >
          <View className={`w-5 h-5 mr-2 rounded border ${remember ? "border-[#e2728f] bg-[#e2728f]" : "border-gray-400"}`} />
          <Text className="text-sm text-gray-600">Remember me</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text className="text-sm text-[#e2728f] font-medium">Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        className="bg-[#e2728f] py-5 rounded-full mb-3 shadow-md" 
        onPress={handleEmailLogin}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-base">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-8 py-3">
        <View className="flex-1 h-[1px] bg-gray-300" />
        <Text className="mx-3 text-gray-600 text-sm">Or Sign In With</Text>
        <View className="flex-1 h-[1px] bg-gray-300" />
      </View>

      {/* Google */}
      <TouchableOpacity
        className="flex-row items-center bg-white border border-gray-300 py-4 pl-2 rounded-full mb-5 shadow-sm"
        disabled={!request || loading}
        onPress={() => promptAsync()}
      >
        <Image
          source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
          className="w-9 h-9 ml-4"
        />
        <Text className="flex-1 text-center text-base font-medium mr-8 text-gray-700">
          Sign In With Google
        </Text>
      </TouchableOpacity>

      {/* Guest */}
      <TouchableOpacity
        className="flex-row items-center bg-neutral-800 py-4 rounded-full pl-2 shadow-sm"
        onPress={handleNoSignIn}
        disabled={loading}
      >
        <Image
          source={{ uri: "https://img.icons8.com/ios-filled/50/ffffff/user.png" }}
          className="w-9 h-9 ml-4"
        />
        <Text className="flex-1 text-center text-base font-medium text-white mr-10">
          Continue Without Signing In
        </Text>
      </TouchableOpacity>

      {/* Sign up link */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-600 text-sm">Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text className="text-[#e2728f] font-medium text-sm">Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}