import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import TabNavigator from "./TabNavigator";
// Screen Imports
import SplashScreen from "../screens/Splash";
import LoginScreen from "../auth/Login";
import SignUpScreen from "../auth/SignUp";
import LandingPage1 from "../landingPages/Page1";
import LandingPage2 from "../landingPages/Page2";
import LandingPage3 from "../landingPages/Page3";
import SurveyPage1 from "../screens/survey/SurveyPage1";
import SurveyPage2 from "../screens/survey/SurveyPage2";
import LesionsByRegion from "../screens/LesionsByRegion"; // Import the component
import ModelScan from "../screens/model/ModelScan";
import LesionDetails from "../screens/LesionDetails";
import ChatScreen from "../screens/chatScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // We still keep the loading check for the initial app startup
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* === ONBOARDING FLOW === */}
      {/* We list these first so they are available immediately */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LandingPage1" component={LandingPage1} />
      <Stack.Screen name="LandingPage2" component={LandingPage2} />
      <Stack.Screen name="LandingPage3" component={LandingPage3} />

      <Stack.Screen name="LesionsByRegion" component={LesionsByRegion} />
      <Stack.Screen name="LesionDetails" component={LesionDetails} />

      <Stack.Screen name="ModelScan" component={ModelScan} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />


      {/* === SURVEY === */}
      <Stack.Screen name="SurveyPage1" component={SurveyPage1} />
      <Stack.Screen name="SurveyPage2" component={SurveyPage2} />

      {/* === MAIN APP (Offline Accessible) === */}
      {/* This is now ALWAYS available. No login required. */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* === FEATURES (Accessible from Home) === */}
      {/* <Stack.Screen name="ModelScan" component={Placeholder} />
      <Stack.Screen name="LesionDetails" component={Placeholder} /> */}

      {/* === AUTH (Optional - Accessed via Profile or specialized buttons) === */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
