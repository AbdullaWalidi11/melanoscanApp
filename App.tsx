// App.tsx
import "./global.css";
import "./src/i18n"; // Initialize i18n
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SurveyProvider } from "./src/context/SurveyContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { createLesionsTable } from "./src/database/lesions-table";

// Note: Removed 'useNetworkSync' and 'AppContent' from here.
// They moved to AppNavigator.tsx

export default function App() {
  // Initialize Database on Launch
  useEffect(() => {
    createLesionsTable();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <SurveyProvider>
            {/* Direct usage of AppNavigator. 
                 Since it is inside NavigationContainer, 
                 hooks inside it can see the navigation context. */}
            <AppNavigator />
          </SurveyProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
