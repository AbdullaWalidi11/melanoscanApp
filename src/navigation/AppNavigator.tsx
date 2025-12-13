import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import TabNavigator from "./TabNavigator";

// ✅ Import the Sync Hook here
import { useNetworkSync } from "../hooks/useNetworkSync";

// Screen Imports
import SplashScreen from "../screens/Splash";
import LoginScreen from "../auth/Login";
import SignUpScreen from "../auth/SignUp";
import LandingPage1 from "../landingPages/Page1";
import LandingPage2 from "../landingPages/Page2";
import LandingPage3 from "../landingPages/Page3";
import SurveyPage1 from "../screens/survey/SurveyPage1";
import SurveyPage2 from "../screens/survey/SurveyPage2";
import LesionsByRegion from "../screens/LesionsByRegion";
import ScanUpload from "../screens/model/ScanUpload";
import AnalysisResult from "../screens/model/AnalysisResult";
import LesionDetails from "../screens/LesionDetails";
import ChatScreen from "../screens/chatScreen";
import ComparisonHistory from "../screens/comparison/ComparisonHistory";
import CompareProcessing from "../screens/comparison/CompareProcessing";
import CompareResult from "../screens/comparison/CompareResult";
import LogDetailScreen from "../screens/comparison/LogDetailScreen";
import ForgotPassword from "../auth/ForgotPassword";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { loading } = useAuth();

  // ✅ Call the hook here.
  // It is safe because AppNavigator is a child of <NavigationContainer> (in App.tsx).
  // It will run in the background without blocking the UI.
  useNetworkSync();

  // We still keep the loading check for the initial app startup
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* === ONBOARDING FLOW === */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LandingPage1" component={LandingPage1} />
      <Stack.Screen name="LandingPage2" component={LandingPage2} />
      <Stack.Screen name="LandingPage3" component={LandingPage3} />

      <Stack.Screen name="LesionsByRegion" component={LesionsByRegion} />
      <Stack.Screen name="LesionDetails" component={LesionDetails} />

      {/* Refactored Scan Flow */}
      <Stack.Screen name="ModelScan" component={ScanUpload} />
      <Stack.Screen name="AnalysisResult" component={AnalysisResult} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />

      {/* === SURVEY === */}
      <Stack.Screen name="SurveyPage1" component={SurveyPage1} />
      <Stack.Screen name="SurveyPage2" component={SurveyPage2} />

      {/* === MAIN APP === */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      <Stack.Screen name="ComparisonHistory" component={ComparisonHistory} />
      <Stack.Screen name="CompareProcessing" component={CompareProcessing} />
      <Stack.Screen name="CompareResult" component={CompareResult} />
      <Stack.Screen name="LogDetailScreen" component={LogDetailScreen} />

      {/* === AUTH === */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
}
